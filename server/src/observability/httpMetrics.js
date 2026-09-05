import { Histogram } from "prom-client";

const labels = ["method", "route", "status_code"];

const normalizeRoute = (req) => {
  const routePath = req.route?.path;
  if (!routePath) return "unmatched";
  return `${req.baseUrl || ""}${routePath}`;
};

export function createHttpMetrics({ registry }) {
  const duration = new Histogram({
    name: "http_server_duration_seconds",
    help: "HTTP server request duration in seconds",
    labelNames: labels,
    buckets: [0.025, 0.05, 0.1, 0.25, 0.5, 0.7, 1, 2, 5],
    registers: [registry],
  });
  const responseBytes = new Histogram({
    name: "http_server_response_bytes",
    help: "HTTP server response payload size in bytes",
    labelNames: labels,
    buckets: [256, 1024, 4096, 16384, 65536, 262144, 1048576, 4194304],
    registers: [registry],
  });

  return {
    duration,
    responseBytes,
    middleware(req, res, next) {
      const startedAt = process.hrtime.bigint();
      res.once("finish", () => {
        const metricLabels = {
          method: req.method,
          route: normalizeRoute(req),
          status_code: String(res.statusCode),
        };
        const elapsedSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
        duration.observe(metricLabels, elapsedSeconds);
        const size = Number(res.getHeader("content-length"));
        responseBytes.observe(metricLabels, Number.isFinite(size) ? size : 0);
      });
      next();
    },
  };
}
