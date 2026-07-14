import test from "node:test";
import assert from "node:assert/strict";
import {
  buildActiveCompanionSummary,
  buildEventCheckInSummary,
  buildTripDestinationCloneRows,
  calculateDistanceMeters,
  resolveTripCloneThumbnail,
  validateEventCheckInTarget,
} from "../event.service.js";

test("buildActiveCompanionSummary counts active sessions by place", () => {
  const summary = buildActiveCompanionSummary([
    { placeId: 10 },
    { placeId: 10 },
    { placeId: 11 },
    { placeId: null },
    {},
  ]);

  assert.deepEqual(summary.byPlace, { 10: 2, 11: 1 });
  assert.equal(summary.total, 3);
});

test("buildTripDestinationCloneRows clones TripPlan stops when legacy destinations are empty", () => {
  const rows = buildTripDestinationCloneRows({
    tripId: 99,
    destinations: [],
    stops: [
      {
        placeId: 10,
        dayNumber: 2,
        sequence: 3,
        arrivalTime: "08:00",
        departureTime: "09:00",
        durationMinutes: 60,
        note: "Breakfast",
        transportToNext: "bike",
        routeDistanceM: 1250,
        estimatedCost: 50000,
      },
    ],
  });

  assert.deepEqual(rows, [
    {
      tripId: 99,
      placeId: 10,
      dayNumber: 2,
      order: 3,
      startTime: "08:00",
      endTime: "09:00",
      durationMinutes: 60,
      note: "Breakfast",
      transportToNext: "bike",
      distanceToNext: 1.25,
      estimatedCost: 50000,
      status: "planned",
    },
  ]);
});

test("resolveTripCloneThumbnail falls back to TripPlan cover and first place image", () => {
  assert.equal(
    resolveTripCloneThumbnail({
      event: { thumbnail: "event.jpg" },
      tripSample: { thumbnail: "sample.jpg" },
      tripPlan: { coverImage: "cover.jpg" },
    }),
    "event.jpg",
  );

  assert.equal(
    resolveTripCloneThumbnail({
      tripSample: { thumbnail: "sample.jpg" },
      tripPlan: { coverImage: "cover.jpg" },
    }),
    "sample.jpg",
  );

  assert.equal(
    resolveTripCloneThumbnail({
      tripSample: {},
      tripPlan: {
        coverImage: null,
        stops: [
          {
            place: {
              thumbnail: null,
              images: [{ secureUrl: "place.jpg" }],
            },
          },
        ],
      },
    }),
    "place.jpg",
  );
});

test("buildEventCheckInSummary returns personal progress and per-place counts", () => {
  const destinations = [
    { placeId: 10, place: { id: 10, name: "Cho noi" } },
    { placeId: 11, place: { id: 11, name: "Ben Ninh Kieu" } },
    { placeId: 12, place: { id: 12, name: "Con Son" } },
  ];
  const moments = [
    { placeId: 10, userId: 7 },
    { placeId: 10, userId: 8 },
    { placeId: 12, userId: 7 },
  ];

  const summary = buildEventCheckInSummary({ destinations, moments, userId: 7 });

  assert.deepEqual(summary.myCheckedInPlaceIds, [10, 12]);
  assert.equal(summary.personal.checkedInCount, 2);
  assert.equal(summary.personal.totalDestinations, 3);
  assert.equal(summary.personal.progressPercent, 67);
  assert.deepEqual(summary.byPlace, {
    10: { placeId: 10, totalCheckIns: 2, checkedInByMe: true },
    11: { placeId: 11, totalCheckIns: 0, checkedInByMe: false },
    12: { placeId: 12, totalCheckIns: 1, checkedInByMe: true },
  });
});

test("calculateDistanceMeters uses haversine distance in meters", () => {
  const meters = calculateDistanceMeters(10.0452, 105.7469, 10.0457, 105.7472);
  assert.ok(meters > 60);
  assert.ok(meters < 70);
});

test("validateEventCheckInTarget rejects places outside the event route", () => {
  const destinations = [{ placeId: 10, place: { latitude: 10, longitude: 105 } }];

  assert.throws(
    () => validateEventCheckInTarget({ destinations, placeId: 99 }),
    /khong thuoc su kien/i,
  );
});

test("validateEventCheckInTarget rejects check-in too far from the destination", () => {
  const destinations = [{ placeId: 10, place: { latitude: 10, longitude: 105 } }];

  assert.throws(
    () =>
      validateEventCheckInTarget({
        destinations,
        placeId: 10,
        latitude: 10.02,
        longitude: 105.02,
        radiusMeters: 75,
      }),
    /qua xa/i,
  );
});
