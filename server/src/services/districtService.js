import prisma from "../config/prismaClient.js";
import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";
import { point, polygon, multiPolygon } from "@turf/helpers";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * DISTRICT SERVICE
 * Quản lý địa lý Cần Thơ (Quận/Huyện, Phường/Xã)
 */

// =============================================================================
// DISTRICT (QUẬN/HUYỆN)
// =============================================================================

/**
 * Lấy tất cả quận/huyện
 */
export const getAllDistricts = async (filters = {}) => {
  const { isActive, search } = filters;

  const where = {};

  if (isActive !== undefined) {
    where.isActive = isActive === "true" || isActive === true;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }

  const districts = await prisma.districtCantho.findMany({
    where,
    include: {
      _count: {
        select: { wards: true, places: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return districts;
};

/**
 * Lấy quận/huyện theo ID
 */
export const getDistrictById = async (id) => {
  const district = await prisma.districtCantho.findUnique({
    where: { id },
    include: {
      wards: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
      _count: {
        select: { places: true },
      },
    },
  });

  return district;
};

/**
 * Lấy quận/huyện theo code
 */
export const getDistrictByCode = async (code) => {
  const district = await prisma.districtCantho.findUnique({
    where: { code },
    include: {
      wards: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
      _count: {
        select: { places: true },
      },
    },
  });

  return district;
};

// =============================================================================
// WARD (PHƯỜNG/XÃ)
// =============================================================================

/**
 * Lấy tất cả phường/xã theo quận
 */
export const getWardsByDistrict = async (districtId, filters = {}) => {
  const { isActive, search, wardType } = filters;

  const where = {
    districtId,
  };

  if (isActive !== undefined) {
    where.isActive = isActive === "true" || isActive === true;
  }

  if (wardType) {
    where.wardType = wardType;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }

  const wards = await prisma.wardCantho.findMany({
    where,
    include: {
      district: {
        select: { id: true, name: true, code: true },
      },
      _count: {
        select: { places: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return wards;
};

/**
 * Lấy phường/xã theo ID
 */
export const getWardById = async (id) => {
  const ward = await prisma.wardCantho.findUnique({
    where: { id },
    include: {
      district: {
        select: { id: true, name: true, code: true, latitude: true, longitude: true },
      },
      _count: {
        select: { places: true },
      },
    },
  });

  return ward;
};

/**
 * Lấy phường/xã theo code
 */
export const getWardByCode = async (code) => {
  const ward = await prisma.wardCantho.findUnique({
    where: { code },
    include: {
      district: {
        select: { id: true, name: true, code: true },
      },
    },
  });

  return ward;
};

/**
 * Lấy tất cả phường/xã (có pagination)
 */
export const getAllWards = async (filters = {}) => {
  const { isActive, wardType, search, page = 1, limit = 50 } = filters;

  const where = {};

  if (isActive !== undefined) {
    where.isActive = isActive === "true" || isActive === true;
  }

  if (wardType) {
    where.wardType = wardType;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [wards, total] = await Promise.all([
    prisma.wardCantho.findMany({
      where,
      include: {
        district: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: [{ districtId: "asc" }, { name: "asc" }],
      skip,
      take: parseInt(limit),
    }),
    prisma.wardCantho.count({ where }),
  ]);

  return {
    data: wards,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};


/**
 * =============================================================================
 * CACHE & LOOKUP LOGIC
 * =============================================================================
 */

let boundaryCache = {
  features: [],
  isLoaded: false,
};

/**
 * Load boundaries into memory from GeoJSON file
 */
export const initializeBoundaryCache = async () => {
  if (boundaryCache.isLoaded) return;

  console.log("Initializing boundary cache from file...");
  try {
      // Data is at root/data, server is at root/server
      // So from server/src/services, we need to go up:
      // ../ (src) -> ../ (server) -> ../ (root) -> data
      const filePath = path.join(__dirname, "../../../data/cantho_districts.geojson");
      console.log("Loading boundaries from:", filePath);
      
      if (fs.existsSync(filePath)) {
          const data = fs.readFileSync(filePath, "utf8");
          const json = JSON.parse(data);
          boundaryCache.features = json.features || [];
          boundaryCache.isLoaded = true;
          console.log(`✅ Loaded ${boundaryCache.features.length} district boundaries.`);
      } else {
          console.error("❌ GeoJSON file not found at:", filePath);
          // Fallback or retry? Logic stops here.
      }
  } catch (error) {
      console.error("❌ Failed to load boundary cache:", error);
  }
};

/**
 * Lookup District by Lat/Lng
 */
export const lookupDistrict = async (lat, lng) => {
  if (!boundaryCache.isLoaded) {
    await initializeBoundaryCache();
  }
  
  if (!boundaryCache.features || boundaryCache.features.length === 0) {
      console.warn("Boundary cache empty. Lookup failed.");
      return null;
  }

  // Ensure Lat/Lng are numbers
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) return null;

  const pt = point([longitude, latitude]); // Turf uses [lng, lat]
  console.log(`Looking up point: [${longitude}, ${latitude}] in ${boundaryCache.features.length} features`);

  // Calculate distances to find closest district (features are Points)
  let closestDistrict = null;
  let minDistance = Infinity;
  const MAX_DISTANCE_KM = 20; // Only match if within 20km

  // Simple Haversine implementation to avoid new dependency
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  for (const feature of boundaryCache.features) {
    try {
      const geometry = feature.geometry;
      // Ensure it's a Point
      if (geometry.type !== 'Point') continue;
      
      const [featLng, featLat] = geometry.coordinates;
      const dist = calculateDistance(latitude, longitude, featLat, featLng);

      if (dist < minDistance && dist <= MAX_DISTANCE_KM) {
        minDistance = dist;
        closestDistrict = feature;
      }
    } catch (e) {
      console.error(`Error checking feature distance:`, e);
    }
  }

  if (closestDistrict) {
      const { code, district_id, name } = closestDistrict.properties;
      console.log(`Found closest district: ${name} (${minDistance.toFixed(2)}km)`);
      
      if (code) return await getDistrictByCode(code.toString());
      if (district_id) return await getDistrictById(parseInt(district_id));
      if (name) {
          const districts = await getAllDistricts({ search: name });
          if (districts.length > 0) return districts[0];
      }
  }

  return null;
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * GET /api/address/search - Tìm kiếm địa chỉ
 */
export const searchAddress = async (query, limit = 10) => {
  if (!query || query.length < 2) {
    return [];
  }

  // Tìm trong phường/xã
  const wards = await prisma.wardCantho.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { code: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      district: {
        select: { id: true, name: true },
      },
    },
    take: limit,
  });

  // Format kết quả
  const results = wards.map((ward) => ({
    type: "ward",
    wardId: ward.id,
    wardName: ward.name,
    wardType: ward.wardType,
    districtId: ward.district.id,
    districtName: ward.district.name,
    fullAddress: `${ward.wardType === "phuong" ? "Phường" : ward.wardType === "xa" ? "Xã" : "Thị trấn"} ${ward.name}, ${ward.district.name}, TP. Cần Thơ`,
    latitude: ward.latitude,
    longitude: ward.longitude,
  }));

  return results;
};

/**
 * Lấy địa chỉ đầy đủ từ districtId và wardId
 */
export const getFullAddress = async (districtId, wardId = null) => {
  const district = await prisma.districtCantho.findUnique({
    where: { id: districtId },
    select: { name: true },
  });

  if (!district) return null;

  let fullAddress = `${district.name}, TP. Cần Thơ`;

  if (wardId) {
    const ward = await prisma.wardCantho.findUnique({
      where: { id: wardId },
      select: { name: true, wardType: true },
    });

    if (ward) {
      const wardPrefix =
        ward.wardType === "phuong"
          ? "Phường"
          : ward.wardType === "xa"
          ? "Xã"
          : "Thị trấn";
      fullAddress = `${wardPrefix} ${ward.name}, ${fullAddress}`;
    }
  }

  return fullAddress;
};

export default {
  getAllDistricts,
  getDistrictById,
  getDistrictByCode,
  getWardsByDistrict,
  getWardById,
  getWardByCode,
  getAllWards,
  searchAddress,
  getFullAddress,
  lookupDistrict,
  initializeBoundaryCache
};
