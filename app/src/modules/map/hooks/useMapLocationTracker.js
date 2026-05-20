import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { useSharedValue } from "react-native-reanimated";
import { distanceMeters } from "../utils/distance";

const LAST_KNOWN_MAX_AGE_MS = 5 * 60 * 1000;
const WATCH_STATE_PUBLISH_INTERVAL_MS = 3500;
const WATCH_STATE_PUBLISH_DISTANCE_M = 18;

export function useMapLocationTracker({ watchEnabled = false } = {}) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const currentLocationSharedValue = useSharedValue(null);
  const currentLocationRef = useRef(null);
  const lastPublishedAtRef = useRef(0);

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
      currentLocationSharedValue.value = nextLocation;
      currentLocationRef.current = nextLocation;

      if (
        force ||
        !previous ||
        elapsed >= WATCH_STATE_PUBLISH_INTERVAL_MS ||
        movedMeters >= WATCH_STATE_PUBLISH_DISTANCE_M
      ) {
        lastPublishedAtRef.current = now;
        setCurrentLocation(nextLocation);
      }
    },
    [currentLocationSharedValue],
  );

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

        subscriber = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 12,
            timeInterval: 5000,
          },
          (location) => {
            if (!location?.coords) return;
            publishLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          },
        );
      } catch {
        // Keep silent: route builder still works with manual locate updates.
      }
    };

    watchLocation();

    return () => {
      active = false;
      subscriber?.remove?.();
    };
  }, [publishLocation, watchEnabled]);

  const locateNow = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const nextLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      publishLocation(nextLocation, { force: true });
      return nextLocation;
    } catch {
      return null;
    }
  }, [publishLocation]);

  return {
    currentLocation,
    currentLocationRef,
    currentLocationSharedValue,
    setCurrentLocation,
    locateNow,
  };
}
