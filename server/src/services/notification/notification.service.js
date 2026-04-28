import prisma from "../../config/prismaClient.js";
import eventEmitter, { EVENTS } from "../../utils/eventEmitter.js";
import { emitToUser, isUserOnline } from "../../config/socketIO.js";
import { sendWebPush } from "./webPush.service.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const ADMIN_ROLE_IDS = [1, 2];

const FIELD_LABELS = {
  idCardFront: "CCCD mặt trước",
  idCardBack: "CCCD mặt sau",
  businessLicense: "Giấy phép kinh doanh",
  idCardNumber: "Số CCCD",
  taxCode: "Mã số thuế",
  bankAccount: "Số tài khoản ngân hàng",
  bankAccountNumber: "Số tài khoản ngân hàng",
  bankOwner: "Chủ tài khoản ngân hàng",
  bankAccountOwner: "Chủ tài khoản ngân hàng",
  bankName: "Ngân hàng",
};

export async function sendExpoPush(tokens, title, body, data = {}) {
  const messages = (Array.isArray(tokens) ? tokens : [tokens])
    .filter(Boolean)
    .map((to) => ({ to, title, body, data, sound: "default" }));

  if (messages.length === 0) return;

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });
    return response.json();
  } catch (err) {
    console.error("[ExpoPush] Failed to send push notification:", err.message);
  }
}

async function getUserPushTokens(userId) {
  const sessions = await prisma.userSession.findMany({
    where: { userId: Number(userId), isActive: true, pushToken: { not: null } },
    select: { pushToken: true },
  });
  return sessions.map((session) => session.pushToken).filter(Boolean);
}

const toPositiveInt = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const uniqueRecipients = (recipients = []) => {
  const seen = new Set();
  return recipients
    .map((recipient) => ({
      userId: toPositiveInt(recipient.userId),
      businessId: toPositiveInt(recipient.businessId),
      roleId: toPositiveInt(recipient.roleId),
    }))
    .filter((recipient) => {
      if (!recipient.userId || seen.has(recipient.userId)) return false;
      seen.add(recipient.userId);
      return true;
    });
};

const toPayload = (notification, recipient) => ({
  id: recipient.id,
  notificationId: notification.id,
  title: notification.title,
  body: notification.body,
  message: notification.body,
  metadata: notification.data || {},
  readAt: recipient.readAt,
  createdAt: recipient.createdAt || notification.createdAt,
});

async function sendPushIfOffline(userId, title, body, data) {
  if (isUserOnline(userId)) return;

  sendWebPush(userId, title, body, data).catch(() => {});

  const tokens = await getUserPushTokens(userId).catch(() => []);
  if (tokens.length > 0) {
    sendExpoPush(tokens, title, body, data).catch(() => {});
  }
}

async function createNotification({
  title,
  body,
  data = {},
  recipients,
  createdBy = null,
  targetType = "users",
}) {
  const normalizedRecipients = uniqueRecipients(recipients);
  if (normalizedRecipients.length === 0) return null;

  const createdById = toPositiveInt(createdBy) || normalizedRecipients[0].userId;
  const userIds = normalizedRecipients.map((recipient) => recipient.userId);

  const notification = await prisma.notificationGlobal.create({
    data: {
      title,
      body,
      targetType,
      targetValue: { userIds },
      data,
      createdBy: createdById,
      status: "published",
      sentAt: new Date(),
      successCount: normalizedRecipients.length,
      recipients: {
        create: normalizedRecipients.map((recipient) => ({
          userId: recipient.userId,
          businessId: recipient.businessId,
          roleId: recipient.roleId,
        })),
      },
    },
    include: { recipients: true },
  });

  for (const recipient of notification.recipients) {
    const payload = toPayload(notification, recipient);
    emitToUser(recipient.userId, "notification", payload);
    sendPushIfOffline(recipient.userId, title, body, data).catch(() => {});
  }

  return notification;
}

async function notifyUser(userId, title, body, data = {}, createdBy = null) {
  return createNotification({
    title,
    body,
    data,
    createdBy,
    recipients: [{ userId }],
  });
}

