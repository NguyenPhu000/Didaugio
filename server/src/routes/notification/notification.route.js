import express from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import * as controller from "../../controllers/notification/notification.controller.js";
import * as webPushController from "../../controllers/notification/webPush.controller.js";

const router = express.Router();

router.use(authenticate);

// Web Push
router.get("/vapid-key", webPushController.getVapidPublicKey);
router.post("/subscribe", webPushController.saveSubscription);
router.delete("/subscribe", webPushController.removeSubscription);

// Notifications CRUD
router.get("/", controller.getNotifications);
router.get("/unread-count", controller.getUnreadCount);
router.put("/mark-all-read", controller.markAllAsRead);
router.put("/read-all", controller.markAllAsRead);
router.put("/:id/read", controller.markAsRead);

export default router;
