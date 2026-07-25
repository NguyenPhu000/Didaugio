import prisma from "../../config/prismaClient.js";
import {
  getActiveAiRuntime,
} from "../ai/runtime/aiRuntimeConfig.js";

function dateWhere({ from, to }) {
  if (!from && !to) return undefined;
  return {
    ...(from ? { gte: new Date(from) } : {}),
    ...(to ? { lte: new Date(to) } : {}),
  };
}

function sum(rows, field) {
  return rows.reduce((total, row) => total + (row[field] ?? 0), 0);
}

function rounded(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function percentile95(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)];
}

export function createAiOverviewService({
  client,
  getRuntime = getActiveAiRuntime,
}) {
  async function getOverview({ from, to } = {}) {
    const [runtime, rows] = await Promise.all([
      getRuntime(),
      client.aiRequestLog.findMany({
        where: {
          isTest: false,
          ...(dateWhere({ from, to })
            ? { createdAt: dateWhere({ from, to }) }
            : {}),
        },
        select: {
          status: true,
          inputTokens: true,
          outputTokens: true,
          latencyMs: true,
          safetyBlocked: true,
          feedback: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const requests = rows.length;
    const latencies = rows
      .map((row) => row.latencyMs)
      .filter((value) => Number.isFinite(value));
    const timelineByDay = new Map();
    for (const row of rows) {
      const bucket = new Date(row.createdAt).toISOString().slice(0, 10);
      const current = timelineByDay.get(bucket) ?? {
        bucket,
        requests: 0,
        errors: 0,
        inputTokens: 0,
        outputTokens: 0,
      };
      current.requests += 1;
      if (row.status === "error") current.errors += 1;
      current.inputTokens += row.inputTokens ?? 0;
      current.outputTokens += row.outputTokens ?? 0;
      timelineByDay.set(bucket, current);
    }

    return {
      runtime: {
        status: runtime.status,
        provider: runtime.configData?.provider?.adapter ?? null,
        model: runtime.configData?.provider?.model ?? null,
        version: runtime.version,
      },
      totals: {
        requests,
        inputTokens: sum(rows, "inputTokens"),
        outputTokens: sum(rows, "outputTokens"),
        successRate: requests === 0
          ? 0
          : rounded(
              (rows.filter((row) => row.status === "success").length /
                requests) *
                100,
              2,
            ),
        safetyBlocks: rows.filter((row) => row.safetyBlocked).length,
        negativeFeedback: rows.filter((row) => row.feedback === "down").length,
      },
      latency: {
        averageMs: latencies.length === 0
          ? 0
          : rounded(
              latencies.reduce((total, value) => total + value, 0) /
                latencies.length,
            ),
        p95Ms: percentile95(latencies),
      },
      timeline: [...timelineByDay.values()],
    };
  }

  return { getOverview };
}

const service = createAiOverviewService({ client: prisma });

export const getOverview = service.getOverview.bind(service);
