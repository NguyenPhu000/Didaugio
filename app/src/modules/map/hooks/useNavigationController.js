import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calculateRouteApi } from "../../../api/routingApi";
import { mapRoutingResponse } from "./routeMapping";
import {
  buildSpatialIndex,
  calculateProgress,
  getDistanceM,
  isOffRoute as checkIsOffRoute,
  ROUTE_ENGINE_THRESHOLDS,
  snapToRoute,
  toMapCoordinate,
  normalizeHeadingDelta,
} from "../utils/routeEngine";
import {
  NAVIGATION_EVENTS,
  NAVIGATION_STATES,
  transitionNavigationState,
} from "../utils/navigationMachine";
import {
  GPS_LOST_TIMEOUT_MS,
  DEAD_RECKONING_MIN_SPEED_MPS,
} from "../constants/navigation.constants";

const UI_PUBLISH_INTERVAL_MS = 700;
const OFF_ROUTE_CONFIRM_TICKS = 3;
const GPS_LOST_MS = GPS_LOST_TIMEOUT_MS;
const CAMERA_MIN_INTERVAL_MS = 800;
const CAMERA_MIN_HEADING_DELTA_DEG = 10;
const CAMERA_ANIMATION_MS = 500;
const DEFAULT_CAMERA = Object.freeze({
  zoom: 17,
  pitch: 45,
});

function isAbortError(error) {
  return (
    error?.name === "AbortError" ||
    error?.name === "CanceledError" ||
    error?.code === "ERR_CANCELED"
  );
}

function normalizeDestination(destination) {
  if (!destination) return null;
  const lat = Number(destination.lat ?? destination.latitude);
  const lng = Number(destination.lng ?? destination.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    lat,
    lng,
    ...(destination.name ? { name: destination.name } : {}),
  };
}

function calculateKinematicCamera(speedKmh, distanceToManeuver) {
  const speed = Number(speedKmh);
  const distance = Number(distanceToManeuver);

  if (Number.isFinite(speed) && speed > 60) {
    return { zoom: 14, pitch: 30 };
  }

  if (
    (Number.isFinite(distance) && distance < 150) ||
    (Number.isFinite(speed) && speed < 20)
  ) {
    return { zoom: 18, pitch: 55 };
  }

  return DEFAULT_CAMERA;
}

