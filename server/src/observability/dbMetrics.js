import { Gauge, Histogram } from "prom-client";

export function instrumentPrisma(prisma, { registry }) {
  const duration = new Histogram({
    name: "db_client_duration_seconds",
    help: "Prisma database operation duration in seconds",
    labelNames: ["model", "action", "outcome"],
    buckets: [0.0025, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2],
    registers: [registry],
  });
  const inFlight = new Gauge({
    name: "db_client_in_flight",
    help: "Current Prisma operations waiting for or using a database connection",
    registers: [registry],
  });

  prisma.$use(async (params, next) => {
    const startedAt = process.hrtime.bigint();
    inFlight.inc();
    let outcome = "ok";
    try {
      return await next(params);
    } catch (error) {
      outcome = "error";
      throw error;
    } finally {
      inFlight.dec();
      duration.observe(
        {
          model: params.model || "raw",
          action: params.action || "unknown",
          outcome,
        },
        Number(process.hrtime.bigint() - startedAt) / 1e9,
      );
    }
  });

  return { duration, inFlight };
}
