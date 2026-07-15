import { useCallback, useMemo } from "react";
import { trackEvent } from "../../../lib/analytics";
import { useMapRouting } from "./useMapRouting";
import { MAP_TEXT } from "../constants/mapText.constants";
import {
  formatRouteDistance,
  formatRouteEta,
} from "../utils/routeFormat";
import {
  buildRouteEndpointFromLocation,
  buildRouteEndpointFromPlace,
} from "./useMapPlaceRoutingUtils";
import { NAVIGATION_EVENT_DEDUP_MS } from "../constants/navigation.constants";

export function useMapPlaceRouting({
  activePlace,
  currentLocation,
  handleLocate,
  isActiveTripMode,
  lastNavigationEventRef,
  routingPlace,
  setRoutingPlace,
  setSelectedPlace,
}) {
  const routeOriginFromCurrentLocation = useMemo(
    () =>
      buildRouteEndpointFromLocation(
        currentLocation,
        MAP_TEXT.common.currentLocationName,
      ),
    [currentLocation],
  );

  const routeDestinationFromRoutingPlace = useMemo(
    () =>
      buildRouteEndpointFromPlace(
        routingPlace,
        MAP_TEXT.common.destinationName,
      ),
    [routingPlace],
  );

  const routeOrigin = isActiveTripMode ? null : routeOriginFromCurrentLocation;
  const routeDestination = isActiveTripMode
    ? null
    : routeDestinationFromRoutingPlace;
  const routeEnabled = Boolean(routeOrigin && routeDestination);

  const {
    coordinates: routeCoordinates,
    source: routeSource,
    distanceM: routeDistanceM,
    durationS: routeDurationS,
    isError: isRouteError,
    isFallback: isRouteFallback,
    isFetching: isRouteFetching,
    error: routeError,
    refetch: refetchRoute,
  } = useMapRouting({
    origin: routeOrigin,
    destination: routeDestination,
    mode: "motorcycle",
    enabled: routeEnabled,
  });

  const routeEtaLabel = useMemo(
    () => formatRouteEta(routeDurationS),
    [routeDurationS],
  );
  const routeDistanceLabel = useMemo(
    () => formatRouteDistance(routeDistanceM),
    [routeDistanceM],
  );

  const shouldShowPreviewTravelInfo = useMemo(() => {
    if (isActiveTripMode) return false;
    if (!routeEnabled || !activePlace) return false;
    if (String(activePlace.id) !== String(routingPlace?.id)) return false;
    return true;
  }, [activePlace, isActiveTripMode, routeEnabled, routingPlace?.id]);

  const previewTravelLoading =
    shouldShowPreviewTravelInfo &&
    isRouteFetching &&
    !routeEtaLabel &&
    !routeDistanceLabel;

  const routeStatus = useMemo(() => {
    if (!routeEnabled) return null;

    if (isRouteError) {
      return {
        type: "error",
        icon: "wifi-off",
        title: MAP_TEXT.errors.routeDirectionTitle,
        message: routeError?.message || MAP_TEXT.errors.routeDirectionMessage,
        canRetry: true,
      };
    }

    if (routeSource === "fallback" || isRouteFallback) {
      return {
        type: "fallback",
        icon: "info-outline",
        title: MAP_TEXT.errors.routeFallbackTitle,
        message: MAP_TEXT.errors.routeFallbackMessage,
        canRetry: true,
      };
    }

    return null;
  }, [
    isRouteError,
    isRouteFallback,
    routeEnabled,
    routeError?.message,
    routeSource,
  ]);

  const handleStartRouteFromPreview = useCallback(
    async (place) => {
      if (!place?.id) return;

      const routeMode = MAP_TEXT.analytics.routeModeCurrentLocationToPlace;
      const eventSignature = `${String(place.id)}:${routeMode}:${routeSource || MAP_TEXT.common.unknownValue}`;
      const now = Date.now();

      if (
        lastNavigationEventRef.current.signature === eventSignature &&
        now - lastNavigationEventRef.current.timestamp <
          NAVIGATION_EVENT_DEDUP_MS
      ) {
        return;
      }

      lastNavigationEventRef.current = {
        signature: eventSignature,
        timestamp: now,
      };

      trackEvent("navigation_started", {
        placeId: place.id,
        placeName: place.name || MAP_TEXT.common.unknownValue,
        fromScreen: "map_preview",
        routeMode,
        routeSource: routeSource || MAP_TEXT.common.unknownValue,
        distance: routeDistanceM ?? null,
        duration: routeDurationS ?? null,
        vehicleType: "motorcycle",
        timestamp: new Date().toISOString(),
      });

      setSelectedPlace(place);
      setRoutingPlace(place);

      if (!currentLocation) {
        await handleLocate();
      }
    },
    [
      currentLocation,
      handleLocate,
      lastNavigationEventRef,
      routeDistanceM,
      routeDurationS,
      routeSource,
      setRoutingPlace,
      setSelectedPlace,
    ],
  );

  return {
    handleStartRouteFromPreview,
    isRouteFetching,
    previewTravelLoading,
    refetchRoute,
    routeCoordinates,
    routeDistanceLabel,
    routeEnabled,
    routeEtaLabel,
    routeSource,
    routeStatus,
    shouldShowPreviewTravelInfo,
  };
}
