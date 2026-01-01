import express from "express";
import profileController from "../controllers/profileController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =============================================================================
// PROFILE ROUTES
// Tất cả routes đều yêu cầu đăng nhập
// =============================================================================

// Lấy thông tin profile hiện tại
router.get("/", authenticate, profileController.getProfile);

// Cập nhật thông tin profile
router.put("/", authenticate, profileController.updateProfile);

// Cập nhật avatar
router.put("/avatar", authenticate, profileController.updateAvatar);

// Cập nhật cài đặt thông báo
router.put(
  "/notifications",
  authenticate,
  profileController.updateNotificationSettings
);

// Cập nhật sở thích du lịch
router.put(
  "/travel-preferences",
  authenticate,
  profileController.updateTravelPreferences
);

export default router;
