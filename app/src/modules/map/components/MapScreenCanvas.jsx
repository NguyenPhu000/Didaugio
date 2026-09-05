import { memo, useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Marker } from "react-native-maps";
import { Image } from "expo-image";
import { MaterialIconsRounded } from "../../../components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";
import { resolveMediaUrl, resolvePlaceImageUri } from "../../../lib/media-url";
import MapView from "./MapView";
import RoutePolyline from "./RoutePolyline";
import SnapLine from "./SnapLine";

const PreviewStopMarker = memo(function PreviewStopMarker({ stop, previewSegments }) {
  const placeData = stop.place || stop.destination?.place || stop;
  const imageUri =
    resolvePlaceImageUri(placeData) ||
    resolveMediaUrl(stop.thumbnail || placeData?.thumbnail || placeData?.images?.[0]);
  const badgeColor =
    previewSegments[stop.sequence - 1]?.color ||
    previewSegments[stop.sequence - 2]?.color ||
    "#EF4444";
  const stopName = stop.name || placeData?.name || `Điểm ${stop.sequence}`;
  const [tracksViewChanges, setTracksViewChanges] = useState(Boolean(imageUri));

  useEffect(() => {
    setTracksViewChanges(Boolean(imageUri));
  }, [imageUri]);

  const handleImageSettled = useCallback(() => {
    setTracksViewChanges(false);
  }, []);

  return (
    <Marker
      coordinate={stop.coordinate}
      anchor={{ x: 0.2, y: 0.5 }}
      zIndex={100 - stop.sequence}
      tracksViewChanges={tracksViewChanges}
    >
      <View className="flex-row items-center" pointerEvents="none">
        <View
          className="relative h-12 w-12 rounded-[14px] border-[2.5px] bg-white p-0.5 shadow-lg"
          style={{ borderColor: badgeColor }}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width: "100%", height: "100%", borderRadius: 10 }}
              contentFit="cover"
              onLoad={handleImageSettled}
              onError={handleImageSettled}
            />
          ) : (
            <View className="flex-1 items-center justify-center rounded-[10px] bg-slate-100">
              <MaterialIconsRounded name="place" size={22} color={badgeColor} />
            </View>
          )}

          <View className="absolute -left-2 -top-2 h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-[#181819] px-1 shadow-md">
            <Text className="text-center font-bold text-[11.5px] text-white">
              {stop.markerLabel}
            </Text>
          </View>
        </View>

        <View className="ml-1.5 max-w-[154px] rounded-[14px] border border-black/[0.08] bg-white px-2.5 py-1.5 shadow-sm">
          <Text
            className="font-bold text-[11.5px] tracking-tight text-[#181819]"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {stopName}
          </Text>
        </View>
      </View>
    </Marker>
  );
});

const MapScreenCanvasLoadingOverlay = memo(function MapScreenCanvasLoadingOverlay({
  isLoading,
  mapUiTheme,
  loadingText,
}) {
  if (!isLoading) return null;
  return (
    <View
      className="flex-1 items-center justify-center gap-3"
      style={{ backgroundColor: mapUiTheme.background }}
    >
      <ActivityIndicator color={mapUiTheme.neon} size="large" />
      <Text
        className="text-[14px] font-medium"
        style={{ color: mapUiTheme.text }}
      >
        {loadingText}
      </Text>
    </View>
  );
});

const MapScreenCanvasErrorOverlay = memo(function MapScreenCanvasErrorOverlay({
  error,
  mapUiTheme,
  onRetry,
  errorText,
  retryText,
}) {
  if (!error) return null;
  return (
    <View
      className="flex-1 items-center justify-center gap-3"
      style={{ backgroundColor: mapUiTheme.background }}
    >
      <MaterialIconsRounded name="wifi-off" size={40} color="#FB7185" />
      <Text className="text-[14px]" style={{ color: mapUiTheme.text }}>
        {errorText}
      </Text>
      <Pressable
        onPress={onRetry}
        className="flex-row items-center gap-2 px-5 py-2.5 rounded-xl"
        style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
      >
        <MaterialIconsRounded
          name="refresh"
          size={18}
          color={mapUiTheme.text}
        />
        <Text className="text-[14px] font-bold text-white">
          {retryText}
        </Text>
      </Pressable>
    </View>
  );
});

const TripPreviewRoutesAndStops = memo(function TripPreviewRoutesAndStops({
  isTripPreviewMode,
  previewSegments = [],
  previewStops = [],
}) {
  if (!isTripPreviewMode) return null;
  return (
    <>
      {previewSegments.map((segment) => (
        <RoutePolyline
          key={segment.id}
          coordinates={segment.coordinates}
          source={segment.source}
          strokeWidth={6}
          isPrimary
          dashed={segment.dashed}
          color="#111111"
          strokeOpacity={0.96}
        />
      ))}
      {previewStops.map((stop) => (
        <PreviewStopMarker
          key={`preview-stop-${stop.id}`}
          stop={stop}
          previewSegments={previewSegments}
        />
      ))}
    </>
  );
});

