import { Router } from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { requireActiveBusiness } from "../../middlewares/requireActiveBusiness.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import { auditLog } from "../../middlewares/auditLogMiddleware.js";
import * as invitationController from "../../controllers/business/staffInvitation.controller.js";

const router = Router();

// All invitation management routes require authentication and active business
router.use(authenticate);
router.use(requireActiveBusiness());

// GET /api/business/staff/invitations - Danh sách invitations
router.get(
  "/invitations",
  hasPermission("staff.view"),
  invitationController.getAll,
);

// POST /api/business/staff/invite - Tạo invitation
router.post(
  "/invite",
  hasPermission("staff.create"),
  auditLog({
    action: "CREATE",
    tableName: "staff_invitations",
    description: "Tạo lời mời nhân viên",
  }),
  invitationController.create,
);

// POST /api/business/staff/invite/:id/revoke - Thu hồi invitation
router.post(
  "/invite/:id/revoke",
  hasPermission("staff.create"),
  auditLog({
    action: "UPDATE",
    tableName: "staff_invitations",
    description: "Thu hồi lời mời nhân viên",
  }),
  invitationController.revoke,
);

export default router;
