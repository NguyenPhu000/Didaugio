import { TRIP_QUERY_KEYS } from "./trip-query-keys";

export { TRIP_QUERY_KEYS };

export const QUERY_KEYS = {
  places: {
    all: () => ["places"],
    list: (filters) => ["places", "list", filters],
    detail: (id) => ["places", "detail", id],
    nearby: (coords) => ["places", "nearby", coords],
    summary: (id) => ["places", "ai-summary", id],
    home: () => ["places", "home"],
  },
  explore: {
    all: () => ["explore"],
    list: (filters) => ["explore", "list", filters],
  },
  categories: {
    all: () => ["categories"],
  },
  bookings: {
    all: () => ["bookings"],
    list: () => ["bookings", "list"],
    detail: (id) => ["bookings", "detail", id],
  },
  user: {
    profile: () => ["user", "profile"],
    summary: () => ["user", "summary"],
    trips: () => ["user", "trips"],
    savedPlaces: () => ["saved-places"],
    savedCollections: () => ["saved-collections"],
  },
  trips: {
    all: TRIP_QUERY_KEYS.all,
    list: TRIP_QUERY_KEYS.list,
    detail: TRIP_QUERY_KEYS.detail,
    shares: (tripId) =>
      tripId === undefined ? ["trips", "shares"] : TRIP_QUERY_KEYS.shares(tripId),
  },
  notifications: {
    all: () => ["notifications"],
    list: (filters) => ["notifications", "list", filters],
  },
  payments: {
    detail: (id) => ["payments", "detail", id],
    byBooking: (bookingId) => ["payments", "booking", bookingId],
  },
};
