import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { useSharedValue } from "react-native-reanimated";
import { distanceMeters } from "../utils/distance";
import { normalizeHeadingDelta } from "../utils/routeEngine";

const LAST_KNOWN_MAX_AGE_MS = 5 * 60 * 1000;
const WATCH_STATE_PUBLISH_INTERVAL_MS = 3500;
const WATCH_STATE_PUBLISH_DISTANCE_M = 18;
const HEADING_FREEZE_SPEED_KMH = 3;

export function useMapLocationTracker({
  watchEnabled = false,
  timeInterval = 5000,
  distanceInterval = 12,
  onLocationUpdate,
} = {}) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [heading, setHeading] = useState(null);
  const currentLocationSharedValue = useSharedValue(null);
  const currentLocationRef = useRef(null);
  const lastPublishedAtRef = useRef(0);
  const headingRef = useRef(null);
  const headingAccuracyRef = useRef(null);

  const mergeHeading = useCallback((loc) => {
    if (!loc) return loc;
    const speedKmh = Number.isFinite(loc.speedKmh)
      ? loc.speedKmh
      : Number.isFinite(loc.speed)
        ? loc.speed * 3.6
        : null;
    const shouldFreezeHeading =
      Number.isFinite(speedKmh) &&
      speedKmh < HEADING_FREEZE_SPEED_KMH &&
      headingRef.current !== null;
    const h = shouldFreezeHeading ? headingRef.current : loc.heading ?? headingRef.current;
    const ha = loc.headingAccuracy ?? headingAccuracyRef.current;
    return { ...loc, heading: h, headingAccuracy: ha, speedKmh };
  }, []);

  const publishLocation = useCallback(
    (nextLocation, { force = false } = {}) => {
      if (
        !nextLocation ||
        !Number.isFinite(nextLocation.latitude) ||
        !Number.isFinite(nextLocation.longitude)
      ) {
        return;
      }

      const previous = currentLocationRef.current;
      const movedMeters = previous
        ? distanceMeters(
            previous.latitude,
            previous.longitude,
            nextLocation.latitude,
            nextLocation.longitude,
          )
        : Number.POSITIVE_INFINITY;
      const now = Date.now();
      const elapsed = now - lastPublishedAtRef.current;
      const merged = mergeHeading(nextLocation);
      currentLocationSharedValue.value = merged;
      currentLocationRef.current = merged;

      if (typeof onLocationUpdate === "function") {
        try {
          onLocationUpdate(merged);
        } catch {
          // Keep GPS watcher alive even if a navigation subscriber fails.
        }
      }

      if (
        force ||
        !previous ||
        elapsed >= WATCH_STATE_PUBLISH_INTERVAL_MS ||
        movedMeters >= WATCH_STATE_PUBLISH_DISTANCE_M
      ) {
        lastPublishedAtRef.current = now;
        setCurrentLocation(merged);
      }
    },
    [currentLocationSharedValue, mergeHeading, onLocationUpdate],
  );

  // Compass heading watcher — updates heading continuously
  useEffect(() => {
    if (!watchEnabled) return undefined;

    let subscriber = null;
    let active = true;

    const startHeadingWatch = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (!active || status !== "granted") return;

        const sub = await Location.watchHeadingAsync((headingData) => {
          if (!active) return;
          const raw =
            headingData.trueHeading >= 0
              ? headingData.trueHeading
              : headingData.magHeading;
          if (!Number.isFinite(raw)) return;

          // Filter minor sensor fluctuations to prevent excessive re-renders (at least 2 degrees change)
          const prev = headingRef.current;
          const prevAcc = headingAccuracyRef.current;
          const rawAcc = headingData.accuracy;

          if (prev !== null && normalizeHeadingDelta(raw, prev) < 2 && prevAcc === rawAcc) {
            return;
          }

          headingRef.current = raw;
          headingAccuracyRef.current = rawAcc;
          setHeading(raw);
          if (currentLocationRef.current) {
            const updated = { 
              ...currentLocationRef.current, 
              heading: raw, 
              headingAccuracy: rawAcc 
            };
            currentLocationRef.current = updated;
            currentLocationSharedValue.value = updated;
          }
          setCurrentLocation((prevLoc) => {
            if (!prevLoc) return prevLoc;
            if (prevLoc.heading === raw && prevLoc.headingAccuracy === rawAcc) return prevLoc;
            return { 
              ...prevLoc, 
              heading: raw, 
              headingAccuracy: rawAcc 
            };
          });
        });

        if (!active) {
          sub?.remove?.();
          return;
        }
        subscriber = sub;
      } catch {
        // Compass not available on some devices — silent fallback.
      }
    };

    startHeadingWatch();

    return () => {
      active = false;
      subscriber?.remove?.();
    };
  }, [currentLocationSharedValue, watchEnabled]);

  useEffect(() => {
    let cancelled = false;

    const preloadCurrentLocation = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted") return;

        const lastKnown = await Location.getLastKnownPositionAsync({
          maxAge: LAST_KNOWN_MAX_AGE_MS,
        });

        const position =
          lastKnown ||
          (await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }));

        if (!position?.coords || cancelled) return;

        publishLocation(
          {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading: position.coords.heading ?? undefined,
            speed: position.coords.speed ?? undefined,
          },
          { force: true },
        );
      } catch {
        // Keep silent: route can still be shown after manual locate.
      }
    };

    preloadCurrentLocation();

    return () => {
      cancelled = true;
    };
  }, [publishLocation]);

  useEffect(() => {
    if (!watchEnabled) return undefined;

    let subscriber = null;
    let active = true;

    const watchLocation = async () => {
      try {
        let permission = await Location.getForegroundPermissionsAsync();
        if (permission.status !== "granted") {
          permission = await Location.requestForegroundPermissionsAsync();
        }
        if (!active || permission.status !== "granted") return;

        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: distanceInterval,
            timeInterval: timeInterval,
          },
          (location) => {
            if (!location?.coords) return;
            publishLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              heading: location.coords.heading ?? undefined,
              speed: location.coords.speed ?? undefined,
            });
          },
        );

        if (!active) {
          sub?.remove?.();
          return;
        }
        subscriber = sub;
      } catch {
        // Keep silent: location tracking still works with manual locate updates.
      }
    };

    watchLocation();

    return () => {
      active = false;
      subscriber?.remove?.();
    };
  }, [publishLocation, watchEnabled, timeInterval, distanceInterval]);

  const locateNow = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return null;

      // Return last known instantly
      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: LAST_KNOWN_MAX_AGE_MS,
      });

      if (lastKnown?.coords) {
        const nextLocation = {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
          heading: headingRef.current ?? lastKnown.coords.heading ?? undefined,
          speed: lastKnown.coords.speed ?? undefined,
        };
        publishLocation(nextLocation, { force: true });

        // Then fetch accurate position in background
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        })
          .then((location) => {
            if (!location?.coords) return;
            publishLocation(
              {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                heading:
                  location.coords.heading ?? headingRef.current ?? undefined,
                speed: location.coords.speed ?? undefined,
              },
              { force: true },
            );
          })
          .catch(() => {});

        return nextLocation;
      }

      // No last known — wait for accurate fix
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!location?.coords) return null;

      const nextLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        heading: headingRef.current ?? location.coords.heading ?? undefined,
        speed: location.coords.speed ?? undefined,
      };
      publishLocation(nextLocation, { force: true });
      return nextLocation;
    } catch {
      return null;
    }
  }, [publishLocation]);

  return {
    currentLocation,
    heading,
    currentLocationRef,
    currentLocationSharedValue,
    setCurrentLocation,
    locateNow,
  };
}
