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
    savedPlaces: () => ["user", "saved-places"],
  },
  trips: {
    all: () => ["trips"],
    list: () => ["trips", "list"],
    detail: (id) => ["trips", "detail", id],
  },
};
