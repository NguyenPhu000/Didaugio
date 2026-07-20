import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Location from "expo-location";
import { logger } from "../../../lib/logger";
import safeAsyncStorage from "../../../utils/safeAsyncStorage";
import { usePingEvent, useEventDetail } from "../../explore/hooks/useEvents";
import { useMapLocationTracker } from "./useMapLocationTracker";
import { useMapRouting } from "./useMapRouting";
import { useNavigationController } from "./useNavigationController";
import {
  buildManeuverLabel,
  getManeuverIcon,
  pickUpcomingStep,
} from "../utils/maneuver";
import { distanceMeters } from "../utils/distance";
import {
  formatRouteDistance,
  formatRouteEta,
} from "../utils/routeFormat";
import { MAP_TEXT } from "../constants/mapText.constants";
import {
  buildGpsIntervals,
  buildNativeUserLocationVisibility,
} from "./useMapActiveTripNavigationUtils";

export function useMapActiveTripNavigation({
  activeNextDestination,
  activeTargetPoint,
  activeTrip,
  activeTripDetail,
  currentLocation,
  isActiveTripMode,
  isTripPreviewMode,
  mapHasForegroundPermission,
  mapRef,
  nearbyTriggered,
  resolveTravelMode,
  showLocationPermissionAlert,
  viewportHeight,
}) {
  const navigationTickHandlerRef = useRef(null);
  const pingMutationRef = useRef(null);
  const pingEventMutation = usePingEvent();

  useEffect(() => {
    pingMutationRef.current = pingEventMutation;
  }, [pingEventMutation]);

  const gpsIntervals = useMemo(
    () => buildGpsIntervals({ nearbyTriggered }),
    [nearbyTriggered],
  );

  const handleActiveLocationUpdate = useCallback((location) => {
    navigationTickHandlerRef.current?.(location);
  }, []);

  const {
    currentLocation: activeTripLocation,
    hasForegroundPermission: activeTripHasForegroundPermission,
    locateNow: locateActiveTripNow,
  } = useMapLocationTracker({
    watchEnabled: isActiveTripMode && !activeTrip.isPaused,
    timeInterval: gpsIntervals.timeInterval,
    distanceInterval: gpsIntervals.distanceInterval,
    onLocationUpdate: handleActiveLocationUpdate,
  });

  const hasForegroundPermission = isActiveTripMode
    ? activeTripHasForegroundPermission
    : mapHasForegroundPermission;
  const shouldShowNativeUserLocation = buildNativeUserLocationVisibility({
    hasForegroundPermission,
    isTripPreviewMode,
  });

  useEffect(() => {
    if (!isActiveTripMode) return;
    let cancelled = false;
    (async () => {
      try {
        const fg = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (fg.status !== "granted") {
          showLocationPermissionAlert();
          return;
        }

        const bg = await Location.requestBackgroundPermissionsAsync();
        if (!cancelled && bg.status !== "granted") {
          showLocationPermissionAlert();
        }
      } catch {
        if (!cancelled) {
          showLocationPermissionAlert();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isActiveTripMode, showLocationPermissionAlert]);

  const [activeEventId, setActiveEventId] = useState(null);
  const { data: eventData } = useEventDetail(activeEventId, !!activeEventId, {
    refetchInterval: activeEventId ? 10_000 : false,
  });
  const broadcastNotice = eventData?.broadcastNotice || null;

  useEffect(() => {
    const checkActiveEvent = async () => {
      try {
        if (isActiveTripMode && activeTrip.activeTripId) {
          const evId = await safeAsyncStorage.getItem(
            `didaugio:active_event_trip:${activeTrip.activeTripId}`,
          );
          setActiveEventId(evId ? parseInt(evId, 10) : null);
        } else {
          setActiveEventId(null);
        }
      } catch (err) {
        logger.error("Lá»—i Ä‘á»c activeEventId:", err);
      }
    };
    checkActiveEvent();
  }, [isActiveTripMode, activeTrip.activeTripId]);

  useEffect(() => {
    if (
      !isActiveTripMode ||
      !activeEventId ||
      !activeTripLocation ||
      activeTrip.isPaused ||
      !activeNextDestination?.placeId
    ) {
      return;
    }

    const sendPing = async () => {
      try {
        await pingMutationRef.current.mutateAsync({
          id: activeEventId,
          payload: {
            latitude: activeTripLocation.latitude,
            longitude: activeTripLocation.longitude,
            placeId: activeNextDestination.placeId,
          },
        });
      } catch (err) {
        logger.error("Lá»—i ping vá»‹ trÃ­ lÃªn server:", err);
      }
    };

    sendPing();
    const interval = setInterval(sendPing, 180000);
    return () => clearInterval(interval);
  }, [
    isActiveTripMode,
    activeEventId,
    activeTripLocation,
    activeTripLocation?.latitude,
    activeTripLocation?.longitude,
    activeNextDestination?.placeId,
    activeTrip.isPaused,
  ]);

  const activeRouteOrigin = useMemo(() => {
    if (!isActiveTripMode || activeTrip.isPaused || !activeTripLocation) {
      return null;
    }
    return {
      lat: activeTripLocation.latitude,
      lng: activeTripLocation.longitude,
      name: MAP_TEXT.common.currentLocationName,
    };
  }, [isActiveTripMode, activeTrip.isPaused, activeTripLocation]);

  const activeTravelMode = useMemo(() => {
    if (!activeTripDetail?.destinations?.length || !activeNextDestination) {
      return "motorcycle";
    }

    const ordered = [...activeTripDetail.destinations].sort((a, b) => {
      if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
      return a.order - b.order;
    });

    const currentIndex = ordered.findIndex(
      (destination) => destination.id === activeNextDestination.id,
    );
    if (currentIndex > 0) {
      const prevDest = ordered[currentIndex - 1];
      if (prevDest.dayNumber === activeNextDestination.dayNumber) {
        return resolveTravelMode(prevDest.transportToNext);
      }
    }

    return resolveTravelMode(
      activeNextDestination.transportToNext || "motorcycle",
    );
  }, [
    activeTripDetail?.destinations,
    activeNextDestination,
    resolveTravelMode,
  ]);

  const {
    coordinates: baseActiveRouteCoordinates,
    firstRoute: baseActiveFirstRoute,
    source: baseActiveRouteSource,
    distanceM: baseActiveRouteDistanceM,
    durationS: baseActiveRouteDurationS,
    isFetching: isActiveRouteFetching,
  } = useMapRouting({
    origin: activeRouteOrigin,
    destination: activeTargetPoint,
    mode: activeTravelMode,
    enabled: Boolean(activeRouteOrigin && activeTargetPoint),
    navMode: "navigation",
  });

  const navigationController = useNavigationController({
    enabled: isActiveTripMode && !activeTrip.isPaused,
    routeCoordinates: baseActiveRouteCoordinates,
    firstRoute: baseActiveFirstRoute,
    destination: activeTargetPoint,
    mode: activeTravelMode,
    mapRef,
  });

  useEffect(() => {
    navigationTickHandlerRef.current = navigationController.onLocationUpdate;
    return () => {
      if (
        navigationTickHandlerRef.current ===
        navigationController.onLocationUpdate
      ) {
        navigationTickHandlerRef.current = null;
      }
    };
  }, [navigationController.onLocationUpdate]);

  const activeNavigationRoute = navigationController.routeOverride;
  const activeRouteCoordinates =
    activeNavigationRoute?.coordinates ?? baseActiveRouteCoordinates;
  const activeFirstRoute =
    activeNavigationRoute?.firstRoute ?? baseActiveFirstRoute;
  const activeRouteSource =
    activeNavigationRoute?.source ?? baseActiveRouteSource;
  const activeRouteDistanceM =
    navigationController.progress?.remainingMeters ??
    activeNavigationRoute?.distanceM ??
    baseActiveRouteDistanceM;
  const activeRouteDurationS =
    navigationController.progress?.etaSeconds ??
    activeNavigationRoute?.durationS ??
    baseActiveRouteDurationS;

  const activeDistanceToTarget = useMemo(() => {
    if (Number.isFinite(navigationController.distanceToDest)) {
      return navigationController.distanceToDest;
    }
    if (!activeTripLocation || !activeTargetPoint) return null;
    return distanceMeters(
      activeTripLocation.latitude,
      activeTripLocation.longitude,
      activeTargetPoint.lat,
      activeTargetPoint.lng,
    );
  }, [
    activeTripLocation,
    activeTargetPoint,
    navigationController.distanceToDest,
  ]);

  const activeUpcomingStep = useMemo(() => {
    if (navigationController.upcomingStep) {
      return navigationController.upcomingStep;
    }
    const steps = activeFirstRoute?.legs?.[0]?.steps;
    return pickUpcomingStep(steps, activeTripLocation, distanceMeters, {
      currentHeading: activeTripLocation?.heading,
    });
  }, [activeFirstRoute, activeTripLocation, navigationController.upcomingStep]);

  const activeInstruction = useMemo(
    () => (activeUpcomingStep ? buildManeuverLabel(activeUpcomingStep) : null),
    [activeUpcomingStep],
  );
  const activeInstructionIcon = useMemo(
    () =>
      activeUpcomingStep ? getManeuverIcon(activeUpcomingStep) : "navigation",
    [activeUpcomingStep],
  );
  const activeRouteEtaLabel = useMemo(
    () => formatRouteEta(activeRouteDurationS),
    [activeRouteDurationS],
  );
  const activeRouteDistanceLabel = useMemo(
    () => formatRouteDistance(activeRouteDistanceM),
    [activeRouteDistanceM],
  );
  const activeDistanceToNextTurnLabel = useMemo(
    () => formatRouteDistance(navigationController.distanceToNextTurn),
    [navigationController.distanceToNextTurn],
  );
  const activeTripSpeedKmh =
    navigationController.lastLocation?.speedKmh ??
    activeTripLocation?.speedKmh ??
    (Number.isFinite(activeTripLocation?.speed)
      ? activeTripLocation.speed * 3.6
      : 0);
  const activeMapPadding = useMemo(
    () =>
      isActiveTripMode && !activeTrip.isPaused
        ? { top: 0, right: 0, bottom: viewportHeight * 0.4, left: 0 }
        : undefined,
    [activeTrip.isPaused, isActiveTripMode, viewportHeight],
  );

  return {
    activeEventId,
    activeDistanceToNextTurnLabel,
    activeDistanceToTarget,
    activeInstruction,
    activeInstructionIcon,
    activeMapPadding,
    activeRouteCoordinates,
    activeRouteDistanceLabel,
    activeRouteEtaLabel,
    activeRouteSource,
    activeTravelMode,
    activeTripLocation,
    activeTripSpeedKmh,
    activeUpcomingStep,
    broadcastNotice,
    isActiveRouteFetching,
    locateActiveTripNow,
    navigationController,
    shouldShowNativeUserLocation,
  };
}
