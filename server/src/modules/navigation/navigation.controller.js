import navigationService from "./navigation.service.js";

export const handleNavigationRecommendation = async (req, res, next) => {
  try {
    const data = await navigationService.recommendRoute(req.body || {});

    res.json({
      success: true,
      data,
      message: "Phân tích điều hướng thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const ingestNavigationTelemetry = async (req, res, next) => {
  try {
    const actor = {
      userId: req.user?.userId || req.user?.id || null,
      roleId: req.user?.roleId || null,
    };

    const data = navigationService.ingestTelemetryBatch({
      ...(req.body || {}),
      actor,
    });

    res.status(202).json({
      success: true,
      data,
      message: "Ghi nhận telemetry điều hướng thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const getNavigationTelemetryHealth = async (req, res, next) => {
  try {
    const data = navigationService.getTelemetryHealth();

    res.json({
      success: true,
      data,
      message: "Navigation telemetry healthy",
    });
  } catch (error) {
    next(error);
  }
};

export const getNavigationTelemetrySession = async (req, res, next) => {
  try {
    const data = navigationService.getSessionTelemetry(req.params.sessionId, {
      limit: req.query.limit,
    });

    res.json({
      success: true,
      data,
      message: "Lấy telemetry theo phiên thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const getNavigationTelemetrySummary = async (req, res, next) => {
  try {
    const data = navigationService.getTelemetrySummary(req.query || {});

    res.json({
      success: true,
      data,
      message: "Lấy tổng hợp telemetry điều hướng thành công",
    });
  } catch (error) {
    next(error);
  }
};