async function notifyAdmins(title, body, data = {}, createdBy = null) {
  const admins = await prisma.user.findMany({
    where: { roleId: { in: ADMIN_ROLE_IDS }, deletedAt: null, status: "active" },
    select: { id: true, roleId: true },
  });

  return createNotification({
    title,
    body,
    data,
    createdBy,
    targetType: "role",
    recipients: admins.map((admin) => ({ userId: admin.id, roleId: admin.roleId })),
  });
}

async function notifyBusinessOwner(
  businessId,
  title,
  body,
  data = {},
  createdBy = null,
) {
  const business = await prisma.business.findUnique({
    where: { id: Number(businessId) },
    select: { id: true, ownerId: true },
  });

  if (!business) return null;

  return createNotification({
    title,
    body,
    data: { ...data, businessId: business.id },
    createdBy,
    targetType: "business",
    recipients: [{ userId: business.ownerId, businessId: business.id, roleId: 3 }],
  });
}

const formatChangedFields = (changedFields = []) =>
  changedFields.map((field) => FIELD_LABELS[field] || field).join(", ");

eventEmitter.on(EVENTS.BUSINESS.REGISTERED, async ({ businessId, userId, businessName }) => {
  await Promise.all([
    notifyAdmins(
      "Doanh nghiệp mới cần duyệt",
      `${businessName || `Doanh nghiệp #${businessId}`} vừa gửi hồ sơ đăng ký.`,
      { businessId, type: "admin_business_registered" },
      userId,
    ),
    notifyUser(
      userId,
      "Đã gửi hồ sơ doanh nghiệp",
      "Hồ sơ doanh nghiệp của bạn đã được gửi và đang chờ quản trị viên xét duyệt.",
      { businessId, type: "business_registered" },
      userId,
    ),
  ]).catch((error) => {
    console.error("[Notification] Error processing BUSINESS.REGISTERED:", error);
  });
});

eventEmitter.on(EVENTS.BUSINESS.APPROVED, async ({ businessId, approvedBy, ownerId }) => {
  await notifyUser(
    ownerId,
    "Doanh nghiệp được duyệt",
    "Hồ sơ doanh nghiệp của bạn đã được duyệt. Bạn có thể bắt đầu đăng địa điểm.",
    { businessId, type: "business_approved" },
    approvedBy,
  ).catch((error) => {
    console.error("[Notification] Error processing BUSINESS.APPROVED:", error);
  });
});

eventEmitter.on(
  EVENTS.BUSINESS.REJECTED,
  async ({ businessId, rejectedBy, reason, ownerId }) => {
    await notifyUser(
      ownerId,
      "Doanh nghiệp bị từ chối",
      `Hồ sơ doanh nghiệp bị từ chối. Lý do: ${reason}`,
      { businessId, type: "business_rejected", reason },
      rejectedBy,
    ).catch((error) => {
      console.error("[Notification] Error processing BUSINESS.REJECTED:", error);
    });
  },
);

eventEmitter.on(
  EVENTS.BUSINESS.SUSPENDED,
  async ({ businessId, suspendedBy, reason, ownerId, cancelledBookings }) => {
    await notifyUser(
      ownerId,
      "Doanh nghiệp bị tạm khóa",
      `Doanh nghiệp của bạn đã bị tạm khóa. Lý do: ${reason}${cancelledBookings > 0 ? `. ${cancelledBookings} đặt chỗ đã tự động hủy.` : ""}`,
      { businessId, type: "business_suspended", reason },
      suspendedBy,
    ).catch((error) => {
      console.error("[Notification] Error processing BUSINESS.SUSPENDED:", error);
    });
  },
);

eventEmitter.on(EVENTS.BUSINESS.REACTIVATED, async ({ businessId, reactivatedBy, ownerId }) => {
  await notifyUser(
    ownerId,
    "Doanh nghiệp được kích hoạt lại",
    "Doanh nghiệp của bạn đã được kích hoạt lại. Các địa điểm đã được khôi phục.",
    { businessId, type: "business_reactivated" },
    reactivatedBy,
  ).catch((error) => {
    console.error("[Notification] Error processing BUSINESS.REACTIVATED:", error);
  });
});

