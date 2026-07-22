import crypto from "node:crypto";
import prisma from "../../config/prismaClient.js";
import ServiceError from "../../utils/serviceError.js";
import { ERROR_CODES } from "../../config/messages.js";
import { assertTripAccess, CAPABILITIES } from "./tripAccessPolicy.service.js";

const payloadHash = (value) => crypto
  .createHash("sha256")
  .update(JSON.stringify(value))
  .digest("hex");

const conflict = (message, code = "TRIP_SESSION_VERSION_CONFLICT") => {
  const error = new ServiceError(message, 409, ERROR_CODES.CONFLICT || code);
  error.errorCode = code;
  return error;
};

export class TripExecutionService {
  constructor(prismaClient) {
    this.prisma = prismaClient || prisma;
  }

  async resolveTripPlan(userId, tripId) {
    const id = Number(tripId);
    if (!Number.isInteger(id) || id <= 0) return null;
    const plan = await this.prisma.tripPlan.findUnique({ where: { id } });
    assertTripAccess(userId, plan, CAPABILITIES.EXECUTE);
    return plan;
  }

  async mapStopId(planId, currentStopId, tx = this.prisma) {
    if (currentStopId == null) return null;
    const stop = await tx.tripStop.findFirst({
      where: { id: Number(currentStopId), tripId: planId },
      select: { id: true },
    });
    if (!stop) throw conflict("Điểm dừng không thuộc hành trình", "TRIP_STOP_MISMATCH");
    return stop.id;
  }

  async upsertSession(userId, tripId, data = {}) {
    const plan = await this.resolveTripPlan(userId, tripId);
    if (!plan) {
      throw new ServiceError("Không tìm thấy hành trình", 404, ERROR_CODES.NOT_FOUND);
    }
    const operationId = String(data.operationId || "").trim();
    const baseVersion = Number(data.baseVersion);
    if (!operationId || !Number.isInteger(baseVersion) || baseVersion < 0) {
      throw new ServiceError(
        "operationId và baseVersion là bắt buộc",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }
    const hash = payloadHash({ ...data, operationId: undefined });

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.tripExecutionSession.findFirst({
        where: { tripId: plan.id, userId },
      });

      if (existing) {
        await tx.$queryRaw`SELECT id FROM trip_execution_sessions WHERE id = ${existing.id} FOR UPDATE`;
        const replay = await tx.tripExecutionOperation.findUnique({
          where: { sessionId_operationId: { sessionId: existing.id, operationId } },
        });
        if (replay) {
          if (replay.payloadHash !== hash) {
            throw conflict("operationId đã được dùng cho nội dung khác", "TRIP_OPERATION_CONFLICT");
          }
          return tx.tripExecutionSession.findUnique({ where: { id: existing.id } });
        }
        const current = await tx.tripExecutionSession.findUnique({ where: { id: existing.id } });
        if (baseVersion !== current.clientStateVersion) {
          throw conflict("Phiên trên thiết bị đã cũ hơn server");
        }
        const nextVersion = current.clientStateVersion + 1;
        const session = await tx.tripExecutionSession.update({
          where: { id: current.id },
          data: this.buildSessionData(plan.id, data, nextVersion, await this.mapStopId(plan.id, data.currentStopId, tx)),
        });
        await tx.tripExecutionOperation.create({
          data: {
            sessionId: session.id,
            tripId: plan.id,
            userId,
            operationId,
            baseVersion,
            nextVersion,
            payloadHash: hash,
          },
        });
        return session;
      }

      if (baseVersion !== 0) throw conflict("Phiên chưa tồn tại; baseVersion phải bằng 0");
      const session = await tx.tripExecutionSession.create({
        data: {
          tripId: plan.id,
          userId,
          startedAt: new Date(),
          ...this.buildSessionData(plan.id, data, 1, await this.mapStopId(plan.id, data.currentStopId, tx)),
        },
      });
      await tx.tripExecutionOperation.create({
        data: {
          sessionId: session.id,
          tripId: plan.id,
          userId,
          operationId,
          baseVersion: 0,
          nextVersion: 1,
          payloadHash: hash,
        },
      });
      return session;
    });
  }

  buildSessionData(_tripId, data, version, currentStopId) {
    const now = new Date();
    const result = {
      deviceId: data.deviceId || null,
      status: data.status || "active",
      lastKnownLat: data.lastKnownLat == null ? null : Number(data.lastKnownLat),
      lastKnownLng: data.lastKnownLng == null ? null : Number(data.lastKnownLng),
      lastKnownHeading: data.lastKnownHeading == null ? null : Number(data.lastKnownHeading),
      lastSyncAt: now,
      clientStateVersion: version,
      metadata: { visitedIds: Array.isArray(data.visitedIds) ? data.visitedIds : [] },
    };
    if (data.currentStopId !== undefined) result.currentStopId = currentStopId;
    if (result.status === "paused") result.pausedAt = now;
    if (result.status === "active") result.resumedAt = now;
    if (["completed", "cancelled"].includes(result.status)) result.endedAt = now;
    return result;
  }

  async getSession(userId, tripId) {
    const plan = await this.resolveTripPlan(userId, tripId);
    if (!plan) return null;
    return this.prisma.tripExecutionSession.findFirst({
      where: { tripId: plan.id, userId },
      include: { currentStop: { include: { place: true } } },
    });
  }

  async endSession(userId, tripId, status = "completed") {
    const plan = await this.resolveTripPlan(userId, tripId);
    const existing = await this.prisma.tripExecutionSession.findFirst({
      where: { tripId: plan.id, userId },
    });
    if (!existing) return null;
    return this.prisma.tripExecutionSession.update({
      where: { id: existing.id },
      data: { status, endedAt: new Date(), lastSyncAt: new Date() },
    });
  }
}

export const tripExecutionService = new TripExecutionService();
export default tripExecutionService;
