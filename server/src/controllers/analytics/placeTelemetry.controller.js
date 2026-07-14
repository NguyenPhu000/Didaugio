import { getPlaceHeatmap, recordPlaceTelemetry } from "../../services/analytics/placeTelemetry.service.js";
import { resolveBusinessId } from "../../utils/businessScope.js";
import ServiceError from "../../utils/serviceError.js";

export async function trackPlaceTelemetry(req, res, next) {
  try {
    await recordPlaceTelemetry({
      placeId: req.params.placeId,
      userId: req.user?.userId ?? null,
      action: req.body.action,
      deviceType: req.body.deviceType ?? null,
      ipAddress: req.ip ?? null,
    });
    return res.status(201).json({ success: true, data: null });
  } catch (error) {
    return next(error);
  }
}

export async function getBusinessPlaceHeatmap(req, res, next) {
  try {
    const businessId = await resolveBusinessId(req);
    if (!businessId) {
      throw new ServiceError("Business context is required", 403, "FORBIDDEN");
    }
    const data = await getPlaceHeatmap({ businessId, ...req.query });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function getAdminPlaceHeatmap(req, res, next) {
  try {
    const data = await getPlaceHeatmap(req.query);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}
