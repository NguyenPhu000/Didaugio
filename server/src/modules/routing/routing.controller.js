import routingService from "./routing.service.js";
import { ROUTING_MESSAGES } from "./routing.constants.js";

export const calculateRoute = async (req, res, next) => {
  try {
    const data = await routingService.calculate(req.body || {});
    res.json({
      success: true,
      data,
      message: ROUTING_MESSAGES.calculateSuccess,
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
      message: ROUTING_MESSAGES.legsSuccess,
    });
  } catch (error) {
    next(error);
  }
};

export const calculateTable = async (req, res, next) => {
  try {
    const data = await routingService.calculateTable(req.body || {});
    res.json({
      success: true,
      data,
      message: ROUTING_MESSAGES.tableSuccess,
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
          ? ROUTING_MESSAGES.healthOk
          : ROUTING_MESSAGES.healthDegraded,
      ...(data.status === "ok" ? {} : { errorCode: "ROUTING_DEGRADED" }),
    });
  } catch (error) {
    next(error);
  }
};
