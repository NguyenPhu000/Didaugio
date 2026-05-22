import { Router } from "express";
import * as invitationController from "../../controllers/business/staffInvitation.controller.js";

const router = Router();

// GET /api/staff/invite/:token - Kiểm tra token (Public)
router.get("/:token", invitationController.validateToken);

// POST /api/staff/invite/accept - Hoàn tất đăng ký (Public)
router.post("/accept", invitationController.accept);

export default router;
