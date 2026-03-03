import express from "express";
import * as boundaryController from "../controllers/boundaryController.js";

const router = express.Router();

router.get("/districts", boundaryController.getDistrictsGeoJSON);

router.get("/wards", boundaryController.getWardsGeoJSON);

router.get("/districts/:code/center", boundaryController.getDistrictCenter);

router.get("/wards/:id/center", boundaryController.getWardCenter);

router.post("/cache/invalidate", boundaryController.invalidateCache);

export default router;
