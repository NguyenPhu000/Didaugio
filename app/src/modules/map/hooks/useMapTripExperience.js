import { useMemo } from "react";

export function buildMapTripExperience({ activeTrip, tripPreviewId } = {}) {
  const isActiveTripMode = Boolean(activeTrip?.isActive);
  const isTripPreviewMode = Boolean(tripPreviewId) && !isActiveTripMode;

  return {
    tripView: {
      isActiveTripMode,
      isTripPreviewMode,
      isNormalMapMode: !isTripPreviewMode && !isActiveTripMode,
      isTripPaused: Boolean(activeTrip?.isPaused),
    },
  };
}

export function useMapTripExperience({ activeTrip, tripPreviewId } = {}) {
  const isActive = Boolean(activeTrip?.isActive);
  const isPaused = Boolean(activeTrip?.isPaused);

  return useMemo(
    () =>
      buildMapTripExperience({
        activeTrip: { isActive, isPaused },
        tripPreviewId,
      }),
    [isActive, isPaused, tripPreviewId],
  );
}