const ActiveTripNavigationOverlays = memo(function ActiveTripNavigationOverlays({
  isActiveTripMode,
  navigationController,
  activeTripLocation,
  previewStops = [],
  previewSegments = [],
}) {
  if (!isActiveTripMode) return null;

  return (
    <>
      {previewStops.length > 0 && previewSegments.length > 0
        ? previewSegments.map((segment) =>
            segment.labelCoordinate ? (
              <Marker
                key={`segment-label-${segment.id}`}
                coordinate={segment.labelCoordinate}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 9,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: "rgba(17,24,39,0.92)",
                    borderWidth: 1.5,
                    borderColor: "rgba(255,255,255,0.9)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  <View
                    style={{
                      transform: [{ rotate: `${segment.bearing || 0}deg` }],
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MaterialIconsRounded
                      name="navigation"
                      size={13}
                      color={segment.color || "#38BDF8"}
                    />
                  </View>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 11,
                      fontFamily: TOKENS.font.bold,
                      letterSpacing: -0.2,
                    }}
                  >
                    {[segment.label, segment.distanceLabel].filter(Boolean).join(" • ")}
                  </Text>
                </View>
              </Marker>
            ) : null,
          )
        : null}

      {!navigationController.isGpsLost &&
      Number.isFinite(activeTripLocation?.latitude) &&
      Number.isFinite(activeTripLocation?.longitude) ? (
        <Marker
          coordinate={activeTripLocation}
          anchor={{ x: 0.5, y: 0.5 }}
          flat
          rotation={Number.isFinite(activeTripLocation.heading) ? activeTripLocation.heading : 0}
          tracksViewChanges={false}
          zIndex={220}
        >
          <View className="h-12 w-12 items-center justify-center rounded-full bg-white shadow-md">
            <View className="h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#101010]">
              <MaterialIconsRounded name="navigation" size={25} color="#FFFFFF" />
            </View>
          </View>
        </Marker>
      ) : null}

      {!navigationController.isGpsLost &&
      navigationController.snappedPoint &&
      Number(navigationController.distanceToRoute) > 8 ? (
        <SnapLine
          from={activeTripLocation}
          to={navigationController.snappedPoint}
        />
      ) : null}

      {navigationController.isGpsLost &&
      navigationController.estimatedPosition ? (
        <Marker
          coordinate={navigationController.estimatedPosition}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <View
              style={{
                backgroundColor: "#9CA3AF",
                opacity: 0.3,
                width: 24,
                height: 24,
                borderRadius: 12,
                position: "absolute",
              }}
            />
            <View
              style={{
                backgroundColor: "#9CA3AF",
                borderColor: "#FFFFFF",
                borderWidth: 1.5,
                width: 12,
                height: 12,
                borderRadius: 6,
              }}
            />
          </View>
        </Marker>
      ) : null}
    </>
  );
});

const ActiveRoutePolylines = memo(function ActiveRoutePolylines({
  isTripPreviewMode,
  isActiveTripMode,
  activeRouteCoordinates = [],
  activeRouteSource,
  routeCoordinates = [],
  routeSource,
  isGpsLost,
}) {
  if (isTripPreviewMode) return null;

  if (isActiveTripMode && activeRouteCoordinates.length > 1) {
    return (
      <RoutePolyline
        coordinates={activeRouteCoordinates}
        source={activeRouteSource || "osrm"}
        strokeWidth={6}
        isPrimary
        dashed={activeRouteSource === "fallback"}
        color="#151515"
        strokeOpacity={isGpsLost ? 0.4 : 0.95}
      />
    );
  }

  if (routeCoordinates.length > 1) {
    return (
      <RoutePolyline
        coordinates={routeCoordinates}
        source={routeSource || "osrm"}
        strokeWidth={5}
        isPrimary
        dashed={routeSource === "fallback"}
      />
    );
  }

  return null;
});

export function MapScreenCanvas({
  activeMapPadding,
  activePlace,
  activeRouteCoordinates,
  activeRouteSource,
  activeTrip,
  activeTripLocation,
  error,
  handleMapPress,
  handleSelectPlace,
  isActiveTripMode,
  isLoading,
  isTripPreviewMode,
  mapCanvasStyle,
  mapRef,
  mapStyle,
  mapText,
  mapUiTheme,
  navigationController,
  previewSegments,
  previewStops,
  refetch,
  routeCoordinates,
  routeSource,
  setMapRegion,
  shouldShowNativeUserLocation,
  visiblePlaces,
}) {
  const courseUpEnabled = isActiveTripMode && !activeTrip.isPaused;

  return (
    <View className="absolute inset-0">
      <MapScreenCanvasLoadingOverlay
        isLoading={isLoading}
        mapUiTheme={mapUiTheme}
        loadingText={mapText.loading.map}
      />

      <MapScreenCanvasErrorOverlay
        error={error}
        mapUiTheme={mapUiTheme}
        onRetry={refetch}
        errorText={mapText.errors.mapData}
        retryText={mapText.errors.retry}
      />

      <MapView
        ref={mapRef}
        places={isTripPreviewMode ? [] : visiblePlaces}
        selectedPlaceId={activePlace?.id ?? null}
        onSelectPlace={handleSelectPlace}
        onPressMap={handleMapPress}
        onRegionChangeComplete={setMapRegion}
        mapType={mapStyle.mapType}
        useNativeCleanStyle={mapStyle.useNativeCleanStyle}
        mapPadding={activeMapPadding}
        courseUpEnabled={courseUpEnabled}
        showsUserLocation={shouldShowNativeUserLocation && !isActiveTripMode}
        showsMyLocationButton={false}
        style={mapCanvasStyle}
      >

        <TripPreviewRoutesAndStops
          isTripPreviewMode={isTripPreviewMode}
          previewSegments={previewSegments}
          previewStops={previewStops}
        />

        <ActiveRoutePolylines
          isTripPreviewMode={isTripPreviewMode}
          isActiveTripMode={isActiveTripMode}
          activeRouteCoordinates={activeRouteCoordinates}
          activeRouteSource={activeRouteSource}
          routeCoordinates={routeCoordinates}
          routeSource={routeSource}
          isGpsLost={navigationController.isGpsLost}
        />

        <ActiveTripNavigationOverlays
          isActiveTripMode={isActiveTripMode}
          navigationController={navigationController}
          activeTripLocation={activeTripLocation}
          previewStops={previewStops}
          previewSegments={previewSegments}
        />
      </MapView>
    </View>
  );
}
