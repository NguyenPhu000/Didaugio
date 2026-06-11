import bcrypt from "bcrypt";
import prisma from "../../config/prismaClient.js";
import { GROQ_MODEL } from "../ai/groq.service.js";
import {
  generateFallbackItinerary,
  generateItinerary,
} from "../ai/itinerary.service.js";
import routingService from "../routing/routing.service.js";
import { normalizeItinerary } from "../../utils/itineraryFormatter.js";
import { uploadPlaceImage } from "../media/media.service.js";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const isRoutingEnabled =
  String(process.env.ROUTING_ENABLED ?? "true") !== "false";

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

const approvedPlaceWhere = {
  deletedAt: null,
  status: "approved",
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
  ratingAvg: true,
  category: { select: { id: true, name: true } },
  district: { select: { id: true, name: true, code: true } },
  ward: { select: { id: true, name: true, wardType: true } },
};

const MAX_TRIP_SUGGESTED_PLACES = 12;

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------



const buildSuggestedPlaces = (days, placeById) => {
  const orderedIds = [];
  const seen = new Set();

  for (const day of days) {
    const safeDestinations = Array.isArray(day?.destinations)
      ? day.destinations
      : [];
    for (const dest of safeDestinations) {
      const placeId = toInt(dest?.placeId);
      if (!placeId || seen.has(placeId) || !placeById.has(placeId)) continue;
      seen.add(placeId);
      orderedIds.push(placeId);
      if (orderedIds.length >= MAX_TRIP_SUGGESTED_PLACES) break;
    }
    if (orderedIds.length >= MAX_TRIP_SUGGESTED_PLACES) break;
  }

  if (orderedIds.length === 0) {
    for (const place of placeById.values()) {
      if (seen.has(place.id)) continue;
      seen.add(place.id);
      orderedIds.push(place.id);
      if (orderedIds.length >= MAX_TRIP_SUGGESTED_PLACES) break;
    }
  }

  return orderedIds.map((id) => placeById.get(id)).filter(Boolean);
};

const buildTripDestinations = ({
  tripId,
  days,
  allowedPlaceIds,
  selectedPlaceIdSet,
  allPlaces = [],
}) => {
  const destinations = [];
  const usedPlaceIds = new Set();

  const safeDays = Array.isArray(days) ? days : [];
  for (const day of safeDays) {
    const dayNumber = Math.max(toInt(day?.dayNumber, 1), 1);
    const safeDestinations = Array.isArray(day?.destinations)
      ? day.destinations
      : [];

    for (let index = 0; index < safeDestinations.length; index += 1) {
      const dest = safeDestinations[index];
      let placeId = toInt(dest?.placeId);

      if (!placeId || !allowedPlaceIds.has(placeId)) {
        const placeDetailsList = Array.isArray(allPlaces) ? allPlaces : [];
        const fallbackPlace = placeDetailsList.find(
          (p) => !usedPlaceIds.has(p.id) && allowedPlaceIds.has(p.id)
        );
        if (fallbackPlace) {
          placeId = fallbackPlace.id;
        } else {
          continue;
        }
      }

      if (selectedPlaceIdSet?.size && !selectedPlaceIdSet.has(placeId)) {
        if (!usedPlaceIds.has(placeId)) {
          // Bỏ qua check selectedPlaceIdSet nếu đây là fallback để tránh rỗng lịch trình
        } else {
          continue;
        }
      }

      usedPlaceIds.add(placeId);

      destinations.push({
        tripId,
        placeId,
        dayNumber,
        order: Math.max(toInt(dest?.order, index + 1), 1),
        startTime: dest?.startTime ?? null,
        endTime: dest?.endTime ?? null,
        durationMinutes: toInt(dest?.durationMinutes, null),
        note: dest?.note ?? null,
        transportToNext: dest?.transportToNext ?? null,
        distanceToNext: Number.isFinite(Number(dest?.distanceToNext))
          ? Number(dest.distanceToNext)
          : null,
        estimatedCost: Number.isFinite(Number(dest?.estimatedCost))
          ? Math.round(Number(dest.estimatedCost))
          : null,
        status: "planned",
      });
    }
  }

  return destinations;
};

const toKm2 = (meters) => {
  const value = Number(meters);
  if (!Number.isFinite(value) || value < 0) return null;
  return Number((value / 1000).toFixed(2));
};

