import Flatbush from "flatbush";
import { distanceMeters } from "./distance";

export const ROUTE_ENGINE_THRESHOLDS = Object.freeze({
  OFF_ROUTE_DISTANCE_M: 50,
  SNAP_SEARCH_RADIUS_M: 80,
  MANEUVER_PASSED_DISTANCE_M: 30,
  MANEUVER_HEADING_DELTA_DEG: 30,
  APPROACHING_DISTANCE_M: 150,
  ARRIVAL_DISTANCE_M: 30,
  ARRIVAL_SPEED_KMH: 5,
  SLIDING_WINDOW_BACK_SEGMENTS: 2,
  SLIDING_WINDOW_FORWARD_SEGMENTS: 15,
  HEADING_SAME_DIRECTION_DEG: 90,
});

const METERS_PER_DEGREE_LAT = 111_320;
const MIN_LNG_COSINE = 0.01;

const toRadians = (value) => (value * Math.PI) / 180;
const toDegrees = (value) => (value * 180) / Math.PI;

export function normalizeCoordinate(point) {
  if (!point) return null;

  if (Array.isArray(point) && point.length >= 2) {
    const lng = Number(point[0]);
    const lat = Number(point[1]);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }

  const lat = Number(point.lat ?? point.latitude);
  const lng = Number(point.lng ?? point.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

export function toMapCoordinate(point) {
  const normalized = normalizeCoordinate(point);
  if (!normalized) return null;
  return {
    latitude: normalized.lat,
    longitude: normalized.lng,
  };
}

export function getDistanceM(p1, p2) {
  const a = normalizeCoordinate(p1);
  const b = normalizeCoordinate(p2);
  if (!a || !b) return Number.POSITIVE_INFINITY;
  return distanceMeters(a.lat, a.lng, b.lat, b.lng);
}

export function calculateBearing(from, to) {
  const a = normalizeCoordinate(from);
  const b = normalizeCoordinate(to);
  if (!a || !b) return null;

  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const deltaLng = toRadians(b.lng - a.lng);
  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

export function normalizeHeadingDelta(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const delta = Math.abs((((a - b) % 360) + 540) % 360 - 180);
  return delta;
}

function getMetersPerDegreeLng(lat) {
  const cosine = Math.max(Math.abs(Math.cos(toRadians(lat))), MIN_LNG_COSINE);
  return METERS_PER_DEGREE_LAT * cosine;
}

function projectToMeters(point, origin) {
  const lngScale = getMetersPerDegreeLng(origin.lat);
  return {
    x: (point.lng - origin.lng) * lngScale,
    y: (point.lat - origin.lat) * METERS_PER_DEGREE_LAT,
  };
}

function unprojectFromMeters(point, origin) {
  const lngScale = getMetersPerDegreeLng(origin.lat);
  return {
    lat: origin.lat + point.y / METERS_PER_DEGREE_LAT,
    lng: origin.lng + point.x / lngScale,
  };
}

export function pointToSegmentDistance(gpsPoint, segmentStart, segmentEnd) {
  const gps = normalizeCoordinate(gpsPoint);
  const a = normalizeCoordinate(segmentStart);
  const b = normalizeCoordinate(segmentEnd);
  if (!gps || !a || !b) {
    return {
      distance: Number.POSITIVE_INFINITY,
      snappedPoint: null,
      projection: 0,
    };
  }

  const p = projectToMeters(gps, gps);
  const start = projectToMeters(a, gps);
  const end = projectToMeters(b, gps);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSq = dx * dx + dy * dy;
  const projection =
    lengthSq > 0
      ? Math.max(0, Math.min(1, ((p.x - start.x) * dx + (p.y - start.y) * dy) / lengthSq))
      : 0;
  const snappedMeters = {
    x: start.x + projection * dx,
    y: start.y + projection * dy,
  };
  const snappedPoint = unprojectFromMeters(snappedMeters, gps);
  const deltaX = p.x - snappedMeters.x;
  const deltaY = p.y - snappedMeters.y;

  return {
    distance: Math.sqrt(deltaX * deltaX + deltaY * deltaY),
    snappedPoint,
    projection,
  };
}

function normalizePolyline(polylineCoords) {
  if (!Array.isArray(polylineCoords)) return [];
  return polylineCoords.map(normalizeCoordinate).filter(Boolean);
}

export function buildSpatialIndex(polylineCoords) {
  const coords = normalizePolyline(polylineCoords);
  const segmentCount = Math.max(0, coords.length - 1);
  const index = new Flatbush(segmentCount);
  const segmentIndexes = [];

  for (let i = 0; i < segmentCount; i += 1) {
    const a = coords[i];
    const b = coords[i + 1];
    index.add(
      Math.min(a.lng, b.lng),
      Math.min(a.lat, b.lat),
      Math.max(a.lng, b.lng),
      Math.max(a.lat, b.lat),
    );
    segmentIndexes.push(i);
  }

  index.finish();
  return {
    index,
    segmentIndexes,
    coords,
  };
}

export function queryNearbySegments(spatialIndex, gpsPoint, radiusM = ROUTE_ENGINE_THRESHOLDS.SNAP_SEARCH_RADIUS_M) {
  const gps = normalizeCoordinate(gpsPoint);
  if (!gps || !spatialIndex?.index?.search) return [];

  const latRadius = radiusM / METERS_PER_DEGREE_LAT;
  const lngRadius = radiusM / getMetersPerDegreeLng(gps.lat);
  const resultIndexes = spatialIndex.index.search(
    gps.lng - lngRadius,
    gps.lat - latRadius,
    gps.lng + lngRadius,
    gps.lat + latRadius,
  );

  return resultIndexes
    .map((itemIndex) => spatialIndex.segmentIndexes?.[itemIndex] ?? itemIndex)
    .filter((segmentIndex) => Number.isInteger(segmentIndex) && segmentIndex >= 0);
}

function evaluateSegment(gps, coords, segmentIndex, gpsHeading) {
  const a = coords[segmentIndex];
  const b = coords[segmentIndex + 1];
  if (!a || !b) return null;

  const snap = pointToSegmentDistance(gps, a, b);
  const segmentHeading = calculateBearing(a, b);
  const headingDelta = Number.isFinite(gpsHeading)
    ? normalizeHeadingDelta(gpsHeading, segmentHeading)
    : null;
  const isSameDirection =
    headingDelta === null ||
    headingDelta <= ROUTE_ENGINE_THRESHOLDS.HEADING_SAME_DIRECTION_DEG;

  return {
    segmentIndex,
    snappedPoint: snap.snappedPoint,
    distanceToRoute: snap.distance,
    projection: snap.projection,
    segmentHeading,
    headingDelta,
    isSameDirection,
  };
}

function selectBestSegment(gps, coords, segmentIndexes, gpsHeading) {
  let bestSameDirection = null;
  let bestAnyDirection = null;

  for (const segmentIndex of segmentIndexes) {
    const candidate = evaluateSegment(gps, coords, segmentIndex, gpsHeading);
    if (!candidate) continue;

    if (
      !bestAnyDirection ||
      candidate.distanceToRoute < bestAnyDirection.distanceToRoute
    ) {
      bestAnyDirection = candidate;
    }

    if (!candidate.isSameDirection) continue;
    if (
      !bestSameDirection ||
      candidate.distanceToRoute < bestSameDirection.distanceToRoute ||
      (candidate.distanceToRoute === bestSameDirection.distanceToRoute &&
        (candidate.headingDelta ?? 0) < (bestSameDirection.headingDelta ?? 0))
    ) {
      bestSameDirection = candidate;
    }
  }

  return bestSameDirection || bestAnyDirection;
}

export function snapToRoute(gpsPoint, polylineCoords, lastKnownIndex = null, options = {}) {
  const gps = normalizeCoordinate(gpsPoint);
  const coords = options.spatialIndex?.coords?.length
    ? options.spatialIndex.coords
    : normalizePolyline(polylineCoords);
  const segmentCount = Math.max(0, coords.length - 1);
  if (!gps || segmentCount === 0) return null;

  const gpsHeading = Number.isFinite(options.heading)
    ? options.heading
    : Number.isFinite(gpsPoint?.heading)
      ? gpsPoint.heading
      : null;
  const searchRadiusM =
    options.searchRadiusM ?? ROUTE_ENGINE_THRESHOLDS.SNAP_SEARCH_RADIUS_M;

  if (
    Number.isInteger(lastKnownIndex) &&
    lastKnownIndex >= 0 &&
    lastKnownIndex < segmentCount
  ) {
    const start = Math.max(
      0,
      lastKnownIndex - ROUTE_ENGINE_THRESHOLDS.SLIDING_WINDOW_BACK_SEGMENTS,
    );
    const end = Math.min(
      segmentCount - 1,
      lastKnownIndex + ROUTE_ENGINE_THRESHOLDS.SLIDING_WINDOW_FORWARD_SEGMENTS,
    );
    const segmentIndexes = [];
    for (let i = start; i <= end; i += 1) segmentIndexes.push(i);
    const best = selectBestSegment(gps, coords, segmentIndexes, gpsHeading);

    if (best && best.distanceToRoute <= searchRadiusM) {
      return {
        ...best,
        method: "sliding-window",
      };
    }
  }

  const candidateIndexes = options.spatialIndex
    ? queryNearbySegments(options.spatialIndex, gps, searchRadiusM)
    : Array.from({ length: segmentCount }, (_, index) => index);
  const fallbackIndexes = candidateIndexes.length
    ? candidateIndexes
    : Array.from({ length: segmentCount }, (_, index) => index);
  const best = selectBestSegment(gps, coords, fallbackIndexes, gpsHeading);

  return best
    ? {
        ...best,
        method: candidateIndexes.length ? "spatial-index" : "full-scan",
      }
    : null;
}

export function isOffRoute(
  distanceToRoute,
  thresholdM = ROUTE_ENGINE_THRESHOLDS.OFF_ROUTE_DISTANCE_M,
) {
  return Number.isFinite(distanceToRoute) && distanceToRoute > thresholdM;
}

function cumulativeRouteDistances(coords) {
  const cumulative = [0];
  for (let i = 1; i < coords.length; i += 1) {
    cumulative[i] = cumulative[i - 1] + getDistanceM(coords[i - 1], coords[i]);
  }
  return cumulative;
}

export function calculateProgress(gpsPoint, polylineCoords, steps = [], speedKmh = 0, lastKnownIndex = null) {
  const coords = normalizePolyline(polylineCoords);
  if (coords.length < 2) {
    return {
      percentComplete: 0,
      remainingMeters: null,
      etaSeconds: null,
      snap: null,
    };
  }

  const snap = snapToRoute(gpsPoint, coords, lastKnownIndex);
  if (!snap) {
    return {
      percentComplete: 0,
      remainingMeters: null,
      etaSeconds: null,
      snap: null,
    };
  }

  const cumulative = cumulativeRouteDistances(coords);
  const totalMeters = cumulative[cumulative.length - 1] || 0;
  const segmentStart = coords[snap.segmentIndex];
  const segmentEnd = coords[snap.segmentIndex + 1];
  const segmentMeters = getDistanceM(segmentStart, segmentEnd);
  const traveledMeters =
    cumulative[snap.segmentIndex] + segmentMeters * (snap.projection ?? 0);
  const remainingMeters = Math.max(0, totalMeters - traveledMeters);
  const speedMps = Number(speedKmh) / 3.6;

  return {
    percentComplete: totalMeters > 0 ? Math.min(100, (traveledMeters / totalMeters) * 100) : 0,
    remainingMeters,
    etaSeconds: speedMps > 0.5 ? remainingMeters / speedMps : null,
    snap,
    steps,
  };
}

export function hasPassedManeuver(gpsPoint, maneuverPoint, nextSegmentHeading, currentHeading) {
  const distanceFromManeuver = getDistanceM(gpsPoint, maneuverPoint);
  if (!Number.isFinite(distanceFromManeuver)) return false;
  if (distanceFromManeuver <= ROUTE_ENGINE_THRESHOLDS.MANEUVER_PASSED_DISTANCE_M) {
    return false;
  }

  if (!Number.isFinite(nextSegmentHeading) || !Number.isFinite(currentHeading)) {
    return false;
  }

  const headingDelta = normalizeHeadingDelta(currentHeading, nextSegmentHeading);
  return (
    headingDelta !== null &&
    headingDelta <= ROUTE_ENGINE_THRESHOLDS.MANEUVER_HEADING_DELTA_DEG
  );
}
