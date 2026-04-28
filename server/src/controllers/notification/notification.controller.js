import prisma from "../../config/prismaClient.js";
import { PAGINATION } from "../../config/constants.js";

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

export const getNotifications = async (req, res, next) => {
  try {
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
