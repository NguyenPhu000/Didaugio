import prisma from "../../config/prismaClient.js";
import ServiceError from "../../utils/serviceError.js";

export const PLACE_TELEMETRY_ACTIONS = new Set([
  "VIEW",
  "DIRECTION",
  "BOOKING_CLICK",
  "SHARE",
]);

const defaultStartDate = () =>
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

export async function recordPlaceTelemetry({
  placeId,
  userId = null,
  action,
  ipAddress = null,
  deviceType = null,
}) {
  if (!PLACE_TELEMETRY_ACTIONS.has(action)) {
    throw new ServiceError("Telemetry action không hợp lệ", 400, "VALIDATION_ERROR");
  }

  const normalizedPlaceId = Number(placeId);
  if (!Number.isInteger(normalizedPlaceId) || normalizedPlaceId <= 0) {
    throw new ServiceError("Place ID không hợp lệ", 400, "VALIDATION_ERROR");
  }

  const place = await prisma.place.findUnique({
    where: { id: normalizedPlaceId },
    select: { id: true },
  });
  if (!place) {
    throw new ServiceError("Địa điểm không tồn tại", 404, "NOT_FOUND");
  }

  return prisma.placeTelemetry.create({
    data: { placeId: place.id, userId, action, ipAddress, deviceType },
  });
}

export async function getPlaceHeatmap({
  businessId,
  action,
  fromDate,
  toDate,
} = {}) {
  if (action && action !== "all" && !PLACE_TELEMETRY_ACTIONS.has(action)) {
    throw new ServiceError("Telemetry action không hợp lệ", 400, "VALIDATION_ERROR");
  }

  const startDate = fromDate ? new Date(fromDate) : defaultStartDate();
  const endDate = toDate ? new Date(toDate) : new Date();
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new ServiceError("Khoảng thời gian không hợp lệ", 400, "VALIDATION_ERROR");
  }
  if (startDate > endDate) {
    throw new ServiceError("Ngày bắt đầu phải trước ngày kết thúc", 400, "VALIDATION_ERROR");
  }

  const where = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
    ...(action && action !== "all" ? { action } : {}),
    ...(businessId ? { place: { businessId: Number(businessId) } } : {}),
  };

  const grouped = await prisma.placeTelemetry.groupBy({
    by: ["placeId"],
    where,
    _count: { id: true },
  });

  let result = [];
  if (grouped.length > 0) {
    const places = await prisma.place.findMany({
      where: { id: { in: grouped.map(({ placeId }) => placeId) } },
      select: { id: true, name: true, address: true, latitude: true, longitude: true },
    });
    const placesById = new Map(places.map((place) => [place.id, place]));

    result = grouped.flatMap(({ placeId, _count }) => {
      const place = placesById.get(placeId);
      return place && place.latitude && place.longitude
        ? [
            {
              placeId,
              name: place.name,
              address: place.address || "",
              lat: Number(place.latitude),
              lng: Number(place.longitude),
              weight: _count.id,
            },
          ]
        : [];
    });
  }

  // Fallback: If no telemetry records match, derive heatmap points from active places & engagement
  if (result.length === 0) {
    const fallbackPlaces = await prisma.place.findMany({
      where: businessId ? { businessId: Number(businessId) } : { status: "approved" },
      take: 30,
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        viewCount: true,
        _count: { select: { bookings: true, reviews: true } },
      },
    });

    result = fallbackPlaces
      .filter((p) => p.latitude && p.longitude)
      .map((p) => ({
        placeId: p.id,
        name: p.name,
        address: p.address || "",
        lat: Number(p.latitude),
        lng: Number(p.longitude),
        weight: Math.max(
          1,
          (p.viewCount || 0) + (p._count.bookings || 0) * 5 + (p._count.reviews || 0) * 3
        ),
      }));
  }

  return result;
}