export function useNavigationController({
  enabled = false,
  routeCoordinates = [],
  firstRoute = null,
  destination = null,
  mode = "motorcycle",
  options = {},
  mapRef = null,
  onRouteReplace,
} = {}) {
  const routeSteps = useMemo(
    () => firstRoute?.legs?.[0]?.steps ?? [],
    [firstRoute],
  );
  const normalizedDestination = useMemo(
    () => normalizeDestination(destination),
    [destination],
  );
  const spatialIndex = useMemo(
    () =>
      enabled && routeCoordinates.length > 1
        ? buildSpatialIndex(routeCoordinates)
        : null,
    [enabled, routeCoordinates],
  );
  const routeRef = useRef({
    coordinates: routeCoordinates,
    firstRoute,
    steps: routeSteps,
    spatialIndex,
  });
  const destinationRef = useRef(normalizedDestination);
  const optionsRef = useRef(options);
  const modeRef = useRef(mode);
  const segmentIndexRef = useRef(null);
  const offRouteCountRef = useRef(0);
  const shadowPromiseRef = useRef(null);
  const shadowAbortRef = useRef(null);
  const lastUiPublishRef = useRef(0);
  const lastGpsAtRef = useRef(0);
  const lastCameraUpdateRef = useRef(0);
  const lastCameraHeadingRef = useRef(null);
  const gpsLostSinceRef = useRef(null);
  const lastKnownSpeedRef = useRef(0);
  const [estimatedPosition, setEstimatedPosition] = useState(null);
  const [machineState, setMachineState] = useState(
    enabled ? NAVIGATION_STATES.NAVIGATING : NAVIGATION_STATES.IDLE,
  );
  const machineStateRef = useRef(machineState);
  const [routeOverride, setRouteOverride] = useState(null);
  const [navSnapshot, setNavSnapshot] = useState({
    state: enabled ? NAVIGATION_STATES.NAVIGATING : NAVIGATION_STATES.IDLE,
    isOffRoute: false,
    snappedPoint: null,
    segmentIndex: null,
    distanceToRoute: null,
    distanceToDest: null,
    distanceToNextTurn: null,
    upcomingStep: null,
    progress: null,
    routeOverride: null,
    lastLocation: null,
  });

  useEffect(() => {
    routeRef.current = {
      coordinates: routeCoordinates,
      firstRoute,
      steps: routeSteps,
      spatialIndex,
    };
  }, [firstRoute, routeCoordinates, routeSteps, spatialIndex]);

  useEffect(() => {
    destinationRef.current = normalizedDestination;
  }, [normalizedDestination]);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    machineStateRef.current = machineState;
  }, [machineState]);

  useEffect(() => {
    if (!enabled) {
      setMachineState(NAVIGATION_STATES.IDLE);
      segmentIndexRef.current = null;
      offRouteCountRef.current = 0;
      shadowAbortRef.current?.abort?.();
      shadowAbortRef.current = null;
      shadowPromiseRef.current = null;
      setRouteOverride(null);
      return;
    }

    setMachineState((prev) =>
      prev === NAVIGATION_STATES.IDLE
        ? NAVIGATION_STATES.NAVIGATING
        : prev,
    );
  }, [enabled]);

  const applyRoute = useCallback(
    (mappedRoute) => {
      if (!mappedRoute) return;
      setRouteOverride(mappedRoute);
      onRouteReplace?.(mappedRoute);
      offRouteCountRef.current = 0;
      shadowPromiseRef.current = null;
      shadowAbortRef.current = null;
      segmentIndexRef.current = null;
      setMachineState((prev) =>
        transitionNavigationState(prev, NAVIGATION_EVENTS.ROUTE_READY),
      );
    },
    [onRouteReplace],
  );

  const fetchRouteFromServer = useCallback((origin, signal) => {
    const dest = destinationRef.current;
    if (!origin || !dest) return Promise.resolve(null);

    return calculateRouteApi(
      {
        origin: {
          lat: origin.latitude,
          lng: origin.longitude,
        },
        destination: dest,
        mode: modeRef.current,
        options: {
          alternatives: 1,
          steps: true,
          overview: "full",
          geometries: "polyline6",
          snapToRoad: true,
          simplifyGeometry: true,
          ...optionsRef.current,
        },
      },
      { signal },
    ).then(mapRoutingResponse);
  }, []);

  const startShadowReroute = useCallback(
    (location) => {
      if (shadowPromiseRef.current) return;
      shadowAbortRef.current = new AbortController();
      shadowPromiseRef.current = fetchRouteFromServer(
        location,
        shadowAbortRef.current.signal,
      );
    },
    [fetchRouteFromServer],
  );

  const confirmReroute = useCallback(
    (location) => {
      const existingPromise = shadowPromiseRef.current;
      const routePromise = existingPromise || fetchRouteFromServer(location);

      routePromise
        .then(applyRoute)
        .catch((error) => {
          if (isAbortError(error)) return;
          if (!existingPromise) return;
          fetchRouteFromServer(location)
            .then(applyRoute)
            .catch(() => {});
        })
        .catch(() => {});
    },
    [applyRoute, fetchRouteFromServer],
  );

  const cancelShadowReroute = useCallback(() => {
    offRouteCountRef.current = 0;
    shadowAbortRef.current?.abort?.();
    shadowAbortRef.current = null;
    shadowPromiseRef.current = null;
  }, []);

  const safeAnimateCamera = useCallback(
    (location, distanceToNextTurn) => {
      if (!mapRef?.current) return;
      const isFirstCamera = lastCameraUpdateRef.current === 0;
      if (!isFirstCamera && !Number.isFinite(location?.heading)) return;
      const now = Date.now();
      if (now - lastCameraUpdateRef.current < CAMERA_MIN_INTERVAL_MS) return;

      const heading = Number.isFinite(location?.heading)
        ? location.heading
        : (lastCameraHeadingRef.current ?? 0);
      const previousHeading = lastCameraHeadingRef.current;
      const headingDelta =
        previousHeading === null
          ? CAMERA_MIN_HEADING_DELTA_DEG + 1
          : normalizeHeadingDelta(heading, previousHeading);
      if (
        headingDelta !== null &&
        headingDelta <= CAMERA_MIN_HEADING_DELTA_DEG
      ) {
        return;
      }

      const speedKmh = Number(location.speedKmh ?? location.speed ?? 0);
      const camera = calculateKinematicCamera(speedKmh, distanceToNextTurn);
      lastCameraUpdateRef.current = now;
      lastCameraHeadingRef.current = heading;
      mapRef.current.animateCamera?.(
        {
          center: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          heading,
          pitch: camera.pitch,
          zoom: camera.zoom,
        },
        { duration: CAMERA_ANIMATION_MS },
      );
    },
    [mapRef],
  );

  const handleLocationUpdate = useCallback(
    (location) => {
      if (!enabled || !location) return;
      lastGpsAtRef.current = Date.now();
      gpsLostSinceRef.current = null;
      lastKnownSpeedRef.current = Number(location.speedKmh ?? location.speed ?? 0) / 3.6;
      const route = routeRef.current;
      if (!route.coordinates?.length || route.coordinates.length < 2) return;

      const snap = snapToRoute(location, route.coordinates, segmentIndexRef.current, {
        spatialIndex: route.spatialIndex,
        heading: location.heading,
      });
      if (!snap) return;

      segmentIndexRef.current = snap.segmentIndex;
      const offRoute = checkIsOffRoute(snap.distanceToRoute);
      const distanceToDest = destinationRef.current
        ? getDistanceM(location, destinationRef.current)
        : null;
      const upcomingStep = route.steps?.find((step) => {
        const loc = step?.maneuver?.location;
        if (!Array.isArray(loc) || loc.length < 2) return false;
        return getDistanceM(location, { lat: loc[1], lng: loc[0] }) > 25;
      }) ?? route.steps?.[route.steps.length - 1] ?? null;
      const maneuverLocation = upcomingStep?.maneuver?.location;
      const distanceToNextTurn = Array.isArray(maneuverLocation)
        ? getDistanceM(location, {
            lat: maneuverLocation[1],
            lng: maneuverLocation[0],
          })
        : null;
      const speedKmh = Number(location.speedKmh ?? location.speed ?? 0);
      const progress = calculateProgress(
        location,
        route.coordinates,
        route.steps,
        speedKmh,
        snap.segmentIndex,
      );

      if (offRoute) {
        offRouteCountRef.current += 1;
        if (offRouteCountRef.current === 1) {
          startShadowReroute(location);
        }
        if (offRouteCountRef.current >= OFF_ROUTE_CONFIRM_TICKS) {
          setMachineState((prev) =>
            transitionNavigationState(prev, NAVIGATION_EVENTS.OFF_ROUTE_CONFIRMED),
          );
          confirmReroute(location);
        }
      } else {
        cancelShadowReroute();
        setMachineState((prev) => {
          if (
            distanceToDest !== null &&
            distanceToDest <= ROUTE_ENGINE_THRESHOLDS.ARRIVAL_DISTANCE_M
          ) {
            return transitionNavigationState(prev, NAVIGATION_EVENTS.ARRIVED);
          }
          if (
            distanceToDest !== null &&
            distanceToDest <= ROUTE_ENGINE_THRESHOLDS.APPROACHING_DISTANCE_M
          ) {
            return transitionNavigationState(prev, NAVIGATION_EVENTS.NEAR_DESTINATION);
          }
          return prev === NAVIGATION_STATES.SUSPENDED
            ? transitionNavigationState(prev, NAVIGATION_EVENTS.GPS_FOUND)
            : prev;
        });
      }

      safeAnimateCamera(location, distanceToNextTurn);

      const now = Date.now();
      if (now - lastUiPublishRef.current < UI_PUBLISH_INTERVAL_MS) return;
      lastUiPublishRef.current = now;
      setNavSnapshot((prev) => ({
        ...prev,
        state: machineStateRef.current,
        isOffRoute: offRoute,
        snappedPoint: toMapCoordinate(snap.snappedPoint),
        segmentIndex: snap.segmentIndex,
        distanceToRoute: snap.distanceToRoute,
        distanceToDest,
        distanceToNextTurn,
        upcomingStep,
        progress,
        routeOverride,
        lastLocation: location,
      }));
    },
    [
      cancelShadowReroute,
      confirmReroute,
      enabled,
      routeOverride,
      safeAnimateCamera,
      startShadowReroute,
    ],
  );

  useEffect(() => {
    if (!enabled) return undefined;

    const interval = setInterval(() => {
      if (!lastGpsAtRef.current) return;
      if (Date.now() - lastGpsAtRef.current > GPS_LOST_MS) {
        if (!gpsLostSinceRef.current) {
          gpsLostSinceRef.current = lastGpsAtRef.current;
        }
        setMachineState((prev) =>
          transitionNavigationState(prev, NAVIGATION_EVENTS.GPS_LOST),
        );
      }
    }, GPS_LOST_MS);

    return () => clearInterval(interval);
  }, [enabled]);

  useEffect(() => {
    if (machineState !== NAVIGATION_STATES.SUSPENDED || !gpsLostSinceRef.current) {
      setEstimatedPosition(null);
      return undefined;
    }

    const tick = () => {
      const speedMps = lastKnownSpeedRef.current;
      if (speedMps < DEAD_RECKONING_MIN_SPEED_MPS) {
        setEstimatedPosition(null);
        return;
      }

      const elapsedS = (Date.now() - gpsLostSinceRef.current) / 1000;
      const route = routeRef.current;
      if (!route.coordinates?.length || route.coordinates.length < 2) return;

      const lastSnap = segmentIndexRef.current;
      if (!Number.isInteger(lastSnap) || lastSnap < 0) return;

      const cumulative = [0];
      for (let i = 1; i < route.coordinates.length; i += 1) {
        cumulative[i] = cumulative[i - 1] + getDistanceM(route.coordinates[i - 1], route.coordinates[i]);
      }

      const segStart = cumulative[lastSnap] || 0;
      const projectedMeters = segStart + speedMps * elapsedS;
      const totalMeters = cumulative[cumulative.length - 1] || 0;
      if (projectedMeters >= totalMeters) return;

      let segIdx = lastSnap;
      while (segIdx < cumulative.length - 1 && cumulative[segIdx + 1] < projectedMeters) {
        segIdx += 1;
      }

      const segLen = (cumulative[segIdx + 1] || 0) - (cumulative[segIdx] || 0);
      const fraction = segLen > 0 ? (projectedMeters - cumulative[segIdx]) / segLen : 0;
      const a = route.coordinates[segIdx];
      const b = route.coordinates[segIdx + 1];
      if (!a || !b) return;

      const aLat = a.latitude ?? a.lat;
      const aLng = a.longitude ?? a.lng;
      const bLat = b.latitude ?? b.lat;
      const bLng = b.longitude ?? b.lng;

      const estimated = {
        latitude: aLat + (bLat - aLat) * fraction,
        longitude: aLng + (bLng - aLng) * fraction,
      };

      const snap = snapToRoute(estimated, route.coordinates, segIdx, {
        spatialIndex: route.spatialIndex,
      });
      if (snap?.snappedPoint) {
        setEstimatedPosition(toMapCoordinate(snap.snappedPoint));
      } else {
        setEstimatedPosition(estimated);
      }
    };

    tick();
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, [machineState]);

  useEffect(() => {
    setNavSnapshot((prev) => ({
      ...prev,
      state: machineState,
      routeOverride,
    }));
  }, [machineState, routeOverride]);

  const isGpsLost = machineState === NAVIGATION_STATES.SUSPENDED;

  return {
    ...navSnapshot,
    state: machineState,
    routeOverride,
    isGpsLost,
    estimatedPosition: isGpsLost ? estimatedPosition : null,
    onLocationUpdate: handleLocationUpdate,
  };
}
