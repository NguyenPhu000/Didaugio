import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sendNavigationTelemetryApi } from "../../../api/routingApi";
import {
  ROUTE_BUILDER_COLORS,
  ROUTE_BUILDER_DEFAULT_COMPLETED_VIEW,
  ROUTE_BUILDER_FIRST_LEG_COLOR,
  ROUTE_BUILDER_MISSED_DISTANCE_M,
  ROUTE_BUILDER_RECOVERY_CONFIRMATION_SAMPLES,
} from "../constants/routeBuilder.constants";
import { MAP_TEXT } from "../constants/mapText.constants";
import { useMapLocationTracker } from "./useMapLocationTracker";
import { useMapRouting, useRoutingLegs } from "./useMapRouting";
import { distanceMeters } from "../utils/distance";
import {
  createLegTrackingState,
  hasSameStopOrder,
} from "../utils/routeBuilderGuards";
import {
  formatRouteDistance,
  formatRouteEta,
} from "../utils/routeBuilderMapper";
import {
  createPendingArrivalPayload,
  shouldClearRecoveryMode,
  shouldEnterPendingArrival,
  shouldEnterRecoveryMode,
} from "./routeBuilderArrivalRecovery.guards";

const NAVIGATION_TELEMETRY_ENABLED =
  process.env.EXPO_PUBLIC_NAVIGATION_TELEMETRY_ENABLED !== "false";

