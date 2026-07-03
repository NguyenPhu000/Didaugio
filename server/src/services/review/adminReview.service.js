import prisma from "../../config/prismaClient.js";
import { PAGINATION } from "../../config/constants.js";
import { ERROR_CODES } from "../../config/messages.js";
import ServiceError from "../../utils/serviceError.js";
import { flushPattern } from "../cache/cache.service.js";

const MOD_ACTION_REVIEW = "REVIEW_STATUS";
const MOD_ACTION_REPLY = "REPLY_STATUS";

const moderationLogInclude = {
  take: 25,
  orderBy: { createdAt: "desc" },
  include: {
    actor: {
      select: {
        id: true,
        email: true,
        profile: { select: { fullName: true } },
      },
    },
  },
};

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
  moderationLogs: moderationLogInclude,
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

  const searchOr = params.search
    ? [
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
      ]
    : null;

  const narrowQueue =
    params.queue === "needs_action" || params.sort === "priority";

  const andParts = [];

  if (narrowQueue) {
    andParts.push({ OR: [{ status: "pending" }, { status: "reported" }] });
  } else if (params.status && params.status !== "all") {
    where.status = params.status;
  }

  if (params.rating) {
    where.rating = parseInt(params.rating, 10);
  }
  if (params.hasMedia === true) {
    where.media = { some: {} };
  }
  if (params.isSeeded === true) {
    where.isSeeded = true;
  } else if (params.isSeeded === false) {
    where.isSeeded = false;
  }

  if (searchOr) {
    andParts.push({ OR: searchOr });
  }

  if (andParts.length > 0) {
    where.AND = andParts;
  }

  return where;
}

const priorityRank = (row) => {
  const statusRank = row.status === "reported" ? 0 : row.status === "pending" ? 1 : 2;
  const seededRank = row.isSeeded ? 1 : 0;
  return statusRank * 10 + seededRank;
};

export const getAll = async (params = {}) => {
  const page = parsePage(params.page);
  const limit = parseLimit(params.limit);
  const skip = (page - 1) * limit;
  const where = buildReviewWhere(params);

  const usePriorityOrder =
    params.queue === "needs_action" && params.sort === "priority";

  if (usePriorityOrder) {
    const lightweight = await prisma.review.findMany({
      where,
      select: { id: true, status: true, isSeeded: true, createdAt: true },
    });

    lightweight.sort((a, b) => {
      const diff = priorityRank(a) - priorityRank(b);
      if (diff !== 0) return diff;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    const total = lightweight.length;
    const pageIds = lightweight.slice(skip, skip + limit).map((r) => r.id);

    if (pageIds.length === 0) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    const data = await prisma.review.findMany({
      where: { id: { in: pageIds } },
      include: reviewInclude,
    });
    const order = new Map(pageIds.map((id, index) => [id, index]));
    data.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

    return {
      data: data.map(normalizeReviewMediaResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

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
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getStats = async () => {
  const where = { deletedAt: null };

  const [
    total,
    pending,
    reported,
    hidden,
    visible,
    seeded,
    avgResult,
  ] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.count({ where: { ...where, status: "pending" } }),
    prisma.review.count({ where: { ...where, status: "reported" } }),
    prisma.review.count({ where: { ...where, status: "hidden" } }),
    prisma.review.count({ where: { ...where, status: "visible" } }),
    prisma.review.count({ where: { ...where, isSeeded: true } }),
    prisma.review.aggregate({ where, _avg: { rating: true } }),
  ]);

  return {
    total,
    pending,
    reported,
    hidden,
    visible,
    seeded,
    avgRating: avgResult._avg.rating
      ? Number(avgResult._avg.rating.toFixed(1))
      : 0,
  };
};

export const moderateReview = async (id, data = {}, actorUserId) => {
  const reviewId = parseInt(id, 10);

  if (
    ["hidden", "reported"].includes(data.status) &&
    !(data.moderationReason && String(data.moderationReason).trim())
  ) {
    throw new ServiceError(
      "Vui lòng nhập lý do can thiệp khi ẩn hoặc gắn cờ report",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const modReason =
    data.moderationReason != null && String(data.moderationReason).trim()
      ? String(data.moderationReason).trim().slice(0, 500)
      : null;

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
    const prev = await tx.review.findUnique({
      where: { id: reviewId },
      select: { status: true },
    });

    const review = await tx.review.update({
      where: { id: reviewId },
      data: {
        status: data.status,
        ...(data.adminNote !== undefined && {
          adminNote: String(data.adminNote).trim().slice(0, 1000) || null,
        }),
      },
      include: reviewInclude,
    });

    await tx.reviewModerationLog.create({
      data: {
        reviewId,
        replyId: null,
        actorUserId,
        action: MOD_ACTION_REVIEW,
        fromStatus: prev.status,
        toStatus: data.status,
        reason: modReason,
        noteSnapshot: review.adminNote ?? null,
      },
    });

    await recalculatePlaceRating(tx, existing.placeId);

    return normalizeReviewMediaResponse(review);
  }).then((result) => {
    // Flush place cache since rating changed
    flushPattern("places:");
    return result;
  });
};

export const moderateReply = async (replyId, body = {}, actorUserId) => {
  const parsedReplyId = parseInt(replyId, 10);
  const status = body.status;
  const modReason =
    body.moderationReason != null && String(body.moderationReason).trim()
      ? String(body.moderationReason).trim().slice(0, 500)
      : null;

  if (status === "hidden" && !modReason) {
    throw new ServiceError(
      "Vui lòng nhập lý do khi ẩn phản hồi",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const existing = await prisma.reviewReply.findUnique({
    where: { id: parsedReplyId },
    select: { id: true, reviewId: true, status: true },
  });

  if (!existing) {
    throw new ServiceError(
      "Phản hồi không tồn tại",
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.reviewReply.update({
      where: { id: parsedReplyId },
      data: { status },
      include: {
        user: { select: { id: true, profile: { select: { fullName: true } } } },
      },
    });

    await tx.reviewModerationLog.create({
      data: {
        reviewId: existing.reviewId,
        replyId: existing.id,
        actorUserId,
        action: MOD_ACTION_REPLY,
        fromStatus: existing.status,
        toStatus: status,
        reason: modReason,
        noteSnapshot: null,
      },
    });

    return updated;
  });
};
