import prisma from "../../config/prismaClient.js";
import { Prisma } from "@prisma/client";
import ServiceError from "../../utils/serviceError.js";
import { decodePlaceCursor, encodePlaceCursor } from "./placeCursor.js";

const CURSOR_SECRET = process.env.PLACE_CURSOR_SECRET || process.env.JWT_SECRET;
const APPROVED_WHERE = { deletedAt: null, status: "approved" };

const categorySelect = { id: true, name: true, slug: true, icon: true, color: true };
const imageSelect = { secureUrl: true, thumbnailUrl: true };

const listSelect = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  address: true,
  latitude: true,
  longitude: true,
  ratingAvg: true,
  ratingCount: true,
  viewCount: true,
  isFeatured: true,
  markerUrl: true,
  category: { select: categorySelect },
  images: { select: imageSelect, orderBy: [{ isCover: "desc" }, { order: "asc" }], take: 1 },
};

const markerSelect = {
  id: true,
  name: true,
  latitude: true,
  longitude: true,
  ratingAvg: true,
  isFeatured: true,
  markerUrl: true,
  thumbnail: true,
  category: { select: categorySelect },
};

const numberValue = (value) => (value == null ? null : Number(value));
const isHttpUrl = (value) => /^https?:\/\//i.test(String(value || ""));

export function normalizeSpatialError(error) {
  const message = String(error?.meta?.message || error?.message || "").toLowerCase();
  if (
    error?.code === "P2010" &&
    (message.includes("st_dwithin") ||
      message.includes("postgis") ||
      message.includes("geography"))
  ) {
    return new ServiceError(
      "Spatial database capability is unavailable",
      503,
      "SPATIAL_DATABASE_UNAVAILABLE",
    );
  }
  return error;
}

export function toPlaceListDto(place) {
  const image = place.images?.[0];
  return {
    id: place.id,
    name: place.name,
    slug: place.slug,
    shortDescription: place.shortDescription,
    address: place.address,
    latitude: numberValue(place.latitude),
    longitude: numberValue(place.longitude),
    ratingAvg: numberValue(place.ratingAvg) ?? 0,
    ratingCount: place.ratingCount,
    isFeatured: place.isFeatured,
    markerUrl: place.markerUrl || null,
    imageUrl: image?.secureUrl || image?.thumbnailUrl || null,
    category: place.category,
  };
}

export function toPlaceMarkerDto(place) {
  return {
    id: place.id,
    name: place.name,
    latitude: numberValue(place.latitude),
    longitude: numberValue(place.longitude),
    ratingAvg: numberValue(place.ratingAvg) ?? 0,
    isFeatured: place.isFeatured,
    markerUrl: place.markerUrl || null,
    ...(isHttpUrl(place.thumbnail) ? { thumbnail: place.thumbnail } : {}),
    category: place.category,
  };
}

const parseDate = (value) => new Date(value);

function cursorClause(cursor, sortBy) {
  if (!cursor) return undefined;
  if (cursor.sortBy !== sortBy) throw new ServiceError("Cursor does not match sort", 400, "VALIDATION_ERROR");
  const [value, second] = cursor.values;
  switch (sortBy) {
    case "newest": return { OR: [{ createdAt: { lt: parseDate(value) } }, { createdAt: parseDate(value), id: { lt: cursor.id } }] };
    case "oldest": return { OR: [{ createdAt: { gt: parseDate(value) } }, { createdAt: parseDate(value), id: { gt: cursor.id } }] };
    case "rating": return { OR: [{ ratingAvg: { lt: value } }, { ratingAvg: value, ratingCount: { lt: second } }, { ratingAvg: value, ratingCount: second, id: { lt: cursor.id } }] };
    case "popular":
    case "views": return { OR: [{ viewCount: { lt: value } }, { viewCount: value, id: { lt: cursor.id } }] };
    case "name": return { OR: [{ name: { gt: value } }, { name: value, id: { gt: cursor.id } }] };
    default: throw new ServiceError("Unsupported sort", 400, "VALIDATION_ERROR");
  }
}

function orderByFor(sortBy) {
  switch (sortBy) {
    case "oldest": return [{ createdAt: "asc" }, { id: "asc" }];
    case "rating": return [{ ratingAvg: "desc" }, { ratingCount: "desc" }, { id: "desc" }];
    case "popular":
    case "views": return [{ viewCount: "desc" }, { id: "desc" }];
    case "name": return [{ name: "asc" }, { id: "asc" }];
    default: return [{ createdAt: "desc" }, { id: "desc" }];
  }
}

