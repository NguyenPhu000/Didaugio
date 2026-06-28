import prisma from "../config/prismaClient.js";
import NodeCache from "node-cache";

const placeCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

const STOP_WORDS = new Set([
  "cho", "mình", "tôi", "ở", "tại", "đi", "đâu", "giờ", "có", "nào", "gợi", "ý", "với",
  "nhé", "nha", "được", "không", "cần", "thơ", "là", "thì", "mà", "lên", "xuống", "cái", "chi",
  "gì", "này", "kia", "đó", "nọ", "chút", "ít", "nhiều", "cực", "quá", "lắm", "hộ", "giúp",
  "quán", "chỗ", "địa", "điểm",
]);

/**
 * Tách từ khóa RAG từ tin nhắn người dùng
 * @param {string} text Tin nhắn thô
 * @returns {Array<string>} Danh sách từ khóa sạch
 */
export function extractKeywords(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

/**
 * Tìm kiếm địa điểm RAG theo từ khóa
 * @param {string} userMessage Tin nhắn cuối của user
 * @returns {Promise<Array>} Danh sách địa điểm khớp từ khóa hoặc featured places fallback
 */
export async function findRelatedPlacesByKeywords(userMessage) {
  const keywords = extractKeywords(userMessage);
  if (keywords.length > 0) {
    const results = await prisma.place.findMany({
      where: {
        status: "approved",
        deletedAt: null,
        OR: keywords.flatMap((kw) => [
          { name: { contains: kw, mode: "insensitive" } },
          { description: { contains: kw, mode: "insensitive" } },
        ]),
      },
      take: 6,
      select: {
        id: true,
        name: true,
        address: true,
        description: true,
        priceFrom: true,
        priceTo: true,
        ratingAvg: true,
        category: { select: { name: true, slug: true } },
        images: {
          select: { secureUrl: true, thumbnailUrl: true, imageData: true },
          orderBy: { order: "asc" },
          take: 3,
        },
      },
    });
    if (results.length > 0) {
      return results.map(r => ({
        ...r,
        ratingAvg: r.ratingAvg ? parseFloat(r.ratingAvg) : 0,
        categoryName: r.category?.name || "Khác",
        categorySlug: r.category?.slug || "",
      }));
    }
  }

  // Fallback: featured places
  const cacheKey = "groq_featured_places_rag";
  let cached = placeCache.get(cacheKey);
  if (cached) return cached;

  const featured = await prisma.place.findMany({
    where: { status: "approved", deletedAt: null },
    orderBy: [{ isFeatured: "desc" }, { ratingAvg: "desc" }, { viewCount: "desc" }],
    take: 15,
    select: {
      id: true,
      name: true,
      address: true,
      description: true,
      priceFrom: true,
      priceTo: true,
      ratingAvg: true,
      category: { select: { name: true, slug: true } },
      images: {
        select: { secureUrl: true, thumbnailUrl: true, imageData: true },
        orderBy: { order: "asc" },
        take: 3,
      },
    },
  });
  const mappedFeatured = featured.map(r => ({
    ...r,
    ratingAvg: r.ratingAvg ? parseFloat(r.ratingAvg) : 0,
    categoryName: r.category?.name || "Khác",
    categorySlug: r.category?.slug || "",
  }));
  placeCache.set(cacheKey, mappedFeatured);
  return mappedFeatured;
}

/**
 * Tìm các địa điểm lân cận sử dụng bộ lọc thô Bounding Box kết hợp công thức Haversine
 * @param {number} lat Vĩ độ của điểm trung tâm
 * @param {number} lng Kinh độ của điểm trung tâm
 * @param {number} radiusKm Bán kính tìm kiếm (km)
 * @param {number} limit Giới hạn kết quả trả về
 * @returns {Promise<Array>} Danh sách địa điểm đã map dữ liệu
 */
export async function findPlacesNearby(lat, lng, radiusKm = 10, limit = 10) {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return [];
  }

  // 1 vĩ độ khoảng 111.045 km
  const deltaLat = radiusKm / 111.045;
  // 1 kinh độ ở vĩ độ Cần Thơ (khoảng 10 độ Bắc) khoảng 111.045 * cos(lat)
  const radLat = (latitude * Math.PI) / 180;
  const deltaLng = radiusKm / (111.045 * Math.cos(radLat));

  const minLat = latitude - deltaLat;
  const maxLat = latitude + deltaLat;
  const minLng = longitude - deltaLng;
  const maxLng = longitude + deltaLng;

  // Query raw SQL trên Postgres để tận dụng Index kinh vĩ độ và tính Haversine
  const rawPlaces = await prisma.$queryRaw`
    SELECT p.id, p.name, p.address, p.description, p.short_description AS "shortDescription",
           p.price_from AS "priceFrom", p.price_to AS "priceTo", p.rating_avg AS "ratingAvg",
           p.latitude, p.longitude, p.thumbnail, c.name AS "categoryName", c.slug AS "categorySlug",
           (6371 * acos(
             cos(radians(${latitude})) * cos(radians(p.latitude)) * 
             cos(radians(p.longitude) - radians(${longitude})) + 
             sin(radians(${latitude})) * sin(radians(p.latitude))
           )) AS distance
    FROM places p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'approved'
      AND p.deleted_at IS NULL
      AND p.latitude BETWEEN ${minLat} AND ${maxLat}
      AND p.longitude BETWEEN ${minLng} AND ${maxLng}
    ORDER BY distance ASC
    LIMIT ${limit}
  `;

  // Trích xuất và định dạng kiểu dữ liệu Decimal thành Number để tránh lỗi JSON
  const placeIds = rawPlaces.map((p) => p.id);

  // Fetch images riêng cho các place vừa tìm được
  const placeImages = placeIds.length > 0
    ? await prisma.placeImage.findMany({
        where: { placeId: { in: placeIds } },
        select: { placeId: true, secureUrl: true, thumbnailUrl: true, imageData: true },
        orderBy: { order: "asc" },
      })
    : [];

  // Gom images theo placeId
  const imagesByPlace = {};
  for (const img of placeImages) {
    if (!imagesByPlace[img.placeId]) imagesByPlace[img.placeId] = [];
    if (imagesByPlace[img.placeId].length < 3) {
      imagesByPlace[img.placeId].push({
        secureUrl: img.secureUrl,
        thumbnailUrl: img.thumbnailUrl,
        imageData: img.imageData,
      });
    }
  }

  return rawPlaces.map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    description: p.description,
    shortDescription: p.shortDescription,
    priceFrom: p.priceFrom,
    priceTo: p.priceTo,
    ratingAvg: p.ratingAvg ? parseFloat(p.ratingAvg) : 0,
    latitude: p.latitude ? parseFloat(p.latitude) : null,
    longitude: p.longitude ? parseFloat(p.longitude) : null,
    thumbnail: p.thumbnail,
    images: imagesByPlace[p.id] || [],
    categoryName: p.categoryName || "Khác",
    categorySlug: p.categorySlug || "",
    distance: p.distance ? parseFloat(p.distance) : 0,
  }));
}

