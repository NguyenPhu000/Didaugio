import { useEffect } from "react";

const LAT_OFFSET_WITH_PLACE = 0.0022;

function firstParam(value) {
  return Array.isArray(value) ? value[0] : value;
}

export function buildMapRouteParamsState(params = {}) {
  const focusLat = firstParam(params.focusLat);
  const focusLng = firstParam(params.focusLng);
  const focusPlaceId = firstParam(params.focusPlaceId);
  const search = firstParam(params.search);
  const lat = Number(focusLat);
  const lng = Number(focusLng);
  const hasValidFocus =
    focusLat !== undefined &&
    focusLng !== undefined &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);
  const placeId = focusPlaceId ? String(focusPlaceId) : "";

  return {
    startNav: firstParam(params.startNav) === "true",
    resumeNav: firstParam(params.resumeNav) === "true",
    focus: hasValidFocus
      ? {
          lat,
          lng,
          placeId,
          key: `${lat}:${lng}:${placeId}`,
        }
      : null,
    startRoute: firstParam(params.startRoute) === "true",
    searchText: search ? String(search) : "",
  };
}

export function useMapRouteParams({
  activeTrip,
  lastAppliedFocusRef,
  mapPlaces,
  mapRef,
  params,
  router,
  setRoutingPlace,
  setSearchText,
  setSelectedPlace,
  setStartNavConfirmVisible,
}) {
  useEffect(() => {
    const routeParams = buildMapRouteParamsState(params);

    if (routeParams.startNav) {
      setStartNavConfirmVisible(true);
      router.setParams({ startNav: undefined });
    }

    if (routeParams.resumeNav) {
      activeTrip.resumeActiveTrip();
      router.setParams({ resumeNav: undefined });
    }

    if (routeParams.searchText) {
      setSearchText(routeParams.searchText);
    }

    if (!routeParams.focus) return;

    const { lat, lng, placeId, key } = routeParams.focus;
    if (lastAppliedFocusRef.current !== key) {
      lastAppliedFocusRef.current = key;
      mapRef.current?.flyTo(
        [lng, lat - (placeId ? LAT_OFFSET_WITH_PLACE : 0)],
        15,
      );
    }

    if (!placeId) return;
    const matchedPlace = (mapPlaces || []).find(
      (place) =>
        String(place.id) === placeId || String(place.slug) === placeId,
    );
    if (!matchedPlace) return;

    setSelectedPlace(matchedPlace);
    if (routeParams.startRoute) {
      setRoutingPlace(matchedPlace);
      router.setParams({ startRoute: undefined });
    }
  }, [
    activeTrip,
    lastAppliedFocusRef,
    mapPlaces,
    mapRef,
    params,
    router,
    setRoutingPlace,
    setSearchText,
    setSelectedPlace,
    setStartNavConfirmVisible,
  ]);
}
