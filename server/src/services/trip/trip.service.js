import crypto from "node:crypto";
import bcrypt from "bcrypt";
import prisma from "../../config/prismaClient.js";
import { BCRYPT_SALT_ROUNDS } from "../../config/constants.js";
import { uploadPlaceImage } from "../media/media.service.js";
import { generateAndSaveTrip } from "./tripAiPlanner.service.js";
import { assertTripAccess, CAPABILITIES } from "./tripAccessPolicy.service.js";

export { generateAndSaveTrip };

const int = (value, fallback = null) => {
  const result = Number.parseInt(value, 10);
  return Number.isNaN(result) ? fallback : result;
};

const normalizeCover = async (value) => {
  if (value == null || value === "") return value;
  if (typeof value === "string" && value.startsWith("data:image/")) {
    return (await uploadPlaceImage(value, "didaugio/trips")).secureUrl;
  }
  return value;
};

const requestHash = (data) => crypto.createHash("sha256").update(JSON.stringify({
  title: data.title || null,
  description: data.description || null,
  startDate: data.startDate || null,
  endDate: data.endDate || null,
  totalDays: int(data.totalDays, 1),
  travelStyle: data.travelStyle || null,
  groupSize: int(data.groupSize, 1),
  placeIds: Array.isArray(data.placeIds) ? data.placeIds.map(Number) : [],
  thumbnail: data.thumbnail || null,
})).digest("hex");

export const TRIP_PLACE_SELECT = {
  id: true,
  name: true,
  slug: true,
  address: true,
  latitude: true,
  longitude: true,
  thumbnail: true,
  ratingAvg: true,
  category: { select: { id: true, name: true } },
  district: { select: { id: true, name: true, code: true } },
  ward: { select: { id: true, name: true, wardType: true } },
  images: {
    take: 1,
    orderBy: [{ isCover: "desc" }, { order: "asc" }],
    select: { secureUrl: true, thumbnailUrl: true, imageData: true },
  },
};

const planInclude = {
  stops: {
    orderBy: [{ dayNumber: "asc" }, { sequence: "asc" }],
    include: { place: { select: TRIP_PLACE_SELECT } },
  },
};

export const serializeTripPlan = (plan, isSaved = false) => ({
  id: plan.id,
  tripPlanId: plan.id,
  userId: plan.userId,
  title: plan.title,
  description: plan.description,
  thumbnail: plan.coverImage,
  coverImage: plan.coverImage,
  startDate: plan.startDate,
  endDate: plan.endDate,
  totalDays: plan.totalDays,
  totalDistance: plan.totalDistanceM == null ? null : Number((plan.totalDistanceM / 1000).toFixed(2)),
  totalDistanceM: plan.totalDistanceM,
  estimatedCost: plan.estimatedCost,
  travelStyle: plan.metadata?.travelStyle ?? null,
  groupSize: plan.metadata?.groupSize ?? 1,
  status: plan.status,
  source: plan.source,
  isAiGenerated: plan.source === "ai_generated",
  isPublic: plan.metadata?.isPublic === true,
  viewCount: plan.metadata?.viewCount ?? 0,
  cloneCount: plan.metadata?.cloneCount ?? 0,
  metadata: plan.metadata,
  createdAt: plan.createdAt,
  updatedAt: plan.updatedAt,
  stops: plan.stops || [],
  destinations: (plan.stops || []).map((stop) => ({
    ...stop,
    tripId: plan.id,
    order: stop.sequence,
    startTime: stop.arrivalTime,
    endTime: stop.departureTime,
    distanceToNext: stop.routeDistanceM == null ? null : Number((stop.routeDistanceM / 1000).toFixed(2)),
    status: stop.fulfillmentStatus,
    visitedAt: stop.fulfilledAt,
  })),
  isSaved,
});

export const withSavedTripFlags = (items = [], savedTrips = []) => {
  const ids = new Set(savedTrips.map((item) => item.tripId));
  return items.map((item) => ({ ...item, isSaved: ids.has(item.id) }));
};

