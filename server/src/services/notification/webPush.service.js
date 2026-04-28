import webpush from "web-push";
import prisma from "../../config/prismaClient.js";

// VAPID keys — generate once with: npx web-push generate-vapid-keys
// Store in .env: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@didaugio.com";

if (PUBLIC_KEY && PRIVATE_KEY) {
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
}

/**
 * Get the public VAPID key for frontend subscription.
 */
export const getVapidPublicKey = (req, res) => {
  if (!PUBLIC_KEY) {
    return res.status(503).json({
      success: false,
      message: "Web Push chưa được cấu hình (thiếu VAPID keys)",
    });
  }
  res.json({ success: true, data: { publicKey: PUBLIC_KEY } });
};

/**
 * Save a push subscription for the authenticated user.
 */
export const saveSubscription = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({
        success: false,
        message: "Subscription không hợp lệ",
      });
    }

    // Upsert subscription — one per user
    await prisma.pushSubscription.upsert({
      where: { userId },
      create: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      update: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    res.json({ success: true, message: "Đã đăng ký thông báo đẩy" });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove push subscription.
 */
export const removeSubscription = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    await prisma.pushSubscription.deleteMany({ where: { userId } });
    res.json({ success: true, message: "Đã hủy thông báo đẩy" });
  } catch (error) {
    next(error);
  }
};

/**
 * Send a Web Push notification to a specific user.
 * Non-blocking — errors are logged but not thrown.
 */
export const sendWebPush = async (userId, title, body, data = {}) => {
  if (!PUBLIC_KEY || !PRIVATE_KEY) return;

  try {
    const sub = await prisma.pushSubscription.findUnique({
      where: { userId: Number(userId) },
    });

    if (!sub) return;

    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };

    const payload = JSON.stringify({ title, body, data, icon: "/logo192.png" });

    await webpush.sendNotification(pushSubscription, payload);
  } catch (err) {
    if (err.statusCode === 410) {
      // Subscription expired — remove from DB
      await prisma.pushSubscription.deleteMany({
        where: { userId: Number(userId) },
      }).catch(() => {});
    }
    console.error("[WebPush] Failed:", err.message);
  }
};
