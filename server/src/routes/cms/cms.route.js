import express from "express";
import * as cmsController from "../../controllers/cms/cms.controller.js";

const router = express.Router();

// GET /api/cms/explore-landing — Aggregate endpoint (no auth)
router.get("/explore-landing", cmsController.getExploreLanding);

// GET /api/cms/banners — Banner marketing đang active
router.get("/banners", cmsController.getBanners);

// GET /api/cms/featured-places — Địa điểm nổi bật
router.get("/featured-places", cmsController.getFeaturedPlaces);

// GET /api/cms/sample-trips — Lịch trình mẫu công khai
router.get("/sample-trips", cmsController.getSampleTrips);

// GET /api/cms/announcements — Thông báo hệ thống đã gửi
router.get("/announcements", cmsController.getAnnouncements);

export default router;
