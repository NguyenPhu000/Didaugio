import express from "express";
import * as controller from "../controllers/autoApproveRuleController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { requireActiveBusiness } from "../middlewares/requireActiveBusiness.js";
import { hasPermission } from "../middlewares/permissionMiddleware.js";
import { validateBody } from "../middlewares/validateSchema.js";
import {
  createAutoApproveRuleSchema,
  updateAutoApproveRuleSchema,
} from "../models/index.js";

const router = express.Router();

router.use(authenticate);
router.use(requireActiveBusiness({ requireContractSigned: true }));

router.get("/", hasPermission("bookings.view"), controller.list);
router.post(
  "/",
  hasPermission("bookings.confirm"),
  validateBody(createAutoApproveRuleSchema),
  controller.create,
);
router.patch(
  "/:id",
  hasPermission("bookings.confirm"),
  validateBody(updateAutoApproveRuleSchema),
  controller.update,
);
router.delete(
  "/:id",
  hasPermission("bookings.confirm"),
  controller.softDelete,
);

export default router;
