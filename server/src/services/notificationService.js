import prisma from "../config/prismaClient.js";
import eventEmitter, { EVENTS } from "../utils/eventEmitter.js";

/**
 * NOTIFICATION SERVICE
 * Xử lý sự kiện và tạo thông báo
 */

// =============================================================================
// EVENT LISTENERS
// =============================================================================

/**
 * Listen: Place Approved
 */
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

/**
 * Listen: Place Rejected
 */
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

/**
 * Initialize Service (Just to ensure file is loaded)
 */
export const initNotificationService = () => {
  console.log("[Notification Service] Initialized and listening for events...");
};
