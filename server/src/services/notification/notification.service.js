import prisma from "../../config/prismaClient.js";
import eventEmitter, { EVENTS } from "../../utils/eventEmitter.js";
import { emitToUser, emitToAll, isUserOnline } from "../../config/socketIO.js";
import { sendWebPush } from "./webPush.service.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const ADMIN_ROLE_IDS = [1, 2, 4];

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
  eventKey = null,
}) {
  const normalizedRecipients = uniqueRecipients(recipients);
  if (normalizedRecipients.length === 0) return null;

  if (eventKey) {
    const existing = await prisma.notificationGlobal.findMany({
      where: { status: "published" },
      include: { recipients: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    const existingNotification = existing.find(
      (item) => item.data?.eventKey === eventKey,
    );

    if (existingNotification) {
      const existingUserIds = new Set(
        existingNotification.recipients.map((recipient) => recipient.userId),
      );
      const missingRecipients = normalizedRecipients.filter(
        (recipient) => !existingUserIds.has(recipient.userId),
      );

      if (missingRecipients.length === 0) return null;

      const createdRecipients = await prisma.notificationRecipient.createMany({
        data: missingRecipients.map((recipient) => ({
          notificationId: existingNotification.id,
          userId: recipient.userId,
          businessId: recipient.businessId,
          roleId: recipient.roleId,
        })),
        skipDuplicates: true,
      });

      const hydratedRecipients = await prisma.notificationRecipient.findMany({
        where: {
          notificationId: existingNotification.id,
          userId: { in: missingRecipients.map((recipient) => recipient.userId) },
        },
      });

      for (const recipient of hydratedRecipients) {
        const payload = toPayload(existingNotification, recipient);
        emitToUser(recipient.userId, "notification", payload);
        sendPushIfOffline(
          recipient.userId,
          existingNotification.title,
          existingNotification.body,
          existingNotification.data || {},
        ).catch(() => {});
      }

      return { ...existingNotification, createdRecipients };
    }
  }

  const createdById = toPositiveInt(createdBy) || normalizedRecipients[0].userId;
  const userIds = normalizedRecipients.map((recipient) => recipient.userId);
  const metadata = eventKey ? { ...data, eventKey } : data;

  const notification = await prisma.notificationGlobal.create({
    data: {
      title,
      body,
      targetType,
      targetValue: { userIds },
      data: metadata,
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
    sendPushIfOffline(recipient.userId, title, body, metadata).catch(() => {});
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
    where: { roleId: { in: ADMIN_ROLE_IDS }, deletedAt: null },
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

async function getAdminRecipients() {
  const admins = await prisma.user.findMany({
    where: { roleId: { in: ADMIN_ROLE_IDS }, deletedAt: null },
    select: { id: true, roleId: true },
  });
  return admins.map((admin) => ({ userId: admin.id, roleId: admin.roleId }));
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

async function backfillPendingReviewNotifications() {
  const adminRecipients = await getAdminRecipients();
  if (adminRecipients.length === 0) return;

  const [pendingBusinesses, pendingPlaces] = await Promise.all([
    prisma.business.findMany({
      where: { status: "pending" },
      select: {
        id: true,
        ownerId: true,
        businessName: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
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
      take: 100,
    }),
  ]);

  for (const business of pendingBusinesses) {
    await createNotification({
      title: "Hồ sơ doanh nghiệp cần duyệt",
      body: `${business.businessName || `Doanh nghiệp #${business.id}`} đang chờ quản trị viên xét duyệt.`,
      data: {
        businessId: business.id,
        type: "admin_business_pending",
      },
      createdBy: business.ownerId,
      targetType: "role",
      recipients: adminRecipients,
      eventKey: `business:pending:${business.id}`,
    }).catch((error) => {
      console.error("[Notification] Backfill pending business failed:", error);
    });
  }

  for (const place of pendingPlaces) {
    await createNotification({
      title: "Địa điểm cần duyệt",
      body: `${place.name || `Địa điểm #${place.id}`} đang chờ quản trị viên xét duyệt.`,
      data: {
        placeId: place.id,
        businessId: place.businessId,
        type: "admin_place_pending",
      },
      createdBy: place.createdBy,
      targetType: "role",
      recipients: adminRecipients,
      eventKey: `place:pending:${place.id}`,
    }).catch((error) => {
      console.error("[Notification] Backfill pending place failed:", error);
    });
  }
}

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

eventEmitter.on(EVENTS.BUSINESS.CONTRACT_SIGNED, async ({ businessId, businessName, ownerId, contractVersion, signedAt }) => {
  await notifyAdmins(
    "Doanh nghiệp ký hợp đồng",
    `${businessName || `Doanh nghiệp #${businessId}`} đã ký hợp đồng (${contractVersion || "v1"}) lúc ${new Date(signedAt).toLocaleString("vi-VN")}.`,
    { businessId, contractVersion, type: "admin_business_contract_signed" },
    ownerId,
  ).catch((error) => {
    console.error("[Notification] Error processing BUSINESS.CONTRACT_SIGNED:", error);
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

eventEmitter.on(EVENTS.BOOKING.PAID, async ({ bookingId, bookingCode, userId, businessId }) => {
  await Promise.all([
    notifyUser(
      userId,
      "Đã thanh toán, chờ xác nhận",
      `Booking #${bookingCode} đã thanh toán thành công. Đang chờ doanh nghiệp xác nhận.`,
      { bookingId, type: "booking_paid" },
    ),
    businessId
      ? notifyBusinessOwner(
          businessId,
          "Có đơn thanh toán mới, vui lòng xác nhận",
          `Booking #${bookingCode} đã được thanh toán. Vui lòng xác nhận đơn.`,
          { bookingId, type: "booking_paid_business" },
        )
      : Promise.resolve(),
  ]).catch((error) => {
    console.error("[Notification] Error processing BOOKING.PAID:", error);
  });
});

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

const formatRescheduleTimeVi = (iso) => {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

eventEmitter.on(
  EVENTS.BOOKING.RESCHEDULED,
  async ({
    bookingId,
    bookingCode,
    userId,
    rescheduledBy,
    newBookingAt,
    businessNote,
  }) => {
    const when = newBookingAt ? formatRescheduleTimeVi(newBookingAt) : "";
    const noteSuffix =
      businessNote && String(businessNote).trim()
        ? ` Ghi chú: ${String(businessNote).trim()}`
        : "";
    await notifyUser(
      userId,
      "Lịch đặt chỗ đã đổi",
      `Booking #${bookingCode} được dời sang ${when}.${noteSuffix}`,
      {
        bookingId,
        type: "booking_rescheduled",
        newBookingAt: newBookingAt || null,
      },
      rescheduledBy,
    ).catch((error) => {
      console.error("[Notification] Error processing BOOKING.RESCHEDULED:", error);
    });
  },
);

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

eventEmitter.on(
  EVENTS.BOOKING.REJECTED,
  async ({ bookingId, bookingCode, rejectedBy, rejectReason, userId }) => {
    await notifyUser(
      userId,
      "Booking bị từ chối",
      `Booking ${bookingCode} bị từ chối. Lý do: ${rejectReason || "Địa điểm không thể nhận yêu cầu này"}`,
      { bookingId, type: "booking_rejected", rejectReason },
      rejectedBy,
    ).catch((error) => {
      console.error("[Notification] Error processing BOOKING.REJECTED:", error);
    });
  },
);

eventEmitter.on(
  EVENTS.BOOKING.EXPIRED,
  async ({ bookingId, bookingCode, userId }) => {
    await notifyUser(
      userId,
      "Booking đã hết hạn",
      `Booking #${bookingCode} đã hết hạn vì quá thời gian xử lý.`,
      { bookingId, type: "booking_expired" },
    ).catch((error) => {
      console.error("[Notification] Error processing BOOKING.EXPIRED:", error);
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

/**
 * Tạo thông báo hệ thống (announcement) — hiển thị ngay cho tất cả user.
 * Lưu vào notifications_global + tạo NotificationRecipient cho từng user
 * + emit Socket.IO + push cho offline users.
 */
export async function createAnnouncement({ title, body, imageUrl, createdBy }) {
  // 1. Lấy toàn bộ user active
  const users = await prisma.user.findMany({
    where: { status: "active" },
    select: { id: true },
  });

  if (users.length === 0) return null;

  const createdById = toPositiveInt(createdBy) || users[0].id;

  // 2. Tạo NotificationGlobal + NotificationRecipient cho từng user
  const notification = await prisma.notificationGlobal.create({
    data: {
      title,
      body,
      imageUrl: imageUrl || null,
      targetType: "all",
      targetValue: { userIds: users.map((u) => u.id) },
      data: { type: "announcement" },
      status: "sent",
      sentAt: new Date(),
      createdBy: createdById,
      successCount: users.length,
      recipients: {
        create: users.map((u) => ({
          userId: u.id,
        })),
      },
    },
    include: { recipients: true },
  });

  // 3. Emit Socket.IO per-user (notification event) + push cho offline users
  for (const recipient of notification.recipients) {
    const payload = toPayload(notification, recipient);
    emitToUser(recipient.userId, "notification", payload);
    sendPushIfOffline(
      recipient.userId,
      title,
      body,
      { type: "announcement", announcementId: notification.id },
    ).catch(() => {});
  }

  // 4. Emit announcement event (cho UI realtime, backwards-compatible)
  emitToAll("announcement", {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    imageUrl: notification.imageUrl,
    sentAt: notification.sentAt,
  });

  return notification;
}

/**
 * Cập nhật thông báo hệ thống (admin).
 */
export async function updateAnnouncement(id, { title, body, imageUrl }) {
  const existing = await prisma.notificationGlobal.findUnique({
    where: { id: Number(id) },
  });

  if (!existing) {
    throw new Error("Không tìm thấy thông báo");
  }

  const updated = await prisma.notificationGlobal.update({
    where: { id: Number(id) },
    data: {
      ...(title !== undefined && { title }),
      ...(body !== undefined && { body }),
      ...(imageUrl !== undefined && { imageUrl }),
    },
  });

  return updated;
}

/**
 * Xóa thông báo hệ thống (admin).
 */
export async function deleteAnnouncement(id) {
  const existing = await prisma.notificationGlobal.findUnique({
    where: { id: Number(id) },
  });

  if (!existing) {
    throw new Error("Không tìm thấy thông báo");
  }

  await prisma.notificationGlobal.delete({
    where: { id: Number(id) },
  });

  return { id: Number(id) };
}

/**
 * Lấy danh sách thông báo hệ thống (admin).
 */
export async function getAnnouncements({ page = 1, limit = 20 } = {}) {
  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const skip = (pageNum - 1) * limitNum;

  const [data, total] = await Promise.all([
    prisma.notificationGlobal.findMany({
      where: { targetType: "all" },
      orderBy: { sentAt: "desc" },
      skip,
      take: limitNum,
      select: {
        id: true,
        title: true,
        body: true,
        imageUrl: true,
        sentAt: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.notificationGlobal.count({ where: { targetType: "all" } }),
  ]);

  return {
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

export const initNotificationService = () => {
  console.log("[Notification Service] Initialized and listening for events...");
  backfillPendingReviewNotifications().catch((error) => {
    console.error("[Notification] Backfill pending review notifications failed:", error);
  });
};
