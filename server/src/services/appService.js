import prisma from "../config/prismaClient.js";
import { generateItinerary } from "./geminiService.js";

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

/**
 * Search / list approved places with optional text search, category and district filters.
 * Supports standard page-based pagination.
 */
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
      },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    data: reviews,
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

  const review = await prisma.review.upsert({
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
      title: payload.title || null,
      content: payload.content || null,
      visitType: payload.visitType || null,
      status: "visible",
    },
    update: {
      rating,
      title: payload.title || null,
      content: payload.content || null,
      visitType: payload.visitType || null,
      status: "visible",
      deletedAt: null,
    },
  });

  const aggregate = await prisma.review.aggregate({
    where: {
      placeId,
      deletedAt: null,
      status: "visible",
    },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.place.update({
    where: { id: placeId },
    data: {
      ratingAvg: Number((aggregate._avg.rating || 0).toFixed(1)),
      ratingCount: aggregate._count.rating,
    },
  });

  return review;
};

export const getServices = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const serviceType = query.serviceType || undefined;
  const search = query.search || undefined;

  const where = {
    isActive: true,
  };

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
    data: items,
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

export const savePlace = async (userId, placeId, note = null) => {
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
    },
    update: {
      note,
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
              select: { id: true, name: true, slug: true, thumbnail: true },
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

export const generateAndSaveTrip = async (userId, preferences = {}) => {
  const {
    totalDays = 1,
    travelStyle,
    groupSize = 1,
    budget,
    categoryId,
    notes,
  } = preferences;

  // Fetch relevant places from DB matching the preferences
  const where = { ...approvedPlaceWhere };
  if (categoryId) where.categoryId = toInt(categoryId);

  const places = await prisma.place.findMany({
    where,
    orderBy: [{ ratingAvg: "desc" }, { viewCount: "desc" }],
    take: 50,
    include: {
      category: { select: { id: true, name: true } },
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

  const startTime = Date.now();
  let geminiResult;
  let isSuccessful = true;
  let errorMessage = null;

  try {
    geminiResult = await generateItinerary(preferences, places);
  } catch (err) {
    isSuccessful = false;
    errorMessage = err.message;
    throw err;
  } finally {
    // Log AI prompt history regardless of success/failure
    await prisma.aiPromptHistory
      .create({
        data: {
          userId,
          promptType: "trip_itinerary",
          promptText: JSON.stringify(preferences),
          contextData: { placesCount: places.length, travelStyle, totalDays },
          responseText: geminiResult?.raw ?? null,
          responseParsed: geminiResult?.parsed ?? null,
          modelUsed: "gemini-1.5-flash",
          tokensUsed: geminiResult?.tokensUsed ?? null,
          responseTimeMs: Date.now() - startTime,
          isSuccessful,
          errorMessage,
        },
      })
      .catch(() => {}); // Non-blocking — don't fail if logging fails
  }

  const itinerary = geminiResult.parsed;

  // Build valid placeId set for safety
  const placeIdSet = new Set(places.map((p) => p.id));

  // Persist trip + destinations in a transaction
  const trip = await prisma.$transaction(async (tx) => {
    const created = await tx.trip.create({
      data: {
        userId,
        title: itinerary.title || `Lịch trình ${totalDays} ngày ở Cần Thơ`,
        description: itinerary.description ?? null,
        totalDays: itinerary.totalDays || totalDays,
        estimatedCost: itinerary.estimatedCost ?? null,
        travelStyle: travelStyle ?? null,
        groupSize,
        isAiGenerated: true,
        aiPrompt: JSON.stringify(preferences),
        status: "draft",
      },
    });

    // Flatten all destinations across days
    const allDestinations = (itinerary.days || [])
      .flatMap((day) =>
        (day.destinations || []).map((dest) => ({
          tripId: created.id,
          placeId: dest.placeId,
          dayNumber: day.dayNumber,
          order: dest.order,
          startTime: dest.startTime ?? null,
          endTime: dest.endTime ?? null,
          durationMinutes: dest.durationMinutes ?? null,
          note: dest.note ?? null,
          transportToNext: dest.transportToNext ?? null,
          estimatedCost: dest.estimatedCost ?? null,
          status: "planned",
        })),
      )
      .filter((d) => placeIdSet.has(d.placeId));

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

  return trip;
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
  getMyTrips,
  generateAndSaveTrip,
  submitFeedback,
};
