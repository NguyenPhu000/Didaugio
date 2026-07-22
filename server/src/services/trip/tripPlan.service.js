import prisma from "../../config/prismaClient.js";
import {
  BOOKING_STATUS,
  BOOKING_TRIP_LINK_STATUS,
  DOMAIN_JOB_TYPES,
  PAYMENT_STATUS,
  TRIP_BOOKING_ATTACH_MODE,
  TRIP_DATE_RANGE_MODE,
  TRIP_PLAN_SOURCE,
  TRIP_PLAN_STATUS,
  TRIP_STOP_FULFILLMENT_STATUS,
  isAdminOrSuperAdminRole,
} from "../../config/constants.js";
import ServiceError from "../../utils/serviceError.js";
import {
  assertTripAccess,
  CAPABILITIES,
} from "./tripAccessPolicy.service.js";

const TEMP_SEQUENCE_BASE = 100000;

const TRIP_PLAN_PLACE_SELECT = {
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

const serviceError = (message, statusCode, errorCode) =>
  new ServiceError(message, statusCode, errorCode);

export const diffDaysInclusive = (startDate, targetDate) => {
  const start = new Date(startDate);
  const target = new Date(targetDate);
  start.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.floor((target.getTime() - start.getTime()) / 86400000) + 1;
};

const deriveStopFulfillmentStatus = (booking) => {
  if (booking.status === BOOKING_STATUS.CANCELLED) {
    return TRIP_STOP_FULFILLMENT_STATUS.CANCELLED;
  }
  if (booking.status === BOOKING_STATUS.COMPLETED) {
    return TRIP_STOP_FULFILLMENT_STATUS.VISITED;
  }
  if (
    booking.status === BOOKING_STATUS.CONFIRMED ||
    booking.paymentStatus === PAYMENT_STATUS.PAID
  ) {
    return TRIP_STOP_FULFILLMENT_STATUS.SCHEDULED;
  }
  return TRIP_STOP_FULFILLMENT_STATUS.PENDING;
};

const buildDateRangeUpdate = (trip, bookingUseDate) => {
  const bookingDate = new Date(bookingUseDate);
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const nextStartDate = bookingDate < startDate ? bookingDate : startDate;
  const nextEndDate = bookingDate > endDate ? bookingDate : endDate;

  return {
    startDate: nextStartDate,
    endDate: nextEndDate,
    totalDays: diffDaysInclusive(nextStartDate, nextEndDate),
  };
};

const canManageTrip = (trip, actorUserId, actor) => {
  return (
    trip.userId === actorUserId || isAdminOrSuperAdminRole(actor?.roleId)
  );
};

const toLegacyDestination = (stop) => {
  return {
    id: stop.id,
    stopId: stop.id,
    tripId: stop.tripId,
    placeId: stop.placeId,
    dayNumber: stop.dayNumber,
    order: stop.sequence,
    sequence: stop.sequence,
    startTime: stop.arrivalTime,
    endTime: stop.departureTime,
    durationMinutes: stop.durationMinutes,
    note: stop.note,
    transportToNext: stop.transportToNext,
    distanceToNext:
      stop.routeDistanceM == null
        ? null
        : Number((Number(stop.routeDistanceM) / 1000).toFixed(2)),
    estimatedCost: stop.estimatedCost,
    status: stop.fulfillmentStatus,
    visitedAt: stop.fulfilledAt,
    place: stop.place,
    metadata: stop.metadata,
  };
};

const normalizeTripPlanDetail = (tripPlan, { isSaved = false } = {}) => ({
  id: tripPlan.id,
  tripPlanId: tripPlan.id,
  userId: tripPlan.userId,
  title: tripPlan.title,
  description: tripPlan.description,
  thumbnail: tripPlan.coverImage,
  coverImage: tripPlan.coverImage,
  startDate: tripPlan.startDate,
  endDate: tripPlan.endDate,
  totalDays: tripPlan.totalDays,
  totalDistance: tripPlan.totalDistanceM == null ? null : Number((tripPlan.totalDistanceM / 1000).toFixed(2)),
  totalDistanceM: tripPlan.totalDistanceM,
  estimatedCost: tripPlan.estimatedCost,
  travelStyle: tripPlan.metadata?.travelStyle ?? null,
  groupSize: tripPlan.metadata?.groupSize ?? 1,
  isAiGenerated: tripPlan.source === TRIP_PLAN_SOURCE.AI_GENERATED,
  aiPrompt: tripPlan.metadata?.aiPrompt ?? null,
  status: tripPlan.status,
  isPublic: tripPlan.metadata?.isPublic === true,
  viewCount: tripPlan.metadata?.viewCount ?? 0,
  cloneCount: tripPlan.metadata?.cloneCount ?? 0,
  source: tripPlan.source,
  metadata: tripPlan.metadata,
  createdAt: tripPlan.createdAt,
  updatedAt: tripPlan.updatedAt,
  destinations: (tripPlan.stops || []).map(toLegacyDestination),
  stops: tripPlan.stops || [],
  isSaved,
});

const findStopByClientId = (stops, clientId) => {
  const id = Number(clientId);
  if (!Number.isInteger(id) || id <= 0) return null;
  return (
    stops.find((stop) => Number(stop.id) === id) || null
  );
};

const getNextStopSequence = async (tx, { tripId, dayNumber }) => {
  const lastStop = await tx.tripStop.findFirst({
    where: { tripId, dayNumber },
    orderBy: { sequence: "desc" },
    select: { sequence: true },
  });

  return (lastStop?.sequence ?? 0) + 1;
};

const enqueueRouteRebuildTx = async (tx, { tripId, actorUserId, reason }) => {
  await tx.domainJob.create({
    data: {
      type: DOMAIN_JOB_TYPES.REBUILD_ROUTE_METRICS,
      aggregate: "TripPlan",
      aggregateId: tripId,
      payload: {
        tripId,
        actorUserId,
        reason,
      },
    },
  });
};

export const makeTripPlanService = (prismaClient = prisma) => {
  const getTripPlanWithStops = (tx, tripPlanId) =>
    tx.tripPlan.findUnique({
      where: { id: tripPlanId },
      include: {
        stops: {
          orderBy: [{ dayNumber: "asc" }, { sequence: "asc" }],
          include: { place: { select: TRIP_PLAN_PLACE_SELECT } },
        },
      },
    });

  /* Legacy request-time resolver retained only in git history; disabled by the
     canonical cutover. The executable resolver is defined below this block.
  const createShadowTripPlan = async (tx, legacyTrip) => {
    const startDate = legacyTrip.startDate || new Date();
    const endDate = legacyTrip.endDate || startDate;
    const plan = await tx.tripPlan.create({
      data: {
        userId: legacyTrip.userId,
        title: legacyTrip.title,
        description: legacyTrip.description,
        coverImage: legacyTrip.thumbnail,
        startDate,
        endDate,
        totalDays: legacyTrip.totalDays || 1,
        status: legacyTrip.status === TRIP_PLAN_STATUS.COMPLETED
          ? TRIP_PLAN_STATUS.COMPLETED
          : TRIP_PLAN_STATUS.PLANNED,
        source: legacyTrip.isAiGenerated
          ? TRIP_PLAN_SOURCE.AI_GENERATED
          : TRIP_PLAN_SOURCE.IMPORTED,
        estimatedCost: legacyTrip.estimatedCost,
        totalDistanceM:
          legacyTrip.totalDistance == null
            ? null
            : Math.round(Number(legacyTrip.totalDistance) * 1000),
        metadata: {
          legacyTripId: legacyTrip.id,
          createdFor: "mobile_contract_compat",
        },
      },
    });

    if (legacyTrip.destinations?.length) {
      // Normalize sequence trong trường hợp legacy data có cặp (dayNumber, order) trùng nhau
      const seenKeys = new Map();
      const stopsData = legacyTrip.destinations.map((dest) => {
        const dayNum = dest.dayNumber ?? 1;
        const rawSeq = dest.order ?? 0;
        const key = `${dayNum}`;
        const usedSeqs = seenKeys.get(key) ?? new Set();
        let seq = rawSeq;
        while (usedSeqs.has(seq)) seq += 1;
        usedSeqs.add(seq);
        seenKeys.set(key, usedSeqs);
        return {
          tripId: plan.id,
          placeId: dest.placeId,
          dayNumber: dayNum,
          sequence: seq,
          note: dest.note,
          arrivalTime: dest.startTime,
          departureTime: dest.endTime,
          durationMinutes: dest.durationMinutes,
          estimatedCost: dest.estimatedCost,
          transportToNext: dest.transportToNext,
          routeDistanceM:
            dest.distanceToNext == null
              ? null
              : Math.round(Number(dest.distanceToNext) * 1000),
          fulfillmentStatus:
            dest.status === "visited"
              ? TRIP_STOP_FULFILLMENT_STATUS.VISITED
              : TRIP_STOP_FULFILLMENT_STATUS.PENDING,
          fulfilledAt: dest.visitedAt,
          metadata: { legacyDestinationId: dest.id },
        };
      });

      await tx.tripStop.createMany({ data: stopsData, skipDuplicates: true });
    }

    return getTripPlanWithStops(tx, plan.id);
  };

  const resolveTripPlan = async (
    tx,
    { tripId, actorUserId, includeStops = false, capability = CAPABILITIES.EDIT },
  ) => {
    let tripPlan = await tx.tripPlan.findFirst({
      where: { id: tripId },
      ...(includeStops
        ? {
            include: {
              stops: {
                orderBy: [{ dayNumber: "asc" }, { sequence: "asc" }],
                include: { place: { select: TRIP_PLAN_PLACE_SELECT } },
              },
            },
          }
        : {}),
    });

    // Hard cutover: only TripPlan.id is accepted. Migration/backfill is offline.
    assertTripAccess(actorUserId, tripPlan, capability);
    return { tripPlan, legacyTrip: null };

    if (tripPlan) {
      return { tripPlan, legacyTrip: null };
    }

    tripPlan = await tx.tripPlan.findFirst({
      where: {
        userId: actorUserId,
        metadata: { path: ["legacyTripId"], equals: tripId },
      },
      ...(includeStops
        ? {
            include: {
              stops: {
                orderBy: [{ dayNumber: "asc" }, { sequence: "asc" }],
                include: { place: { select: TRIP_PLAN_PLACE_SELECT } },
              },
            },
          }
        : {}),
    });

    const legacyTrip = await tx.trip.findFirst({
      where: { id: tripId, userId: actorUserId },
      include: {
        destinations: {
          orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
          include: { place: { select: TRIP_PLAN_PLACE_SELECT } },
        },
      },
    });

    if (tripPlan) {
      return {
        tripPlan: includeStops ? tripPlan : await getTripPlanWithStops(tx, tripPlan.id),
        legacyTrip,
      };
    }

    if (!legacyTrip) {
      return { tripPlan: null, legacyTrip: null };
    }

    try {
      return {
        tripPlan: await createShadowTripPlan(tx, legacyTrip),
        legacyTrip,
      };
    } catch (err) {
      // Race condition: một transaction đồng thời đã tạo shadow plan trước.
      // Bắt P2002 (unique_constraint) và fallback fetch plan đã được tạo.
      if (err?.code === "P2002") {
        const existingPlan = await tx.tripPlan.findFirst({
          where: {
            userId: actorUserId,
            metadata: { path: ["legacyTripId"], equals: tripId },
          },
          include: {
            stops: {
              orderBy: [{ dayNumber: "asc" }, { sequence: "asc" }],
              include: { place: { select: TRIP_PLAN_PLACE_SELECT } },
            },
          },
        });
        return { tripPlan: existingPlan, legacyTrip };
      }
      throw err;
    }
  };

  */

  const resolveTripPlan = async (
    tx,
    { tripId, actorUserId, includeStops = false, capability = CAPABILITIES.EDIT },
  ) => {
    const tripPlan = await tx.tripPlan.findUnique({
      where: { id: tripId },
      ...(includeStops ? { include: { stops: {
        orderBy: [{ dayNumber: "asc" }, { sequence: "asc" }],
        include: { place: { select: TRIP_PLAN_PLACE_SELECT } },
      } } } : {}),
    });
    assertTripAccess(actorUserId, tripPlan, capability);
    return { tripPlan };
  };

  const getTripDetail = async ({ tripId, actorUserId }) =>
    prismaClient.$transaction(async (tx) => {
      const { tripPlan, legacyTrip } = await resolveTripPlan(tx, {
        tripId,
        actorUserId,
        includeStops: true,
        capability: CAPABILITIES.VIEW,
      });

      if (!tripPlan) return null;

      const saved = actorUserId == null ? null : await tx.savedTrip.findUnique({
        where: { userId_tripId: { userId: actorUserId, tripId: tripPlan.id } },
      });

      return normalizeTripPlanDetail(tripPlan, { isSaved: !!saved });
    });

  const linkBookingToTrip = async ({
    bookingId,
    tripId,
    actorUserId,
    attachMode = TRIP_BOOKING_ATTACH_MODE.CREATE_STOP_IF_MISSING,
    dateRangeMode = TRIP_DATE_RANGE_MODE.REJECT_OUTSIDE_RANGE,
  }) =>
    prismaClient.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          service: { select: { id: true, placeId: true, businessId: true } },
          tripLink: true,
        },
      });

      if (!booking) {
        throw serviceError("Không tìm thấy booking", 404, "BOOKING_NOT_FOUND");
      }

      const trip = await tx.tripPlan.findUnique({
        where: { id: tripId },
        include: {
          stops: {
            select: {
              id: true,
              placeId: true,
              dayNumber: true,
              fulfillmentStatus: true,
            },
          },
        },
      });

      if (!trip) {
        throw serviceError("Không tìm thấy chuyến đi", 404, "TRIP_NOT_FOUND");
      }

      const actor = await tx.user.findUnique({
        where: { id: actorUserId },
        select: {
          id: true,
          roleId: true,
          role: { select: { name: true } },
        },
      });

      if (!canManageTrip(trip, actorUserId, actor)) {
        throw serviceError(
          "Bạn không có quyền truy cập chuyến đi này",
          403,
          "TRIP_FORBIDDEN",
        );
      }

      if (booking.userId !== trip.userId) {
        throw serviceError(
          "Người sở hữu booking không khớp với chủ chuyến đi",
          400,
          "BOOKING_OWNER_MISMATCH",
        );
      }

      if (!booking.service?.placeId) {
        throw serviceError(
          "Dịch vụ trong booking chưa được gắn với địa điểm",
          400,
          "BOOKING_PLACE_MISSING",
        );
      }

      let effectiveTrip = trip;
      let computedDayNumber = diffDaysInclusive(trip.startDate, booking.useDate);
      const isOutsideRange =
        computedDayNumber < 1 || computedDayNumber > trip.totalDays;

      if (
        isOutsideRange &&
        dateRangeMode === TRIP_DATE_RANGE_MODE.REJECT_OUTSIDE_RANGE
      ) {
        throw serviceError(
          "Ngày sử dụng booking nằm ngoài thời gian của chuyến đi",
          400,
          "BOOKING_OUTSIDE_TRIP_RANGE",
        );
      }

      if (
        isOutsideRange &&
        dateRangeMode === TRIP_DATE_RANGE_MODE.EXPAND_TRIP_RANGE
      ) {
        const rangeUpdate = buildDateRangeUpdate(trip, booking.useDate);
        effectiveTrip = await tx.tripPlan.update({
          where: { id: trip.id },
          data: rangeUpdate,
          include: {
            stops: {
              select: {
                id: true,
                placeId: true,
                dayNumber: true,
                fulfillmentStatus: true,
              },
            },
          },
        });
        computedDayNumber = diffDaysInclusive(
          effectiveTrip.startDate,
          booking.useDate,
        );
      }

      let matchedStop = null;
      let stopCreated = false;

      if (computedDayNumber >= 1 && computedDayNumber <= effectiveTrip.totalDays) {
        const candidates = effectiveTrip.stops.filter(
          (stop) =>
            stop.placeId === booking.service.placeId &&
            stop.dayNumber === computedDayNumber,
        );

        if (candidates.length === 1) {
          [matchedStop] = candidates;
        }
      }

      if (
        !matchedStop &&
        attachMode === TRIP_BOOKING_ATTACH_MODE.CREATE_STOP_IF_MISSING
      ) {
        const nextSequence = await getNextStopSequence(tx, {
          tripId: effectiveTrip.id,
          dayNumber: computedDayNumber,
        });

        matchedStop = await tx.tripStop.create({
          data: {
            tripId: effectiveTrip.id,
            placeId: booking.service.placeId,
            dayNumber: computedDayNumber,
            sequence: nextSequence,
            plannedDate: booking.useDate,
            arrivalTime: booking.useTime,
            departureTime: booking.endTimeStr,
            fulfillmentStatus: deriveStopFulfillmentStatus(booking),
            metadata: {
              createdFromBookingId: booking.id,
              createdFromBookingCode: booking.bookingCode,
            },
          },
          select: {
            id: true,
            placeId: true,
            dayNumber: true,
            fulfillmentStatus: true,
          },
        });
        stopCreated = true;
      }

      const link = await tx.bookingTripLink.upsert({
        where: { bookingId: booking.id },
        create: {
          bookingId: booking.id,
          tripId: effectiveTrip.id,
          stopId: matchedStop?.id ?? null,
          linkedById: actorUserId,
          status: BOOKING_TRIP_LINK_STATUS.LINKED,
          metadata: {
            linkedFrom: "manual_or_business_rule",
            bookingStatus: booking.status,
            paymentStatus: booking.paymentStatus,
          },
        },
        update: {
          tripId: effectiveTrip.id,
          stopId: matchedStop?.id ?? null,
          linkedById: actorUserId,
          status: BOOKING_TRIP_LINK_STATUS.LINKED,
          unlinkedAt: null,
          metadata: {
            relinkedAt: new Date().toISOString(),
            bookingStatus: booking.status,
            paymentStatus: booking.paymentStatus,
          },
        },
        select: {
          bookingId: true,
          tripId: true,
          stopId: true,
          status: true,
        },
      });

      if (link.stopId) {
        await tx.tripStop.update({
          where: { id: link.stopId },
          data: {
            fulfillmentStatus: deriveStopFulfillmentStatus(booking),
          },
        });
      }

      if (stopCreated) {
        await enqueueRouteRebuildTx(tx, {
          tripId: effectiveTrip.id,
          actorUserId,
          reason: "booking_link_created_stop",
        });
      }

      return {
        bookingId: link.bookingId,
        tripId: link.tripId,
        stopId: link.stopId,
        linkStatus: link.status,
        stopCreated,
      };
    });

  const reorderDestinations = async ({ tripId, actorUserId, updates }) =>
    prismaClient.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM trip_plans WHERE id = ${tripId} FOR UPDATE`;

      const trip = await tx.tripPlan.findUnique({
        where: { id: tripId },
        select: { id: true, userId: true, totalDays: true },
      });

      if (!trip) {
        throw serviceError("Không tìm thấy chuyến đi", 404, "TRIP_NOT_FOUND");
      }

      const actor = await tx.user.findUnique({
        where: { id: actorUserId },
        select: {
          id: true,
          roleId: true,
          role: { select: { name: true } },
        },
      });

      if (!canManageTrip(trip, actorUserId, actor)) {
        throw serviceError(
          "Bạn không có quyền truy cập chuyến đi này",
          403,
          "TRIP_FORBIDDEN",
        );
      }

      for (const item of updates) {
        if (item.dayNumber > trip.totalDays) {
          throw serviceError(
            "Ngày sắp xếp vượt quá thời gian của chuyến đi",
            400,
            "TRIP_DAY_OUT_OF_RANGE",
          );
        }
      }

      const stopIds = updates.map((item) => item.stopId);
      const existingStops = await tx.tripStop.findMany({
        where: {
          id: { in: stopIds },
          tripId,
        },
        select: {
          id: true,
          dayNumber: true,
          sequence: true,
        },
      });

      if (existingStops.length !== updates.length) {
        throw serviceError(
          "Một hoặc nhiều điểm dừng không thuộc chuyến đi này",
          400,
          "TRIP_STOP_MISMATCH",
        );
      }

      for (let index = 0; index < existingStops.length; index += 1) {
        const stop = existingStops[index];
        await tx.tripStop.update({
          where: { id: stop.id },
          data: { sequence: TEMP_SEQUENCE_BASE + index + 1 },
        });
      }

      for (const item of updates) {
        await tx.tripStop.update({
          where: { id: item.stopId },
          data: {
            dayNumber: item.dayNumber,
            sequence: item.sequence,
          },
        });
      }

      await enqueueRouteRebuildTx(tx, {
        tripId,
        actorUserId,
        reason: "trip_stop_reordered",
      });

      return {
        tripId,
        updatedCount: updates.length,
        routeRebuildQueued: true,
      };
    });

  const reorderClientDestinations = async ({
    tripId,
    actorUserId,
    dayNumber,
    orderedIds,
  }) => {
    const { tripPlan } = await prismaClient.$transaction((tx) =>
      resolveTripPlan(tx, { tripId, actorUserId, includeStops: true }),
    );

    if (!tripPlan) {
      throw serviceError("Khong tim thay chuyen di", 404, "TRIP_NOT_FOUND");
    }

    const dayStops = tripPlan.stops.filter(
      (stop) => Number(stop.dayNumber) === Number(dayNumber),
    );
    const updates = orderedIds.map((id, index) => {
      const stop = findStopByClientId(dayStops, id);
      if (!stop) {
        throw serviceError(
          "Mot hoac nhieu diem dung khong thuoc chuyen di nay",
          400,
          "TRIP_STOP_MISMATCH",
        );
      }
      return {
        stopId: stop.id,
        dayNumber: Number(dayNumber),
        sequence: index + 1,
      };
    });

    await reorderDestinations({
      tripId: tripPlan.id,
      actorUserId,
      updates,
    });

    const refreshed = await getTripDetail({ tripId, actorUserId });
    return refreshed?.destinations?.filter(
      (dest) => Number(dest.dayNumber) === Number(dayNumber),
    ) || [];
  };

  const moveClientDestination = async ({
    tripId,
    actorUserId,
    destinationId,
    newDayNumber,
    newOrder = 0,
    startTime,
    endTime,
    note,
  }) => {
    const { tripPlan } = await prismaClient.$transaction((tx) =>
      resolveTripPlan(tx, { tripId, actorUserId, includeStops: true }),
    );

    if (!tripPlan) {
      throw serviceError("Khong tim thay chuyen di", 404, "TRIP_NOT_FOUND");
    }

    const stop = findStopByClientId(tripPlan.stops, destinationId);
    if (!stop) {
      throw serviceError("Khong tim thay dia diem", 404, "TRIP_STOP_NOT_FOUND");
    }

    const targetDayNumber = Number(newDayNumber);
    const targetIndex = Math.max(Number(newOrder) || 0, 0);
    const targetDayStops = tripPlan.stops
      .filter(
        (item) =>
          Number(item.dayNumber) === targetDayNumber &&
          Number(item.id) !== Number(stop.id),
      )
      .sort((a, b) => a.sequence - b.sequence);
    targetDayStops.splice(Math.min(targetIndex, targetDayStops.length), 0, stop);

    await reorderDestinations({
      tripId: tripPlan.id,
      actorUserId,
      updates: targetDayStops.map((item, index) => ({
        stopId: item.id,
        dayNumber: targetDayNumber,
        sequence: index + 1,
      })),
    });

    const data = {};
    if (startTime !== undefined) data.arrivalTime = startTime;
    if (endTime !== undefined) data.departureTime = endTime;
    if (note !== undefined) data.note = note;
    if (Object.keys(data).length > 0) {
      await prismaClient.tripStop.update({
        where: { id: stop.id },
        data,
      });
    }

    const refreshed = await getTripDetail({ tripId, actorUserId });
    return refreshed?.destinations?.find(
      (dest) => Number(dest.stopId) === Number(stop.id),
    ) || null;
  };

  const removeClientDestination = async ({ tripId, actorUserId, destinationId }) => {
    const { tripPlan } = await prismaClient.$transaction((tx) =>
      resolveTripPlan(tx, { tripId, actorUserId, includeStops: true }),
    );

    if (!tripPlan) {
      throw serviceError("Không tìm thấy chuyến đi", 404, "TRIP_NOT_FOUND");
    }

    const stop = findStopByClientId(tripPlan.stops, destinationId);
    if (!stop) {
      throw serviceError("Không tìm thấy địa điểm", 404, "TRIP_STOP_NOT_FOUND");
    }

    await prismaClient.$transaction(async (tx) => {
      await tx.bookingTripLink.deleteMany({
        where: { stopId: stop.id },
      });

      await tx.tripStop.delete({
        where: { id: stop.id },
      });

      const remainingDayStops = tripPlan.stops
        .filter(
          (item) =>
            Number(item.dayNumber) === Number(stop.dayNumber) &&
            Number(item.id) !== Number(stop.id),
        )
        .sort((a, b) => a.sequence - b.sequence);

      for (let index = 0; index < remainingDayStops.length; index += 1) {
        await tx.tripStop.update({
          where: { id: remainingDayStops[index].id },
          data: { sequence: index + 1 },
        });
      }

      await enqueueRouteRebuildTx(tx, {
        tripId: tripPlan.id,
        actorUserId,
        reason: "trip_stop_removed",
      });
    });

    return true;
  };

  const updateClientDestination = async ({ tripId, actorUserId, destinationId, data }) => {
    const { tripPlan } = await prismaClient.$transaction((tx) =>
      resolveTripPlan(tx, { tripId, actorUserId, includeStops: true }),
    );

    if (!tripPlan) {
      throw serviceError("Không tìm thấy chuyến đi", 404, "TRIP_NOT_FOUND");
    }

    const stop = findStopByClientId(tripPlan.stops, destinationId);
    if (!stop) {
      throw serviceError("Không tìm thấy địa điểm", 404, "TRIP_STOP_NOT_FOUND");
    }

    const updateData = {};
    if (data.startTime !== undefined) updateData.arrivalTime = data.startTime;
    if (data.endTime !== undefined) updateData.departureTime = data.endTime;
    if (data.durationMinutes !== undefined) updateData.durationMinutes = parseInt(data.durationMinutes, 10);
    if (data.note !== undefined) updateData.note = data.note;
    if (data.transportToNext !== undefined) updateData.transportToNext = data.transportToNext;
    if (data.distanceToNext !== undefined) {
      updateData.routeDistanceM = data.distanceToNext !== null ? Math.round(Number(data.distanceToNext) * 1000) : null;
    }

    const updatedStop = await prismaClient.tripStop.update({
      where: { id: stop.id },
      data: updateData,
      include: { place: { select: TRIP_PLAN_PLACE_SELECT } },
    });

    await prismaClient.$transaction(async (tx) => {
      await enqueueRouteRebuildTx(tx, {
        tripId: tripPlan.id,
        actorUserId,
        reason: "trip_stop_updated",
      });
    });

    return toLegacyDestination(updatedStop);
  };

  const addClientDestination = async (tripId, actorUserId, {
    placeId,
    dayNumber = 1,
    order = 0,
    note,
    startTime,
    endTime,
    transportToNext,
    distanceToNext,
  }) => {
    const { tripPlan } = await prismaClient.$transaction((tx) =>
      resolveTripPlan(tx, { tripId, actorUserId, includeStops: true }),
    );

    if (!tripPlan) {
      throw serviceError("Không tìm thấy chuyến đi", 404, "TRIP_NOT_FOUND");
    }

    const targetDayNumber = Number(dayNumber);
    const nextSequence = await getNextStopSequence(prismaClient, {
      tripId: tripPlan.id,
      dayNumber: targetDayNumber,
    });

    const createdStop = await prismaClient.tripStop.create({
      data: {
        tripId: tripPlan.id,
        placeId: Number(placeId),
        dayNumber: targetDayNumber,
        sequence: nextSequence,
        arrivalTime: startTime ?? null,
        departureTime: endTime ?? null,
        durationMinutes: 60,
        note: note ?? null,
        transportToNext: transportToNext ?? null,
        routeDistanceM: distanceToNext !== undefined && distanceToNext !== null ? Math.round(Number(distanceToNext) * 1000) : null,
        fulfillmentStatus: TRIP_STOP_FULFILLMENT_STATUS.PENDING,
      },
      include: { place: { select: TRIP_PLAN_PLACE_SELECT } },
    });

    await prismaClient.$transaction(async (tx) => {
      await enqueueRouteRebuildTx(tx, {
        tripId: tripPlan.id,
        actorUserId,
        reason: "trip_stop_added",
      });
    });

    return toLegacyDestination(createdStop);
  };

  return {
    getTripDetail,
    linkBookingToTrip,
    reorderDestinations,
    reorderClientDestinations,
    moveClientDestination,
    removeClientDestination,
    updateClientDestination,
    addClientDestination,
  };
};

export const tripPlanService = makeTripPlanService();
export const getTripDetail = tripPlanService.getTripDetail;
export const linkBookingToTrip = tripPlanService.linkBookingToTrip;
export const reorderDestinations = tripPlanService.reorderDestinations;
export const reorderClientDestinations = tripPlanService.reorderClientDestinations;
export const moveClientDestination = tripPlanService.moveClientDestination;
export const removeClientDestination = tripPlanService.removeClientDestination;
export const updateClientDestination = tripPlanService.updateClientDestination;
export const addClientDestination = tripPlanService.addClientDestination;

export default tripPlanService;
