import prisma from "../../config/prismaClient.js";
import ServiceError from "../../utils/serviceError.js";
import { ERROR_CODES } from "../../config/messages.js";

const VALID_PLAN_STATUSES = new Set([
  "draft",
  "planned",
  "active",
  "paused",
  "completed",
  "cancelled",
  "archived",
]);

const toPlanStatus = (status) =>
  VALID_PLAN_STATUSES.has(status) ? status : "planned";

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export class TripExecutionService {
  constructor(prismaClient) {
    this.prisma = prismaClient || prisma;
  }

  async resolveTripPlan(userId, tripId) {
    const directPlan = await this.prisma.tripPlan.findFirst({
      where: { id: tripId, userId },
    });
    if (directPlan) return directPlan;

    const existingShadow = await this.prisma.tripPlan.findFirst({
      where: {
        userId,
        metadata: { path: ["legacyTripId"], equals: tripId },
      },
    });
    if (existingShadow) return existingShadow;

    const legacyTrip = await this.prisma.trip.findFirst({
      where: { id: tripId, userId },
      include: {
        destinations: {
          orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
        },
      },
    });
    if (!legacyTrip) return null;

    const startDate = legacyTrip.startDate || new Date();
    const endDate =
      legacyTrip.endDate ||
      addDays(startDate, Math.max(legacyTrip.totalDays || 1, 1) - 1);

    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.tripPlan.create({
        data: {
          userId,
          title: legacyTrip.title,
          description: legacyTrip.description,
          coverImage: legacyTrip.thumbnail,
          startDate,
          endDate,
          totalDays: legacyTrip.totalDays || 1,
          status: toPlanStatus(legacyTrip.status),
          source: legacyTrip.isAiGenerated ? "ai_generated" : "imported",
          estimatedCost: legacyTrip.estimatedCost,
          totalDistanceM:
            legacyTrip.totalDistance != null
              ? Math.round(Number(legacyTrip.totalDistance) * 1000)
              : null,
          metadata: {
            legacyTripId: legacyTrip.id,
            createdFor: "active_trip_session",
          },
        },
      });

      if (legacyTrip.destinations.length > 0) {
        await tx.tripStop.createMany({
          data: legacyTrip.destinations.map((dest) => ({
            tripId: plan.id,
            placeId: dest.placeId,
            dayNumber: dest.dayNumber,
            sequence: dest.order,
            note: dest.note,
            plannedDate: addDays(startDate, Math.max(dest.dayNumber || 1, 1) - 1),
            arrivalTime: dest.startTime,
            departureTime: dest.endTime,
            durationMinutes: dest.durationMinutes,
            estimatedCost: dest.estimatedCost,
            transportToNext: dest.transportToNext,
            routeDistanceM:
              dest.distanceToNext != null
                ? Math.round(Number(dest.distanceToNext) * 1000)
                : null,
            fulfilledAt: dest.visitedAt,
            fulfillmentStatus:
              dest.status === "visited" ? "checked_in" : "pending",
            metadata: { legacyDestinationId: dest.id },
          })),
        });
      }

      return plan;
    });
  }

  async mapStopId(planId, currentStopId) {
    if (!currentStopId) return null;

    const directStop = await this.prisma.tripStop.findFirst({
      where: { id: Number(currentStopId), tripId: planId },
      select: { id: true },
    });
    if (directStop) return directStop.id;

    const shadowStop = await this.prisma.tripStop.findFirst({
      where: {
        tripId: planId,
        metadata: {
          path: ["legacyDestinationId"],
          equals: Number(currentStopId),
        },
      },
      select: { id: true },
    });

    return shadowStop?.id ?? null;
  }

  async upsertSession(userId, tripId, data = {}) {
    const {
      deviceId,
      status = "active",
      currentStopId,
      lastKnownLat,
      lastKnownLng,
      lastKnownHeading,
      visitedIds = [],
    } = data;

    const tripPlan = await this.resolveTripPlan(userId, tripId);
    if (!tripPlan) {
      throw new ServiceError(
        "Không tìm thấy hành trình du lịch hoặc bạn không có quyền truy cập",
        404,
        ERROR_CODES.NOT_FOUND,
      );
    }

    const existing = await this.prisma.tripExecutionSession.findFirst({
      where: { tripId: tripPlan.id, userId },
    });

    const sessionData = {
      deviceId,
      status,
      currentStopId: await this.mapStopId(tripPlan.id, currentStopId),
      lastKnownLat: lastKnownLat != null ? parseFloat(lastKnownLat) : null,
      lastKnownLng: lastKnownLng != null ? parseFloat(lastKnownLng) : null,
      lastKnownHeading:
        lastKnownHeading != null ? parseFloat(lastKnownHeading) : null,
      lastSyncAt: new Date(),
      metadata: {
        clientTripId: tripId,
        visitedIds,
      },
    };

    if (status === "paused") {
      sessionData.pausedAt = new Date();
    } else if (status === "active") {
      sessionData.resumedAt = new Date();
    } else if (status === "completed" || status === "cancelled") {
      sessionData.endedAt = new Date();
    }

    if (existing) {
      return this.prisma.tripExecutionSession.update({
        where: { id: existing.id },
        data: sessionData,
      });
    }

    return this.prisma.tripExecutionSession.create({
      data: {
        tripId: tripPlan.id,
        userId,
        startedAt: new Date(),
        ...sessionData,
      },
    });
  }

  async getSession(userId, tripId) {
    const tripPlan = await this.resolveTripPlan(userId, tripId);
    if (!tripPlan) return null;

    return this.prisma.tripExecutionSession.findFirst({
      where: { tripId: tripPlan.id, userId },
      include: {
        currentStop: {
          include: { place: true },
        },
      },
    });
  }

  async endSession(userId, tripId, status = "completed") {
    const tripPlan = await this.resolveTripPlan(userId, tripId);
    if (!tripPlan) return null;

    const existing = await this.prisma.tripExecutionSession.findFirst({
      where: { tripId: tripPlan.id, userId },
    });
    if (!existing) return null;

    return this.prisma.tripExecutionSession.update({
      where: { id: existing.id },
      data: {
        status,
        endedAt: new Date(),
        lastSyncAt: new Date(),
      },
    });
  }
}

export const tripExecutionService = new TripExecutionService();
export default tripExecutionService;
