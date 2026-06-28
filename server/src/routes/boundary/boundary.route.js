import express from "express";
import * as boundaryController from "../../controllers/boundary/boundary.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import {
  validateBody,
  validateParams,
} from "../../middlewares/validateSchema.js";
import {
  boundaryDistrictCodeParamSchema,
  boundaryWardIdParamSchema,
  invalidateBoundaryCacheSchema,
} from "../../models/index.js";

const router = express.Router();

router.get("/districts", boundaryController.getDistrictsGeoJSON);

router.get("/wards", boundaryController.getWardsGeoJSON);

router.get(
  "/districts/:code/center",
  validateParams(boundaryDistrictCodeParamSchema),
  boundaryController.getDistrictCenter,
);

router.get(
  "/wards/:id/center",
  validateParams(boundaryWardIdParamSchema),
  boundaryController.getWardCenter,
);

router.post(
  "/cache/invalidate",
  authenticate,
  hasPermission("system.edit_config"),
  validateBody(invalidateBoundaryCacheSchema),
  boundaryController.invalidateCache,
);

export default router;
