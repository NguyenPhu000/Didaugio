import prisma from "../../config/prismaClient.js";
import { findPlacesNearby } from "../../utils/spatialQuery.js";
import { generateHybridPlan } from "../../services/ai/hybridPlanner.service.js";

/**
 * POST /api/ai/hybrid-plan
 * Tạo lịch trình thông minh kết hợp dữ liệu DB thật và dự toán chi phí.
 */
export const handleHybridPlan = async (req, res) => {
  try {
    const { coords, currentCoords } = req.body;
    const gpsCoords = currentCoords || coords;

    if (!gpsCoords || !gpsCoords.latitude || !gpsCoords.longitude) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Tọa độ vị trí hiện tại (latitude, longitude) là bắt buộc.",
        errorCode: "MISSING_COORDINATES",
      });
    }

    const lat = parseFloat(gpsCoords.latitude);
    const lng = parseFloat(gpsCoords.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Tọa độ GPS không hợp lệ.",
        errorCode: "INVALID_COORDINATES",
      });
    }

    // 1. Lấy sở thích du lịch (travelPreferences) của user từ DB
    const userId = req.user?.id;
    let travelPreferences = null;
    if (userId) {
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
        select: { travelPreferences: true },
      });
      travelPreferences = profile?.travelPreferences;
    }

    // 2. Tìm kiếm địa điểm lân cận bằng Spatial Query (có Bounding Box pre-filter)
    // Lấy tối đa 15 địa điểm được phê duyệt trong bán kính 12km để AI lựa chọn
    const nearbyPlaces = await findPlacesNearby(lat, lng, 12, 15);

    if (nearbyPlaces.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Không tìm thấy địa điểm được phê duyệt nào xung quanh vị trí của bạn.",
        errorCode: "NO_PLACES_NEARBY",
      });
    }

    // 3. Gọi service AI sắp xếp lịch trình và tính toán chi phí
    const planResult = await generateHybridPlan(
      { latitude: lat, longitude: lng },
      travelPreferences,
      nearbyPlaces
    );

    return res.status(200).json({
      success: true,
      data: planResult,
      message: "Tạo lịch trình thành công",
    });
  } catch (error) {
    const isQuotaError =
      error?.status === 429 || /quota|rate.?limit|too many requests/i.test(error?.message || "");
    const isUnavailable =
      error?.status === 503 || /service unavailable|overloaded/i.test(error?.message || "");

    console.error("[HybridPlanError]", error?.status || "", (error?.message || "").split("\n")[0]);

    if (isQuotaError) {
      return res.status(429).json({
        success: false,
        data: null,
        message: "Hệ thống AI đang quá tải giới hạn tần suất. Vui lòng thử lại sau.",
        errorCode: "QUOTA_EXCEEDED",
      });
    }

    if (isUnavailable) {
      return res.status(503).json({
        success: false,
        data: null,
        message: "Dịch vụ AI hiện tại không khả dụng, vui lòng thử lại sau.",
        errorCode: "AI_UNAVAILABLE",
      });
    }

    return res.status(error.statusCode || 500).json({
      success: false,
      data: null,
      message: error.message || "Lỗi hệ thống khi tạo lịch trình du lịch.",
      errorCode: error.code || "INTERNAL_ERROR",
    });
  }
};
