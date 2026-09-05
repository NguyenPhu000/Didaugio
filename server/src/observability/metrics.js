import { Counter, Gauge, collectDefaultMetrics } from "prom-client";
import { createHttpMetrics } from "./httpMetrics.js";
import { instrumentPrisma } from "./dbMetrics.js";
import { getStats as getCacheStats } from "../services/cache/cache.service.js";
import { registerAdministrativeCollectors } from "./administrativeMetrics.js";
import { metricsRegistry } from "./registry.js";

export { metricsRegistry } from "./registry.js";
export const cursorValidationErrors = new Counter({
  name: "place_cursor_validation_errors_total",
  help: "Rejected place cursor tokens",
  registers: [metricsRegistry],
});

export function registerMetrics(
  app,
  {
    enabled = false,
    registry = metricsRegistry,
    collectRuntimeMetrics = false,
    prisma,
  } = {},
) {
  const httpMetrics = createHttpMetrics({ registry });
  app.use(httpMetrics.middleware);

  if (collectRuntimeMetrics) {
    collectDefaultMetrics({ register: registry, prefix: "didaugio_" });
  }

  if (enabled && prisma) instrumentPrisma(prisma, { registry });
  if (enabled && prisma) registerAdministrativeCollectors({ registry, prisma });

  if (enabled) {
    new Gauge({
      name: "redis_cache_operations_total",
      help: "Redis cache operations observed by outcome",
      labelNames: ["outcome"],
      registers: [registry],
      collect() {
        const stats = getCacheStats().redis;
        this.set({ outcome: "hit" }, stats.hits);
        this.set({ outcome: "miss" }, stats.misses);
        this.set({ outcome: "error" }, stats.errors);
      },
    });
  }

  if (enabled) {
    const metricsToken = String(process.env.METRICS_TOKEN || "").trim();
    app.get("/metrics", async (req, res, next) => {
      try {
        if (!metricsToken && process.env.NODE_ENV === "production") {
          return res.status(503).json({ error: "Metrics authentication is not configured" });
        }

        if (metricsToken) {
          const authorization = String(req.headers.authorization || "");
          const providedToken = authorization.startsWith("Bearer ")
            ? authorization.slice(7).trim()
            : String(req.headers["x-metrics-token"] || "").trim();
          if (providedToken !== metricsToken) {
            return res.status(401).json({ error: "Unauthorized" });
          }
        }

        res.setHeader("Content-Type", registry.contentType);
        res.send(await registry.metrics());
      } catch (error) {
        next(error);
      }
    });
  }

  return { registry, httpMetrics };
}
