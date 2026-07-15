import { checkReadiness } from "./health.service.js";

const HEALTH_TIMEOUT_MS = Number(process.env.HEALTH_CHECK_TIMEOUT_MS || 2_000);

export const registerHealthRoutes = (app, {
  prisma,
  routingUrl,
  routingEnabled = String(process.env.ROUTING_ENABLED ?? "true") !== "false",
  redis,
  requireSpatial = String(process.env.PLACE_V2_SPATIAL_ENABLED ?? "true") !== "false",
  fetchImpl,
} = {}) => {
  app.get("/health/live", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.get("/health/ready", async (_req, res) => {
    const readiness = await checkReadiness({
      prisma,
      routingUrl,
      routingEnabled,
      redis,
      requireSpatial,
      fetchImpl,
      timeoutMs: HEALTH_TIMEOUT_MS,
    });

    res.status(readiness.ready ? 200 : 503).json({
      status: readiness.ready ? "ok" : "degraded",
      ...readiness,
    });
  });
};
