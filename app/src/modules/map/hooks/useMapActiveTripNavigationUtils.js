export function buildGpsIntervals({ nearbyTriggered }) {
  if (nearbyTriggered) {
    return { timeInterval: 3000, distanceInterval: 5 };
  }
  return { timeInterval: 10000, distanceInterval: 15 };
}

export function buildUserHeadingState({
  isTripPreviewMode,
  liveUserHeading,
  userMapLocation,
}) {
  const userHeading = Number.isFinite(liveUserHeading)
    ? liveUserHeading
    : Number.isFinite(userMapLocation?.heading)
      ? userMapLocation.heading
      : null;

  return {
    shouldShowUserHeadingHat:
      !isTripPreviewMode &&
      userMapLocation &&
      Number.isFinite(userMapLocation.latitude) &&
      Number.isFinite(userMapLocation.longitude),
    userHeading,
    userHeadingOpacity: userHeading === null ? 0.45 : 1,
  };
}
