import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BOOKING_LINK_NOTE_RE = /^\[BOOKING_LINK\]\s+([A-Z0-9_-]+)/i;

const mapTripStatus = (status) => {
  switch (status) {
    case "planned":
    case "upcoming":
      return "planned";
    case "in-progress":
      return "active";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    case "draft":
    default:
      return "draft";
  }
};

const mapTripSource = (isAiGenerated) =>
  isAiGenerated ? "ai_generated" : "manual";

const mapStopFulfillmentStatus = (status) => {
  switch (status) {
    case "visited":
    case "completed":
      return "visited";
    case "cancelled":
      return "cancelled";
    case "checked_in":
      return "checked_in";
    case "scheduled":
      return "scheduled";
    case "planned":
    default:
      return "pending";
  }
};

const parseBookingCode = (note) => {
  if (!note) return null;
  const match = String(note).match(BOOKING_LINK_NOTE_RE);
  return match?.[1] ?? null;
};

const dateOrCreated = (date, createdAt) => date ?? createdAt ?? new Date();

const normalizeTripDates = (trip) => {
  const startDate = dateOrCreated(trip.startDate, trip.createdAt);
  const endDate = dateOrCreated(trip.endDate, trip.startDate ?? trip.createdAt);
  return { startDate, endDate };
};

async function migrateTrip(tx, legacyTrip) {
  const { startDate, endDate } = normalizeTripDates(legacyTrip);

  await tx.tripPlan.upsert({
    where: { id: legacyTrip.id },
    create: {
      id: legacyTrip.id,
      userId: legacyTrip.userId,
      title: legacyTrip.title,
      description: legacyTrip.description,
      coverImage: legacyTrip.thumbnail,
      startDate,
      endDate,
      totalDays: legacyTrip.totalDays || 1,
      status: mapTripStatus(legacyTrip.status),
      source: mapTripSource(legacyTrip.isAiGenerated),
      estimatedCost: legacyTrip.estimatedCost,
      totalDistanceM: legacyTrip.totalDistance
        ? Math.round(Number(legacyTrip.totalDistance) * 1000)
        : null,
      metadata: {
        migratedFromTripId: legacyTrip.id,
        aiPrompt: legacyTrip.aiPrompt,
        travelStyle: legacyTrip.travelStyle,
        groupSize: legacyTrip.groupSize,
      },
    },
    update: {},
  });

  const byDay = new Map();
  for (const destination of legacyTrip.destinations) {
    const list = byDay.get(destination.dayNumber) ?? [];
    list.push(destination);
    byDay.set(destination.dayNumber, list);
  }

  for (const [dayNumber, dayStops] of byDay.entries()) {
    const normalized = [...dayStops]
      .sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.id - b.id;
      })
      .map((item, index) => ({
        legacy: item,
        sequence: index + 1,
      }));

    for (const { legacy, sequence } of normalized) {
      const stop = await tx.tripStop.upsert({
        where: {
          tripId_dayNumber_sequence: {
            tripId: legacyTrip.id,
            dayNumber,
            sequence,
          },
        },
        create: {
          tripId: legacyTrip.id,
          placeId: legacy.placeId,
          dayNumber,
          sequence,
          note: legacy.note,
          arrivalTime: legacy.startTime,
          departureTime: legacy.endTime,
          durationMinutes: legacy.durationMinutes,
          estimatedCost: legacy.estimatedCost,
          transportToNext: legacy.transportToNext,
          routeDistanceM: legacy.distanceToNext
            ? Math.round(Number(legacy.distanceToNext) * 1000)
            : null,
          fulfillmentStatus: mapStopFulfillmentStatus(legacy.status),
          fulfilledAt: legacy.visitedAt,
          metadata: {
            migratedFromDestinationId: legacy.id,
          },
        },
        update: {},
        select: { id: true },
      });

      const bookingCode = parseBookingCode(legacy.note);
      if (!bookingCode) continue;

      const booking = await tx.booking.findUnique({
        where: { bookingCode },
        select: { id: true },
      });

      if (!booking) {
        console.warn(
          `[trip-backfill] booking not found for note link: ${bookingCode}`,
        );
        continue;
      }

      await tx.bookingTripLink.upsert({
        where: { bookingId: booking.id },
        create: {
          bookingId: booking.id,
          tripId: legacyTrip.id,
          stopId: stop.id,
          status: "linked",
          metadata: {
            migratedFromDestinationId: legacy.id,
            migratedFromNote: true,
          },
        },
        update: {
          tripId: legacyTrip.id,
          stopId: stop.id,
          status: "linked",
          metadata: {
            migratedFromDestinationId: legacy.id,
            migratedFromNote: true,
            remigratedAt: new Date().toISOString(),
          },
        },
      });
    }
  }
}

async function syncSequences() {
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"trip_plans"', 'id'),
      COALESCE((SELECT MAX(id) FROM "trip_plans"), 1),
      true
    )
  `);
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"trip_stops"', 'id'),
      COALESCE((SELECT MAX(id) FROM "trip_stops"), 1),
      true
    )
  `);
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"booking_trip_links"', 'id'),
      COALESCE((SELECT MAX(id) FROM "booking_trip_links"), 1),
      true
    )
  `);
}

async function main() {
  const legacyTrips = await prisma.trip.findMany({
    include: {
      destinations: {
        orderBy: [{ dayNumber: "asc" }, { order: "asc" }, { id: "asc" }],
      },
    },
  });

  for (const legacyTrip of legacyTrips) {
    await prisma.$transaction((tx) => migrateTrip(tx, legacyTrip), {
      timeout: 30000,
    });
  }

  await syncSequences();
  console.log(`[trip-backfill] migrated ${legacyTrips.length} trip(s)`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error("[trip-backfill] failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
