import prisma from "../../config/prismaClient.js";
import { ERROR_CODES } from "../../config/messages.js";
import ServiceError from "../../utils/serviceError.js";
import tripService, { TRIP_PLACE_SELECT } from "../trip/trip.service.js";

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
            secureUrl: true,
            thumbnailUrl: true,
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
          select: { id: true, imageData: true, secureUrl: true, thumbnailUrl: true, isCover: true },
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
          secureUrl: true,
          thumbnailUrl: true,
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
          reviews: true,
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
                secureUrl: true,
                thumbnailUrl: true,
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

// Trip functions are re-exported from ../trip/trip.service.js
export const {
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
  createTripShare,
  getTripShares,
  accessTripShare,
  deleteTripShare,
} = tripService;


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
  createTripShare,
  getTripShares,
  accessTripShare,
  deleteTripShare,
  submitFeedback,
};
