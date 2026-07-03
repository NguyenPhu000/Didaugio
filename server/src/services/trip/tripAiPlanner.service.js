import prisma from "../../config/prismaClient.js";
import { GROQ_MODEL } from "../ai/groq.service.js";
import {
  generateFallbackItinerary,
  generateItinerary,
} from "../ai/itinerary.service.js";
import routingService from "../routing/routing.service.js";
import { normalizeItinerary } from "../../utils/itineraryFormatter.js";

const MAX_TRIP_SUGGESTED_PLACES = 12;
const isRoutingEnabled =
  String(process.env.ROUTING_ENABLED ?? "true") !== "false";

const approvedPlaceWhere = {
  deletedAt: null,
  status: "approved",
};

const toInt = (value, fallback = null) => {
  const number = parseInt(value, 10);
  return Number.isNaN(number) ? fallback : number;
};

const toKm2 = (meters) => {
  const value = Number(meters);
  if (!Number.isFinite(value) || value < 0) return null;
  return Number((value / 1000).toFixed(2));
};

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
        const fallbackPlace = (Array.isArray(allPlaces) ? allPlaces : []).find(
          (p) => !usedPlaceIds.has(p.id) && allowedPlaceIds.has(p.id),
        );
        if (fallbackPlace) {
          placeId = fallbackPlace.id;
        } else {
          continue;
        }
      }

      if (selectedPlaceIdSet?.size && !selectedPlaceIdSet.has(placeId)) {
        if (usedPlaceIds.has(placeId)) continue;
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
      note: "Dia diem duoc chon truoc khi chot lich trinh",
      transportToNext: null,
      estimatedCost: null,
      status: "planned",
    };
  });
};

export const generateAndSaveTrip = async (userId, preferences = {}) => {
  const {
    totalDays = 1,
    travelStyle,
    groupSize = 1,
    categoryId,
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
        select: { imageData: true, secureUrl: true, thumbnailUrl: true },
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
            modelUsed: aiResult?.raw ? GROQ_MODEL : "fallback-local",
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
    const created = await tx.tripPlan.create({
      data: {
        userId,
        title: itinerary.title,
        description: itinerary.description ?? null,
        startDate: new Date(),
        endDate: new Date(Date.now() + (itinerary.totalDays - 1) * 24 * 60 * 60 * 1000),
        totalDays: itinerary.totalDays,
        totalDistanceM: tripRoutingSummary?.totalDistance ? Math.round(tripRoutingSummary.totalDistance) : null,
        estimatedCost: itinerary.estimatedCost ?? null,
        status: "planned",
        source: "ai_generated",
        metadata: {
          travelStyle: travelStyle ?? null,
          groupSize: Math.max(toInt(groupSize, 1), 1),
          aiPrompt: JSON.stringify(preferences),
        },
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
      const stopsData = allDestinations.map((dest) => ({
        tripId: dest.tripId,
        placeId: dest.placeId,
        dayNumber: dest.dayNumber,
        sequence: dest.order,
        title: null,
        note: dest.note,
        arrivalTime: dest.startTime,
        departureTime: dest.endTime,
        durationMinutes: dest.durationMinutes,
        estimatedCost: dest.estimatedCost,
        transportToNext: dest.transportToNext,
        routeDistanceM: dest.distanceToNext ? Math.round(dest.distanceToNext * 1000) : null,
      }));

      await tx.tripStop.createMany({ data: stopsData });
    }

    const savedPlan = await tx.tripPlan.findUnique({
      where: { id: created.id },
      include: {
        stops: {
          orderBy: [{ dayNumber: "asc" }, { sequence: "asc" }],
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
                  select: {
                    imageData: true,
                    secureUrl: true,
                    thumbnailUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      ...savedPlan,
      destinations: savedPlan.stops.map((stop) => ({
        ...stop,
        order: stop.sequence,
        startTime: stop.arrivalTime,
        endTime: stop.departureTime,
      })),
    };
  });

  return {
    ...trip,
    tripRoutingSummary,
  };
};

export default {
  generateAndSaveTrip,
};
