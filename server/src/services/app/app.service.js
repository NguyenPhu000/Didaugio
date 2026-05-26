import prisma from "../../config/prismaClient.js";
import { ERROR_CODES } from "../../config/messages.js";
import { PRIMARY_GEMINI_MODEL } from "../../config/geminiClient.js";
import { mapGeminiError } from "../../lib/geminiErrorHandler.js";
import {
  generateFallbackItinerary,
  generateItinerary,
} from "../ai/gemini.service.js";
import routingService from "../routing/routing.service.js";
import ServiceError from "../../utils/serviceError.js";

const isRoutingEnabled =
  String(process.env.ROUTING_ENABLED ?? "true") !== "false";

const toInt = (value, fallback = null) => {
  const number = parseInt(value, 10);
  return Number.isNaN(number) ? fallback : number;
};

const parsePagination = (query = {}) => {
  const page = Math.max(toInt(query.page, 1), 1);
  const limit = Math.min(Math.max(toInt(query.limit, 10), 1), 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const approvedPlaceWhere = {
  deletedAt: null,
  status: "approved",
};

const REVIEW_MEDIA_LIMIT = 5;
const REVIEW_COOLDOWN_MINUTES = Number(
  process.env.REVIEW_COOLDOWN_MINUTES || 10,
);
const REVIEW_DUPLICATE_WINDOW_HOURS = Number(
  process.env.REVIEW_DUPLICATE_WINDOW_HOURS || 24,
);
const REVIEW_RECENT_LIMIT = Number(process.env.REVIEW_RECENT_LIMIT || 5);
const REVIEW_BLOCKED_TERMS = String(process.env.REVIEW_BLOCKED_TERMS || "")
  .split(",")
  .map((term) => term.trim().toLowerCase())
  .filter(Boolean);

const REVIEW_STATUS = {
  VISIBLE: "visible",
  PENDING: "pending",
};

const normalizeReviewMedia = (media = []) =>
  Array.isArray(media)
    ? media
        .slice(0, REVIEW_MEDIA_LIMIT)
        .map((item, index) => ({
          mediaData: String(item?.mediaData || "").trim(),
          thumbnailUrl: String(item?.thumbnailUrl || item?.mediaData || "").trim(),
          mediaType: String(item?.mediaType || "image").trim() || "image",
          caption: item?.caption ? String(item.caption).trim() : null,
          order: toInt(item?.order, index) ?? index,
        }))
        .filter((item) => item.mediaData)
    : [];

const normalizeReviewMediaResponse = (review) => {
  if (!review) return review;
  return {
    ...review,
    media: (review.media || []).map((item) => ({
      ...item,
      thumbnailUrl: item.thumbnailUrl || item.mediaData,
    })),
  };
};

const normalizeReviewText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const hasBlockedReviewTerm = (payload = {}) => {
  if (REVIEW_BLOCKED_TERMS.length === 0) return false;
  const text = normalizeReviewText(`${payload.title || ""} ${payload.content || ""}`);
  return REVIEW_BLOCKED_TERMS.some((term) => text.includes(term));
};

const hasRepeatedTextPattern = (payload = {}) => {
  const text = normalizeReviewText(`${payload.title || ""} ${payload.content || ""}`);
  if (text.length < 12) return false;
  return /(.)\1{8,}/.test(text) || /(.{3,})\1{3,}/.test(text);
};

async function enforceReviewSpamPolicy(placeId, userId, payload = {}) {
  const now = new Date();
  const cooldownSince = new Date(
    now.getTime() - REVIEW_COOLDOWN_MINUTES * 60 * 1000,
  );
  const duplicateSince = new Date(
    now.getTime() - REVIEW_DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000,
  );
  const normalizedContent = normalizeReviewText(payload.content);

  const [existingReview, recentUserReviews, duplicateReview] =
    await Promise.all([
      prisma.review.findUnique({
        where: { placeId_userId: { placeId, userId } },
        select: { id: true, updatedAt: true },
      }),
      prisma.review.count({
        where: {
          userId,
          createdAt: { gte: duplicateSince },
          deletedAt: null,
        },
      }),
      normalizedContent
        ? prisma.review.findFirst({
            where: {
              userId,
              placeId: { not: placeId },
              content: { equals: payload.content, mode: "insensitive" },
              createdAt: { gte: duplicateSince },
              deletedAt: null,
            },
            select: { id: true },
          })
        : null,
    ]);

  if (existingReview && existingReview.updatedAt > cooldownSince) {
    throw new ServiceError(
      "Bạn vừa cập nhật đánh giá, vui lòng thử lại sau",
      429,
      "REVIEW_COOLDOWN",
    );
  }

  if (!existingReview && recentUserReviews >= REVIEW_RECENT_LIMIT) {
    throw new ServiceError(
      "Bạn đã gửi quá nhiều đánh giá trong thời gian ngắn",
      429,
      "REVIEW_RATE_LIMIT",
    );
  }

  if (duplicateReview) {
    throw new ServiceError(
      "Nội dung đánh giá bị trùng lặp trong thời gian ngắn",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  return {
    existingReview,
    isSuspicious:
      hasBlockedReviewTerm(payload) || hasRepeatedTextPattern(payload),
  };
}

async function resolveReviewBooking(placeId, userId, bookingId) {
  const bookingWhere = {
    userId,
    status: "completed",
    deletedAt: null,
    service: { placeId },
  };

  if (bookingId) {
    const booking = await prisma.booking.findFirst({
      where: {
        ...bookingWhere,
        id: parseInt(bookingId, 10),
      },
      select: { id: true },
    });

    if (!booking) {
      throw new ServiceError(
        "Booking không hợp lệ hoặc chưa hoàn tất cho địa điểm này",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    return booking;
  }

  return prisma.booking.findFirst({
    where: bookingWhere,
    orderBy: [{ completedAt: "desc" }, { useDate: "desc" }],
    select: { id: true },
  });
}

const parseTermsObject = (terms) => {
  if (!terms || typeof terms !== "string") return null;
  try {
    const parsed = JSON.parse(terms);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
};

const getDepositPolicy = (terms) => {
  const meta = parseTermsObject(terms);
  const raw = meta?.depositConfig || {};

  const requireDeposit =
    raw.requireDeposit === true || String(raw.requireDeposit) === "true";
  const depositType = raw.depositType === "FIXED" ? "FIXED" : "PERCENT";
  const depositAmount = Number(raw.depositAmount);
  const normalizedDepositAmount = Number.isFinite(depositAmount)
    ? depositType === "PERCENT"
      ? Math.max(0, Math.min(100, depositAmount))
      : Math.max(0, depositAmount)
    : null;

  let depositRefundable = raw.depositRefundable;
  if (typeof depositRefundable !== "boolean") {
    depositRefundable = String(depositRefundable) !== "false";
  }

  const refundPercent = Number(raw.depositRefundPercent);

  return {
    requireDeposit,
    depositType: requireDeposit ? depositType : null,
    depositAmount: requireDeposit ? normalizedDepositAmount : null,
    depositRefundable,
    depositRefundPercent:
      Number.isFinite(refundPercent) && refundPercent >= 0
        ? Math.min(refundPercent, 100)
        : 50,
  };
};

export const getHomeData = async (query = {}) => {
  const limit = Math.min(Math.max(toInt(query.limit, 12), 1), 30);

  const [categories, featuredPlaces, banners] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ level: "asc" }, { order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        color: true,
      },
      take: 20,
    }),
    prisma.place.findMany({
      where: {
        ...approvedPlaceWhere,
        isFeatured: true,
      },
      orderBy: [{ ratingAvg: "desc" }, { viewCount: "desc" }, { id: "desc" }],
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true, color: true },
        },
        district: {
          select: { id: true, name: true, code: true },
        },
        images: {
          take: 1,
          orderBy: [{ isCover: "desc" }, { order: "asc" }],
          select: {
            id: true,
            imageData: true,
            isCover: true,
          },
        },
      },
      take: limit,
    }),
    prisma.bannerMarketing.findMany({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      orderBy: [{ priority: "desc" }, { id: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        description: true,
        imageData: true,
        linkType: true,
        linkValue: true,
      },
    }),
  ]);

  return {
    categories,
    featuredPlaces,
    banners,
  };
};

