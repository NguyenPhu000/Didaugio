import prisma from "../../config/prismaClient.js";
import ServiceError from "../../utils/serviceError.js";

const TEMP_SEQUENCE_BASE = 100000;
const ADMIN_ROLE_NAMES = new Set(["admin", "superadmin", "super_admin"]);

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
  if (booking.status === "cancelled") return "cancelled";
  if (booking.status === "completed") return "visited";
  if (booking.status === "confirmed" || booking.paymentStatus === "paid") {
    return "scheduled";
  }
  return "pending";
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
  const roleName = actor?.role?.name?.toLowerCase?.();
  return trip.userId === actorUserId || ADMIN_ROLE_NAMES.has(roleName);
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
      type: "RebuildRouteMetrics",
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
  const linkBookingToTrip = async ({
    bookingId,
    tripId,
    actorUserId,
    attachMode = "create_stop_if_missing",
    dateRangeMode = "reject_outside_range",
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

      if (isOutsideRange && dateRangeMode === "reject_outside_range") {
        throw serviceError(
          "Ngày sử dụng booking nằm ngoài thời gian của chuyến đi",
          400,
          "BOOKING_OUTSIDE_TRIP_RANGE",
        );
      }

      if (isOutsideRange && dateRangeMode === "expand_trip_range") {
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

      if (!matchedStop && attachMode === "create_stop_if_missing") {
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
          status: "linked",
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
          status: "linked",
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

  return {
    linkBookingToTrip,
    reorderDestinations,
  };
};

export const tripPlanService = makeTripPlanService();
export const linkBookingToTrip = tripPlanService.linkBookingToTrip;
export const reorderDestinations = tripPlanService.reorderDestinations;

export default tripPlanService;
