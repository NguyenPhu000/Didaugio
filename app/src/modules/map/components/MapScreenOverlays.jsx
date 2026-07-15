import { View } from "react-native";
import StartNavigationModal from "./navigation/StartNavigationModal";
import TripCompleteModal from "./navigation/TripCompleteModal";
import NavigationStatusBanner from "./navigation/NavigationStatusBanner";
import ArrivalBanner from "./navigation/ArrivalBanner";
import MapTopControls from "./MapTopControls";
import { CheckInButton } from "./CheckInButton";
import MapFabStack from "./MapFabStack";
import MapStatusPill from "./MapStatusPill";
import MapPlacePreviewCard from "./MapPlacePreviewCard";
import FilterPickerModal from "./filters/FilterPickerModal";

export function MapScreenOverlays({
  activeDistanceToTarget,
  activeArrivalVisible,
  activeEventId,
  activeFilterGroupMeta,
  activeNextDestination,
  activePlace,
  activeTrip,
  activeTripLocation,
  activeTripSpeedKmh,
  activeTargetPoint,
  completeDayNumber,
  completeIsTripEnd,
  createMomentMutation,
  error,
  filterHandlers,
  filterPickerOptions,
  filterPickerVisible,
  filterState,
  floatingTabClearance,
  followCameraRef,
  handleCloseFilterPicker,
  handleClosePreview,
  handleConfirmTripComplete,
  handleConfirmActiveArrival,
  handleDismissActiveArrival,
  handleExitActiveTrip,
  handleLocate,
  handleOpenPlaceDetail,
  handleResetFilters,
  handleSelectFilterOption,
  handleStartRouteFromPreview,
  handleTopControlsLayout,
  hasActiveFilters,
  hasMeasuredTopControls,
  insets,
  isActiveTripMode,
  isCompactPreviewCard,
  isMomentUploading,
  isPlacesLoading,
  isRouteFetching,
  isScreenDimmed,
  isTripPreviewMode,
  layerModalVisible,
  locateActiveTripNow,
  mapFabTopOffset,
  mapStatusTopOffset,
  mapStyle,
  mapStyles,
  mapText,
  previewTravelLoading,
  refetch,
  refetchRoute,
  routeDistanceLabel,
  routeEnabled,
  routeEtaLabel,
  routeStatus,
  screenDimOverlayOpacity,
  searchHandlers,
  searchState,
  setIsMomentUploading,
  setLayerModalVisible,
  setMapStyle,
  setSearchText,
  startNavConfirmVisible,
  setStartNavConfirmVisible,
  setTripCompleteVisible,
  shouldShowMapStatus,
  shouldShowPreviewTravelInfo,
  t,
  tripCompleteVisible,
  visiblePlaces,
  filterGroups,
}) {
  return (
    <>
      <StartNavigationModal
        visible={startNavConfirmVisible}
        onDismiss={() => {
          setStartNavConfirmVisible(false);
          handleExitActiveTrip();
        }}
        onConfirm={async () => {
          setStartNavConfirmVisible(false);
          followCameraRef.current = true;
          await locateActiveTripNow();
        }}
      />

      <TripCompleteModal
        visible={tripCompleteVisible}
        isTripEnd={completeIsTripEnd}
        dayNumber={completeDayNumber}
        onDismiss={() => {
          setTripCompleteVisible(false);
          if (completeIsTripEnd) {
            handleExitActiveTrip();
          }
        }}
        onPrimaryAction={handleConfirmTripComplete}
        primaryActionText={completeIsTripEnd ? t("mapScreen.complete") : t("mapScreen.paused")}
      />

      <NavigationStatusBanner
        visible={!isTripPreviewMode && routeEnabled && Boolean(routeStatus)}
        routeStatus={routeStatus}
        routeEtaLabel={routeEtaLabel}
        routeDistanceLabel={routeDistanceLabel}
        isRouteFetching={isRouteFetching}
        onRetry={refetchRoute}
        bottomOffset={
          activePlace
            ? floatingTabClearance + 124
            : floatingTabClearance + 82
        }
      />

      <ArrivalBanner
        visible={isActiveTripMode && !activeTrip.isPaused && activeArrivalVisible}
        targetName={activeTargetPoint?.name}
        distanceMeters={activeDistanceToTarget ?? Number.POSITIVE_INFINITY}
        speedKmh={activeTripSpeedKmh}
        bottomOffset={floatingTabClearance + 18}
        onDismiss={handleDismissActiveArrival}
        onConfirm={handleConfirmActiveArrival}
      />

      <View
        className="flex-1 flex-col"
        style={{ paddingTop: (insets.top || 0) + 12 }}
        pointerEvents="box-none"
      >
        {!isTripPreviewMode && !isActiveTripMode ? (
          <MapTopControls
            searchState={searchState}
            searchHandlers={searchHandlers}
            filterState={filterState}
            filterHandlers={filterHandlers}
            onLayout={handleTopControlsLayout}
          />
        ) : null}

        <CheckInButton
          activeEventId={activeEventId}
          activeNextDestination={activeNextDestination}
          activeDistanceToTarget={activeDistanceToTarget}
          currentLocation={activeTripLocation}
          isActiveTripMode={isActiveTripMode}
          isTripPaused={activeTrip.isPaused}
          createMomentMutation={createMomentMutation}
          isMomentUploading={isMomentUploading}
          setIsMomentUploading={setIsMomentUploading}
          t={t}
          bottomOffset={floatingTabClearance + 180}
        />

        <MapFabStack
          visible={hasMeasuredTopControls}
          topOffset={mapFabTopOffset}
          mapStyle={mapStyle}
          mapStyles={mapStyles}
          layerModalVisible={layerModalVisible}
          setLayerModalVisible={setLayerModalVisible}
          setMapStyle={setMapStyle}
          onLocate={handleLocate}
          t={t}
        />

        {shouldShowMapStatus && isPlacesLoading ? (
          <MapStatusPill
            type="loading"
            message={mapText.web.loadingPlaces}
            topOffset={mapStatusTopOffset}
          />
        ) : null}

        {shouldShowMapStatus && error ? (
          <MapStatusPill
            type="error"
            message={mapText.web.placesLoadError}
            actionLabel={mapText.errors.retry}
            onAction={refetch}
            topOffset={mapStatusTopOffset}
          />
        ) : null}

        {shouldShowMapStatus &&
        !isPlacesLoading &&
        !error &&
        hasActiveFilters &&
        visiblePlaces.length === 0 ? (
          <MapStatusPill
            type="empty"
            message={mapText.web.noPlacesForFilters}
            actionLabel={mapText.search.cancel}
            onAction={() => {
              setSearchText("");
              handleResetFilters();
            }}
            topOffset={mapStatusTopOffset}
          />
        ) : null}
      </View>

      {activePlace && !isTripPreviewMode && !isActiveTripMode ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            bottom: floatingTabClearance + 8,
            zIndex: 70,
          }}
        >
          <MapPlacePreviewCard
            place={activePlace}
            onClose={handleClosePreview}
            onViewDetail={handleOpenPlaceDetail}
            onStartRoute={handleStartRouteFromPreview}
            travelEtaLabel={
              shouldShowPreviewTravelInfo ? routeEtaLabel : undefined
            }
            travelDistanceLabel={
              shouldShowPreviewTravelInfo ? routeDistanceLabel : undefined
            }
            travelLoading={previewTravelLoading}
            compact={isCompactPreviewCard}
          />
        </View>
      ) : null}

      {isActiveTripMode && !activeTrip.isPaused && isScreenDimmed ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: `rgba(0, 0, 0, ${screenDimOverlayOpacity})`,
            zIndex: 4,
          }}
        />
      ) : null}

      <FilterPickerModal
        visible={!isTripPreviewMode && filterPickerVisible}
        activeFilterGroup={filterState.activeFilterGroup}
        activeFilterGroupLabel={activeFilterGroupMeta.label}
        filterGroups={filterGroups}
        options={filterPickerOptions}
        onClose={handleCloseFilterPicker}
        onSelectFilterGroup={filterHandlers.selectFilterGroup}
        onSelectOption={handleSelectFilterOption}
      />
    </>
  );
}