function cursorValues(place, sortBy) {
  switch (sortBy) {
    case "rating": return [String(place.ratingAvg), place.ratingCount];
    case "popular":
    case "views": return [place.viewCount];
    case "name": return [place.name];
    default: return [place.createdAt.toISOString()];
  }
}

function buildWhere(filters, cursor) {
  const where = { ...APPROVED_WHERE };
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.districtId) where.districtId = filters.districtId;
  if (filters.wardId) where.wardId = filters.wardId;
  if (filters.priceRange && filters.priceRange !== "all") where.priceRange = filters.priceRange;
  if (filters.minRating != null) where.ratingAvg = { gte: filters.minRating };
  if (filters.isFeatured != null) where.isFeatured = filters.isFeatured;
  if (filters.search) where.OR = [
    { name: { contains: filters.search, mode: "insensitive" } },
    { shortDescription: { contains: filters.search, mode: "insensitive" } },
    { address: { contains: filters.search, mode: "insensitive" } },
  ];
  const after = cursorClause(cursor, filters.sortBy);
  if (after) where.AND = [after];
  return where;
}

export async function listPlacesV2(filters) {
  const limit = Number(filters.limit) || 10;
  const cursor = filters.cursor ? decodePlaceCursor(filters.cursor, CURSOR_SECRET) : null;
  const records = await prisma.place.findMany({
    where: buildWhere(filters, cursor),
    select: { ...listSelect, createdAt: true },
    orderBy: orderByFor(filters.sortBy),
    take: limit + 1,
  });
  const hasMore = records.length > limit;
  const page = hasMore ? records.slice(0, -1) : records;
  const last = page.at(-1);
  return {
    data: page.map(toPlaceListDto),
    pagination: {
      limit,
      hasMore,
      nextCursor: hasMore && last
        ? encodePlaceCursor({ sortBy: filters.sortBy, values: cursorValues(last, filters.sortBy), id: last.id }, CURSOR_SECRET)
        : null,
    },
  };
}

export async function listMapMarkers(query) {
  const west = Number(query.west) || 0;
  const south = Number(query.south) || 0;
  const east = Number(query.east) || 0;
  const north = Number(query.north) || 0;
  const limit = Number(query.limit) || 100;

  const records = await prisma.place.findMany({
    where: {
      ...APPROVED_WHERE,
      longitude: { gte: west, lte: east },
      latitude: { gte: south, lte: north },
    },
    select: markerSelect,
    orderBy: [{ id: "asc" }],
    take: limit,
  });
  return records.map(toPlaceMarkerDto);
}

export async function listNearbyMarkers(query) {
  const lat = Number(query.latitude) || 0;
  const lon = Number(query.longitude) || 0;
  const radiusMeters = Number(query.radiusMeters) || 5000;
  const limit = Number(query.limit) || 50;
  const categoryId = query.categoryId ? Number(query.categoryId) : null;

  const categoryClause = categoryId ? Prisma.sql`AND p.category_id = ${categoryId}` : Prisma.empty;
  let rows;
  try {
    rows = await prisma.$queryRaw`
    SELECT p.id, p.name, p.latitude, p.longitude, p.rating_avg AS "ratingAvg", p.is_featured AS "isFeatured",
           p.marker_url AS "markerUrl", p.thumbnail, c.id AS "categoryId", c.name AS "categoryName", c.slug AS "categorySlug",
           c.icon AS "categoryIcon", c.color AS "categoryColor",
           ST_Distance(
             ST_SetSRID(ST_MakePoint(p.longitude::double precision, p.latitude::double precision), 4326)::geography,
             ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography
           ) AS distance_meters
    FROM places p
    JOIN categories c ON c.id = p.category_id
    WHERE p.status = 'approved' AND p.deleted_at IS NULL
      ${categoryClause}
      AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(p.longitude::double precision, p.latitude::double precision), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
        ${radiusMeters}
      )
    ORDER BY ST_SetSRID(ST_MakePoint(p.longitude::double precision, p.latitude::double precision), 4326)::geography
      <-> ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography
      LIMIT ${limit};
    `;
  } catch (error) {
    throw normalizeSpatialError(error);
  }
  return rows.map((row) => ({
    ...toPlaceMarkerDto({
      id: row.id, name: row.name, latitude: row.latitude, longitude: row.longitude,
      ratingAvg: row.ratingAvg, isFeatured: row.isFeatured, markerUrl: row.markerUrl,
      thumbnail: row.thumbnail,
      category: { id: row.categoryId, name: row.categoryName, slug: row.categorySlug, icon: row.categoryIcon, color: row.categoryColor },
    }),
    distanceMeters: Math.round(Number(row.distance_meters)),
  }));
}
