import prisma from "../config/prismaClient.js";

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
        select: {
          id: true,
          name: true,
          code: true,
          latitude: true,
          longitude: true,
        },
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

// =============================================================================
// LOOKUP DISTRICT BY LAT/LNG (DB-based)
// =============================================================================

/**
 * Haversine distance (km) between two lat/lng points
 */
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Lookup the nearest district for a given lat/lng.
 * Reads centroid coordinates directly from the DB — no file needed.
 */
export const lookupDistrict = async (lat, lng) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  if (isNaN(latitude) || isNaN(longitude)) return null;

  const MAX_DISTANCE_KM = 20;

  const districts = await prisma.districtCantho.findMany({
    where: { isActive: true },
    select: {
      id: true,
      code: true,
      name: true,
      latitude: true,
      longitude: true,
    },
  });

  let closest = null;
  let minDist = Infinity;

  for (const d of districts) {
    if (d.latitude == null || d.longitude == null) continue;
    const dist = haversineKm(latitude, longitude, d.latitude, d.longitude);
    if (dist < minDist && dist <= MAX_DISTANCE_KM) {
      minDist = dist;
      closest = d;
    }
  }

  if (!closest) return null;

  // Return full district with wards
  return getDistrictByCode(closest.code);
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
};
