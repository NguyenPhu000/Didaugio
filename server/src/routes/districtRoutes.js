import express from "express";
import * as districtController from "../controllers/districtController.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middlewares/validateSchema.js";
import {
  districtCodeParamSchema,
  districtIdParamSchema,
  getDistrictsQuerySchema,
  getWardsByDistrictQuerySchema,
  lookupDistrictBodySchema,
} from "../models/index.js";

const router = express.Router();

router.get(
  "/",
  validateQuery(getDistrictsQuerySchema),
  districtController.getDistricts,
);

router.get(
  "/code/:code",
  validateParams(districtCodeParamSchema),
  districtController.getDistrictByCode,
);

router.get(
  "/:id",
  validateParams(districtIdParamSchema),
  districtController.getDistrictById,
);

router.get(
  "/:id/wards",
  validateParams(districtIdParamSchema),
  validateQuery(getWardsByDistrictQuerySchema),
  districtController.getWardsByDistrict,
);

router.post(
  "/lookup",
  validateBody(lookupDistrictBodySchema),
  districtController.lookupDistrict,
);

export default router;