export function useRouteBuilderController({
  allPlaces,
  onSelectPlace,
  onLocationResolved,
}) {
  const routeBuilderLegTrackingRef = useRef(createLegTrackingState());
  const telemetrySessionIdRef = useRef(
    `route-builder-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  );

  const [routeBuilderMode, setRouteBuilderMode] = useState(false);
  const [routeBuilderDraftStops, setRouteBuilderDraftStops] = useState([]);
  const [routeBuilderConfirmedStops, setRouteBuilderConfirmedStops] = useState(
    [],
  );
  const [routeBuilderCompletedLegs, setRouteBuilderCompletedLegs] = useState(0);
  const [routeBuilderCompletedView, setRouteBuilderCompletedView] = useState(
    ROUTE_BUILDER_DEFAULT_COMPLETED_VIEW,
  );
  const [routeBuilderPendingArrival, setRouteBuilderPendingArrival] =
    useState(null);
  const [routeBuilderArrivalAlertVisible, setRouteBuilderArrivalAlertVisible] =
    useState(false);
  const [routeBuilderRecoveryMode, setRouteBuilderRecoveryMode] =
    useState(false);

  const shouldWatchLocation =
    routeBuilderMode && routeBuilderConfirmedStops.length > 0;

  const { currentLocation, locateNow } = useMapLocationTracker({
    watchEnabled: shouldWatchLocation,
  });

  const emitNavigationTelemetry = useCallback(
    (eventType, payload = {}) => {
      if (!NAVIGATION_TELEMETRY_ENABLED) return;

      sendNavigationTelemetryApi({
        sessionId: telemetrySessionIdRef.current,
        meta: {
          platform: "mobile",
        },
        events: [
          {
            eventType,
            eventAt: new Date().toISOString(),
            routeId: payload.routeId,
            legIndex: payload.legIndex,
            location: currentLocation
              ? {
                  lat: currentLocation.latitude,
                  lng: currentLocation.longitude,
                }
              : undefined,
            payload,
          },
        ],
      }).catch(() => {
        // Telemetry is best-effort and must never interrupt navigation UX.
      });
    },
    [currentLocation],
  );

  const syncBuilderStops = useCallback(
    (stops) => {
      if (!Array.isArray(stops) || stops.length === 0) return [];

      const nextStops = [];
      for (const stop of stops) {
        const latest = allPlaces.find(
          (place) => String(place?.id) === String(stop?.id),
        );
        if (!latest) continue;
        nextStops.push(latest);
      }
      return nextStops;
    },
    [allPlaces],
  );

  useEffect(() => {
    setRouteBuilderDraftStops((prev) => {
      const next = syncBuilderStops(prev);
      return hasSameStopOrder(prev, next) ? prev : next;
    });
  }, [syncBuilderStops]);

  useEffect(() => {
    setRouteBuilderConfirmedStops((prev) => {
      const next = syncBuilderStops(prev);
      return hasSameStopOrder(prev, next) ? prev : next;
    });
  }, [syncBuilderStops]);

  const routeOriginFromCurrentLocation = useMemo(() => {
    if (
      !currentLocation ||
      !Number.isFinite(currentLocation.latitude) ||
      !Number.isFinite(currentLocation.longitude)
    ) {
      return null;
    }

    return {
      lat: currentLocation.latitude,
      lng: currentLocation.longitude,
      name: MAP_TEXT.common.currentLocationName,
    };
  }, [currentLocation]);

  const routeBuilderCanStartFromCurrentLocation = Boolean(
    routeOriginFromCurrentLocation,
  );

  const routeBuilderMinimumStops = routeBuilderCanStartFromCurrentLocation
    ? 1
    : 2;

  const routeBuilderCanConfirm =
    routeBuilderDraftStops.length >= routeBuilderMinimumStops;
  const routeBuilderHasConfirmedRoute = routeBuilderConfirmedStops.length > 0;

  const routeBuilderWaypoints = useMemo(() => {
    if (!routeBuilderHasConfirmedRoute) return [];

    const waypoints = [];
    if (
      routeBuilderCanStartFromCurrentLocation &&
      routeOriginFromCurrentLocation
    ) {
      waypoints.push(routeOriginFromCurrentLocation);
    }

    routeBuilderConfirmedStops.forEach((stop, index) => {
      if (
        !Number.isFinite(stop?.latitude) ||
        !Number.isFinite(stop?.longitude)
      ) {
        return;
      }

      waypoints.push({
        lat: Number(stop.latitude),
        lng: Number(stop.longitude),
        name: stop.name || MAP_TEXT.routeBuilder.stopFallbackName(index),
      });
    });

    return waypoints;
  }, [
    routeBuilderCanStartFromCurrentLocation,
    routeBuilderConfirmedStops,
    routeBuilderHasConfirmedRoute,
    routeOriginFromCurrentLocation,
  ]);

  const routeBuilderEnabled =
    routeBuilderMode && routeBuilderWaypoints.length >= 2;

  const routeBuilderIsDirty = useMemo(() => {
    if (!routeBuilderHasConfirmedRoute) return false;
    return !hasSameStopOrder(
      routeBuilderDraftStops,
      routeBuilderConfirmedStops,
    );
  }, [
    routeBuilderConfirmedStops,
    routeBuilderDraftStops,
    routeBuilderHasConfirmedRoute,
  ]);

  const {
    legs: routeBuilderLegs,
    totalDistance: routeBuilderTotalDistance,
    totalDuration: routeBuilderTotalDuration,
    isError: isRouteBuilderError,
    isFetching: isRouteBuilderFetching,
    refetch: refetchRouteBuilder,
  } = useRoutingLegs({
    waypoints: routeBuilderWaypoints,
    mode: "motorcycle",
    enabled: routeBuilderEnabled,
  });

  const routeBuilderDistanceLabel = useMemo(
    () => formatRouteDistance(routeBuilderTotalDistance),
    [routeBuilderTotalDistance],
  );
  const routeBuilderEtaLabel = useMemo(
    () => formatRouteEta(routeBuilderTotalDuration),
    [routeBuilderTotalDuration],
  );

  const routeBuilderLegCount = routeBuilderLegs.length;

  const routeBuilderActiveLegIndex = useMemo(() => {
    if (!routeBuilderEnabled || routeBuilderLegCount === 0) return null;
    return Math.min(routeBuilderCompletedLegs, routeBuilderLegCount - 1);
  }, [routeBuilderCompletedLegs, routeBuilderEnabled, routeBuilderLegCount]);

  const routeBuilderActiveTarget = useMemo(() => {
    if (!routeBuilderEnabled || routeBuilderWaypoints.length < 2) return null;
    const targetIndex = Math.min(
      routeBuilderCompletedLegs + 1,
      routeBuilderWaypoints.length - 1,
    );
    const target = routeBuilderWaypoints[targetIndex];
    if (!target) return null;
    return {
      ...target,
      targetIndex,
      legIndex: routeBuilderActiveLegIndex,
    };
  }, [
    routeBuilderActiveLegIndex,
    routeBuilderCompletedLegs,
    routeBuilderEnabled,
    routeBuilderWaypoints,
  ]);

  const routeBuilderDistanceToActiveTarget = useMemo(() => {
    if (
      !routeBuilderActiveTarget ||
      !currentLocation ||
      !Number.isFinite(routeBuilderActiveTarget.lat) ||
      !Number.isFinite(routeBuilderActiveTarget.lng) ||
      !Number.isFinite(currentLocation.latitude) ||
      !Number.isFinite(currentLocation.longitude)
    ) {
      return null;
    }

    return distanceMeters(
      currentLocation.latitude,
      currentLocation.longitude,
      routeBuilderActiveTarget.lat,
      routeBuilderActiveTarget.lng,
    );
  }, [currentLocation, routeBuilderActiveTarget]);

  const routeBuilderDistanceToActiveTargetLabel = useMemo(
    () => formatRouteDistance(routeBuilderDistanceToActiveTarget),
    [routeBuilderDistanceToActiveTarget],
  );

  useEffect(() => {
    setRouteBuilderCompletedLegs((prev) =>
      Math.min(prev, routeBuilderLegCount),
    );
  }, [routeBuilderLegCount]);

  useEffect(() => {
    if (!routeBuilderEnabled) return;
    if (routeBuilderCompletedLegs < routeBuilderLegCount) return;
    setRouteBuilderPendingArrival(null);
    setRouteBuilderArrivalAlertVisible(false);
    setRouteBuilderRecoveryMode(false);
  }, [routeBuilderCompletedLegs, routeBuilderEnabled, routeBuilderLegCount]);

  useEffect(() => {
    if (!routeBuilderPendingArrival) {
      setRouteBuilderArrivalAlertVisible(false);
    }
  }, [routeBuilderPendingArrival]);

  useEffect(() => {
    if (!routeBuilderEnabled) {
      setRouteBuilderPendingArrival(null);
      setRouteBuilderArrivalAlertVisible(false);
      setRouteBuilderRecoveryMode(false);
      routeBuilderLegTrackingRef.current = createLegTrackingState();
      return;
    }

    const activeLeg = routeBuilderActiveLegIndex;
    if (activeLeg == null) return;

    if (routeBuilderLegTrackingRef.current.legIndex !== activeLeg) {
      routeBuilderLegTrackingRef.current = createLegTrackingState(activeLeg);
      setRouteBuilderPendingArrival(null);
      setRouteBuilderArrivalAlertVisible(false);
      setRouteBuilderRecoveryMode(false);
    }
  }, [routeBuilderActiveLegIndex, routeBuilderEnabled]);

  useEffect(() => {
    if (!routeBuilderEnabled || routeBuilderDistanceToActiveTarget == null) {
      return;
    }

    const tracking = routeBuilderLegTrackingRef.current;
    tracking.minDistance = Math.min(
      tracking.minDistance,
      routeBuilderDistanceToActiveTarget,
    );

    const activeLeg = routeBuilderActiveLegIndex;
    if (activeLeg == null) {
      tracking.prevDistance = routeBuilderDistanceToActiveTarget;
      return;
    }

    const pendingForCurrentLeg =
      routeBuilderPendingArrival?.legIndex === activeLeg;

    if (
      shouldEnterPendingArrival({
        pendingForCurrentLeg,
        distanceToTarget: routeBuilderDistanceToActiveTarget,
      })
    ) {
      setRouteBuilderPendingArrival(
        createPendingArrivalPayload({
          activeLeg,
          targetName: routeBuilderActiveTarget?.name,
        }),
      );
      setRouteBuilderArrivalAlertVisible(true);
      setRouteBuilderRecoveryMode(false);
      tracking.prevDistance = routeBuilderDistanceToActiveTarget;
      return;
    }

    const hasMissedTarget = shouldEnterRecoveryMode({
      pendingForCurrentLeg,
      minDistance: tracking.minDistance,
      distanceToTarget: routeBuilderDistanceToActiveTarget,
    });

    if (hasMissedTarget) {
      tracking.recoveryCandidateCount += 1;
    } else {
      tracking.recoveryCandidateCount = 0;
    }

    if (
      tracking.recoveryCandidateCount >=
      ROUTE_BUILDER_RECOVERY_CONFIRMATION_SAMPLES
    ) {
      setRouteBuilderRecoveryMode(true);
      if (!tracking.recoveryEventEmitted) {
        tracking.recoveryEventEmitted = true;
        emitNavigationTelemetry("route_deviation", {
          legIndex: activeLeg,
          targetName: routeBuilderActiveTarget?.name,
          minDistance: tracking.minDistance,
          distanceToTarget: routeBuilderDistanceToActiveTarget,
          thresholdMeters: ROUTE_BUILDER_MISSED_DISTANCE_M,
        });
        emitNavigationTelemetry("reroute_requested", {
          legIndex: activeLeg,
          targetName: routeBuilderActiveTarget?.name,
          reason: "missed_target",
        });
      }
    }

    if (
      shouldClearRecoveryMode({
        recoveryMode: routeBuilderRecoveryMode,
        distanceToTarget: routeBuilderDistanceToActiveTarget,
      })
    ) {
      setRouteBuilderRecoveryMode(false);
      tracking.recoveryCandidateCount = 0;
    }

    tracking.prevDistance = routeBuilderDistanceToActiveTarget;
  }, [
    routeBuilderActiveLegIndex,
    routeBuilderActiveTarget,
    routeBuilderDistanceToActiveTarget,
    routeBuilderEnabled,
    routeBuilderPendingArrival,
    routeBuilderRecoveryMode,
    emitNavigationTelemetry,
  ]);

  const routeBuilderRecoveryOrigin = useMemo(() => {
    if (
      !routeBuilderEnabled ||
      !routeBuilderRecoveryMode ||
      !currentLocation ||
      !Number.isFinite(currentLocation.latitude) ||
      !Number.isFinite(currentLocation.longitude)
    ) {
      return null;
    }

    return {
      lat: currentLocation.latitude,
      lng: currentLocation.longitude,
      name: MAP_TEXT.common.currentLocationName,
    };
  }, [currentLocation, routeBuilderEnabled, routeBuilderRecoveryMode]);

  const routeBuilderRecoveryDestination = useMemo(() => {
    if (
      !routeBuilderEnabled ||
      !routeBuilderRecoveryMode ||
      !routeBuilderActiveTarget ||
      !Number.isFinite(routeBuilderActiveTarget.lat) ||
      !Number.isFinite(routeBuilderActiveTarget.lng)
    ) {
      return null;
    }

    return {
      lat: routeBuilderActiveTarget.lat,
      lng: routeBuilderActiveTarget.lng,
      name:
        routeBuilderActiveTarget.name || MAP_TEXT.common.destinationMissingName,
    };
  }, [routeBuilderActiveTarget, routeBuilderEnabled, routeBuilderRecoveryMode]);

  const {
    coordinates: routeBuilderRecoveryCoordinates,
    source: routeBuilderRecoverySource,
  } = useMapRouting({
    origin: routeBuilderRecoveryOrigin,
    destination: routeBuilderRecoveryDestination,
    mode: "motorcycle",
    enabled: Boolean(
      routeBuilderRecoveryOrigin && routeBuilderRecoveryDestination,
    ),
  });

  const routeBuilderLegVisuals = useMemo(() => {
    if (!routeBuilderEnabled || !Array.isArray(routeBuilderLegs)) return [];

    return routeBuilderLegs.map((leg, index) => {
      const isFirstLegFromCurrent =
        routeBuilderCanStartFromCurrentLocation && index === 0;
      const color = isFirstLegFromCurrent
        ? ROUTE_BUILDER_FIRST_LEG_COLOR
        : ROUTE_BUILDER_COLORS[
            (isFirstLegFromCurrent ? index - 1 : index) %
              ROUTE_BUILDER_COLORS.length
          ];

      const isCompleted = index < routeBuilderCompletedLegs;
      const shouldHide = isCompleted && routeBuilderCompletedView === "hide";
      const source = leg?.source || leg?.route?.source || "osrm";

      return {
        key: `builder-leg-${index}-${leg?.index || "x"}`,
        geometry: leg?.route?.geometry,
        coordinates: leg?.route?.coordinates,
        source,
        dashed: source === "fallback",
        color,
        opacity: isCompleted ? 0.2 : 0.92,
        shouldHide,
      };
    });
  }, [
    routeBuilderCanStartFromCurrentLocation,
    routeBuilderCompletedLegs,
    routeBuilderCompletedView,
    routeBuilderEnabled,
    routeBuilderLegs,
  ]);

  const handleAddStopFromPlace = useCallback(
    (place) => {
      if (!place?.id) return;

      setRouteBuilderMode(true);
      setRouteBuilderRecoveryMode(false);
      setRouteBuilderPendingArrival(null);
      setRouteBuilderArrivalAlertVisible(false);
      onSelectPlace?.(place);

      setRouteBuilderDraftStops((prev) => {
        const existed = prev.some(
          (stop) => String(stop?.id) === String(place.id),
        );
        if (existed) return prev;
        return [...prev, place];
      });
    },
    [onSelectPlace],
  );

  const handleRemoveRouteBuilderStop = useCallback((stopId) => {
    setRouteBuilderDraftStops((prev) =>
      prev.filter((stop) => String(stop?.id) !== String(stopId)),
    );
  }, []);

  const handleClearRouteBuilder = useCallback(() => {
    setRouteBuilderDraftStops([]);
    setRouteBuilderConfirmedStops([]);
    setRouteBuilderCompletedLegs(0);
    setRouteBuilderPendingArrival(null);
    setRouteBuilderArrivalAlertVisible(false);
    setRouteBuilderRecoveryMode(false);
  }, []);

  const handleConfirmRouteBuilder = useCallback(async () => {
    if (!routeBuilderCanConfirm) return;

    if (!routeBuilderCanStartFromCurrentLocation && !currentLocation) {
      const located = await locateNow();
      onLocationResolved?.(located ?? null);
    }

    setRouteBuilderConfirmedStops(routeBuilderDraftStops);
    setRouteBuilderCompletedLegs(0);
    setRouteBuilderPendingArrival(null);
    setRouteBuilderArrivalAlertVisible(false);
    setRouteBuilderRecoveryMode(false);
    setRouteBuilderMode(true);
    const confirmedWaypointCount =
      routeBuilderDraftStops.length +
      (routeBuilderCanStartFromCurrentLocation ? 1 : 0);
    emitNavigationTelemetry("navigation_started", {
      stopCount: routeBuilderDraftStops.length,
      waypointCount: confirmedWaypointCount,
      mode: "motorcycle",
    });
    emitNavigationTelemetry("route_confirmed", {
      stopCount: routeBuilderDraftStops.length,
      waypointCount: confirmedWaypointCount,
    });
  }, [
    currentLocation,
    emitNavigationTelemetry,
    locateNow,
    onLocationResolved,
    routeBuilderCanConfirm,
    routeBuilderCanStartFromCurrentLocation,
    routeBuilderDraftStops,
  ]);

  const handleExitRouteBuilder = useCallback(() => {
    if (routeBuilderConfirmedStops.length > 0) {
      emitNavigationTelemetry("route_cancelled", {
        completedLegs: routeBuilderCompletedLegs,
        legCount: routeBuilderLegCount,
      });
    }
    setRouteBuilderMode(false);
    setRouteBuilderDraftStops([]);
    setRouteBuilderConfirmedStops([]);
    setRouteBuilderCompletedLegs(0);
    setRouteBuilderPendingArrival(null);
    setRouteBuilderArrivalAlertVisible(false);
    setRouteBuilderRecoveryMode(false);
  }, [
    emitNavigationTelemetry,
    routeBuilderCompletedLegs,
    routeBuilderConfirmedStops.length,
    routeBuilderLegCount,
  ]);

  const handleConfirmArrivedRouteBuilderLeg = useCallback(() => {
    if (!routeBuilderPendingArrival) return;

    const nextCompletedLegs = Math.min(
      Math.max(
        routeBuilderCompletedLegs,
        routeBuilderPendingArrival.legIndex + 1,
      ),
      routeBuilderLegCount,
    );

    setRouteBuilderCompletedLegs((prev) =>
      Math.min(
        Math.max(prev, routeBuilderPendingArrival.legIndex + 1),
        routeBuilderLegCount,
      ),
    );
    setRouteBuilderPendingArrival(null);
    setRouteBuilderArrivalAlertVisible(false);
    setRouteBuilderRecoveryMode(false);
    emitNavigationTelemetry("leg_arrived", {
      legIndex: routeBuilderPendingArrival.legIndex,
      targetName: routeBuilderPendingArrival.targetName,
    });
    if (nextCompletedLegs >= routeBuilderLegCount) {
      emitNavigationTelemetry("route_completed", {
        legCount: routeBuilderLegCount,
      });
    }
  }, [
    emitNavigationTelemetry,
    routeBuilderCompletedLegs,
    routeBuilderLegCount,
    routeBuilderPendingArrival,
  ]);

  const handleDismissRouteBuilderArrivalAlert = useCallback(() => {
    setRouteBuilderArrivalAlertVisible(false);
  }, []);

  const handleResetRouteBuilderProgress = useCallback(() => {
    setRouteBuilderCompletedLegs(0);
  }, []);

  const handleToggleCompletedLegView = useCallback(() => {
    setRouteBuilderCompletedView((prev) => (prev === "dim" ? "hide" : "dim"));
  }, []);

  const routeBuilderHasPendingArrival = Boolean(routeBuilderPendingArrival);
  const routeBuilderHasFinished =
    routeBuilderLegCount > 0 &&
    routeBuilderCompletedLegs >= routeBuilderLegCount;

  return {
    currentLocation,
    locateNow,
    mode: routeBuilderMode,
    setMode: setRouteBuilderMode,
    draftStops: routeBuilderDraftStops,
    confirmedStops: routeBuilderConfirmedStops,
    canStartFromCurrentLocation: routeBuilderCanStartFromCurrentLocation,
    minimumStops: routeBuilderMinimumStops,
    canConfirm: routeBuilderCanConfirm,
    hasConfirmedRoute: routeBuilderHasConfirmedRoute,
    enabled: routeBuilderEnabled,
    isDirty: routeBuilderIsDirty,
    completedLegs: routeBuilderCompletedLegs,
    completedView: routeBuilderCompletedView,
    pendingArrival: routeBuilderPendingArrival,
    arrivalAlertVisible: routeBuilderArrivalAlertVisible,
    recoveryMode: routeBuilderRecoveryMode,
    activeTarget: routeBuilderActiveTarget,
    distanceToActiveTargetLabel: routeBuilderDistanceToActiveTargetLabel,
    legCount: routeBuilderLegCount,
    hasPendingArrival: routeBuilderHasPendingArrival,
    hasFinished: routeBuilderHasFinished,
    etaLabel: routeBuilderEtaLabel,
    distanceLabel: routeBuilderDistanceLabel,
    isRouteError: isRouteBuilderError,
    isRouteFetching: isRouteBuilderFetching,
    retryRoute: refetchRouteBuilder,
    recoveryCoordinates: routeBuilderRecoveryCoordinates,
    recoverySource: routeBuilderRecoverySource,
    legVisuals: routeBuilderLegVisuals,
    addStopFromPlace: handleAddStopFromPlace,
    removeStop: handleRemoveRouteBuilderStop,
    clear: handleClearRouteBuilder,
    confirmRoute: handleConfirmRouteBuilder,
    exit: handleExitRouteBuilder,
    confirmArrivedLeg: handleConfirmArrivedRouteBuilderLeg,
    dismissArrivalAlert: handleDismissRouteBuilderArrivalAlert,
    resetProgress: handleResetRouteBuilderProgress,
    toggleCompletedView: handleToggleCompletedLegView,
  };
}
