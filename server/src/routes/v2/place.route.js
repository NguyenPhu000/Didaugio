import express from "express";
import { validateQuery } from "../../middlewares/validateSchema.js";
import {
  placeV2ListQuerySchema,
  placeV2MapQuerySchema,
  placeV2NearbyQuerySchema,
} from "../../models/index.js";
import {
  listMapMarkersV2,
  listNearbyMarkersV2,
  listPlacesV2,
} from "../../controllers/place/placeV2.controller.js";

const router = express.Router();

router.get("/", validateQuery(placeV2ListQuerySchema), listPlacesV2);
router.get("/map", validateQuery(placeV2MapQuerySchema), listMapMarkersV2);
router.get("/nearby", validateQuery(placeV2NearbyQuerySchema), listNearbyMarkersV2);

export default router;
