/**
 * BOUNDARY SERVICE
 * Serves GeoJSON FeatureCollections built from database records.
 * Database is the single source of truth — no static file reads.
 */

import prisma from "../config/prismaClient.js";

// =============================================================================
// IN-MEMORY CACHE (avoid hitting DB on every map load)
// =============================================================================
let cache = {
  districts: null,
  wards: null,
  ttl: 5 * 60 * 1000, // 5 minutes
  timestamps: { districts: 0, wards: 0 },
};

const isCacheValid = (key) =>
  cache[key] && Date.now() - cache.timestamps[key] < cache.ttl;

/**
 * Invalidate cache (call after admin updates boundary data)
 */
export const invalidateCache = (key = null) => {
  if (key) {
    cache[key] = null;
    cache.timestamps[key] = 0;
  } else {
    cache.districts = null;
    cache.wards = null;
    cache.timestamps = { districts: 0, wards: 0 };
  }
};

// =============================================================================
// GEOJSON BUILDERS
// =============================================================================

/**
 * Build GeoJSON FeatureCollection for districts from DB
 */
export const getDistrictsGeoJSON = async () => {
  if (isCacheValid("districts")) return cache.districts;

  const districts = await prisma.districtCantho.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      code: true,
      latitude: true,
      longitude: true,
      boundary: true,
    },
    orderBy: { name: "asc" },
  });

  const geojson = {
    type: "FeatureCollection",
    features: districts.map((d) => ({
      type: "Feature",
      properties: {
        id: d.id,
        name: d.name,
        code: d.code,
        level: "district",
      },
      geometry: d.boundary || {
        type: "Point",
        coordinates: [parseFloat(d.longitude), parseFloat(d.latitude)],
      },
    })),
  };

  cache.districts = geojson;
  cache.timestamps.districts = Date.now();
  return geojson;
};

/**
 * Build GeoJSON FeatureCollection for wards from DB
 */
export const getWardsGeoJSON = async () => {
  if (isCacheValid("wards")) return cache.wards;

  const wards = await prisma.wardCantho.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      code: true,
      wardType: true,
      latitude: true,
      longitude: true,
      // boundary omitted: Prisma client needs regeneration after column was added.
      // Ward boundaries are not seeded yet so Point fallback is used anyway.
      district: {
        select: { id: true, name: true, code: true },
      },
    },
    orderBy: [{ districtId: "asc" }, { name: "asc" }],
  });

  const geojson = {
    type: "FeatureCollection",
    features: wards
      .map((w) => {
        // Fallback: if ward has no coords, use district's
        const lng = w.longitude ? parseFloat(w.longitude) : null;
        const lat = w.latitude ? parseFloat(w.latitude) : null;

        const geometry =
          lng && lat ? { type: "Point", coordinates: [lng, lat] } : null;

        return {
          type: "Feature",
          properties: {
            id: w.id,
            name: w.name,
            code: w.code,
            district_id: w.district.id,
            district_code: w.district.code,
            district_name: w.district.name,
            ward_type: w.wardType,
            level: "ward",
          },
          geometry,
        };
      })
      .filter((f) => f.geometry !== null),
  };

  cache.wards = geojson;
  cache.timestamps.wards = Date.now();
  return geojson;
};

// =============================================================================
// CENTROID SERVICES
// =============================================================================

/**
 * Lấy centroid của District theo code
 */
export const getDistrictCentroid = async (code) => {
  const district = await prisma.districtCantho.findUnique({
    where: { code },
    select: {
      id: true,
      name: true,
      code: true,
      latitude: true,
      longitude: true,
    },
  });

  if (!district) throw new Error("District not found");
  if (!district.latitude || !district.longitude)
    throw new Error("District does not have centroid coordinates");

  return {
    id: district.id,
    name: district.name,
    code: district.code,
    latitude: parseFloat(district.latitude),
    longitude: parseFloat(district.longitude),
  };
};

/**
 * Lấy centroid của Ward theo ID
 */
export const getWardCentroid = async (id) => {
  const ward = await prisma.wardCantho.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      code: true,
      wardType: true,
      latitude: true,
      longitude: true,
      district: {
        select: { id: true, name: true, latitude: true, longitude: true },
      },
    },
  });

  if (!ward) throw new Error("Ward not found");

  return {
    id: ward.id,
    name: ward.name,
    code: ward.code,
    districtId: ward.district.id,
    districtName: ward.district.name,
    wardType: ward.wardType,
    latitude:
      ward.latitude && parseFloat(ward.latitude) !== 0
        ? parseFloat(ward.latitude)
        : parseFloat(ward.district.latitude),
    longitude:
      ward.longitude && parseFloat(ward.longitude) !== 0
        ? parseFloat(ward.longitude)
        : parseFloat(ward.district.longitude),
  };
};

export default {
  getDistrictsGeoJSON,
  getWardsGeoJSON,
  getDistrictCentroid,
  getWardCentroid,
  invalidateCache,
};