eventEmitter.on(
  EVENTS.BUSINESS.TERMINATED,
  async ({ businessId, terminatedBy, reason, ownerId, cancelledBookings }) => {
    await notifyUser(
      ownerId,
      "Hợp đồng doanh nghiệp đã chấm dứt",
      `Hợp đồng doanh nghiệp của bạn đã bị chấm dứt. Lý do: ${reason}${cancelledBookings > 0 ? `. ${cancelledBookings} đặt chỗ đã tự động hủy và hoàn tiền.` : ""}`,
      { businessId, type: "business_terminated", reason },
      terminatedBy,
    ).catch((error) => {
      console.error("[Notification] Error processing BUSINESS.TERMINATED:", error);
    });
  },
);

eventEmitter.on(EVENTS.BUSINESS.DOCUMENT_UPDATED, async ({ businessId, ownerId, changedFields }) => {
  const labels = formatChangedFields(changedFields);
  await Promise.all([
    notifyUser(
      ownerId,
      "Tài liệu pháp lý đã cập nhật",
      `Các trường đã thay đổi: ${labels}. Hồ sơ sẽ được xem xét lại.`,
      { businessId, type: "business_document_updated", changedFields },
    ),
    notifyAdmins(
      "Tài liệu doanh nghiệp cập nhật",
      `Doanh nghiệp #${businessId} đã cập nhật: ${labels}. Cần xem xét lại.`,
      { businessId, type: "admin_document_updated", changedFields },
    ),
  ]).catch((error) => {
    console.error("[Notification] Error processing BUSINESS.DOCUMENT_UPDATED:", error);
  });
});

eventEmitter.on(EVENTS.BUSINESS.RESUBMITTED, async ({ businessId, ownerId, businessName }) => {
  await notifyAdmins(
    "Doanh nghiệp nộp lại hồ sơ",
    `${businessName || `Doanh nghiệp #${businessId}`} đã nộp lại hồ sơ để duyệt.`,
    { businessId, type: "admin_business_resubmitted" },
    ownerId,
  ).catch((error) => {
    console.error("[Notification] Error processing BUSINESS.RESUBMITTED:", error);
  });
});

eventEmitter.on(EVENTS.PLACE.CREATED, async ({ id, name, createdBy }) => {
  const place = await prisma.place.findUnique({
    where: { id: Number(id) },
    select: { id: true, name: true, status: true, businessId: true },
  });

  if (place?.status === "pending") {
    await notifyAdmins(
      "Địa điểm mới cần duyệt",
      `${name || place.name || `Địa điểm #${id}`} vừa được gửi để xét duyệt.`,
      { placeId: id, businessId: place.businessId, type: "admin_place_created" },
      createdBy,
    ).catch((error) => {
      console.error("[Notification] Error processing PLACE.CREATED:", error);
    });
  }
});

eventEmitter.on(EVENTS.PLACE.UPDATED, async ({ id, updatedBy }) => {
  const place = await prisma.place.findUnique({
    where: { id: Number(id) },
    select: { id: true, name: true, status: true, businessId: true },
  });

  if (place?.status === "pending") {
    await notifyAdmins(
      "Địa điểm đã cập nhật",
      `${place.name || `Địa điểm #${id}`} đã cập nhật và cần xét duyệt lại.`,
      { placeId: id, businessId: place.businessId, type: "admin_place_updated" },
      updatedBy,
    ).catch((error) => {
      console.error("[Notification] Error processing PLACE.UPDATED:", error);
    });
  }
});

eventEmitter.on(EVENTS.PLACE.DELETED, async ({ id }) => {
  await notifyAdmins(
    "Địa điểm đã bị xóa",
    `Địa điểm #${id} vừa bị xóa khỏi hệ thống.`,
    { placeId: id, type: "admin_place_deleted" },
  ).catch((error) => {
    console.error("[Notification] Error processing PLACE.DELETED:", error);
  });
});

eventEmitter.on(EVENTS.PLACE.APPROVED, async ({ id, approvedBy, ownerId }) => {
  await notifyUser(
    ownerId,
    "Địa điểm được duyệt",
    `Địa điểm của bạn (ID: ${id}) đã được duyệt thành công.`,
    { placeId: id, type: "place_approved" },
    approvedBy,
  ).catch((error) => {
    console.error("[Notification] Error processing PLACE.APPROVED:", error);
  });
});

