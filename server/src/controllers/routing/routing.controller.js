import routingService from "../../services/routing/routing.service.js";

export const calculateRoute = async (req, res, next) => {
  try {
    const data = await routingService.calculate(req.body || {});
    res.json({
      success: true,
      data,
      message: "Tính tuyến đường thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const calculateRouteLegs = async (req, res, next) => {
  try {
    const data = await routingService.calculateLegs(req.body || {});
    res.json({
      success: true,
      data,
      message: "Tính các chặng đường thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const getRoutingHealth = async (req, res, next) => {
  try {
    const data = await routingService.getHealth();
    const statusCode = data.status === "ok" ? 200 : 503;

    res.status(statusCode).json({
      success: data.status === "ok",
      data,
      message:
        data.status === "ok"
          ? "Routing service healthy"
          : "Routing service degraded",
      ...(data.status === "ok" ? {} : { errorCode: "ROUTING_DEGRADED" }),
    });
  } catch (error) {
    next(error);
  }
};
