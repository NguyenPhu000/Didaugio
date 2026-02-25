export const ENDPOINTS = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    loginGoogle: "/auth/google",
    refresh: "/auth/refresh",
    me: "/auth/me",
    logout: "/auth/logout",
  },
  app: {
    home: "/app/home",
    services: "/app/services",
    places: "/app/places",
    placeDetail: (id) => `/app/places/${id}`,
    placeReviews: (id) => `/app/places/${id}/reviews`,
    feedback: "/app/feedback",
    myProfile: "/app/me/profile",
    mySavedPlaces: "/app/me/saved-places",
    mySavedPlaceById: (placeId) => `/app/me/saved-places/${placeId}`,
    myTrips: "/app/me/trips",
    generateTrip: "/app/me/trips/generate",
  },
};