export const searchPlaces = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);

  const search = query.search ? String(query.search).trim() : undefined;
  const categoryId = toInt(query.categoryId);
  const districtId = toInt(query.districtId);

  const where = { ...approvedPlaceWhere };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { address: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (categoryId) where.categoryId = categoryId;
  if (districtId) where.districtId = districtId;

  const [places, total] = await Promise.all([
    prisma.place.findMany({
      where,
      orderBy: [{ ratingAvg: "desc" }, { viewCount: "desc" }, { id: "desc" }],
      skip,
      take: limit,
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true, color: true },
        },
        district: {
          select: { id: true, name: true, code: true },
        },
        images: {
          take: 1,
          orderBy: [{ isCover: "desc" }, { order: "asc" }],
          select: { id: true, imageData: true, isCover: true },
        },
      },
    }),
    prisma.place.count({ where }),
  ]);

  return {
    data: places,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPlaceDetail = async (placeId, userId = null) => {
  const place = await prisma.place.findFirst({
    where: {
      id: placeId,
      ...approvedPlaceWhere,
    },
    include: {
      category: {
        select: { id: true, name: true, slug: true, icon: true, color: true },
      },
      district: {
        select: { id: true, name: true, code: true },
      },
      ward: {
        select: { id: true, name: true, wardType: true },
      },
      images: {
        orderBy: [{ isCover: "desc" }, { order: "asc" }],
        select: {
          id: true,
          imageData: true,
          caption: true,
          isCover: true,
        },
      },
      openingHours: {
        orderBy: [{ dayOfWeek: "asc" }],
      },
      amenities: true,
      _count: {
        select: {
          reviews: true,
          favorites: true,
        },
      },
    },
  });

  if (!place) {
    return null;
  }

  let isSaved = false;
  if (userId) {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_placeId: {
          userId,
          placeId,
        },
      },
      select: { id: true },
    });
    isSaved = !!favorite;
  }

  return {
    ...place,
    isSaved,
  };
};