/**
 * Tìm quận/huyện gần nhất từ tọa độ GPS để hỗ trợ Reverse Geocoding
 * @param {number} lat Vĩ độ
 * @param {number} lng Kinh độ
 * @returns {Promise<Object|null>}
 */
export async function findNearestDistrict(lat, lng) {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return null;
  }

  const result = await prisma.$queryRaw`
    SELECT id, name, code, latitude, longitude,
           (6371 * acos(
             cos(radians(${latitude})) * cos(radians(latitude)) * 
             cos(radians(longitude) - radians(${longitude})) + 
             sin(radians(${latitude})) * sin(radians(latitude))
           )) AS distance
    FROM districts_cantho
    WHERE is_active = true
    ORDER BY distance ASC
    LIMIT 1
  `;

  if (!result || result.length === 0) return null;
  
  return {
    id: result[0].id,
    name: result[0].name,
    code: result[0].code,
    latitude: parseFloat(result[0].latitude),
    longitude: parseFloat(result[0].longitude),
  };
}

/**
 * Tìm phường/xã gần nhất từ tọa độ GPS để hỗ trợ Reverse Geocoding
 * @param {number} lat Vĩ độ
 * @param {number} lng Kinh độ
 * @returns {Promise<Object|null>}
 */
export async function findNearestWard(lat, lng) {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return null;
  }

  const result = await prisma.$queryRaw`
    SELECT id, name, code, latitude, longitude, district_id AS "districtId",
           (6371 * acos(
             cos(radians(${latitude})) * cos(radians(latitude)) * 
             cos(radians(longitude) - radians(${longitude})) + 
             sin(radians(${latitude})) * sin(radians(latitude))
           )) AS distance
    FROM wards_cantho
    WHERE is_active = true
    ORDER BY distance ASC
    LIMIT 1
  `;

  if (!result || result.length === 0) return null;

  return {
    id: result[0].id,
    name: result[0].name,
    code: result[0].code,
    districtId: result[0].districtId,
    latitude: result[0].latitude ? parseFloat(result[0].latitude) : null,
    longitude: result[0].longitude ? parseFloat(result[0].longitude) : null,
  };
}
