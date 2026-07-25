import prisma from "../../config/prismaClient.js";
import { findPlacesNearby } from "../../utils/spatialQuery.js";
import { generateHybridPlan } from "../../services/ai/hybridPlanner.service.js";
import { generateHybridFallback } from "../../services/ai/hybridPlannerFallback.js";
import {
  canUseHybridFallback,
  toAiServiceError,
} from "../../services/ai/aiProviderPolicy.js";
import {
  resolveGroqProviderOptions,
} from "../../services/ai/groq.service.js";
import { executeAiRequest } from "../../services/ai/runtime/aiRuntimeExecution.js";

/**
 * POST /api/ai/hybrid-plan
 * Tạo lịch trình thông minh kết hợp dữ liệu DB thật và dự toán chi phí.
 */
export const handleHybridPlan = async (req, res) => {
  try {
    const { currentCoords, userPrompt } = req.body;
    const gpsCoords = currentCoords;

    if (!gpsCoords) {
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
    const userId = req.user?.userId || req.user?.id;
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
    let planResult;
    let requestLogId = null;
    try {
      const execution = await executeAiRequest({
        feature: "planner",
        user: { userId },
        inputText: userPrompt || "Tạo lịch trình gần vị trí hiện tại",
        context: {
          travelPreferences,
          budget: travelPreferences?.budget,
          places: nearbyPlaces,
        },
        operation: async ({ configData, context: allowedContext }) => {
          const providerOptions = await resolveGroqProviderOptions(
            configData,
            "planner",
          );
          const plan = await generateHybridPlan(
            { latitude: lat, longitude: lng },
            travelPreferences,
            nearbyPlaces,
            userPrompt,
            providerOptions,
            allowedContext,
          );
          return {
            outputText: JSON.stringify(plan),
            plan,
            usage: plan.usage,
          };
        },
      });
      planResult = execution.result.plan;
      requestLogId = execution.requestLogId ?? null;
    } catch (error) {
      if (!canUseHybridFallback(error)) throw error;
      planResult = generateHybridFallback(nearbyPlaces);
    }

    return res.status(200).json({
      success: true,
      data: {
        ...planResult,
        ...(requestLogId ? { requestLogId } : {}),
      },
      message: "Tạo lịch trình thành công",
    });
  } catch (error) {
    const aiError = toAiServiceError(error);
    const isQuotaError = aiError.code === "QUOTA_EXCEEDED";
    const isUnavailable = aiError.code === "AI_UNAVAILABLE";

    console.info("[AI]", { feature: "hybrid-plan-controller", code: aiError.code });

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

    return res.status(aiError.statusCode || 502).json({
      success: false,
      data: null,
      message: "Không thể tạo lịch trình AI vào lúc này.",
      errorCode: aiError.code,
    });
  }
};
