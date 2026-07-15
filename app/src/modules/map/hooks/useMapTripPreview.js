import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { calculateRouteApi } from "../../../api/routingApi";
import { sendLocalNotification } from "../../../lib/local-notifications";
import { mapRoutingResponse } from "./routeMapping";
import {
  buildTripPreviewSegments,
  buildTripPreviewStops,
} from "../utils/tripRoutePreview";
import { buildTripPreviewRouteRequest } from "./useMapTripPreviewUtils";

export function useMapTripPreview({
  activeTrip,
  floatingTabClearance,
  followCameraRef,
  insets,
  isTripPreviewMode,
  locateActiveTripNow,
  mapRef,
  previewTrip,
  resolveTravelMode,
  router,
  t,
  updatePreviewTripMutation,
}) {
  const [previewRouteResults, setPreviewRouteResults] = useState([]);
  const [isPreviewRouteLoading, setIsPreviewRouteLoading] = useState(false);
  const [isPreviewRouteError, setIsPreviewRouteError] = useState(false);

  const previewStops = useMemo(
    () => buildTripPreviewStops(previewTrip?.destinations || []),
    [previewTrip?.destinations],
  );

  const previewSegments = useMemo(
    () => buildTripPreviewSegments(previewStops, previewRouteResults),
    [previewRouteResults, previewStops],
  );

  const previewFitCoordinates = useMemo(() => {
    if (previewSegments.length > 0) {
      return previewSegments.flatMap((segment) => segment.coordinates);
    }
    return previewStops.map((stop) => stop.coordinate);
  }, [previewSegments, previewStops]);

  useEffect(() => {
    if (!isTripPreviewMode || previewStops.length < 2) {
      setPreviewRouteResults([]);
      setIsPreviewRouteLoading(false);
      setIsPreviewRouteError(false);
      return;
    }

    let cancelled = false;
    setIsPreviewRouteLoading(true);
    setIsPreviewRouteError(false);

    Promise.all(
      previewStops.slice(0, -1).map(async (from, index) => {
        const to = previewStops[index + 1];
        try {
          const response = await calculateRouteApi(
            buildTripPreviewRouteRequest({
              from,
              to,
              resolveMode: resolveTravelMode,
            }),
          );
          return mapRoutingResponse(response);
        } catch {
          return {
            coordinates: [from.coordinate, to.coordinate],
            distanceM: null,
            source: "fallback",
          };
        }
      }),
    )
      .then((results) => {
        if (cancelled) return;
        const hasFallback = results.some(
          (result) => result.source === "fallback",
        );
        setPreviewRouteResults(results);
        setIsPreviewRouteError(hasFallback);
      })
      .finally(() => {
        if (!cancelled) setIsPreviewRouteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isTripPreviewMode, previewStops, resolveTravelMode]);

  useEffect(() => {
    if (!isTripPreviewMode || previewFitCoordinates.length < 2) return;
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates?.(previewFitCoordinates, {
        edgePadding: {
          top: (insets.top || 0) + 130,
          right: 48,
          bottom: floatingTabClearance + 150,
          left: 48,
        },
        animated: true,
      });
    }, 180);
    return () => clearTimeout(timer);
  }, [
    floatingTabClearance,
    insets.top,
    isTripPreviewMode,
    mapRef,
    previewFitCoordinates,
  ]);

  const handleCancelTripPreview = useCallback(() => {
    setPreviewRouteResults([]);
    router.setParams({ tripPreviewId: undefined });
    router.back();
  }, [router]);

  const handleConfirmTripPreview = useCallback(() => {
    if (!previewTrip?.id || updatePreviewTripMutation.isPending) return;
    if (previewStops.length === 0) {
      Alert.alert(t("common.error"), t("mapScreen.previewNoStops"));
      return;
    }

    updatePreviewTripMutation.mutate(
      { status: "in-progress" },
      {
        onSuccess: async () => {
          await activeTrip.startActiveTrip(previewTrip.id);
          await sendLocalNotification({
            title: t("trip.detail.startNotification"),
            body: t("trip.detail.startNotificationBody", {
              title: previewTrip.title || t("trip.detail.defaultTitle"),
            }),
            data: { tripId: previewTrip.id },
          });
          router.setParams({ tripPreviewId: undefined });
          followCameraRef.current = true;
          await locateActiveTripNow();
        },
        onError: (error) => {
          Alert.alert(
            t("common.error"),
            error?.message || t("trip.detail.startError"),
          );
        },
      },
    );
  }, [
    activeTrip,
    followCameraRef,
    locateActiveTripNow,
    previewStops.length,
    previewTrip,
    router,
    t,
    updatePreviewTripMutation,
  ]);

  return {
    handleCancelTripPreview,
    handleConfirmTripPreview,
    isPreviewRouteError,
    isPreviewRouteLoading,
    previewSegments,
    previewStops,
  };
}
