export function buildGpsIntervals({ nearbyTriggered }) {
  if (nearbyTriggered) {
    return { timeInterval: 3000, distanceInterval: 5 };
  }
  return { timeInterval: 10000, distanceInterval: 15 };
}

export function buildNativeUserLocationVisibility({
  hasForegroundPermission,
  isTripPreviewMode,
}) {
  return !isTripPreviewMode && hasForegroundPermission === true;
}
