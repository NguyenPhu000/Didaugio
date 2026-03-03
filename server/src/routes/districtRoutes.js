import express from "express";
import * as districtController from "../controllers/districtController.js";

const router = express.Router();

router.get("/", districtController.getDistricts);

router.get("/code/:code", districtController.getDistrictByCode);

router.get("/:id", districtController.getDistrictById);

router.get("/:id/wards", districtController.getWardsByDistrict);

router.post("/lookup", districtController.lookupDistrict);

export default router;
