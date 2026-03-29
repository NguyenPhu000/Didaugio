import prisma from "../config/prismaClient.js";
import eventEmitter, { EVENTS } from "../utils/eventEmitter.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/**
 * Send push notifications via Expo Push Service.
 * Non-blocking — errors are logged but not thrown.
 * @param {string|string[]} tokens
 * @param {string} title
 * @param {string} body
 * @param {Object} data
 */
export async function sendExpoPush(tokens, title, body, data = {}) {
  const tokenList = Array.isArray(tokens) ? tokens : [tokens];
  const messages = tokenList
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

/**
 * Get active push tokens for a user from UserSession.
 * @param {number} userId
 * @returns {Promise<string[]>}
 */
async function getUserPushTokens(userId) {
  const sessions = await prisma.userSession.findMany({
    where: { userId, isActive: true, pushToken: { not: null } },
    select: { pushToken: true },
  });
  return sessions.map((s) => s.pushToken).filter(Boolean);
}

/**
 * Convenience: send push + create DB notification for a user.
 */
async function notifyUser(userId, title, body, data = {}, createdBy = null) {
  const [tokens] = await Promise.all([
    getUserPushTokens(userId),
    prisma.notificationGlobal.create({
      data: {
        title,
        body,
        targetType: "user",
        targetValue: { userId },
        data,
        createdBy,
        status: "published",
        sentAt: new Date(),
      },
    }),
  ]);

  if (tokens.length > 0) {
    sendExpoPush(tokens, title, body, data).catch(() => {});
  }
}

eventEmitter.on(EVENTS.PLACE.APPROVED, async ({ id, approvedBy, ownerId }) => {
  try {
    await notifyUser(
      ownerId,
      "Địa điểm được duyệt",
      `Địa điểm của bạn (ID: ${id}) đã được duyệt thành công.`,
      { placeId: id, type: "place_approved" },
      approvedBy,
    );
  } catch (error) {
    console.error("[Notification] Error processing APPROVED event:", error);
  }
});

eventEmitter.on(EVENTS.PLACE.REJECTED, async ({ id, rejectedBy, reason, ownerId }) => {
  try {
    await notifyUser(
      ownerId,
      "Địa điểm bị từ chối",
      `Địa điểm của bạn (ID: ${id}) bị từ chối. Lý do: ${reason}`,
      { placeId: id, type: "place_rejected", reason },
      rejectedBy,
    );
  } catch (error) {
    console.error("[Notification] Error processing REJECTED event:", error);
  }
});

eventEmitter.on(EVENTS.BOOKING.CREATED, async ({ bookingId, bookingCode, userId, businessOwnerId }) => {
  await notifyUser(businessOwnerId, "Booking mới", `Có booking mới #${bookingCode} cần xác nhận.`, { bookingId, type: "booking_created" }, userId).catch(() => {});
  await notifyUser(userId, "Đặt chỗ thành công", `Đặt chỗ #${bookingCode} đã được ghi nhận, đang chờ xác nhận.`, { bookingId, type: "booking_created" }).catch(() => {});
});

eventEmitter.on(EVENTS.BOOKING.CONFIRMED, async ({ bookingId, bookingCode, confirmedBy, userId }) => {
  await notifyUser(userId, "Booking đã xác nhận", `Booking #${bookingCode} đã được xác nhận. Mã QR đã sẵn sàng.`, { bookingId, type: "booking_confirmed" }, confirmedBy).catch(() => {});
});

eventEmitter.on(EVENTS.BOOKING.CANCELLED, async ({ bookingId, bookingCode, cancelledBy, cancelReason, userId }) => {
  await notifyUser(userId, "Booking đã bị hủy", `Booking #${bookingCode} đã bị hủy. Lý do: ${cancelReason}`, { bookingId, type: "booking_cancelled", cancelReason }, cancelledBy).catch(() => {});
});

eventEmitter.on(EVENTS.BOOKING.COMPLETED, async ({ bookingId, bookingCode, completedBy, userId }) => {
  await notifyUser(userId, "Booking hoàn thành", `Booking #${bookingCode} đã hoàn thành. Cảm ơn bạn!`, { bookingId, type: "booking_completed" }, completedBy).catch(() => {});
});

eventEmitter.on(EVENTS.BOOKING.NO_SHOW, async ({ bookingId, bookingCode, markedBy, userId }) => {
  await notifyUser(userId, "Không đến", `Bạn đã không đến. Booking #${bookingCode} đã bị đánh dấu không đến.`, { bookingId, type: "booking_no_show" }, markedBy).catch(() => {});
});

eventEmitter.on(EVENTS.BUSINESS.APPROVED, async ({ businessId, approvedBy, ownerId }) => {
  await notifyUser(ownerId, "Doanh nghiệp được duyệt", "Hồ sơ doanh nghiệp của bạn đã được duyệt. Bạn có thể bắt đầu đăng địa điểm.", { businessId, type: "business_approved" }, approvedBy).catch(() => {});
});

eventEmitter.on(EVENTS.BUSINESS.REJECTED, async ({ businessId, rejectedBy, reason, ownerId }) => {
  await notifyUser(ownerId, "Doanh nghiệp bị từ chối", `Hồ sơ doanh nghiệp bị từ chối. Lý do: ${reason}`, { businessId, type: "business_rejected", reason }, rejectedBy).catch(() => {});
});

export const initNotificationService = () => {
  console.log("[Notification Service] Initialized and listening for events...");
};
