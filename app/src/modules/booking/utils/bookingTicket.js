import i18n from "../../../i18n";
import {
  formatPriceLocale,
  formatShortDate,
  getI18nLocale,
} from "../../../utils/dateFormat";
import {
  getOptimizedCloudinaryUrl,
  resolveMediaUrl,
} from "../../../lib/media-url";

const CONFIRMED_QR_STATUSES = new Set(["confirmed", "completed"]);

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function firstImageFrom(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const resolved = firstImageFrom(item);
      if (resolved) return resolved;
    }
    return null;
  }
  if (typeof value === "object") {
    return firstDefined(
      value.url,
      value.uri,
      value.imageUrl,
      value.imageData,
      value.thumbnail,
      value.thumbnailUrl,
      value.secureUrl,
    );
  }
  return null;
}

export function getBookingHeroImage(booking) {
  const service = booking?.service || {};
  const place = service?.place || booking?.place || {};
  const raw = firstDefined(
    service.thumbnail,
    service.thumbnailUrl,
    firstImageFrom(service.images),
    place.thumbnailUrl,
    place.thumbnail,
    firstImageFrom(place.images),
    firstImageFrom(place.placeImages),
    place.coverImage,
    booking?.thumbnail,
  );
  const resolved = resolveMediaUrl(raw);
  return resolved ? getOptimizedCloudinaryUrl(resolved, 800) : null;
}

export function normalizeBookingTicket(booking, t = i18n.t) {
  const service = booking?.service || {};
  const place = service?.place || booking?.place || {};
  const bookingCode = booking?.bookingCode || booking?.code || `#${booking?.id || "--"}`;
  const useDate = firstDefined(booking?.useDate, booking?.bookingDate, booking?.bookingAt);
  const useTime = firstDefined(booking?.useTime, booking?.bookingTime);
  const quantity = Number(firstDefined(booking?.quantity, booking?.guestCount, booking?.seats, 1));
  const locale = getI18nLocale();

  return {
    id: booking?.id,
    bookingCode,
    status: booking?.status || "unknown",
    serviceName: service?.name || t("bookings.defaultService"),
    placeName: place?.name || t("bookings.defaultPlace"),
    address: place?.address || booking?.address || t("bookingTicket.notAvailable", "Not available"),
    dateLabel: useDate ? formatShortDate(useDate) || String(useDate).slice(0, 10) : "--/--/----",
    timeLabel: useTime || "--:--",
    quantityLabel: Number.isFinite(quantity)
      ? t("bookingTicket.quantityValue", { count: quantity, defaultValue: `${quantity}` })
      : t("bookingTicket.notAvailable", "Not available"),
    totalLabel: formatPriceLocale(firstDefined(booking?.finalPrice, booking?.totalPrice, booking?.price, 0)),
    createdLabel: booking?.createdAt
      ? new Date(booking.createdAt).toLocaleDateString(locale)
      : null,
    heroImage: getBookingHeroImage(booking),
    canShowQr: CONFIRMED_QR_STATUSES.has(String(booking?.status || "").toLowerCase()),
    linkedTrip: booking?.linkedTrip || null,
  };
}