export const getPlaceReviews = async (placeId, query = {}) => {
  const { page, limit, skip } = parsePagination(query);

  const where = {
    placeId,
    deletedAt: null,
    status: "visible",
  };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { fullName: true, avatar: true },
            },
          },
        },
        media: {
          orderBy: [{ order: "asc" }],
          select: {
            id: true,
            mediaData: true,
            mediaType: true,
            caption: true,
          },
        },
        replies: {
          where: { status: "visible" },
          orderBy: [{ createdAt: "asc" }],
          select: {
            id: true,
            content: true,
            status: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                profile: {
                  select: { fullName: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    data: reviews.map(normalizeReviewMediaResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createOrUpdateReview = async (placeId, userId, payload = {}) => {
  const rating = toInt(payload.rating);
  if (!rating || rating < 1 || rating > 5) {
    const error = new Error("Rating phai tu 1 den 5");
    error.statusCode = 400;
    throw error;
  }

  const place = await prisma.place.findFirst({
    where: {
      id: placeId,
      ...approvedPlaceWhere,
    },
    select: { id: true },
  });

  if (!place) {
    const error = new Error("Khong tim thay dia diem");
    error.statusCode = 404;
    throw error;
  }

  const spamPolicy = await enforceReviewSpamPolicy(placeId, userId, payload);
  const linkedBooking = await resolveReviewBooking(
    placeId,
    userId,
    payload.bookingId,
  );
  const media = normalizeReviewMedia(payload.media);
  const reviewStatus = spamPolicy.isSuspicious
    ? REVIEW_STATUS.PENDING
    : REVIEW_STATUS.VISIBLE;

  const review = await prisma.$transaction(async (tx) => {
    const savedReview = await tx.review.upsert({
      where: {
        placeId_userId: {
          placeId,
          userId,
        },
      },
      create: {
        placeId,
        userId,
        rating,
        bookingId: linkedBooking?.id || null,
        title: payload.title || null,
        content: payload.content || null,
        visitType: payload.visitType || null,
        status: reviewStatus,
        isVerifiedPurchase: Boolean(linkedBooking),
      },
      update: {
        rating,
        bookingId: linkedBooking?.id || null,
        title: payload.title || null,
        content: payload.content || null,
        visitType: payload.visitType || null,
        status: reviewStatus,
        isVerifiedPurchase: Boolean(linkedBooking),
        deletedAt: null,
      },
    });

    await tx.reviewMedia.deleteMany({ where: { reviewId: savedReview.id } });
    if (media.length > 0) {
      await tx.reviewMedia.createMany({
        data: media.map((item) => ({
          reviewId: savedReview.id,
          mediaData: item.mediaData,
          mediaType: item.mediaType,
          caption: item.caption,
          order: item.order,
        })),
      });
    }

    const aggregate = await tx.review.aggregate({
      where: {
        placeId,
        deletedAt: null,
        status: "visible",
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await tx.place.update({
      where: { id: placeId },
      data: {
        ratingAvg: Number((aggregate._avg.rating || 0).toFixed(1)),
        ratingCount: aggregate._count.rating,
      },
    });

    return tx.review.findUnique({
      where: { id: savedReview.id },
      include: {
        media: {
          orderBy: [{ order: "asc" }],
          select: {
            id: true,
            mediaData: true,
            mediaType: true,
            caption: true,
            order: true,
          },
        },
      },
    });
  });

  return normalizeReviewMediaResponse(review);
};

export const getServices = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const placeId = toInt(query.placeId);
  const serviceType = query.serviceType || undefined;
  const search = query.search || undefined;

  const where = {
    isActive: true,
  };

  if (placeId) {
    where.placeId = placeId;
  }

  if (serviceType && serviceType !== "all") {
    where.serviceType = serviceType;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.businessService.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        serviceType: true,
        price: true,
        salePrice: true,
        terms: true,
        thumbnail: true,
        bookingCount: true,
        place: {
          select: {
            id: true,
            name: true,
            district: {
              select: { id: true, name: true },
            },
          },
        },
      },
    }),
    prisma.businessService.count({ where }),
  ]);

  return {
    data: items.map((item) => {
      const deposit = getDepositPolicy(item.terms);
      return {
        ...item,
        ...deposit,
      };
    }),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getMyProfileSummary = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      _count: {
        select: {
          favorites: true,
          trips: true,
          bookings: true,
        },
      },
    },
  });

  if (!user) {
    const error = new Error("Khong tim thay nguoi dung");
    error.statusCode = 404;
    throw error;
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    status: user.status,
    profile: user.profile,
    stats: user._count,
  };
};

export const getMySavedPlaces = async (userId, query = {}) => {
  const { page, limit, skip } = parsePagination(query);

  const where = {
    userId,
    place: approvedPlaceWhere,
  };

  if (query.collectionName) {
    where.collectionName = String(query.collectionName).trim();
  }

  const [items, total] = await Promise.all([
    prisma.favorite.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: limit,
      include: {
        place: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
                color: true,
              },
            },
            district: {
              select: { id: true, name: true },
            },
            ward: {
              select: { id: true, name: true, wardType: true },
            },
            images: {
              take: 1,
              orderBy: [{ isCover: "desc" }, { order: "asc" }],
              select: {
                id: true,
                imageData: true,
                isCover: true,
              },
            },
          },
        },
      },
    }),
    prisma.favorite.count({ where }),
  ]);

  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/** `collectionNameInput` chỉ bỏ qua khi thực sự không truyền (undefined); không dùng default `null` để tránh gọi 3 đối số vẫn bị coi là “đổi collection”. */
