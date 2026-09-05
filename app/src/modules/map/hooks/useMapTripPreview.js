import { useCallback, useEffect, useMemo, useState } from "react";
import { useWindowDimensions } from "react-native";
import { calculateRouteApi } from "../../../api/routingApi";
import { sendLocalNotification } from "../../../lib/local-notifications";
import { mapRoutingResponse } from "./routeMapping";
import {
  buildTripPreviewDays,
  buildTripPreviewSegments,
  buildTripPreviewStops,
  getDefaultTripPreviewDayNumber,
  getTripPreviewDayStartState,
  getTripPreviewSheetHeight,
} from "../utils/tripRoutePreview";
import { buildTripPreviewRouteRequest } from "./useMapTripPreviewUtils";
import { showAppAlert } from "../../../utils/appAlert";

export function useMapTripPreview({
  activeTrip,
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
  const { height: viewportHeight } = useWindowDimensions();
  const [previewNow, setPreviewNow] = useState(() => new Date());
  const [selectedPreviewDayNumber, setSelectedPreviewDayNumber] = useState(null);
  const [previewRouteResults, setPreviewRouteResults] = useState([]);
  const [isPreviewRouteLoading, setIsPreviewRouteLoading] = useState(false);
  const [isPreviewRouteError, setIsPreviewRouteError] = useState(false);

  const previewDays = useMemo(
    () =>
      buildTripPreviewDays({
        destinations: previewTrip?.destinations || [],
        startDate: previewTrip?.startDate,
        now: previewNow,
      }),
    [previewNow, previewTrip?.destinations, previewTrip?.startDate],
  );
  const defaultPreviewDayNumber = useMemo(
    () => getDefaultTripPreviewDayNumber(previewDays),
    [previewDays],
  );
  const selectedPreviewDay = useMemo(
    () =>
      previewDays.find((day) => day.dayNumber === selectedPreviewDayNumber) ||
      previewDays.find((day) => day.dayNumber === defaultPreviewDayNumber) ||
      null,
    [defaultPreviewDayNumber, previewDays, selectedPreviewDayNumber],
  );
  const isSelectedPreviewDayStartAllowed =
    getTripPreviewDayStartState(selectedPreviewDay).canStart;
  const previewDestinations = useMemo(
    () => selectedPreviewDay?.destinations || previewTrip?.destinations || [],
    [previewTrip?.destinations, selectedPreviewDay?.destinations],
  );

  useEffect(() => {
    if (!isTripPreviewMode) {
      setSelectedPreviewDayNumber(null);
      return;
    }

    setSelectedPreviewDayNumber((currentDayNumber) =>
      previewDays.some((day) => day.dayNumber === currentDayNumber)
        ? currentDayNumber
        : defaultPreviewDayNumber,
    );
  }, [defaultPreviewDayNumber, isTripPreviewMode, previewDays]);

  useEffect(() => {
    if (!isTripPreviewMode || !previewTrip?.startDate) return undefined;

    setPreviewNow(new Date());
    let timer;
    const scheduleNextMidnight = () => {
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0);
      timer = setTimeout(() => {
        setPreviewNow(new Date());
        scheduleNextMidnight();
      }, Math.max(nextMidnight.getTime() - Date.now() + 100, 1000));
    };
    scheduleNextMidnight();
    return () => clearTimeout(timer);
  }, [isTripPreviewMode, previewTrip?.startDate]);

  const previewStops = useMemo(
    () => buildTripPreviewStops(previewDestinations),
    [previewDestinations],
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
  const previewSheetHeight = getTripPreviewSheetHeight(viewportHeight);

  useEffect(() => {
    if (!isTripPreviewMode || previewStops.length < 2) {
      setPreviewRouteResults([]);
      setIsPreviewRouteLoading(false);
      setIsPreviewRouteError(false);
      return;
    }

    let cancelled = false;
    const abortController = new AbortController();
    setPreviewRouteResults([]);
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
            { signal: abortController.signal },
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
      abortController.abort();
    };
  }, [isTripPreviewMode, previewStops, resolveTravelMode]);

  useEffect(() => {
    if (!isTripPreviewMode || previewFitCoordinates.length < 2) return;
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates?.(previewFitCoordinates, {
        edgePadding: {
          top: (insets.top || 0) + 130,
          right: 48,
          bottom: previewSheetHeight + 32,
          left: 48,
        },
        animated: true,
      });
    }, 180);
    return () => clearTimeout(timer);
  }, [
    insets.top,
    isTripPreviewMode,
    mapRef,
    previewFitCoordinates,
    previewSheetHeight,
  ]);

  const handleCancelTripPreview = useCallback(() => {
    setPreviewRouteResults([]);
    router.setParams({ tripPreviewId: undefined });
    router.back();
  }, [router]);

  const handleConfirmTripPreview = useCallback(() => {
    if (!previewTrip?.id || updatePreviewTripMutation.isPending) return;
    if (!isSelectedPreviewDayStartAllowed) return;
    if (previewStops.length === 0) {
      showAppAlert({
        title: t("common.error"),
        message: t("mapScreen.previewNoStops"),
        type: "error",
        buttons: [{ text: t("common.close") }],
      });
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
          showAppAlert({
            title: t("common.error"),
            message: error?.message || t("trip.detail.startError"),
            type: "error",
            buttons: [{ text: t("common.close") }],
          });
        },
      },
    );
  }, [
    activeTrip,
    followCameraRef,
    locateActiveTripNow,
    isSelectedPreviewDayStartAllowed,
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
    isSelectedPreviewDayStartAllowed,
    previewSegments,
    previewDays,
    previewStops,
    selectedPreviewDay,
    setSelectedPreviewDayNumber,
  };
}
