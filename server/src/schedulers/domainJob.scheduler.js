import prisma from "../config/prismaClient.js";
import logger from "../config/logger.js";
import { DOMAIN_JOB_STATUS, DOMAIN_JOB_TYPES } from "../config/constants.js";
import routingService from "../services/routing/routing.service.js";

const DEFAULT_INTERVAL_MS = Number(process.env.DOMAIN_JOB_INTERVAL_MS || 15000);
const DEFAULT_BATCH_SIZE = Number(process.env.DOMAIN_JOB_BATCH_SIZE || 10);

const toPoint = (place) => ({
  lat: Number(place.latitude),
  lng: Number(place.longitude),
});

const rebuildRouteMetrics = async (job) => {
  const tripId = Number(job.payload?.tripId || job.aggregateId);
  if (!Number.isInteger(tripId) || tripId <= 0) return;

  const trip = await prisma.tripPlan.findUnique({
    where: { id: tripId },
    include: {
      stops: {
        orderBy: [{ dayNumber: "asc" }, { sequence: "asc" }],
        include: {
          place: {
            select: {
              latitude: true,
              longitude: true,
            },
          },
        },
      },
    },
  });

  if (!trip || trip.stops.length === 0) return;

  if (trip.stops.length === 1) {
    await prisma.tripStop.update({
      where: { id: trip.stops[0].id },
      data: {
        routeDistanceM: null,
        routeDurationSec: null,
        routeGeometry: null,
        routeMetricsVersion: { increment: 1 },
      },
    });
    return;
  }

  const waypoints = trip.stops.map((stop) => toPoint(stop.place));
  const routeResult = await routingService.calculateLegs({
    waypoints,
    mode: "driving",
    options: {
      alternatives: 0,
      steps: false,
      overview: "full",
    },
  });

  const legsByIndex = new Map(
    (routeResult.legs || []).map((leg) => [Number(leg.index), leg]),
  );

  await prisma.$transaction(async (tx) => {
    for (let index = 0; index < trip.stops.length; index += 1) {
      const stop = trip.stops[index];
      const leg = legsByIndex.get(index + 1);
      const route = leg?.route;

      await tx.tripStop.update({
        where: { id: stop.id },
        data: {
          routeDistanceM: route ? Math.round(Number(route.distance || 0)) : null,
          routeDurationSec: route ? Math.round(Number(route.duration || 0)) : null,
          routeGeometry: route?.geometry ?? null,
          routeMetricsVersion: { increment: 1 },
        },
      });
    }
  });

  const totalDistanceM = Math.round(Number(routeResult.totalDistance || 0));
  await prisma.tripPlan.update({
    where: { id: tripId },
    data: {
      totalDistanceM: Number.isFinite(totalDistanceM) ? totalDistanceM : null,
    },
  });
};

const handlers = {
  [DOMAIN_JOB_TYPES.REBUILD_ROUTE_METRICS]: rebuildRouteMetrics,
};

export const processPendingDomainJobs = async (batchSize = DEFAULT_BATCH_SIZE) => {
  const jobs = await prisma.domainJob.findMany({
    where: {
      status: DOMAIN_JOB_STATUS.PENDING,
      runAfter: { lte: new Date() },
    },
    orderBy: { createdAt: "asc" },
    take: batchSize,
  });

  for (const job of jobs) {
    const claimed = await prisma.domainJob.updateMany({
      where: {
        id: job.id,
        status: DOMAIN_JOB_STATUS.PENDING,
      },
      data: {
        status: DOMAIN_JOB_STATUS.PROCESSING,
        attempts: { increment: 1 },
      },
    });

    if (claimed.count !== 1) continue;

    try {
      const handler = handlers[job.type];
      if (!handler) {
        throw new Error(`No handler for domain job type ${job.type}`);
      }

      await handler(job);
      await prisma.domainJob.update({
        where: { id: job.id },
        data: { status: DOMAIN_JOB_STATUS.DONE },
      });
    } catch (error) {
      const attempts = Number(job.attempts || 0) + 1;
      const shouldRetry = attempts < 5;
      await prisma.domainJob.update({
        where: { id: job.id },
        data: {
          status: shouldRetry
            ? DOMAIN_JOB_STATUS.PENDING
            : DOMAIN_JOB_STATUS.FAILED,
          runAfter: new Date(Date.now() + Math.min(60000, attempts * 10000)),
          payload: {
            ...(job.payload || {}),
            lastError: error?.message || "Domain job failed",
          },
        },
      });
      logger.error("[scheduler] domain job failed", {
        jobId: job.id,
        type: job.type,
        error: error?.message,
      });
    }
  }

  return jobs.length;
};

export const startDomainJobScheduler = () => {
  if (!DEFAULT_INTERVAL_MS || DEFAULT_INTERVAL_MS <= 0) {
    logger.info("[scheduler] domain jobs: off (DOMAIN_JOB_INTERVAL_MS=0)");
    return null;
  }

  const timer = setInterval(() => {
    processPendingDomainJobs().catch((error) => {
      logger.error("[scheduler] domain jobs failed", error);
    });
  }, DEFAULT_INTERVAL_MS);

  logger.info(`[scheduler] domain jobs: every ${DEFAULT_INTERVAL_MS}ms`);
  return timer;
};

export default {
  processPendingDomainJobs,
  startDomainJobScheduler,
};
