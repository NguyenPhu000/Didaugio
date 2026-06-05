import { Router } from "express";
import * as invitationController from "../../controllers/business/staffInvitation.controller.js";
import { validateBody } from "../../middlewares/validateSchema.js";
import { acceptInvitationSchema } from "../../models/index.js";

const router = Router();

// GET /api/staff/invite/:token - Kiểm tra token (Public)
router.get("/:token", invitationController.validateToken);

// POST /api/staff/invite/accept - Hoàn tất đăng ký (Public)
router.post("/accept", validateBody(acceptInvitationSchema), invitationController.accept);

export default router;
