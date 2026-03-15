import express from "express";
import * as boundaryController from "../controllers/boundaryController.js";
import { validateBody, validateParams } from "../middlewares/validateSchema.js";
import {
  boundaryDistrictCodeParamSchema,
  boundaryWardIdParamSchema,
  invalidateBoundaryCacheSchema,
} from "../models/schemas/boundarySchema.js";

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
  validateBody(invalidateBoundaryCacheSchema),
  boundaryController.invalidateCache,
);

export default router;