export const savePlace = async (userId, placeId, note = null, collectionNameInput) => {
  const place = await prisma.place.findFirst({
    where: {
      id: placeId,
      ...approvedPlaceWhere,
    },
    select: { id: true },
  });

  if (!place) {
    const error = new Error("Khong tim thay dia diem");
    error.statusCode = 404;
    throw error;
  }

  const shouldUpdateCollection = collectionNameInput !== undefined;
  const collectionName =
    shouldUpdateCollection &&
    typeof collectionNameInput === "string" &&
    collectionNameInput.trim()
      ? collectionNameInput.trim().slice(0, 80)
      : null;

  const favorite = await prisma.favorite.upsert({
    where: {
      userId_placeId: {
        userId,
        placeId,
      },
    },
    create: {
      userId,
      placeId,
      note,
      ...(shouldUpdateCollection && { collectionName }),
    },
    update: {
      note,
      ...(shouldUpdateCollection && { collectionName }),
    },
  });

  return favorite;
};

export const unsavePlace = async (userId, placeId) => {
  await prisma.favorite.deleteMany({
    where: {
      userId,
      placeId,
    },
  });

  return { success: true };
};

export const getMySavedCollections = async (userId) => {
  const groups = await prisma.favorite.groupBy({
    by: ["collectionName"],
    where: {
      userId,
      collectionName: { not: null },
      place: approvedPlaceWhere,
    },
    _count: { id: true },
    orderBy: { collectionName: "asc" },
  });

  return groups
    .filter((item) => String(item.collectionName || "").trim())
    .map((item) => ({
      name: item.collectionName,
      count: item._count.id,
    }));
};

export const renameMySavedCollection = async (userId, fromName, toName) => {
  const from = String(fromName || "").trim();
  const to = String(toName || "").trim().slice(0, 80);

  if (!from || !to) {
    const error = new Error("Tên bộ sưu tập không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  const result = await prisma.favorite.updateMany({
    where: { userId, collectionName: from },
    data: { collectionName: to },
  });

  return { name: to, updatedCount: result.count };
};

export const deleteMySavedCollection = async (userId, name) => {
  const collectionName = String(name || "").trim();
  if (!collectionName) {
    const error = new Error("Tên bộ sưu tập không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  const result = await prisma.favorite.updateMany({
    where: { userId, collectionName },
    data: { collectionName: null },
  });

  return { name: collectionName, updatedCount: result.count };
};

export const saveTrip = async (userId, tripId) => {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) {
    const err = new Error("Không tìm thấy chuyến đi");
    err.statusCode = 404;
    throw err;
  }

  const saved = await prisma.savedTrip.upsert({
    where: { userId_tripId: { userId, tripId } },
    create: { userId, tripId },
    update: {},
  });

  return saved;
};

export const unsaveTrip = async (userId, tripId) => {
  await prisma.savedTrip.deleteMany({
    where: { userId, tripId },
  });
  return { success: true };
};

