import bcrypt from "bcrypt";
import prisma from "../../config/prismaClient.js";
import { BCRYPT_SALT_ROUNDS } from "../../config/constants.js";
import routingService from "../routing/routing.service.js";
import { uploadPlaceImage } from "../media/media.service.js";
import { generateAndSaveTrip } from "./tripAiPlanner.service.js";

export { generateAndSaveTrip };

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const toInt = (value, fallback = null) => {
  const number = parseInt(value, 10);
  return Number.isNaN(number) ? fallback : number;
};

const parsePagination = (query = {}) => {
  const page = Math.max(toInt(query.page, 1), 1);
  const limit = Math.min(Math.max(toInt(query.limit, 10), 1), 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/** Chuyển data URL base64 thành URL Cloudinary (giống event thumbnail). */
const normalizeTripThumbnail = async (thumbnail) => {
  if (thumbnail == null || thumbnail === "") return thumbnail;
  if (typeof thumbnail === "string" && thumbnail.startsWith("data:image/")) {
    const uploadResult = await uploadPlaceImage(thumbnail, "didaugio/trips");
    return uploadResult.secureUrl;
  }
  return thumbnail;
};

export const withSavedTripFlags = (items = [], savedTrips = []) => {
  const savedTripIds = new Set(savedTrips.map((saved) => saved.tripId));
  return items.map((trip) => ({
    ...trip,
    isSaved: savedTripIds.has(trip.id),
  }));
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const TRIP_PLACE_SELECT = {
  id: true,
  name: true,
  address: true,
  latitude: true,
  longitude: true,
  thumbnail: true,
  images: {
    take: 1,
    orderBy: [{ isCover: "desc" }, { order: "asc" }],
    select: { secureUrl: true, thumbnailUrl: true, imageData: true },
  },
  ratingAvg: true,
  category: { select: { id: true, name: true } },
  district: { select: { id: true, name: true, code: true } },
  ward: { select: { id: true, name: true, wardType: true } },
};

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

const toKm2 = (meters) => {
  const value = Number(meters);
  if (!Number.isFinite(value) || value < 0) return null;
  return Number((value / 1000).toFixed(2));
};
const recalculateDistancesForDay = async (tripId, dayNumber) => {
  try {
    const destinations = await prisma.tripDestination.findMany({
      where: { tripId, dayNumber: toInt(dayNumber, 1) },
      orderBy: { order: "asc" },
      include: { place: true },
    });

    if (destinations.length === 0) return;

    for (let i = 0; i < destinations.length; i++) {
      const currentDest = destinations[i];

      if (i === destinations.length - 1) {
        await prisma.tripDestination.update({
          where: { id: currentDest.id },
          data: {
            distanceToNext: null,
            transportToNext: null,
          },
        });
        continue;
      }

      const nextDest = destinations[i + 1];
      const fromPlace = currentDest.place;
      const toPlace = nextDest.place;

      if (!fromPlace || !toPlace) continue;

      let distanceKm = null;
      try {
        const routeResult = await routingService.calculate({
          origin: {
            lat: Number(fromPlace.latitude),
            lng: Number(fromPlace.longitude),
            name: fromPlace.name,
          },
          destination: {
            lat: Number(toPlace.latitude),
            lng: Number(toPlace.longitude),
            name: toPlace.name,
          },
          mode: "motorcycle",
          options: { alternatives: 0, steps: false },
        });

        const route = routeResult?.routes?.[0];
        if (route) {
          distanceKm = toKm2(route.distance);
        }
      } catch (err) {
        console.error("Lỗi tính toán khoảng cách tự động: ", err.message);
      }

      await prisma.tripDestination.update({
        where: { id: currentDest.id },
        data: {
          distanceToNext: distanceKm,
        },
      });
    }
  } catch (error) {
    console.error("Lỗi recalculateDistancesForDay: ", error.message);
  }
};

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

export const saveTrip = async (userId, tripId) => {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) {
    const err = new Error("Không tìm thấy chuyến đi");
    err.statusCode = 404;
    throw err;
  }

  const saved = await prisma.savedTrip.upsert({
    where: { userId_tripId: { userId, tripId } },
    create: { userId, tripId },
    update: {},
  });

  return saved;
};

export const unsaveTrip = async (userId, tripId) => {
  await prisma.savedTrip.deleteMany({
    where: { userId, tripId },
  });
  return { success: true };
};

export const getMySavedTrips = async (userId) => {
  const saved = await prisma.savedTrip.findMany({
    where: { userId },
    include: {
      trip: {
        include: {
          destinations: {
            orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
            include: { place: { select: TRIP_PLACE_SELECT } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return saved.map((s) => ({ ...s.trip, savedAt: s.createdAt, isSaved: true }));
};

export const getMyTrips = async (userId, query = {}) => {
  const { page, limit, skip } = parsePagination(query);

  const where = { userId };

  const [items, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip,
      take: limit,
      include: {
        destinations: {
          orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
          take: 6,
          include: {
            place: {
              select: {
                id: true,
                name: true,
                slug: true,
                thumbnail: true,
                category: {
                  select: { id: true, name: true },
                },
                district: {
                  select: { id: true, name: true, code: true },
                },
                ward: {
                  select: { id: true, name: true, wardType: true },
                },
                images: {
                  take: 1,
                  orderBy: [{ isCover: "desc" }, { order: "asc" }],
                  select: { secureUrl: true, thumbnailUrl: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.trip.count({ where }),
  ]);

  const tripIds = items.map((trip) => trip.id);
  const savedTrips =
    tripIds.length > 0
      ? await prisma.savedTrip.findMany({
          where: { userId, tripId: { in: tripIds } },
          select: { tripId: true },
        })
      : [];

  return {
    data: withSavedTripFlags(items, savedTrips),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createTrip = async (userId, data) => {
  const {
    title,
    description,
    startDate,
    endDate,
    totalDays,
    travelStyle,
    groupSize,
    status,
    placeIds,
    thumbnail,
  } = data;

  const normalizedThumbnail = await normalizeTripThumbnail(thumbnail);

  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.create({
      data: {
        userId,
        title,
        description,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        totalDays: toInt(totalDays, 1),
        travelStyle,
        groupSize: toInt(groupSize, 1),
        status: status || "upcoming",
        ...(normalizedThumbnail !== undefined && normalizedThumbnail !== null
          ? { thumbnail: normalizedThumbnail }
          : {}),
      },
    });

    if (Array.isArray(placeIds) && placeIds.length > 0) {
      const destinations = placeIds.map((placeId, index) => ({
        tripId: trip.id,
        placeId: toInt(placeId),
        dayNumber: 1,
        order: index + 1,
        status: "planned",
      }));
      await tx.tripDestination.createMany({ data: destinations });
    }

    return tx.trip.findUnique({
      where: { id: trip.id },
      include: {
        destinations: {
          orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
          include: { place: { select: TRIP_PLACE_SELECT } },
        },
      },
    });
  });
};

export const getTripDetail = async (id, userId) => {
  const trip = await prisma.trip.findFirst({
    where: { id, userId },
    include: {
      destinations: {
        orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
        include: { place: { select: TRIP_PLACE_SELECT } },
      },
    },
  });

  if (!trip) return null;

  const saved = userId
    ? await prisma.savedTrip.findUnique({
        where: { userId_tripId: { userId, tripId: id } },
      })
    : null;

  return { ...trip, isSaved: !!saved };
};

export const updateTrip = async (id, userId, data) => {
  const trip = await prisma.trip.findFirst({ where: { id, userId } });
  if (!trip) {
    const err = new Error("Không tìm thấy chuyến đi");
    err.statusCode = 404;
    throw err;
  }
  const {
    title,
    description,
    startDate,
    endDate,
    totalDays,
    travelStyle,
    groupSize,
    status,
    thumbnail,
  } = data;

  if (totalDays !== undefined) {
    const parsedTotalDays = toInt(totalDays, 1);
    if (parsedTotalDays < trip.totalDays) {
      await prisma.tripDestination.updateMany({
        where: { tripId: id, dayNumber: { gt: parsedTotalDays } },
        data: { dayNumber: parsedTotalDays },
      });
      await recalculateDistancesForDay(id, parsedTotalDays);
    }
  }

  const normalizedThumbnail =
    thumbnail !== undefined ? await normalizeTripThumbnail(thumbnail) : undefined;

  return prisma.trip.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(startDate !== undefined && {
        startDate: startDate ? new Date(startDate) : null,
      }),
      ...(endDate !== undefined && {
        endDate: endDate ? new Date(endDate) : null,
      }),
      ...(totalDays !== undefined && { totalDays: toInt(totalDays, 1) }),
      ...(travelStyle !== undefined && { travelStyle }),
      ...(groupSize !== undefined && { groupSize: toInt(groupSize, 1) }),
      ...(status !== undefined && { status }),
      ...(normalizedThumbnail !== undefined && { thumbnail: normalizedThumbnail }),
    },
    include: {
      destinations: {
        orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
        include: { place: { select: TRIP_PLACE_SELECT } },
      },
    },
  });
};

export const deleteTrip = async (id, userId) => {
  const trip = await prisma.trip.findFirst({ where: { id, userId } });
  if (!trip) {
    const err = new Error("Không tìm thấy chuyến đi");
    err.statusCode = 404;
    throw err;
  }
  await prisma.trip.delete({ where: { id } });
};

export const duplicateTrip = async (id, userId) => {
  const trip = await prisma.trip.findFirst({
    where: { id, userId },
    include: { destinations: true },
  });
  if (!trip) {
    const err = new Error("Không tìm thấy chuyến đi");
    err.statusCode = 404;
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    const newTrip = await tx.trip.create({
      data: {
        userId,
        title: `${trip.title} (Bản sao)`,
        description: trip.description,
        startDate: null,
        endDate: null,
        totalDays: trip.totalDays,
        travelStyle: trip.travelStyle,
        groupSize: trip.groupSize,
        status: "upcoming",
        thumbnail: trip.thumbnail,
      },
    });

    if (trip.destinations?.length > 0) {
      await tx.tripDestination.createMany({
        data: trip.destinations.map((dest) => ({
          tripId: newTrip.id,
          placeId: dest.placeId,
          dayNumber: dest.dayNumber,
          order: dest.order,
          startTime: null,
          endTime: null,
          durationMinutes: null,
          note: dest.note,
          transportToNext: null,
          distanceToNext: null,
          estimatedCost: null,
          status: "planned",
        })),
      });
    }

    return tx.trip.findUnique({
      where: { id: newTrip.id },
      include: {
        destinations: {
          orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
          include: { place: { select: TRIP_PLACE_SELECT } },
        },
      },
    });
  });
};

export const addDestination = async (
  tripId,
  userId,
  { placeId, dayNumber, order, note, startTime, endTime, transportToNext, distanceToNext },
) => {
  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) {
    const err = new Error("Không tìm thấy chuyến đi");
    err.statusCode = 404;
    throw err;
  }

  let targetOrder = toInt(order);
  if (targetOrder === null || targetOrder === undefined) {
    const maxDest = await prisma.tripDestination.findFirst({
      where: { tripId, dayNumber: toInt(dayNumber, 1) },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    targetOrder = maxDest ? maxDest.order + 1 : 1;
  }

  if (transportToNext) {
    const previousDest = await prisma.tripDestination.findFirst({
      where: { tripId, dayNumber: toInt(dayNumber, 1) },
      orderBy: { order: "desc" },
    });
    if (previousDest) {
      await prisma.tripDestination.update({
        where: { id: previousDest.id },
        data: { transportToNext },
      });
    }
  }

  const created = await prisma.tripDestination.create({
    data: {
      tripId,
      placeId: toInt(placeId),
      dayNumber: toInt(dayNumber, 1),
      order: targetOrder,
      note,
      startTime: startTime ?? null,
      endTime: endTime ?? null,
      transportToNext: null,
      distanceToNext: distanceToNext !== undefined && distanceToNext !== null ? Number(distanceToNext) : null,
      status: "planned",
    },
  });

  await recalculateDistancesForDay(tripId, dayNumber);

  return prisma.tripDestination.findFirst({
    where: { id: created.id },
    include: { place: { select: TRIP_PLACE_SELECT } },
  });
};

export const removeDestination = async (tripId, destId, userId) => {
  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) {
    const err = new Error("Không tìm thấy chuyến đi");
    err.statusCode = 404;
    throw err;
  }
  const dest = await prisma.tripDestination.findFirst({
    where: { id: destId, tripId },
  });
  if (!dest) {
    const err = new Error("Không tìm thấy địa điểm trong lịch trình");
    err.statusCode = 404;
    throw err;
  }
  await prisma.tripDestination.delete({ where: { id: destId } });

  await recalculateDistancesForDay(tripId, dest.dayNumber);
};

export const reorderDestinations = async (tripId, userId, { dayNumber, orderedIds }) => {
  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) {
    const err = new Error("Khong tim thay chuyen di");
    err.statusCode = 404;
    throw err;
  }
  await prisma.$transaction(
    orderedIds.map((destId, index) =>
      prisma.tripDestination.update({
        where: { id: toInt(destId) },
        data: { order: index },
      }),
    ),
  );

  await recalculateDistancesForDay(tripId, dayNumber);

  return prisma.tripDestination.findMany({
    where: { tripId, dayNumber: toInt(dayNumber, 1) },
    orderBy: { order: "asc" },
    include: { place: { select: TRIP_PLACE_SELECT } },
  });
};

export const updateDestination = async (tripId, destId, userId, data) => {
  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) {
    const err = new Error("Khong tim thay chuyen di");
    err.statusCode = 404;
    throw err;
  }
  const dest = await prisma.tripDestination.findFirst({ where: { id: destId, tripId } });
  if (!dest) {
    const err = new Error("Khong tim thay dia diem");
    err.statusCode = 404;
    throw err;
  }
  const updateData = {};
  if (data.startTime !== undefined) updateData.startTime = data.startTime;
  if (data.endTime !== undefined) updateData.endTime = data.endTime;
  if (data.durationMinutes !== undefined) updateData.durationMinutes = toInt(data.durationMinutes);
  if (data.note !== undefined) updateData.note = data.note;
  if (data.transportToNext !== undefined) updateData.transportToNext = data.transportToNext;
  if (data.distanceToNext !== undefined) updateData.distanceToNext = data.distanceToNext !== null ? Number(data.distanceToNext) : null;

  await prisma.tripDestination.update({
    where: { id: destId },
    data: updateData,
  });

  await recalculateDistancesForDay(tripId, dest.dayNumber);

  return prisma.tripDestination.findFirst({
    where: { id: destId },
    include: { place: { select: TRIP_PLACE_SELECT } },
  });
};

export const moveDestination = async (tripId, destId, userId, { newDayNumber, newOrder }) => {
  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) {
    const err = new Error("Khong tim thay chuyen di");
    err.statusCode = 404;
    throw err;
  }
  const dest = await prisma.tripDestination.findFirst({ where: { id: destId, tripId } });
  if (!dest) {
    const err = new Error("Khong tim thay dia diem");
    err.statusCode = 404;
    throw err;
  }
  const oldDayNumber = dest.dayNumber;

  await prisma.tripDestination.update({
    where: { id: destId },
    data: {
      dayNumber: toInt(newDayNumber),
      order: toInt(newOrder, 0),
    },
  });

  await recalculateDistancesForDay(tripId, oldDayNumber);
  await recalculateDistancesForDay(tripId, newDayNumber);

  return prisma.tripDestination.findFirst({
    where: { id: destId },
    include: { place: { select: TRIP_PLACE_SELECT } },
  });
};

// ---------------------------------------------------------------------------
// TripShare Functions
// ---------------------------------------------------------------------------

const generateShareCode = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const createTripShare = async (tripId, userId, data = {}) => {
  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) {
    const err = new Error("Không tìm thấy chuyến đi");
    err.statusCode = 404;
    throw err;
  }

  const shareCode = generateShareCode();
  // Hash password before storing
  const hashedPassword = data.password
    ? await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS)
    : null;

  const share = await prisma.tripShare.create({
    data: {
      tripId,
      shareCode,
      shareType: data.shareType || "view",
      password: hashedPassword,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      maxAccess: data.maxAccess || null,
    },
  });

  return share;
};

export const getTripShares = async (tripId, userId) => {
  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) {
    const err = new Error("Không tìm thấy chuyến đi");
    err.statusCode = 404;
    throw err;
  }

  return prisma.tripShare.findMany({
    where: { tripId },
    orderBy: { createdAt: "desc" },
  });
};

export const accessTripShare = async (shareCode, password = null) => {
  const share = await prisma.tripShare.findUnique({
    where: { shareCode },
    include: {
      trip: {
        include: {
          destinations: {
            orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
            include: { place: { select: TRIP_PLACE_SELECT } },
          },
        },
      },
    },
  });

  if (!share || !share.isActive) {
    const err = new Error("Link chia sẻ không tồn tại hoặc đã bị vô hiệu hóa");
    err.statusCode = 404;
    throw err;
  }

  if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
    const err = new Error("Link chia sẻ đã hết hạn");
    err.statusCode = 410;
    throw err;
  }

  if (share.maxAccess && share.accessCount >= share.maxAccess) {
    const err = new Error("Link chia sẻ đã đạt giới hạn truy cập");
    err.statusCode = 410;
    throw err;
  }

  if (share.password) {
    if (!password) {
      const err = new Error("Cần mật khẩu để xem chuyến đi này");
      err.statusCode = 403;
      throw err;
    }
    const isMatch = await bcrypt.compare(password, share.password);
    if (!isMatch) {
      const err = new Error("Mật khẩu không đúng");
      err.statusCode = 403;
      throw err;
    }
  }

  await prisma.tripShare.update({
    where: { id: share.id },
    data: { accessCount: { increment: 1 } },
  });

  return { trip: share.trip, shareType: share.shareType };
};

export const deleteTripShare = async (shareId, userId) => {
  const share = await prisma.tripShare.findUnique({
    where: { id: shareId },
    include: { trip: true },
  });

  if (!share || share.trip.userId !== userId) {
    const err = new Error("Không tìm thấy link chia sẻ");
    err.statusCode = 404;
    throw err;
  }

  await prisma.tripShare.delete({ where: { id: shareId } });
  return { success: true };
};

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default {
  saveTrip,
  unsaveTrip,
  getMySavedTrips,
  getMyTrips,
  generateAndSaveTrip,
  createTrip,
  getTripDetail,
  updateTrip,
  deleteTrip,
  duplicateTrip,
  addDestination,
  removeDestination,
  reorderDestinations,
  updateDestination,
  moveDestination,
  createTripShare,
  getTripShares,
  accessTripShare,
  deleteTripShare,
};
