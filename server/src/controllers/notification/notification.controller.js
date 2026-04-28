import prisma from "../../config/prismaClient.js";
import { PAGINATION } from "../../config/constants.js";

const REVIEW_NOTIFICATION_ROLE_IDS = [1, 2, 4];
const PENDING_REVIEW_LIMIT = 100;

const toNotificationDto = (recipient) => ({
  id: recipient.id,
  notificationId: recipient.notificationId,
  title: recipient.notification.title,
  body: recipient.notification.body,
  message: recipient.notification.body,
  metadata: recipient.notification.data || {},
  readAt: recipient.readAt,
  createdAt: recipient.createdAt || recipient.notification.createdAt,
});

async function getCurrentUserRoleId(userId, fallbackRoleId) {
  const dbUser = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { roleId: true },
  });
  return Number(dbUser?.roleId || fallbackRoleId);
}

async function ensurePendingReviewNotification({
  eventKey,
  title,
  body,
  data,
  createdBy,
  recipient,
}) {
  const existingCandidates = await prisma.notificationGlobal.findMany({
    where: { status: "published" },
    include: { recipients: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  const existing = existingCandidates.find(
    (notification) => notification.data?.eventKey === eventKey,
  );

  if (existing) {
    const hasRecipient = existing.recipients.some(
      (item) => item.userId === recipient.userId,
    );
    if (!hasRecipient) {
      await prisma.notificationRecipient.createMany({
        data: [{
          notificationId: existing.id,
          userId: recipient.userId,
          businessId: recipient.businessId,
          roleId: recipient.roleId,
        }],
        skipDuplicates: true,
      });
    }
    return;
  }

  await prisma.notificationGlobal.create({
    data: {
      title,
      body,
      targetType: "role",
      targetValue: { userIds: [recipient.userId] },
      data: { ...data, eventKey },
      createdBy: Number(createdBy) || recipient.userId,
      status: "published",
      sentAt: new Date(),
      successCount: 1,
      recipients: {
        create: {
          userId: recipient.userId,
          businessId: recipient.businessId,
          roleId: recipient.roleId,
        },
      },
    },
  });
}

async function syncPendingReviewNotificationsForUser(req) {
  const userId = Number(req.user.userId);
  const roleId = await getCurrentUserRoleId(userId, req.user.roleId);
  if (!REVIEW_NOTIFICATION_ROLE_IDS.includes(roleId)) return;

  const [pendingBusinesses, pendingPlaces] = await Promise.all([
    prisma.business.findMany({
      where: { status: "pending" },
      select: { id: true, ownerId: true, businessName: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: PENDING_REVIEW_LIMIT,
    }),
    prisma.place.findMany({
      where: { status: "pending", deletedAt: null },
      select: {
        id: true,
        name: true,
        businessId: true,
        createdBy: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: PENDING_REVIEW_LIMIT,
    }),
  ]);

  for (const business of pendingBusinesses) {
    await ensurePendingReviewNotification({
      eventKey: `business:pending:${business.id}`,
      title: "Hồ sơ doanh nghiệp cần duyệt",
      body: `${business.businessName || `Doanh nghiệp #${business.id}`} đang chờ quản trị viên xét duyệt.`,
      data: { businessId: business.id, type: "admin_business_pending" },
      createdBy: business.ownerId,
      recipient: { userId, roleId },
    });
  }

  for (const place of pendingPlaces) {
    await ensurePendingReviewNotification({
      eventKey: `place:pending:${place.id}`,
      title: "Địa điểm cần duyệt",
      body: `${place.name || `Địa điểm #${place.id}`} đang chờ quản trị viên xét duyệt.`,
      data: {
        placeId: place.id,
        businessId: place.businessId,
        type: "admin_place_pending",
      },
      createdBy: place.createdBy,
      recipient: { userId, roleId, businessId: place.businessId },
    });
  }
}

export const getNotifications = async (req, res, next) => {
  try {
    await syncPendingReviewNotificationsForUser(req);

    const userId = Number(req.user.userId);
    const page = Math.max(Number(req.query.page) || PAGINATION.DEFAULT_PAGE, 1);
    const limit = Math.min(
      Number(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT,
    );
    const unreadOnly = req.query.unreadOnly === "true";
    const where = {
      userId,
      notification: { status: "published" },
      ...(unreadOnly ? { readAt: null } : {}),
    };

    const [recipients, total, unreadCount] = await Promise.all([
      prisma.notificationRecipient.findMany({
        where,
        include: { notification: true },
        orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notificationRecipient.count({ where }),
      prisma.notificationRecipient.count({
        where: { userId, readAt: null, notification: { status: "published" } },
      }),
    ]);

    res.json({
      success: true,
      data: recipients.map(toNotificationDto),
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = Number(req.user.userId);
    const unreadCount = await prisma.notificationRecipient.count({
      where: { userId, readAt: null, notification: { status: "published" } },
    });

    res.json({ success: true, data: { unreadCount } });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const userId = Number(req.user.userId);
    const id = Number(req.params.id);

    const recipient = await prisma.notificationRecipient.findFirst({
      where: { id, userId },
      select: { id: true, readAt: true },
    });

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Thông báo không tồn tại",
      });
    }

    if (!recipient.readAt) {
      await prisma.notificationRecipient.update({
        where: { id },
        data: { readAt: new Date() },
      });
    }

    res.json({ success: true, message: "Đã đánh dấu đã đọc" });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = Number(req.user.userId);

    const result = await prisma.notificationRecipient.updateMany({
      where: { userId, readAt: null, notification: { status: "published" } },
      data: { readAt: new Date() },
    });

    res.json({
      success: true,
      message: `Đã đánh dấu ${result.count} thông báo đã đọc`,
      data: { updatedCount: result.count },
    });
  } catch (error) {
    next(error);
  }
};
