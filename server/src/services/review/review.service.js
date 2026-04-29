import prisma from "../../config/prismaClient.js";
import { PAGINATION, ROLES } from "../../config/constants.js";
import { ERROR_CODES } from "../../config/messages.js";
import eventEmitter, { EVENTS } from "../../utils/eventEmitter.js";
import ServiceError from "../../utils/serviceError.js";

const defaultInclude = {
  user: {
    select: {
      id: true,
      profile: { select: { fullName: true, avatar: true } },
    },
  },
  place: { select: { id: true, name: true } },
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
          profile: { select: { fullName: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
};

const normalizeReviewMediaResponse = (review) => ({
  ...review,
  media: (review.media || []).map((item) => ({
    ...item,
    thumbnailUrl: item.thumbnailUrl || item.mediaData,
  })),
});

export const getAll = async (params = {}, userId, roleId) => {
  const page = parseInt(params.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    parseInt(params.limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT,
  );
  const skip = (page - 1) * limit;

  const where = { deletedAt: null };

  if (roleId > ROLES.ADMIN) {
    const business = await prisma.business.findUnique({
      where: { ownerId: userId },
      select: { id: true },
    });
    if (!business)
      return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };

    const placeIds = await prisma.place.findMany({
      where: { businessId: business.id, deletedAt: null },
      select: { id: true },
    });
    where.placeId = { in: placeIds.map((p) => p.id) };
  }

  if (params.search) {
    where.OR = [
      { content: { contains: params.search, mode: "insensitive" } },
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
  if (params.rating) {
    where.rating = parseInt(params.rating);
  }
  if (params.placeId) {
    const requestedPlaceId = parseInt(params.placeId);
    // Nếu đã scope theo business, chỉ cho lọc nếu placeId thuộc danh sách được phép
    if (Array.isArray(where.placeId?.in)) {
      if (where.placeId.in.includes(requestedPlaceId)) {
        where.placeId = requestedPlaceId;
      }
      // Nếu không thuộc, giữ nguyên scope (bỏ qua tham số placeId không hợp lệ)
    } else {
      where.placeId = requestedPlaceId;
    }
  }
  if (String(params.hasMedia) === "true") {
    where.media = { some: {} };
  }
  if (String(params.needsAttention) === "true") {
    where.rating = { lte: 2 };
    where.replies = { none: {} };
  }

  const [data, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: defaultInclude,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    data: data.map(normalizeReviewMediaResponse),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getById = async (id, options = {}) => {
  const { businessId } = options;
  const where = { id: parseInt(id) };
  if (businessId != null) {
    where.place = { businessId };
  }

  const review = await prisma.review.findFirst({
    where,
    include: {
      ...defaultInclude,
      media: true,
    },
  });

  if (!review) {
    throw new ServiceError(
      "Đánh giá không tồn tại",
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  return normalizeReviewMediaResponse(review);
};

export const reply = async (reviewId, content, userId, options = {}) => {
  const { businessId } = options;
  const reviewWhere = { id: parseInt(reviewId) };
  if (businessId != null) {
    reviewWhere.place = { businessId };
  }

  const review = await prisma.review.findFirst({
    where: reviewWhere,
    select: { id: true, userId: true },
  });

  if (!review) {
    throw new ServiceError(
      "Đánh giá không tồn tại hoặc không thuộc địa điểm của bạn",
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  const replyData = await prisma.reviewReply.create({
    data: {
      reviewId: parseInt(reviewId),
      userId,
      content,
    },
    include: {
      user: { select: { id: true, profile: { select: { fullName: true } } } },
    },
  });

  eventEmitter.emit(EVENTS.REVIEW.REPLIED, {
    reviewId,
    replyId: replyData.id,
    repliedBy: userId,
    reviewUserId: review.userId,
  });

  return replyData;
};

export const getStats = async (userId, roleId) => {
  const where = { deletedAt: null };

  if (roleId > ROLES.ADMIN) {
    const business = await prisma.business.findUnique({
      where: { ownerId: userId },
      select: { id: true },
    });
    if (!business) {
      return {
        total: 0,
        avgRating: 0,
        byRating: {},
        repliedCount: 0,
        responseRate: 0,
        avgResponseTimeHours: 0,
      };
    }

    const placeIds = await prisma.place.findMany({
      where: { businessId: business.id, deletedAt: null },
      select: { id: true },
    });
    where.placeId = { in: placeIds.map((p) => p.id) };
  }

  const [total, avgResult, byRating, reviewsWithFirstReply] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.aggregate({ where, _avg: { rating: true } }),
    prisma.review.groupBy({
      by: ["rating"],
      where,
      _count: { id: true },
    }),
    prisma.review.findMany({
      where,
      select: {
        createdAt: true,
        replies: {
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    }),
  ]);
  const repliedReviews = reviewsWithFirstReply.filter(
    (review) => review.replies.length > 0,
  );
  const totalResponseHours = repliedReviews.reduce((sum, review) => {
    const firstReply = review.replies[0];
    const diffMs = firstReply.createdAt.getTime() - review.createdAt.getTime();
    return sum + Math.max(diffMs, 0) / (1000 * 60 * 60);
  }, 0);

  return {
    total,
    avgRating: avgResult._avg.rating
      ? Number(avgResult._avg.rating.toFixed(1))
      : 0,
    repliedCount: repliedReviews.length,
    responseRate:
      total > 0 ? Number(((repliedReviews.length / total) * 100).toFixed(1)) : 0,
    avgResponseTimeHours:
      repliedReviews.length > 0
        ? Number((totalResponseHours / repliedReviews.length).toFixed(1))
        : 0,
    byRating: byRating.reduce(
      (acc, item) => ({ ...acc, [item.rating]: item._count.id }),
      {},
    ),
  };
};

export const updateReply = async (replyId, content, userId) => {
  const existing = await prisma.reviewReply.findUnique({
    where: { id: parseInt(replyId) },
    select: { id: true, userId: true, status: true },
  });

  if (!existing) {
    throw new ServiceError(
      "Phản hồi không tồn tại",
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  if (existing.userId !== userId) {
    throw new ServiceError(
      "Bạn không có quyền sửa phản hồi này",
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  return prisma.reviewReply.update({
    where: { id: parseInt(replyId) },
    data: { content },
    include: {
      user: { select: { id: true, profile: { select: { fullName: true } } } },
    },
  });
};

export const deleteReply = async (replyId, userId) => {
  const existing = await prisma.reviewReply.findUnique({
    where: { id: parseInt(replyId) },
    select: { id: true, userId: true },
  });

  if (!existing) {
    throw new ServiceError(
      "Phản hồi không tồn tại",
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  if (existing.userId !== userId) {
    throw new ServiceError(
      "Bạn không có quyền xóa phản hồi này",
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  await prisma.reviewReply.delete({ where: { id: parseInt(replyId) } });
  return true;
};

export const moderateReply = async (replyId, status, userId) => {
  const existing = await prisma.reviewReply.findUnique({
    where: { id: parseInt(replyId) },
    select: { id: true, userId: true, status: true },
  });

  if (!existing) {
    throw new ServiceError(
      "Phản hồi không tồn tại",
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  if (existing.userId !== userId) {
    throw new ServiceError(
      "Bạn không có quyền moderation phản hồi này",
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  return prisma.reviewReply.update({
    where: { id: parseInt(replyId) },
    data: { status },
    include: {
      user: { select: { id: true, profile: { select: { fullName: true } } } },
    },
  });
};
