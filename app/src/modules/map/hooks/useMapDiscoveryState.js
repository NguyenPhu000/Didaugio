import { useCallback, useEffect, useMemo, useState } from "react";
import { Keyboard, LayoutAnimation } from "react-native";
import { resolveMediaUrl } from "../../../lib/media-url";
import {
  getPlaceRatingValue,
  getPlaceReviewCount,
} from "../../place/utils/placeDisplay";
import { useBoundaryData } from "./useBoundaryData";
import { useFilterState } from "./useFilterState";
import { useHomeData } from "./useHomeData";
import { useMapPlaces } from "./useMapPlaces";
import { ALL_AREAS_KEY } from "../constants/filter.constants";
import { filterVisiblePlaces, getPlaceDistrictMeta } from "../utils/placeFilter";
import {
  buildAreaOptions,
  buildCategoryOptions,
} from "./useMapDiscoveryStateUtils";

export function useMapDiscoveryState({
  authUser,
  mapRegion,
  router,
  searchInputRef,
  selectedPlace,
  setSelectedPlace,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const {
    data: mapPlaces,
    isLoading: isPlacesLoading,
    error: placesError,
    refetch: refetchPlaces,
  } = useMapPlaces(mapRegion);
  const {
    districts: districtGeo,
    refetch: refetchBoundary,
  } = useBoundaryData();
  const { data: homeData } = useHomeData({ limit: 12 });

  const allPlaces = useMemo(
    () => (Array.isArray(mapPlaces) ? mapPlaces : []),
    [mapPlaces],
  );
  const categories = useMemo(
    () => buildCategoryOptions({ homeData, places: allPlaces }),
    [homeData, allPlaces],
  );
  const areaOptions = useMemo(
    () =>
      buildAreaOptions({
        places: allPlaces,
        getDistrictMeta: getPlaceDistrictMeta,
      }),
    [allPlaces],
  );

  const {
    activeFilterGroup,
    activeCategoryId,
    activeArea,
    quickFilters,
    filterPickerVisible,
    activeFilterGroupMeta,
    activeFilterSummaryLabel,
    filterPickerOptions,
    handleSelectFilterGroup,
    handleOpenFilterPicker,
    handleCloseFilterPicker,
    handleSelectFilterOption,
    handleResetFilters,
  } = useFilterState({
    categories,
    areaOptions,
  });

  const visiblePlaces = useMemo(
    () =>
      filterVisiblePlaces({
        places: allPlaces,
        searchText,
        activeCategoryId,
        activeArea,
        quickFilters,
        getRatingValue: getPlaceRatingValue,
        getReviewCount: getPlaceReviewCount,
        allAreasKey: ALL_AREAS_KEY,
      }),
    [allPlaces, searchText, activeCategoryId, activeArea, quickFilters],
  );

  useEffect(() => {
    if (!selectedPlace?.id) return;
    const latest = allPlaces.find(
      (place) => String(place?.id) === String(selectedPlace.id),
    );
    if (latest) {
      setSelectedPlace(latest);
    }
  }, [allPlaces, selectedPlace, setSelectedPlace]);

  const refetch = useCallback(() => {
    refetchPlaces?.();
    refetchBoundary?.();
  }, [refetchBoundary, refetchPlaces]);

  const openSearch = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchOpen(true);
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }, [searchInputRef]);

  const closeSearch = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchOpen(false);
    setSearchText("");
    Keyboard.dismiss();
  }, []);

  const currentUserAvatarUri = useMemo(
    () =>
      resolveMediaUrl(
        authUser?.profile?.avatar || authUser?.avatar || authUser?.photoURL,
      ),
    [authUser],
  );
  const selectedPlaceId = selectedPlace?.id ?? null;
  const activePlace = useMemo(
    () => visiblePlaces.find((place) => place.id === selectedPlaceId) || selectedPlace,
    [visiblePlaces, selectedPlaceId, selectedPlace],
  );

  const searchState = useMemo(
    () => ({
      open: searchOpen,
      text: searchText,
      inputRef: searchInputRef,
      currentUserAvatarUri,
    }),
    [currentUserAvatarUri, searchInputRef, searchOpen, searchText],
  );
  const searchHandlers = useMemo(
    () => ({
      setText: setSearchText,
      open: openSearch,
      close: closeSearch,
      avatarPress: () => router.push("/(tabs)/profile"),
    }),
    [closeSearch, openSearch, router],
  );
  const filterState = useMemo(
    () => ({
      activeFilterGroup,
      activeFilterGroupMeta,
      activeFilterSummaryLabel,
    }),
    [activeFilterGroup, activeFilterGroupMeta, activeFilterSummaryLabel],
  );
  const filterHandlers = useMemo(
    () => ({
      selectFilterGroup: handleSelectFilterGroup,
      openFilterPicker: handleOpenFilterPicker,
    }),
    [handleOpenFilterPicker, handleSelectFilterGroup],
  );

  return {
    activeArea,
    activeCategoryId,
    activeFilterGroupMeta,
    activePlace,
    allPlaces,
    districtGeo,
    error: placesError,
    filterHandlers,
    filterPickerOptions,
    filterPickerVisible,
    filterState,
    handleCloseFilterPicker,
    handleResetFilters,
    handleSelectFilterOption,
    isLoading: isPlacesLoading && allPlaces.length === 0,
    isPlacesLoading,
    quickFilters,
    refetch,
    searchHandlers,
    searchState,
    searchText,
    setSearchText,
    visiblePlaces,
  };
}
