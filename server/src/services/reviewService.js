import prisma from "../config/prismaClient.js";
import { PAGINATION, ROLES } from "../config/constants.js";
import eventEmitter, { EVENTS } from "../utils/eventEmitter.js";

const defaultInclude = {
  user: { select: { id: true, fullName: true, avatar: true } },
  place: { select: { id: true, name: true } },
  replies: {
    include: { user: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "asc" },
  },
};

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
    if (!business) return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };

    const placeIds = await prisma.place.findMany({
      where: { businessId: business.id, deletedAt: null },
      select: { id: true },
    });
    where.placeId = { in: placeIds.map((p) => p.id) };
  }

  if (params.search) {
    where.OR = [
      { content: { contains: params.search, mode: "insensitive" } },
      { user: { fullName: { contains: params.search, mode: "insensitive" } } },
    ];
  }
  if (params.rating) {
    where.rating = parseInt(params.rating);
  }
  if (params.placeId) {
    where.placeId = parseInt(params.placeId);
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
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getById = async (id) => {
  const review = await prisma.review.findUnique({
    where: { id: parseInt(id) },
    include: {
      ...defaultInclude,
      media: true,
    },
  });

  if (!review) {
    throw Object.assign(new Error("Đánh giá không tồn tại"), { statusCode: 404 });
  }

  return review;
};

export const reply = async (reviewId, content, userId) => {
  const review = await prisma.review.findUnique({
    where: { id: parseInt(reviewId) },
    select: { id: true, userId: true },
  });

  if (!review) {
    throw Object.assign(new Error("Đánh giá không tồn tại"), { statusCode: 404 });
  }

  const replyData = await prisma.reviewReply.create({
    data: {
      reviewId: parseInt(reviewId),
      userId,
      content,
    },
    include: { user: { select: { id: true, fullName: true } } },
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
    if (!business) return { total: 0, avgRating: 0, byRating: {} };

    const placeIds = await prisma.place.findMany({
      where: { businessId: business.id, deletedAt: null },
      select: { id: true },
    });
    where.placeId = { in: placeIds.map((p) => p.id) };
  }

  const [total, avgResult, byRating] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.aggregate({ where, _avg: { rating: true } }),
    prisma.review.groupBy({
      by: ["rating"],
      where,
      _count: { id: true },
    }),
  ]);

  return {
    total,
    avgRating: avgResult._avg.rating ? Number(avgResult._avg.rating.toFixed(1)) : 0,
    byRating: byRating.reduce(
      (acc, item) => ({ ...acc, [item.rating]: item._count.id }),
      {},
    ),
  };
};