export const makeTripListService = (db = prisma) => ({
  async getMyTrips(userId, query = {}) {
    const page = Math.max(int(query.page, 1), 1);
    const limit = Math.min(Math.max(int(query.limit, 10), 1), 50);
    const where = { userId };
    const [plans, saved, total] = await Promise.all([
      db.tripPlan.findMany({ where, orderBy: [{ updatedAt: "desc" }], skip: (page - 1) * limit, take: limit, include: planInclude }),
      db.savedTrip.findMany({ where: { userId }, select: { tripId: true } }),
      db.tripPlan.count({ where }),
    ]);
    return {
      data: withSavedTripFlags(plans.map((plan) => serializeTripPlan(plan)), saved),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },
});

export const getMyTrips = (userId, query) => makeTripListService().getMyTrips(userId, query);

export async function createTrip(userId, data) {
  const clientRequestId = data.clientRequestId || null;
  const hash = clientRequestId ? requestHash(data) : null;
  const normalizedCover = await normalizeCover(data.thumbnail);
  const execute = async () => prisma.$transaction(async (tx) => {
    if (clientRequestId) {
      const replay = await tx.tripPlan.findUnique({
        where: { userId_clientRequestId: { userId, clientRequestId } },
        include: planInclude,
      });
      if (replay) {
        if (replay.clientRequestHash !== hash) {
          const error = new Error("Idempotency key đã được dùng cho nội dung khác");
          error.statusCode = 409;
          error.errorCode = "TRIP_CREATE_IDEMPOTENCY_CONFLICT";
          throw error;
        }
        return serializeTripPlan(replay);
      }
    }
    const totalDays = int(data.totalDays, 1);
    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const endDate = data.endDate ? new Date(data.endDate) : new Date(startDate.getTime() + (totalDays - 1) * 86400000);
    const plan = await tx.tripPlan.create({
      data: {
        userId,
        title: data.title || "Chuyến đi mới",
        description: data.description || null,
        coverImage: normalizedCover,
        startDate,
        endDate,
        totalDays,
        status: "planned",
        source: "manual",
        clientRequestId,
        clientRequestHash: hash,
        metadata: { travelStyle: data.travelStyle || null, groupSize: int(data.groupSize, 1), isPublic: false },
      },
    });
    if (Array.isArray(data.placeIds) && data.placeIds.length > 0) {
      await tx.tripStop.createMany({
        data: data.placeIds.map((placeId, index) => ({
          tripId: plan.id,
          placeId: int(placeId),
          dayNumber: 1,
          sequence: index + 1,
        })),
      });
    }
    return serializeTripPlan(await tx.tripPlan.findUnique({ where: { id: plan.id }, include: planInclude }));
  });

  try {
    return await execute();
  } catch (error) {
    if (error?.code !== "P2002" || !clientRequestId) throw error;
    const replay = await prisma.tripPlan.findUnique({
      where: { userId_clientRequestId: { userId, clientRequestId } },
      include: planInclude,
    });
    if (!replay || replay.clientRequestHash !== hash) {
      const conflict = new Error("Idempotency key conflict");
      conflict.statusCode = 409;
      conflict.errorCode = "TRIP_CREATE_IDEMPOTENCY_CONFLICT";
      throw conflict;
    }
    return serializeTripPlan(replay);
  }
}

export async function updateTrip(id, userId, data) {
  const plan = await prisma.tripPlan.findUnique({ where: { id } });
  assertTripAccess(userId, plan, CAPABILITIES.EDIT);
  const totalDays = data.totalDays === undefined ? plan.totalDays : int(data.totalDays, 1);
  if (totalDays < plan.totalDays) {
    const overflow = await prisma.tripStop.count({ where: { tripId: id, dayNumber: { gt: totalDays } } });
    if (overflow > 0) {
      const error = new Error("Hãy di chuyển các điểm dừng trước khi giảm số ngày");
      error.statusCode = 409;
      error.errorCode = "TRIP_DAYS_CONFLICT";
      throw error;
    }
  }
  const metadata = {
    ...(plan.metadata && typeof plan.metadata === "object" ? plan.metadata : {}),
    ...(data.travelStyle !== undefined && { travelStyle: data.travelStyle }),
    ...(data.groupSize !== undefined && { groupSize: int(data.groupSize, 1) }),
    ...(data.isPublic !== undefined && { isPublic: data.isPublic === true }),
  };
  const status = ({ upcoming: "planned", "in-progress": "active", canceled: "cancelled" })[data.status] || data.status;
  const updated = await prisma.tripPlan.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.endDate && { endDate: new Date(data.endDate) }),
      ...(data.totalDays !== undefined && { totalDays }),
      ...(status && { status }),
      ...(data.thumbnail !== undefined && { coverImage: (await normalizeCover(data.thumbnail)) || null }),
      metadata,
    },
    include: planInclude,
  });
  return serializeTripPlan(updated);
}

export async function deleteTrip(id, userId) {
  const plan = await prisma.tripPlan.findUnique({ where: { id } });
  assertTripAccess(userId, plan, CAPABILITIES.DELETE);
  await prisma.tripPlan.delete({ where: { id } });
  return { success: true };
}

