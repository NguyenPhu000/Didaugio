import prisma from "../../config/prismaClient.js";
import { PAGINATION } from "../../config/constants.js";
import { ERROR_CODES } from "../../config/messages.js";
import ServiceError from "../../utils/serviceError.js";

const reviewInclude = {
  user: {
    select: {
      id: true,
      email: true,
      profile: { select: { fullName: true, avatar: true } },
    },
  },
  place: {
    select: {
      id: true,
      name: true,
      business: { select: { id: true, businessName: true } },
    },
  },
  media: {
    orderBy: { order: "asc" },
    select: {
      id: true,
      mediaData: true,
      mediaType: true,
      caption: true,
      order: true,
    },
  },
  replies: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { fullName: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
};

const parsePage = (value) => parseInt(value, 10) || PAGINATION.DEFAULT_PAGE;
const parseLimit = (value) =>
  Math.min(parseInt(value, 10) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

const normalizeReviewMediaResponse = (review) => ({
  ...review,
  media: (review.media || []).map((item) => ({
    ...item,
    thumbnailUrl: item.thumbnailUrl || item.mediaData,
  })),
});

async function recalculatePlaceRating(tx, placeId) {
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
}

function buildReviewWhere(params = {}) {
  const where = { deletedAt: null };

  if (params.status && params.status !== "all") {
    where.status = params.status;
  }
  if (params.rating) {
    where.rating = parseInt(params.rating, 10);
  }
  if (params.hasMedia === true) {
    where.media = { some: {} };
  }
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { content: { contains: params.search, mode: "insensitive" } },
      { adminNote: { contains: params.search, mode: "insensitive" } },
      { place: { name: { contains: params.search, mode: "insensitive" } } },
      {
        user: {
          profile: {
            is: {
              fullName: { contains: params.search, mode: "insensitive" },
            },
          },
        },
      },
    ];
  }

  return where;
}

export const getAll = async (params = {}) => {
  const page = parsePage(params.page);
  const limit = parseLimit(params.limit);
  const skip = (page - 1) * limit;
  const where = buildReviewWhere(params);

  const [data, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: reviewInclude,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    data: data.map(normalizeReviewMediaResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getStats = async () => {
  const where = { deletedAt: null };

  const [total, pending, reported, hidden, visible, avgResult] =
    await Promise.all([
      prisma.review.count({ where }),
      prisma.review.count({ where: { ...where, status: "pending" } }),
      prisma.review.count({ where: { ...where, status: "reported" } }),
      prisma.review.count({ where: { ...where, status: "hidden" } }),
      prisma.review.count({ where: { ...where, status: "visible" } }),
      prisma.review.aggregate({ where, _avg: { rating: true } }),
    ]);

  return {
    total,
    pending,
    reported,
    hidden,
    visible,
    avgRating: avgResult._avg.rating
      ? Number(avgResult._avg.rating.toFixed(1))
      : 0,
  };
};

export const moderateReview = async (id, data = {}) => {
  const reviewId = parseInt(id, 10);

  const existing = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, placeId: true },
  });

  if (!existing) {
    throw new ServiceError(
      "Đánh giá không tồn tại",
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  return prisma.$transaction(async (tx) => {
    const review = await tx.review.update({
      where: { id: reviewId },
      data: {
        status: data.status,
        adminNote: data.adminNote ?? null,
      },
      include: reviewInclude,
    });

    await recalculatePlaceRating(tx, existing.placeId);

    return normalizeReviewMediaResponse(review);
  });
};

export const moderateReply = async (replyId, status) => {
  const parsedReplyId = parseInt(replyId, 10);

  const existing = await prisma.reviewReply.findUnique({
    where: { id: parsedReplyId },
    select: { id: true },
  });

  if (!existing) {
    throw new ServiceError(
      "Phản hồi không tồn tại",
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  return prisma.reviewReply.update({
    where: { id: parsedReplyId },
    data: { status },
    include: {
      user: { select: { id: true, profile: { select: { fullName: true } } } },
    },
  });
};
