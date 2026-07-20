export const classifyPlaceMapping = ({ coordinatesValid, matches }) => {
  if (!coordinatesValid) {
    return {
      status: "exception",
      wardCode: null,
      reason: "invalid_coordinate",
    };
  }

  const uniqueMatches = [...new Set(Array.isArray(matches) ? matches : [])];
  if (uniqueMatches.length === 1) {
    return { status: "mapped", wardCode: uniqueMatches[0], reason: null };
  }

  return {
    status: "exception",
    wardCode: null,
    reason: uniqueMatches.length === 0 ? "zero_match" : "multiple_matches",
  };
};

export const rankNearbyWardSuggestions = (suggestions) =>
  (Array.isArray(suggestions) ? suggestions : [])
    .filter(
      ({ wardCode, distanceMeters }) =>
        typeof wardCode === "string" &&
        Number.isFinite(distanceMeters) &&
        distanceMeters >= 0 &&
        distanceMeters <= 1_000,
    )
    .sort(
      (left, right) =>
        left.distanceMeters - right.distanceMeters ||
        left.wardCode.localeCompare(right.wardCode),
    )
    .slice(0, 3)
    .map(({ wardCode, distanceMeters }) => ({ wardCode, distanceMeters }));
