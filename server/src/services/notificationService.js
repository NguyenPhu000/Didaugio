import prisma from "../config/prismaClient.js";
import eventEmitter, { EVENTS } from "../utils/eventEmitter.js";

eventEmitter.on(EVENTS.PLACE.APPROVED, async ({ id, approvedBy, ownerId }) => {
  try {
    console.log(`[Notification] Processing APPROVED event for place ${id}`);
    
    // Create personal notification using NotificationGlobal (Targeted)
    await prisma.notificationGlobal.create({
      data: {
        title: "Địa điểm đựợc duyệt",
        body: `Địa điểm của bạn (ID: ${id}) đã được duyệt thành công.`,
        targetType: "user",
        targetValue: { userId: ownerId },
        data: { placeId: id, type: "place_approved" },
        createdBy: approvedBy,
        status: "published", // Auto publish
        sentAt: new Date(),
      },
    });

    console.log(`[Notification] Sent notification to user ${ownerId}`);
  } catch (error) {
    console.error("[Notification] Error processing APPROVED event:", error);
  }
});

eventEmitter.on(EVENTS.PLACE.REJECTED, async ({ id, rejectedBy, reason, ownerId }) => {
  try {
    console.log(`[Notification] Processing REJECTED event for place ${id}`);

    await prisma.notificationGlobal.create({
      data: {
        title: "Địa điểm bị từ chối",
        body: `Địa điểm của bạn (ID: ${id}) bị từ chối. Lý do: ${reason}`,
        targetType: "user",
        targetValue: { userId: ownerId },
        data: { placeId: id, type: "place_rejected", reason },
        createdBy: rejectedBy,
        status: "published",
        sentAt: new Date(),
      },
    });

    console.log(`[Notification] Sent notification to user ${ownerId}`);
  } catch (error) {
    console.error("[Notification] Error processing REJECTED event:", error);
  }
});

const createNotification = async (title, body, targetUserId, data, createdBy) => {
  try {
    await prisma.notificationGlobal.create({
      data: {
        title,
        body,
        targetType: "user",
        targetValue: { userId: targetUserId },
        data,
        createdBy,
        status: "published",
        sentAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[Notification] Error creating notification:", error);
  }
};

eventEmitter.on(EVENTS.BOOKING.CREATED, async ({ bookingId, bookingCode, userId, businessOwnerId }) => {
  await createNotification(
    "Booking mới",
    `Có booking mới #${bookingCode} cần xác nhận.`,
    businessOwnerId,
    { bookingId, type: "booking_created" },
    userId,
  );
  await createNotification(
    "Đặt chỗ thành công",
    `Đặt chỗ #${bookingCode} đã được ghi nhận, đang chờ xác nhận.`,
    userId,
    { bookingId, type: "booking_created" },
    null,
  );
});

eventEmitter.on(EVENTS.BOOKING.CONFIRMED, async ({ bookingId, bookingCode, confirmedBy, userId }) => {
  await createNotification(
    "Booking đã xác nhận",
    `Booking #${bookingCode} đã được xác nhận. Mã QR đã sẵn sàng.`,
    userId,
    { bookingId, type: "booking_confirmed" },
    confirmedBy,
  );
});

eventEmitter.on(EVENTS.BOOKING.CANCELLED, async ({ bookingId, bookingCode, cancelledBy, cancelReason, userId }) => {
  await createNotification(
    "Booking đã bị hủy",
    `Booking #${bookingCode} đã bị hủy. Lý do: ${cancelReason}`,
    userId,
    { bookingId, type: "booking_cancelled", cancelReason },
    cancelledBy,
  );
});

eventEmitter.on(EVENTS.BOOKING.COMPLETED, async ({ bookingId, bookingCode, completedBy, userId }) => {
  await createNotification(
    "Booking hoàn thành",
    `Booking #${bookingCode} đã hoàn thành. Cảm ơn bạn!`,
    userId,
    { bookingId, type: "booking_completed" },
    completedBy,
  );
});

eventEmitter.on(EVENTS.BOOKING.NO_SHOW, async ({ bookingId, bookingCode, markedBy, userId }) => {
  await createNotification(
    "Không đến",
    `Bạn đã không đến. Booking #${bookingCode} đã bị đánh dấu không đến.`,
    userId,
    { bookingId, type: "booking_no_show" },
    markedBy,
  );
});

eventEmitter.on(EVENTS.BUSINESS.APPROVED, async ({ businessId, approvedBy, ownerId }) => {
  await createNotification(
    "Doanh nghiệp được duyệt",
    "Hồ sơ doanh nghiệp của bạn đã được duyệt. Bạn có thể bắt đầu đăng địa điểm.",
    ownerId,
    { businessId, type: "business_approved" },
    approvedBy,
  );
});

eventEmitter.on(EVENTS.BUSINESS.REJECTED, async ({ businessId, rejectedBy, reason, ownerId }) => {
  await createNotification(
    "Doanh nghiệp bị từ chối",
    `Hồ sơ doanh nghiệp bị từ chối. Lý do: ${reason}`,
    ownerId,
    { businessId, type: "business_rejected", reason },
    rejectedBy,
  );
});

export const initNotificationService = () => {
  console.log("[Notification Service] Initialized and listening for events...");
};