const enrichItineraryWithRouting = async ({
  itinerary,
  placeById,
  selectedPlaceIdSet,
}) => {
  const clonedItinerary = {
    ...itinerary,
    days: (itinerary?.days || []).map((day) => ({
      ...day,
      destinations: (day?.destinations || []).map((dest) => ({ ...dest })),
    })),
  };

  let totalDistanceMeters = 0;
  let totalDurationSeconds = 0;
  const legSummaries = [];

  for (const day of clonedItinerary.days) {
    const dayDestinations = (day?.destinations || []).filter((dest) => {
      const placeId = toInt(dest?.placeId);
      if (!placeId || !placeById.has(placeId)) return false;
      if (selectedPlaceIdSet?.size && !selectedPlaceIdSet.has(placeId)) {
        return false;
      }
      return true;
    });

    for (let i = 0; i < dayDestinations.length; i += 1) {
      dayDestinations[i].distanceToNext = null;
    }

    for (let i = 0; i < dayDestinations.length - 1; i += 1) {
      const fromDest = dayDestinations[i];
      const toDest = dayDestinations[i + 1];
      const fromPlace = placeById.get(toInt(fromDest.placeId));
      const toPlace = placeById.get(toInt(toDest.placeId));
      if (!fromPlace || !toPlace) continue;

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
      if (!route) continue;

      totalDistanceMeters += Number(route.distance || 0);
      totalDurationSeconds += Number(route.duration || 0);
      fromDest.distanceToNext = toKm2(route.distance);

      legSummaries.push({
        dayNumber: day.dayNumber,
        fromPlaceId: fromPlace.id,
        toPlaceId: toPlace.id,
        distance: Number(route.distance || 0),
        duration: Number(route.duration || 0),
        source: routeResult?.source || "osrm",
      });
    }
  }

  return {
    itinerary: clonedItinerary,
    tripRoutingSummary: {
      totalDistance: totalDistanceMeters,
      totalDistanceKm: toKm2(totalDistanceMeters),
      totalDuration: totalDurationSeconds,
      legs: legSummaries,
    },
  };
};

