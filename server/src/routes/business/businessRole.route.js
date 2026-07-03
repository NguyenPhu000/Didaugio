import { Router } from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { requireActiveBusiness } from "../../middlewares/requireActiveBusiness.js";
import * as businessRoleController from "../../controllers/business/businessRole.controller.js";

const router = Router();

router.use(authenticate);
router.use(requireActiveBusiness());

// GET /api/business/roles - Lấy danh sách vai trò
router.get("/", businessRoleController.getDefaultRoles);

export default router;
