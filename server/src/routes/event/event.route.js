import express from "express";
import * as eventController from "../../controllers/event/event.controller.js";
import {
  authenticate,
  authenticateOptional,
} from "../../middlewares/authMiddleware.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../../middlewares/validateSchema.js";
import {
  eventIdParamSchema,
  createEventSchema,
  updateEventSchema,
  pingEventSchema,
  createMomentSchema,
  updateBroadcastSchema,
} from "../../models/index.js";
import { z } from "zod";

const router = express.Router();

// 1. GET /api/v1/events - Lấy danh sách sự kiện
router.get(
  "/",
  authenticateOptional,
  eventController.getEvents
);

// 2. GET /api/v1/events/:id - Lấy chi tiết sự kiện
router.get(
  "/:id",
  authenticateOptional,
  validateParams(eventIdParamSchema),
  eventController.getEventById
);

// 3. POST /api/v1/events/:id/join - Tham gia sự kiện
router.post(
  "/:id/join",
  authenticate,
  validateParams(eventIdParamSchema),
  eventController.joinEvent
);

// 4. POST /api/v1/events/:id/ping - Ping vị trí neon ẩn danh
router.post(
  "/:id/ping",
  authenticate,
  validateParams(eventIdParamSchema),
  validateBody(pingEventSchema),
  eventController.pingEvent
);

// 5. POST /api/v1/events/:id/moments - Upload ảnh khoảnh khắc
router.post(
  "/:id/moments",
  authenticate,
  validateParams(eventIdParamSchema),
  validateBody(createMomentSchema),
  eventController.createMoment
);

// 6. GET /api/v1/events/:id/moments - Lấy danh sách ảnh khoảnh khắc chặng
router.get(
  "/:id/moments",
  authenticateOptional,
  validateParams(eventIdParamSchema),
  eventController.getMoments
);

// 7. DELETE /api/v1/events/moments/:momentId - Xóa moment
router.delete(
  "/moments/:momentId",
  authenticate,
  validateParams(z.object({
    momentId: z.coerce.number().int().positive(),
  })),
  eventController.deleteMoment
);

// ─── ADMIN ROUTES ───

// 8. POST /api/v1/events - Tạo sự kiện
router.post(
  "/",
  authenticate,
  hasPermission("settings.manage"),
  validateBody(createEventSchema),
  eventController.createEvent
);

// 9. PUT /api/v1/events/:id - Cập nhật sự kiện
router.put(
  "/:id",
  authenticate,
  hasPermission("settings.manage"),
  validateParams(eventIdParamSchema),
  validateBody(updateEventSchema),
  eventController.updateEvent
);

// 10. DELETE /api/v1/events/:id - Xóa sự kiện
router.delete(
  "/:id",
  authenticate,
  hasPermission("settings.manage"),
  validateParams(eventIdParamSchema),
  eventController.deleteEvent
);

// 11. PUT /api/v1/events/:id/broadcast - Thông báo khẩn cấp từ BTC
router.put(
  "/:id/broadcast",
  authenticate,
  hasPermission("settings.manage"),
  validateParams(eventIdParamSchema),
  validateBody(updateBroadcastSchema),
  eventController.updateBroadcast
);

export default router;