const buildFallbackDestinationsFromSelection = ({
  tripId,
  selectedPlaceIds,
  totalDays,
}) => {
  const safeIds = Array.isArray(selectedPlaceIds) ? selectedPlaceIds : [];
  const safeTotalDays = Math.max(toInt(totalDays, 1), 1);
  const ordersByDay = new Map();

  return safeIds.map((placeId, index) => {
    const dayNumber = (index % safeTotalDays) + 1;
    const nextOrder = (ordersByDay.get(dayNumber) ?? 0) + 1;
    ordersByDay.set(dayNumber, nextOrder);

    return {
      tripId,
      placeId,
      dayNumber,
      order: nextOrder,
      startTime: null,
      endTime: null,
      durationMinutes: null,
      note: "Địa điểm được chọn trước khi chốt lịch trình",
      transportToNext: null,
      estimatedCost: null,
      status: "planned",
    };
  });
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

  return saved.map((s) => ({ ...s.trip, savedAt: s.createdAt }));
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

  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const generateAndSaveTrip = async (userId, preferences = {}) => {
  const {
    totalDays = 1,
    travelStyle,
    groupSize = 1,
    budget,
    categoryId,
    notes,
    previewOnly = false,
    selectedPlaceIds = [],
    itineraryDraft = null,
  } = preferences;

  const where = { ...approvedPlaceWhere };
  if (categoryId) where.categoryId = toInt(categoryId);

  const places = await prisma.place.findMany({
    where,
    orderBy: [{ ratingAvg: "desc" }, { viewCount: "desc" }],
    take: 50,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      district: { select: { id: true, name: true, code: true } },
      ward: { select: { id: true, name: true, wardType: true } },
      openingHours: {
        orderBy: [{ dayOfWeek: "asc" }],
        select: {
          dayOfWeek: true,
          openTime: true,
          closeTime: true,
          isClosed: true,
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
      images: {
        take: 1,
        orderBy: [{ isCover: "desc" }],
        select: { imageData: true },
      },
    },
  });

  if (places.length === 0) {
    const error = new Error("Khong co dia diem nao phu hop voi yeu cau");
    error.statusCode = 404;
    throw error;
  }

  const placeById = new Map(places.map((place) => [place.id, place]));
  const placeIdSet = new Set(placeById.keys());

  let rawItinerary =
    itineraryDraft && typeof itineraryDraft === "object"
      ? itineraryDraft
      : null;

  if (!rawItinerary) {
    const startTime = Date.now();
    let aiResult;
    let isSuccessful = true;
    let errorMessage = null;

    try {
      aiResult = await generateItinerary(preferences, places);
    } catch (err) {
      const errorCode = err?.errorCode || err?.code || "AI_ERROR";
      const allowFallback =
        errorCode === "QUOTA_EXCEEDED" || errorCode === "AI_UNAVAILABLE";

      if (allowFallback) {
        aiResult = {
          parsed: generateFallbackItinerary(preferences, places),
          raw: null,
          tokensUsed: null,
          responseTimeMs: Date.now() - startTime,
        };
        isSuccessful = false;
        errorMessage = `${errorCode}: ${err?.message}`;
      } else {
        isSuccessful = false;
        errorMessage = err?.message;
        throw err;
      }
    } finally {
      await prisma.aiPromptHistory
        .create({
          data: {
            userId,
            promptType: "trip_itinerary",
            promptText: JSON.stringify(preferences),
            contextData: {
              placesCount: places.length,
              travelStyle,
              totalDays,
              previewOnly: !!previewOnly,
            },
            responseText: aiResult?.raw ?? null,
            responseParsed: aiResult?.parsed ?? null,
            modelUsed: aiResult?.raw
              ? GROQ_MODEL
              : "fallback-local",
            tokensUsed: aiResult?.tokensUsed ?? null,
            responseTimeMs: Date.now() - startTime,
            isSuccessful,
            errorMessage,
          },
        })
        .catch(() => {});
    }

    rawItinerary = aiResult?.parsed ?? null;
  }

  let itinerary = normalizeItinerary(rawItinerary, totalDays);
  if (itinerary.days.length === 0) {
    itinerary = normalizeItinerary(
      generateFallbackItinerary(preferences, places),
      totalDays,
    );
  }

  const suggestedPlaces = buildSuggestedPlaces(itinerary.days, placeById);
  const suggestedPlaceIds = suggestedPlaces.map((place) => place.id);
  const normalizedSelectedPlaceIds = Array.isArray(selectedPlaceIds)
    ? selectedPlaceIds
        .map((id) => toInt(id))
        .filter((id) => id && placeIdSet.has(id))
    : [];

  const effectiveSelectedPlaceIds =
    normalizedSelectedPlaceIds.length > 0
      ? normalizedSelectedPlaceIds
      : suggestedPlaceIds;

  const selectedPlaceIdSet =
    effectiveSelectedPlaceIds.length > 0
      ? new Set(effectiveSelectedPlaceIds)
      : null;

  const { itinerary: enrichedItinerary, tripRoutingSummary } = isRoutingEnabled
    ? await enrichItineraryWithRouting({
        itinerary,
        placeById,
        selectedPlaceIdSet,
      })
    : {
        itinerary,
        tripRoutingSummary: {
          totalDistance: 0,
          totalDistanceKm: null,
          totalDuration: 0,
          legs: [],
        },
      };
  itinerary = enrichedItinerary;

  if (previewOnly) {
    return {
      previewOnly: true,
      itinerary,
      suggestedPlaces,
      selectedPlaceIds: effectiveSelectedPlaceIds,
      tripRoutingSummary,
    };
  }

  const trip = await prisma.$transaction(async (tx) => {
    const created = await tx.trip.create({
      data: {
        userId,
        title: itinerary.title,
        description: itinerary.description ?? null,
        totalDays: itinerary.totalDays,
        totalDistance: tripRoutingSummary?.totalDistanceKm ?? null,
        estimatedCost: itinerary.estimatedCost ?? null,
        travelStyle: travelStyle ?? null,
        groupSize: Math.max(toInt(groupSize, 1), 1),
        isAiGenerated: true,
        aiPrompt: JSON.stringify(preferences),
        status: "planned",
      },
    });

    let allDestinations = buildTripDestinations({
      tripId: created.id,
      days: itinerary.days,
      allowedPlaceIds: placeIdSet,
      selectedPlaceIdSet,
      allPlaces: places,
    });

    if (allDestinations.length === 0 && effectiveSelectedPlaceIds.length > 0) {
      allDestinations = buildFallbackDestinationsFromSelection({
        tripId: created.id,
        selectedPlaceIds: effectiveSelectedPlaceIds,
        totalDays: itinerary.totalDays,
      });
    }

    if (allDestinations.length > 0) {
      await tx.tripDestination.createMany({ data: allDestinations });
    }

    return tx.trip.findUnique({
      where: { id: created.id },
      include: {
        destinations: {
          orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
          include: {
            place: {
              select: {
                id: true,
                name: true,
                address: true,
                latitude: true,
                longitude: true,
                category: { select: { id: true, name: true } },
                district: { select: { id: true, name: true, code: true } },
                ward: { select: { id: true, name: true, wardType: true } },
                images: {
                  take: 1,
                  orderBy: [{ isCover: "desc" }],
                  select: { imageData: true },
                },
              },
            },
          },
        },
      },
    });
  });

  return {
    ...trip,
    tripRoutingSummary,
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
    ? await bcrypt.hash(data.password, 10)
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
