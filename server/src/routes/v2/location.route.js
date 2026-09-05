import express from "express";
import * as locationController from "../../controllers/location/location.controller.js";
import { validateBody, validateParams, validateQuery } from "../../middlewares/validateSchema.js";
import {
  locationLookupSchema,
  locationSearchQuerySchema,
  provinceCodeParamSchema,
} from "../../models/index.js";

const router = express.Router();

router.get("/provinces", locationController.getProvinces);
router.get(
  "/provinces/:provinceCode/wards",
  validateParams(provinceCodeParamSchema),
  locationController.getWards,
);
router.get("/search", validateQuery(locationSearchQuerySchema), locationController.search);
router.post("/lookup", validateBody(locationLookupSchema), locationController.lookup);

export default router;