eventEmitter.on(EVENTS.PLACE.REJECTED, async ({ id, rejectedBy, reason, ownerId }) => {
  await notifyUser(
    ownerId,
    "Địa điểm bị từ chối",
    `Địa điểm của bạn (ID: ${id}) bị từ chối. Lý do: ${reason || "Không đạt yêu cầu"}`,
    { placeId: id, type: "place_rejected", reason },
    rejectedBy,
  ).catch((error) => {
    console.error("[Notification] Error processing PLACE.REJECTED:", error);
  });
});

eventEmitter.on(
  EVENTS.BOOKING.CREATED,
  async ({ bookingId, bookingCode, userId, businessOwnerId }) => {
    await Promise.all([
      notifyUser(
        businessOwnerId,
        "Booking mới",
        `Có booking mới #${bookingCode} cần xác nhận.`,
        { bookingId, type: "booking_created" },
        userId,
      ),
      notifyUser(
        userId,
        "Đặt chỗ thành công",
        `Đặt chỗ #${bookingCode} đã được ghi nhận, đang chờ xác nhận.`,
        { bookingId, type: "booking_created" },
      ),
    ]).catch((error) => {
      console.error("[Notification] Error processing BOOKING.CREATED:", error);
    });
  },
);

eventEmitter.on(EVENTS.BOOKING.CONFIRMED, async ({ bookingId, bookingCode, confirmedBy, userId }) => {
  await notifyUser(
    userId,
    "Booking đã xác nhận",
    `Booking #${bookingCode} đã được xác nhận. Mã QR đã sẵn sàng.`,
    { bookingId, type: "booking_confirmed" },
    confirmedBy,
  ).catch((error) => {
    console.error("[Notification] Error processing BOOKING.CONFIRMED:", error);
  });
});

eventEmitter.on(
  EVENTS.BOOKING.CANCELLED,
  async ({ bookingId, bookingCode, cancelledBy, cancelReason, userId }) => {
    await notifyUser(
      userId,
      "Booking đã bị hủy",
      `Booking #${bookingCode} đã bị hủy. Lý do: ${cancelReason}`,
      { bookingId, type: "booking_cancelled", cancelReason },
      cancelledBy,
    ).catch((error) => {
      console.error("[Notification] Error processing BOOKING.CANCELLED:", error);
    });
  },
);

eventEmitter.on(EVENTS.BOOKING.COMPLETED, async ({ bookingId, bookingCode, completedBy, userId }) => {
  await notifyUser(
    userId,
    "Booking hoàn thành",
    `Booking #${bookingCode} đã hoàn thành. Cảm ơn bạn!`,
    { bookingId, type: "booking_completed" },
    completedBy,
  ).catch((error) => {
    console.error("[Notification] Error processing BOOKING.COMPLETED:", error);
  });
});

eventEmitter.on(EVENTS.BOOKING.NO_SHOW, async ({ bookingId, bookingCode, markedBy, userId }) => {
  await notifyUser(
    userId,
    "Không đến",
    `Bạn đã không đến. Booking #${bookingCode} đã bị đánh dấu không đến.`,
    { bookingId, type: "booking_no_show" },
    markedBy,
  ).catch((error) => {
    console.error("[Notification] Error processing BOOKING.NO_SHOW:", error);
  });
});

eventEmitter.on(EVENTS.REVIEW.REPLIED, async ({ reviewId, replyId, repliedBy, reviewUserId }) => {
  await notifyUser(
    reviewUserId,
    "Doanh nghiệp đã phản hồi đánh giá",
    "Đánh giá của bạn vừa nhận được phản hồi từ doanh nghiệp.",
    { reviewId, replyId, type: "review_replied" },
    repliedBy,
  ).catch((error) => {
    console.error("[Notification] Error processing REVIEW.REPLIED:", error);
  });
});

export const initNotificationService = () => {
  console.log("[Notification Service] Initialized and listening for events...");
};
