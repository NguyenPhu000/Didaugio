import express from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import * as controller from "../../controllers/notification/notification.controller.js";
import * as webPushController from "../../controllers/notification/webPush.controller.js";

const router = express.Router();

router.use(authenticate);

// Web Push
router.get("/vapid-key", webPushController.getVapidPublicKey);
router.post("/subscribe", webPushController.saveSubscription);
router.delete("/subscribe", webPushController.removeSubscription);

// Announcements (admin — trước route /:id để tránh conflict)
router.get("/announcements", hasPermission("settings.manage"), controller.getAnnouncements);
router.post("/announcements", hasPermission("settings.manage"), controller.createAnnouncement);
router.put("/announcements/:id", hasPermission("settings.manage"), controller.updateAnnouncement);
router.delete("/announcements/:id", hasPermission("settings.manage"), controller.deleteAnnouncement);

// Notifications CRUD
router.get("/", controller.getNotifications);
router.get("/unread-count", controller.getUnreadCount);
router.put("/mark-all-read", controller.markAllAsRead);
router.put("/read-all", controller.markAllAsRead);
router.put("/:id/read", controller.markAsRead);

export default router;
