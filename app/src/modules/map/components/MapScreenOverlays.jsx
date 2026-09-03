import { Modal, Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";
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
import { MAP_STYLES } from "../config/mapConfig";

const MAP_STYLE_OPTIONS = [MAP_STYLES.OSM, MAP_STYLES.HYBRID];

export function MapScreenOverlays({ mapState, mapHandlers }) {
  const {
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
    filterGroups,
    filterPickerOptions,
    filterPickerVisible,
    filterState,
    floatingTabClearance,
    hasActiveFilters,
    hasMeasuredTopControls,
    insets,
    isActiveTripMode,
    isCompactPreviewCard,
    isMomentUploading,
    layerModalVisible,
    mapStyle,
    isPlacesLoading,
    isRouteFetching,
    isScreenDimmed,
    isTripPreviewMode,
    mapFabTopOffset,
    mapStatusTopOffset,
    mapText,
    previewTravelLoading,
    routeDistanceLabel,
    routeEnabled,
    routeEtaLabel,
    routeStatus,
    screenDimOverlayOpacity,
    searchState,
    shouldShowMapStatus,
    shouldShowPreviewTravelInfo,
    startNavConfirmVisible,
    t,
    tripCompleteVisible,
    visiblePlaces,
  } = mapState;
  const {
    filterHandlers,
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
    locateActiveTripNow,
    refetch,
    refetchRoute,
    searchHandlers,
    setIsMomentUploading,
    setLayerModalVisible,
    setMapStyle,
    setSearchText,
    setStartNavConfirmVisible,
    setTripCompleteVisible,
  } = mapHandlers;
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
          onLocate={handleLocate}
          onMapStylePress={() => setLayerModalVisible(true)}
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

      <Modal
        transparent
        animationType="fade"
        visible={layerModalVisible}
        onRequestClose={() => setLayerModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15,23,42,0.28)" }}
          onPress={() => setLayerModalVisible(false)}
        >
          <View
            style={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              backgroundColor: "#FFFFFF",
              padding: 20,
              paddingBottom: Math.max((insets.bottom || 0) + 16, 32),
              gap: 10,
            }}
          >
            <Text style={{ color: "#0F172A", fontSize: 17, fontWeight: "700" }}>
              {mapText.layerSwitcher.title}
            </Text>
            {MAP_STYLE_OPTIONS.map((styleOption) => {
              const isSelected = mapStyle.key === styleOption.key;
              return (
                <Pressable
                  key={styleOption.key}
                  onPress={() => {
                    setMapStyle(styleOption);
                    setLayerModalVisible(false);
                  }}
                  style={{
                    minHeight: 52,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    backgroundColor: isSelected ? "#ECFDF5" : "#F8FAFC",
                    borderWidth: 1,
                    borderColor: isSelected ? "#99F6E4" : "#E2E8F0",
                  }}
                >
                  <Text style={{ color: "#0F172A", fontSize: 15, fontWeight: "600" }}>
                    {styleOption.label}
                  </Text>
                  {isSelected ? <Check size={19} color="#0F766E" strokeWidth={3} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
