const MAX_VISITED_PLACE_IDS = 20;

function boundedString(value, maxLength) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length <= maxLength ? normalized : undefined;
}

function normalizeCoordinates(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  if (
    typeof value.latitude !== "number" ||
    typeof value.longitude !== "number"
  ) {
    return undefined;
  }

  const { latitude, longitude } = value;
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return undefined;
  }

  return { latitude, longitude };
}

function normalizePreferences(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const preferences = {};
  if (Array.isArray(value.travelStyles)) {
    preferences.travelStyles = value.travelStyles
      .filter((item) => typeof item === "string")
      .map((item) => item.trim().slice(0, 80))
      .filter(Boolean)
      .slice(0, 10);
  }
  return preferences;
}

export function buildSafeChatContext(sessionContext = {}, isPlaceQuery = false) {
  const context = {};
  const currentCoords = normalizeCoordinates(sessionContext.currentLocation);
  const currentCity = boundedString(sessionContext.currentCity, 120);
  const timeOfDay = boundedString(sessionContext.timeOfDay, 40);
  const preferences = normalizePreferences(sessionContext.preferences);

  if (currentCoords !== undefined) context.currentCoords = currentCoords;
  if (currentCity !== undefined) context.currentCity = currentCity;
  if (timeOfDay !== undefined) context.timeOfDay = timeOfDay;
  if (preferences !== undefined) context.preferences = preferences;

  if (Array.isArray(sessionContext.visitedPlaceIds)) {
    context.visitedPlaceIds = [
      ...new Set(
        sessionContext.visitedPlaceIds
          .map(Number)
          .filter((id) => Number.isSafeInteger(id) && id > 0),
      ),
    ].slice(0, MAX_VISITED_PLACE_IDS);
  }

  context.isPlaceQuery = isPlaceQuery === true;
  return context;
}
