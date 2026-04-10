export const ENDPOINTS = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    loginGoogle: "/auth/google",
    refresh: "/auth/refresh",
    me: "/auth/me",
    logout: "/auth/logout",
  },
  places: {
    home: "/places/home",
    list: "/places",
    services: "/places/services",
    detail: (id) => `/places/${id}`,
    detailBySlug: (slug) => `/places/slug/${slug}`,
    reviews: (id) => `/places/${id}/reviews`,
  },
  categories: {
    list: "/categories",
  },
  profile: {
    get: "/profile",
    summary: "/profile/summary",
    savedPlaces: "/profile/saved-places",
    savedPlaceById: (placeId) => `/profile/saved-places/${placeId}`,
    trips: "/profile/trips",
    generateTrip: "/profile/trips/generate",
    createTrip: "/profile/trips",
    tripDetail: (id) => `/profile/trips/${id}`,
    updateTrip: (id) => `/profile/trips/${id}`,
    deleteTrip: (id) => `/profile/trips/${id}`,
    addDestination: (tripId) => `/profile/trips/${tripId}/destinations`,
    removeDestination: (tripId, destId) =>
      `/profile/trips/${tripId}/destinations/${destId}`,
    pushToken: "/profile/push-token",
  },
  booking: {
    create: "/business/bookings",
    list: "/business/bookings",
    detail: (id) => `/business/bookings/${id}`,
  },
  ai: {
    placeSummary: "/ai/place-summary",
    chat: "/ai/chat",
  },
  boundaries: {
    districts: "/boundaries/districts",
    wards: "/boundaries/wards",
  },
  feedback: "/feedback",
};
