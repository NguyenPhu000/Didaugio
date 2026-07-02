export const TRIP_QUERY_KEYS = {
  all: () => ["trips"],

  lists: () => [...TRIP_QUERY_KEYS.all(), "list"],
  list: (filters) =>
    filters === undefined
      ? [...TRIP_QUERY_KEYS.lists()]
      : [...TRIP_QUERY_KEYS.lists(), filters],

  details: () => [...TRIP_QUERY_KEYS.all(), "detail"],
  detail: (tripId) => [...TRIP_QUERY_KEYS.details(), Number(tripId)],

  stops: (tripId) => [...TRIP_QUERY_KEYS.detail(tripId), "stops"],
  stop: (tripId, stopId) => [...TRIP_QUERY_KEYS.stops(tripId), Number(stopId)],

  sessions: () => [...TRIP_QUERY_KEYS.all(), "session"],
  session: (tripId) => [...TRIP_QUERY_KEYS.sessions(), Number(tripId)],
  activeSession: () => [...TRIP_QUERY_KEYS.sessions(), "active"],

  routes: (tripId) => [...TRIP_QUERY_KEYS.detail(tripId), "route"],
  routePreview: (tripId) => [...TRIP_QUERY_KEYS.routes(tripId), "preview"],
  routeMetrics: (tripId) => [...TRIP_QUERY_KEYS.routes(tripId), "metrics"],

  bookings: (tripId) => [...TRIP_QUERY_KEYS.detail(tripId), "bookings"],
  bookingLink: (tripId, bookingId) => [
    ...TRIP_QUERY_KEYS.bookings(tripId),
    Number(bookingId),
  ],

  shares: (tripId) => [...TRIP_QUERY_KEYS.detail(tripId), "shares"],

  ai: {
    root: () => [...TRIP_QUERY_KEYS.all(), "ai"],
    preview: (draftKey) => [...TRIP_QUERY_KEYS.ai.root(), "preview", draftKey],
    suggestions: (params = {}) => [
      ...TRIP_QUERY_KEYS.ai.root(),
      "suggestions",
      params,
    ],
  },
};

export const invalidateTripList = (queryClient) =>
  queryClient.invalidateQueries({ queryKey: TRIP_QUERY_KEYS.lists() });

export const invalidateTripDetail = (queryClient, tripId) =>
  queryClient.invalidateQueries({ queryKey: TRIP_QUERY_KEYS.detail(tripId) });

export const invalidateTripSession = (queryClient, tripId) =>
  queryClient.invalidateQueries({ queryKey: TRIP_QUERY_KEYS.session(tripId) });

export const invalidateTripRoute = (queryClient, tripId) =>
  queryClient.invalidateQueries({ queryKey: TRIP_QUERY_KEYS.routes(tripId) });

export const invalidateTripBookingLinks = (queryClient, tripId) =>
  queryClient.invalidateQueries({ queryKey: TRIP_QUERY_KEYS.bookings(tripId) });