export const getMySavedTrips = async (userId) => {
  const saved = await prisma.savedTrip.findMany({
    where: { userId },
    include: {
      trip: {
        include: {
          destinations: {
            orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
            include: { place: { select: TRIP_PLACE_SELECT } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return saved.map((s) => ({ ...s.trip, savedAt: s.createdAt }));
};

export const getMyTrips = async (userId, query = {}) => {
  const { page, limit, skip } = parsePagination(query);

  const where = { userId };

  const [items, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip,
      take: limit,
      include: {
        destinations: {
          orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
          take: 6,
          include: {
            place: {
              select: {
                id: true,
                name: true,
                slug: true,
                thumbnail: true,
                district: {
                  select: { id: true, name: true, code: true },
                },
                ward: {
                  select: { id: true, name: true, wardType: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.trip.count({ where }),
  ]);

  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const MAX_TRIP_SUGGESTED_PLACES = 12;

const normalizeItineraryDays = (days) => {
  const safeDays = Array.isArray(days) ? days : [];

  return safeDays
    .map((day, dayIndex) => {
      const dayNumber = Math.max(toInt(day?.dayNumber, dayIndex + 1), 1);
      const safeDestinations = Array.isArray(day?.destinations)
        ? day.destinations
        : [];

      const destinations = safeDestinations
        .map((dest, destIndex) => {
          const placeId = toInt(dest?.placeId);
          if (!placeId) return null;

          const durationMinutes = toInt(dest?.durationMinutes, null);
          const estimatedCost = Number(dest?.estimatedCost);

          return {
            placeId,
            order: Math.max(toInt(dest?.order, destIndex + 1), 1),
            startTime: dest?.startTime ?? null,
            endTime: dest?.endTime ?? null,
            durationMinutes:
              Number.isFinite(durationMinutes) && durationMinutes > 0
                ? durationMinutes
                : null,
            note: dest?.note ?? null,
            transportToNext: dest?.transportToNext ?? null,
            estimatedCost:
              Number.isFinite(estimatedCost) && estimatedCost >= 0
                ? Math.round(estimatedCost)
                : null,
          };
        })
        .filter(Boolean);

      return {
        dayNumber,
        theme:
          typeof day?.theme === "string" && day.theme.trim()
            ? day.theme.trim()
            : `Ngày ${dayNumber}`,
        destinations,
      };
    })
    .filter((day) => day.destinations.length > 0);
};

const normalizeItinerary = (itinerary, fallbackTotalDays = 1) => {
  const safeFallbackDays = Math.max(toInt(fallbackTotalDays, 1), 1);
  const days = normalizeItineraryDays(itinerary?.days);
  const parsedTotalDays = Math.max(
    toInt(itinerary?.totalDays, safeFallbackDays),
    1,
  );
  const totalDays = Math.max(parsedTotalDays, days.length || 1);
  const estimatedCost = Number(itinerary?.estimatedCost);

  return {
    title:
      typeof itinerary?.title === "string" && itinerary.title.trim()
        ? itinerary.title.trim()
        : `Lịch trình ${totalDays} ngày ở Cần Thơ`,
    description:
      typeof itinerary?.description === "string" && itinerary.description.trim()
        ? itinerary.description.trim()
        : null,
    totalDays,
    estimatedCost:
      Number.isFinite(estimatedCost) && estimatedCost >= 0
        ? Math.round(estimatedCost)
        : null,
    days,
  };
};

const buildSuggestedPlaces = (days, placeById) => {
  const orderedIds = [];
  const seen = new Set();

  for (const day of days) {
    const safeDestinations = Array.isArray(day?.destinations)
      ? day.destinations
      : [];
    for (const dest of safeDestinations) {
      const placeId = toInt(dest?.placeId);
      if (!placeId || seen.has(placeId) || !placeById.has(placeId)) continue;
      seen.add(placeId);
      orderedIds.push(placeId);
      if (orderedIds.length >= MAX_TRIP_SUGGESTED_PLACES) break;
    }
    if (orderedIds.length >= MAX_TRIP_SUGGESTED_PLACES) break;
  }

  if (orderedIds.length === 0) {
    for (const place of placeById.values()) {
      if (seen.has(place.id)) continue;
      seen.add(place.id);
      orderedIds.push(place.id);
      if (orderedIds.length >= MAX_TRIP_SUGGESTED_PLACES) break;
    }
  }

  return orderedIds.map((id) => placeById.get(id)).filter(Boolean);
};

const buildTripDestinations = ({
  tripId,
  days,
  allowedPlaceIds,
  selectedPlaceIdSet,
  allPlaces = [],
}) => {
  const destinations = [];
  const usedPlaceIds = new Set();

  const safeDays = Array.isArray(days) ? days : [];
  for (const day of safeDays) {
    const dayNumber = Math.max(toInt(day?.dayNumber, 1), 1);
    const safeDestinations = Array.isArray(day?.destinations)
      ? day.destinations
      : [];

    for (let index = 0; index < safeDestinations.length; index += 1) {
      const dest = safeDestinations[index];
      let placeId = toInt(dest?.placeId);

      if (!placeId || !allowedPlaceIds.has(placeId)) {
        const placeDetailsList = Array.isArray(allPlaces) ? allPlaces : [];
        const fallbackPlace = placeDetailsList.find(
          (p) => !usedPlaceIds.has(p.id) && allowedPlaceIds.has(p.id)
        );
        if (fallbackPlace) {
          placeId = fallbackPlace.id;
        } else {
          continue;
        }
      }

      if (selectedPlaceIdSet?.size && !selectedPlaceIdSet.has(placeId)) {
        if (!usedPlaceIds.has(placeId)) {
          // Bỏ qua check selectedPlaceIdSet nếu đây là fallback để tránh rỗng lịch trình
        } else {
          continue;
        }
      }

      usedPlaceIds.add(placeId);

      destinations.push({
        tripId,
        placeId,
        dayNumber,
        order: Math.max(toInt(dest?.order, index + 1), 1),
        startTime: dest?.startTime ?? null,
        endTime: dest?.endTime ?? null,
        durationMinutes: toInt(dest?.durationMinutes, null),
        note: dest?.note ?? null,
        transportToNext: dest?.transportToNext ?? null,
        distanceToNext: Number.isFinite(Number(dest?.distanceToNext))
          ? Number(dest.distanceToNext)
          : null,
        estimatedCost: Number.isFinite(Number(dest?.estimatedCost))
          ? Math.round(Number(dest.estimatedCost))
          : null,
        status: "planned",
      });
    }
  }

  return destinations;
};

const toKm2 = (meters) => {
  const value = Number(meters);
  if (!Number.isFinite(value) || value < 0) return null;
  return Number((value / 1000).toFixed(2));
};

const enrichItineraryWithRouting = async ({
  itinerary,
  placeById,
  selectedPlaceIdSet,
}) => {
  const clonedItinerary = {
    ...itinerary,
    days: (itinerary?.days || []).map((day) => ({
      ...day,
      destinations: (day?.destinations || []).map((dest) => ({ ...dest })),
    })),
  };

  let totalDistanceMeters = 0;
  let totalDurationSeconds = 0;
  const legSummaries = [];

  for (const day of clonedItinerary.days) {
    const dayDestinations = (day?.destinations || []).filter((dest) => {
      const placeId = toInt(dest?.placeId);
      if (!placeId || !placeById.has(placeId)) return false;
      if (selectedPlaceIdSet?.size && !selectedPlaceIdSet.has(placeId)) {
        return false;
      }
      return true;
    });

    for (let i = 0; i < dayDestinations.length; i += 1) {
      dayDestinations[i].distanceToNext = null;
    }

    for (let i = 0; i < dayDestinations.length - 1; i += 1) {
      const fromDest = dayDestinations[i];
      const toDest = dayDestinations[i + 1];
      const fromPlace = placeById.get(toInt(fromDest.placeId));
      const toPlace = placeById.get(toInt(toDest.placeId));
      if (!fromPlace || !toPlace) continue;

      const routeResult = await routingService.calculate({
        origin: {
          lat: Number(fromPlace.latitude),
          lng: Number(fromPlace.longitude),
          name: fromPlace.name,
        },
        destination: {
          lat: Number(toPlace.latitude),
          lng: Number(toPlace.longitude),
          name: toPlace.name,
        },
        mode: "motorcycle",
        options: { alternatives: 0, steps: false },
      });

      const route = routeResult?.routes?.[0];
      if (!route) continue;

      totalDistanceMeters += Number(route.distance || 0);
      totalDurationSeconds += Number(route.duration || 0);
      fromDest.distanceToNext = toKm2(route.distance);

      legSummaries.push({
        dayNumber: day.dayNumber,
        fromPlaceId: fromPlace.id,
        toPlaceId: toPlace.id,
        distance: Number(route.distance || 0),
        duration: Number(route.duration || 0),
        source: routeResult?.source || "osrm",
      });
    }
  }

  return {
    itinerary: clonedItinerary,
    tripRoutingSummary: {
      totalDistance: totalDistanceMeters,
      totalDistanceKm: toKm2(totalDistanceMeters),
      totalDuration: totalDurationSeconds,
      legs: legSummaries,
    },
  };
};

const buildFallbackDestinationsFromSelection = ({
  tripId,
  selectedPlaceIds,
  totalDays,
}) => {
  const safeIds = Array.isArray(selectedPlaceIds) ? selectedPlaceIds : [];
  const safeTotalDays = Math.max(toInt(totalDays, 1), 1);
  const ordersByDay = new Map();

  return safeIds.map((placeId, index) => {
    const dayNumber = (index % safeTotalDays) + 1;
    const nextOrder = (ordersByDay.get(dayNumber) ?? 0) + 1;
    ordersByDay.set(dayNumber, nextOrder);

    return {
      tripId,
      placeId,
      dayNumber,
      order: nextOrder,
      startTime: null,
      endTime: null,
      durationMinutes: null,
      note: "Địa điểm được chọn trước khi chốt lịch trình",
      transportToNext: null,
      estimatedCost: null,
      status: "planned",
    };
  });
};

export const generateAndSaveTrip = async (userId, preferences = {}) => {
  const {
    totalDays = 1,
    travelStyle,
    groupSize = 1,
    budget,
    categoryId,
    notes,
    previewOnly = false,
    selectedPlaceIds = [],
    itineraryDraft = null,
  } = preferences;

  const where = { ...approvedPlaceWhere };
  if (categoryId) where.categoryId = toInt(categoryId);

  const places = await prisma.place.findMany({
    where,
    orderBy: [{ ratingAvg: "desc" }, { viewCount: "desc" }],
    take: 50,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      district: { select: { id: true, name: true, code: true } },
      ward: { select: { id: true, name: true, wardType: true } },
      openingHours: {
        orderBy: [{ dayOfWeek: "asc" }],
        select: {
          dayOfWeek: true,
          openTime: true,
          closeTime: true,
          isClosed: true,
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
      images: {
        take: 1,
        orderBy: [{ isCover: "desc" }],
        select: { imageData: true },
      },
    },
  });

  if (places.length === 0) {
    const error = new Error("Khong co dia diem nao phu hop voi yeu cau");
    error.statusCode = 404;
    throw error;
  }

  const placeById = new Map(places.map((place) => [place.id, place]));
  const placeIdSet = new Set(placeById.keys());

  let rawItinerary =
    itineraryDraft && typeof itineraryDraft === "object"
      ? itineraryDraft
      : null;

  if (!rawItinerary) {
    const startTime = Date.now();
    let geminiResult;
    let isSuccessful = true;
    let errorMessage = null;

    try {
      geminiResult = await generateItinerary(preferences, places);
    } catch (err) {
      const mappedGemini = mapGeminiError(err);
      const mappedCode = mappedGemini?.body?.errorCode;
      const allowFallback =
        mappedCode === "QUOTA_EXCEEDED" || mappedCode === "AI_UNAVAILABLE";

      if (allowFallback) {
        geminiResult = {
          parsed: generateFallbackItinerary(preferences, places),
          raw: null,
          tokensUsed: null,
          responseTimeMs: Date.now() - startTime,
        };
        isSuccessful = false;
        errorMessage = `${mappedCode}: ${mappedGemini?.body?.message || err?.message}`;
      } else {
        isSuccessful = false;
        errorMessage = err?.message;
        throw err;
      }
    } finally {
      await prisma.aiPromptHistory
        .create({
          data: {
            userId,
            promptType: "trip_itinerary",
            promptText: JSON.stringify(preferences),
            contextData: {
              placesCount: places.length,
              travelStyle,
              totalDays,
              previewOnly: !!previewOnly,
            },
            responseText: geminiResult?.raw ?? null,
            responseParsed: geminiResult?.parsed ?? null,
            modelUsed: geminiResult?.raw
              ? PRIMARY_GEMINI_MODEL
              : "fallback-local",
            tokensUsed: geminiResult?.tokensUsed ?? null,
            responseTimeMs: Date.now() - startTime,
            isSuccessful,
            errorMessage,
          },
        })
        .catch(() => {});
    }

    rawItinerary = geminiResult?.parsed ?? null;
  }

  let itinerary = normalizeItinerary(rawItinerary, totalDays);
  if (itinerary.days.length === 0) {
    itinerary = normalizeItinerary(
      generateFallbackItinerary(preferences, places),
      totalDays,
    );
  }

  const suggestedPlaces = buildSuggestedPlaces(itinerary.days, placeById);
  const suggestedPlaceIds = suggestedPlaces.map((place) => place.id);
  const normalizedSelectedPlaceIds = Array.isArray(selectedPlaceIds)
    ? selectedPlaceIds
        .map((id) => toInt(id))
        .filter((id) => id && placeIdSet.has(id))
    : [];

  const effectiveSelectedPlaceIds =
    normalizedSelectedPlaceIds.length > 0
      ? normalizedSelectedPlaceIds
      : suggestedPlaceIds;

  const selectedPlaceIdSet =
    effectiveSelectedPlaceIds.length > 0
      ? new Set(effectiveSelectedPlaceIds)
      : null;

  const { itinerary: enrichedItinerary, tripRoutingSummary } = isRoutingEnabled
    ? await enrichItineraryWithRouting({
        itinerary,
        placeById,
        selectedPlaceIdSet,
      })
    : {
        itinerary,
        tripRoutingSummary: {
          totalDistance: 0,
          totalDistanceKm: null,
          totalDuration: 0,
          legs: [],
        },
      };
  itinerary = enrichedItinerary;

  if (previewOnly) {
    return {
      previewOnly: true,
      itinerary,
      suggestedPlaces,
      selectedPlaceIds: effectiveSelectedPlaceIds,
      tripRoutingSummary,
    };
  }

  const trip = await prisma.$transaction(async (tx) => {
    const created = await tx.trip.create({
      data: {
        userId,
        title: itinerary.title,
        description: itinerary.description ?? null,
        totalDays: itinerary.totalDays,
        totalDistance: tripRoutingSummary?.totalDistanceKm ?? null,
        estimatedCost: itinerary.estimatedCost ?? null,
        travelStyle: travelStyle ?? null,
        groupSize: Math.max(toInt(groupSize, 1), 1),
        isAiGenerated: true,
        aiPrompt: JSON.stringify(preferences),
        status: "planned",
      },
    });

    let allDestinations = buildTripDestinations({
      tripId: created.id,
      days: itinerary.days,
      allowedPlaceIds: placeIdSet,
      selectedPlaceIdSet,
      allPlaces: places,
    });

    if (allDestinations.length === 0 && effectiveSelectedPlaceIds.length > 0) {
      allDestinations = buildFallbackDestinationsFromSelection({
        tripId: created.id,
        selectedPlaceIds: effectiveSelectedPlaceIds,
        totalDays: itinerary.totalDays,
      });
    }

    if (allDestinations.length > 0) {
      await tx.tripDestination.createMany({ data: allDestinations });
    }

    return tx.trip.findUnique({
      where: { id: created.id },
      include: {
        destinations: {
          orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
          include: {
            place: {
              select: {
                id: true,
                name: true,
                address: true,
                latitude: true,
                longitude: true,
                category: { select: { id: true, name: true } },
                district: { select: { id: true, name: true, code: true } },
                ward: { select: { id: true, name: true, wardType: true } },
                images: {
                  take: 1,
                  orderBy: [{ isCover: "desc" }],
                  select: { imageData: true },
                },
              },
            },
          },
        },
      },
    });
  });

  return {
    ...trip,
    tripRoutingSummary,
  };
};

export const submitFeedback = async ({
  userId = null,
  reportType,
  title,
  content,
  targetType = null,
  targetId = null,
  screenshot = null,
}) => {
  if (!reportType || !title || !content) {
    const error = new Error(
      "Thieu thong tin bat buoc: reportType, title, content",
    );
    error.statusCode = 400;
    throw error;
  }

  const feedback = await prisma.feedbackReport.create({
    data: {
      reporterId: userId,
      reportType,
      targetType,
      targetId,
      title,
      content,
      screenshot,
      status: "pending",
    },
  });

  return feedback;
};

const TRIP_PLACE_SELECT = {
  id: true,
  name: true,
  address: true,
  latitude: true,
  longitude: true,
  thumbnail: true,
  ratingAvg: true,
  category: { select: { id: true, name: true } },
  district: { select: { id: true, name: true, code: true } },
  ward: { select: { id: true, name: true, wardType: true } },
};

export const createTrip = async (userId, data) => {
  const {
    title,
    description,
    startDate,
    endDate,
    totalDays,
    travelStyle,
    groupSize,
    status,
  } = data;
  return prisma.trip.create({
    data: {
      userId,
      title,
      description,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      totalDays: toInt(totalDays, 1),
      travelStyle,
      groupSize: toInt(groupSize, 1),
      status: status || "draft",
    },
    include: {
      destinations: {
        include: { place: { select: TRIP_PLACE_SELECT } },
      },
    },
  });
};

export const getTripDetail = async (id, userId) => {
  const trip = await prisma.trip.findFirst({
    where: { id, userId },
    include: {
      destinations: {
        orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
        include: { place: { select: TRIP_PLACE_SELECT } },
      },
    },
  });

  if (!trip) return null;

  const saved = userId
    ? await prisma.savedTrip.findUnique({
        where: { userId_tripId: { userId, tripId: id } },
      })
    : null;

  return { ...trip, isSaved: !!saved };
};

export const updateTrip = async (id, userId, data) => {
  const trip = await prisma.trip.findFirst({ where: { id, userId } });
  if (!trip) {
    const err = new Error("Không tìm thấy chuyến đi");
    err.statusCode = 404;
    throw err;
  }
  const {
    title,
    description,
    startDate,
    endDate,
    totalDays,
    travelStyle,
    groupSize,
    status,
  } = data;
  return prisma.trip.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(startDate !== undefined && {
        startDate: startDate ? new Date(startDate) : null,
      }),
      ...(endDate !== undefined && {
        endDate: endDate ? new Date(endDate) : null,
      }),
      ...(totalDays !== undefined && { totalDays: toInt(totalDays, 1) }),
      ...(travelStyle !== undefined && { travelStyle }),
      ...(groupSize !== undefined && { groupSize: toInt(groupSize, 1) }),
      ...(status !== undefined && { status }),
    },
    include: {
      destinations: {
        orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
        include: { place: { select: TRIP_PLACE_SELECT } },
      },
    },
  });
};

export const deleteTrip = async (id, userId) => {
  const trip = await prisma.trip.findFirst({ where: { id, userId } });
  if (!trip) {
    const err = new Error("Không tìm thấy chuyến đi");
    err.statusCode = 404;
    throw err;
  }
  await prisma.trip.delete({ where: { id } });
};

export const addDestination = async (
  tripId,
  userId,
  { placeId, dayNumber, order, note },
) => {
  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) {
    const err = new Error("Không tìm thấy chuyến đi");
    err.statusCode = 404;
    throw err;
  }
  return prisma.tripDestination.create({
    data: {
      tripId,
      placeId: toInt(placeId),
      dayNumber: toInt(dayNumber, 1),
      order: toInt(order, 0),
      note,
      status: "planned",
    },
    include: { place: { select: TRIP_PLACE_SELECT } },
  });
};

export const removeDestination = async (tripId, destId, userId) => {
  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) {
    const err = new Error("Không tìm thấy chuyến đi");
    err.statusCode = 404;
    throw err;
  }
  const dest = await prisma.tripDestination.findFirst({
    where: { id: destId, tripId },
  });
  if (!dest) {
    const err = new Error("Không tìm thấy địa điểm trong lịch trình");
    err.statusCode = 404;
    throw err;
  }
  await prisma.tripDestination.delete({ where: { id: destId } });
};

export const reorderDestinations = async (tripId, userId, { dayNumber, orderedIds }) => {
  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) {
    const err = new Error("Khong tim thay chuyen di");
    err.statusCode = 404;
    throw err;
  }
  await prisma.$transaction(
    orderedIds.map((destId, index) =>
      prisma.tripDestination.update({
        where: { id: toInt(destId) },
        data: { order: index },
      }),
    ),
  );
  return prisma.tripDestination.findMany({
    where: { tripId, dayNumber: toInt(dayNumber, 1) },
    orderBy: { order: "asc" },
    include: { place: { select: TRIP_PLACE_SELECT } },
  });
};

export const updateDestination = async (tripId, destId, userId, data) => {
  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) {
    const err = new Error("Khong tim thay chuyen di");
    err.statusCode = 404;
    throw err;
  }
  const dest = await prisma.tripDestination.findFirst({ where: { id: destId, tripId } });
  if (!dest) {
    const err = new Error("Khong tim thay dia diem");
    err.statusCode = 404;
    throw err;
  }
  const updateData = {};
  if (data.startTime !== undefined) updateData.startTime = data.startTime;
  if (data.endTime !== undefined) updateData.endTime = data.endTime;
  if (data.durationMinutes !== undefined) updateData.durationMinutes = toInt(data.durationMinutes);
  if (data.note !== undefined) updateData.note = data.note;
  return prisma.tripDestination.update({
    where: { id: destId },
    data: updateData,
    include: { place: { select: TRIP_PLACE_SELECT } },
  });
};

export const moveDestination = async (tripId, destId, userId, { newDayNumber, newOrder }) => {
  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) {
    const err = new Error("Khong tim thay chuyen di");
    err.statusCode = 404;
    throw err;
  }
  const dest = await prisma.tripDestination.findFirst({ where: { id: destId, tripId } });
  if (!dest) {
    const err = new Error("Khong tim thay dia diem");
    err.statusCode = 404;
    throw err;
  }
  return prisma.tripDestination.update({
    where: { id: destId },
    data: {
      dayNumber: toInt(newDayNumber),
      order: toInt(newOrder, 0),
    },
    include: { place: { select: TRIP_PLACE_SELECT } },
  });
};

export default {
  getHomeData,
  searchPlaces,
  getPlaceDetail,
  getPlaceReviews,
  createOrUpdateReview,
  getServices,
  getMyProfileSummary,
  getMySavedPlaces,
  savePlace,
  unsavePlace,
  getMySavedCollections,
  renameMySavedCollection,
  deleteMySavedCollection,
  saveTrip,
  unsaveTrip,
  getMySavedTrips,
  getMyTrips,
  generateAndSaveTrip,
  createTrip,
  getTripDetail,
  updateTrip,
  deleteTrip,
  addDestination,
  removeDestination,
  reorderDestinations,
  updateDestination,
  moveDestination,
  submitFeedback,
};
