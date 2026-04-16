import { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";

const LAST_KNOWN_MAX_AGE_MS = 5 * 60 * 1000;

export function useMapLocationTracker({ watchEnabled = false } = {}) {
  const [currentLocation, setCurrentLocation] = useState(null);

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

        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } catch {
        // Keep silent: route can still be shown after manual locate.
      }
    };

    preloadCurrentLocation();

    return () => {
      cancelled = true;
    };
  }, []);

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
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 12,
            timeInterval: 5000,
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
        // Keep silent: route builder still works with manual locate updates.
      }
    };

    watchLocation();

    return () => {
      active = false;
      subscriber?.remove?.();
    };
  }, [watchEnabled]);

  const locateNow = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setCurrentLocation(nextLocation);
      return nextLocation;
    } catch {
      return null;
    }
  }, []);

  return {
    currentLocation,
    setCurrentLocation,
    locateNow,
  };
}