export async function duplicateTrip(id, userId) {
  const source = await prisma.tripPlan.findUnique({ where: { id }, include: { stops: true } });
  assertTripAccess(userId, source, CAPABILITIES.DUPLICATE);
  return prisma.$transaction(async (tx) => {
    const copy = await tx.tripPlan.create({
      data: {
        userId,
        title: `${source.title} (Bản sao)`,
        description: source.description,
        coverImage: source.coverImage,
        startDate: source.startDate,
        endDate: source.endDate,
        totalDays: source.totalDays,
        status: "draft",
        source: source.source,
        estimatedCost: source.estimatedCost,
        totalDistanceM: source.totalDistanceM,
        metadata: source.metadata,
      },
    });
    if (source.stops.length > 0) {
      await tx.tripStop.createMany({
        data: source.stops.map((stop) => ({
          tripId: copy.id, placeId: stop.placeId, dayNumber: stop.dayNumber,
          sequence: stop.sequence, title: stop.title, note: stop.note,
          plannedDate: stop.plannedDate, arrivalTime: stop.arrivalTime,
          departureTime: stop.departureTime, durationMinutes: stop.durationMinutes,
          estimatedCost: stop.estimatedCost, transportToNext: stop.transportToNext,
          fulfillmentStatus: "pending", metadata: stop.metadata,
        })),
      });
    }
    return serializeTripPlan(await tx.tripPlan.findUnique({ where: { id: copy.id }, include: planInclude }));
  });
}

export async function saveTrip(userId, tripId) {
  const plan = await prisma.tripPlan.findUnique({ where: { id: tripId } });
  assertTripAccess(userId, plan, CAPABILITIES.SAVE);
  return prisma.savedTrip.upsert({
    where: { userId_tripId: { userId, tripId } },
    create: { userId, tripId },
    update: {},
  });
}

export async function unsaveTrip(userId, tripId) {
  await prisma.savedTrip.deleteMany({ where: { userId, tripId } });
  return { success: true };
}

export async function getMySavedTrips(userId) {
  const saved = await prisma.savedTrip.findMany({
    where: { userId },
    include: { trip: { include: planInclude } },
    orderBy: { createdAt: "desc" },
  });
  return saved.map((item) => ({ ...serializeTripPlan(item.trip, true), savedAt: item.createdAt }));
}

export async function createTripShare(tripId, userId, data = {}) {
  const plan = await prisma.tripPlan.findUnique({ where: { id: tripId } });
  assertTripAccess(userId, plan, CAPABILITIES.SHARE);
  return prisma.tripShare.create({
    data: {
      tripId,
      shareCode: crypto.randomBytes(12).toString("base64url"),
      shareType: data.shareType || "view",
      password: data.password ? await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      maxAccess: data.maxAccess || null,
    },
  });
}

export async function getTripShares(tripId, userId) {
  const plan = await prisma.tripPlan.findUnique({ where: { id: tripId } });
  assertTripAccess(userId, plan, CAPABILITIES.SHARE);
  return prisma.tripShare.findMany({ where: { tripId }, orderBy: { createdAt: "desc" } });
}

export async function accessTripShare(shareCode, password = null) {
  return prisma.$transaction(async (tx) => {
    let share = await tx.tripShare.findUnique({ where: { shareCode }, include: { trip: { include: planInclude } } });
    if (share) {
      await tx.$queryRaw`SELECT id FROM trip_shares WHERE id = ${share.id} FOR UPDATE`;
      share = await tx.tripShare.findUnique({ where: { id: share.id }, include: { trip: { include: planInclude } } });
    }
    if (!share || !share.isActive) {
      const error = new Error("Link chia sẻ không tồn tại hoặc đã bị vô hiệu hóa"); error.statusCode = 404; throw error;
    }
    if (share.expiresAt && share.expiresAt < new Date()) {
      const error = new Error("Link chia sẻ đã hết hạn"); error.statusCode = 410; throw error;
    }
    if (share.maxAccess != null && share.accessCount >= share.maxAccess) {
      const error = new Error("Link chia sẻ đã đạt giới hạn truy cập"); error.statusCode = 410; throw error;
    }
    if (share.password && (!password || !(await bcrypt.compare(password, share.password)))) {
      const error = new Error("Mật khẩu không đúng"); error.statusCode = 403; throw error;
    }
    await tx.tripShare.update({ where: { id: share.id }, data: { accessCount: { increment: 1 } } });
    return { trip: serializeTripPlan(share.trip), shareType: share.shareType };
  });
}

export async function deleteTripShare(shareId, userId) {
  const share = await prisma.tripShare.findUnique({ where: { id: shareId }, include: { trip: true } });
  if (!share) {
    const error = new Error("Không tìm thấy link chia sẻ"); error.statusCode = 404; throw error;
  }
  assertTripAccess(userId, share.trip, CAPABILITIES.SHARE);
  await prisma.tripShare.delete({ where: { id: shareId } });
  return { success: true };
}

export default {
  generateAndSaveTrip,
  getMyTrips,
  createTrip,
  updateTrip,
  deleteTrip,
  duplicateTrip,
  saveTrip,
  unsaveTrip,
  getMySavedTrips,
  createTripShare,
  getTripShares,
  accessTripShare,
  deleteTripShare,
};
