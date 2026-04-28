import { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";

const LAST_KNOWN_MAX_AGE_MS = 5 * 60 * 1000;

export function useExploreLocation({ watchEnabled = false } = {}) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [permission, setPermission] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const preload = async () => {
      try {
        const p = await Location.getForegroundPermissionsAsync();
        if (cancelled) return;
        setPermission(p?.status || null);
        if (p?.status !== "granted") return;

        const lastKnown = await Location.getLastKnownPositionAsync({
          maxAge: LAST_KNOWN_MAX_AGE_MS,
        });

        const position =
          lastKnown ||
          (await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }));

        if (!position?.coords || cancelled) return;

        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } catch {
        // Keep silent: Explore still works without location.
      }
    };

    preload();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!watchEnabled) return undefined;

    let subscriber = null;
    let active = true;

    const watch = async () => {
      try {
        let p = await Location.getForegroundPermissionsAsync();
        if (p.status !== "granted") {
          p = await Location.requestForegroundPermissionsAsync();
        }
        if (!active) return;
        setPermission(p?.status || null);
        if (p.status !== "granted") return;

        subscriber = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 25,
            timeInterval: 6000,
          },
          (location) => {
            if (!location?.coords) return;
            setCurrentLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          },
        );
      } catch {
        // Ignore.
      }
    };

    watch();

    return () => {
      active = false;
      subscriber?.remove?.();
    };
  }, [watchEnabled]);

  const locateNow = useCallback(async () => {
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      setPermission(p?.status || null);
      if (p.status !== "granted") return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const next = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setCurrentLocation(next);
      return next;
    } catch {
      return null;
    }
  }, []);

  return {
    currentLocation,
    permission,
    locateNow,
  };
}

