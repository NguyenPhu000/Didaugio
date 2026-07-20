import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Marker } from "react-native-maps";
import { Image } from "expo-image";
import { MaterialIconsRounded } from "../../../components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";
import { resolveMediaUrl } from "../../../lib/media-url";
import { ContextualBoundaryLayer } from "./BoundaryLayer";
import MapView from "./MapView";
import RoutePolyline from "./RoutePolyline";
import SnapLine from "./SnapLine";

export function MapScreenCanvas({
  activeArea,
  activeMapPadding,
  activePlace,
  activeRouteCoordinates,
  activeRouteSource,
  activeTrip,
  activeTripLocation,
  allAreasKey,
  districtGeo,
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
      {isLoading ? (
        <View
          className="flex-1 items-center justify-center gap-3"
          style={{ backgroundColor: mapUiTheme.background }}
        >
          <ActivityIndicator color={mapUiTheme.neon} size="large" />
          <Text
            className="text-[14px] font-medium"
            style={{ color: mapUiTheme.text }}
          >
            {mapText.loading.map}
          </Text>
        </View>
      ) : null}

      {error ? (
        <View
          className="flex-1 items-center justify-center gap-3"
          style={{ backgroundColor: mapUiTheme.background }}
        >
          <MaterialIconsRounded name="wifi-off" size={40} color="#FB7185" />
          <Text className="text-[14px]" style={{ color: mapUiTheme.text }}>
            {mapText.errors.mapData}
          </Text>
          <Pressable
            onPress={refetch}
            className="flex-row items-center gap-2 px-5 py-2.5 rounded-xl"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          >
            <MaterialIconsRounded
              name="refresh"
              size={18}
              color={mapUiTheme.text}
            />
            <Text className="text-[14px] font-bold text-white">
              {mapText.errors.retry}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <MapView
        ref={mapRef}
        places={isTripPreviewMode ? [] : visiblePlaces}
        selectedPlaceId={activePlace?.id ?? null}
        onSelectPlace={handleSelectPlace}
        onPressMap={handleMapPress}
        onRegionChangeComplete={setMapRegion}
        tileUrls={mapStyle.urls}
        mapType={mapStyle.mapType || "standard"}
        useNativeCleanStyle={mapStyle.useNativeCleanStyle === true}
        mapPadding={activeMapPadding}
        courseUpEnabled={courseUpEnabled}
        showsUserLocation={shouldShowNativeUserLocation}
        showsMyLocationButton={false}
        style={mapCanvasStyle}
      >
        <ContextualBoundaryLayer
          geojson={districtGeo}
          activeArea={activeArea}
          allAreasKey={allAreasKey}
        />

        {isTripPreviewMode && previewSegments.length > 0
          ? previewSegments.map((segment) => (
              <RoutePolyline
                key={segment.id}
                coordinates={segment.coordinates}
                source={segment.source}
                strokeWidth={6}
                isPrimary
                dashed={segment.dashed}
                color={segment.color}
                strokeOpacity={0.96}
              />
            ))
          : null}

        {isTripPreviewMode && previewSegments.length > 0
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
                      paddingHorizontal: 8,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: "rgba(17,24,39,0.9)",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.82)",
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: segment.color,
                      }}
                    />
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 11,
                        fontFamily: TOKENS.font.semibold,
                      }}
                    >
                      {[segment.label, segment.distanceLabel].filter(Boolean).join(" • ")}
                    </Text>
                  </View>
                </Marker>
              ) : null,
            )
          : null}

        {isTripPreviewMode && previewStops.length > 0
          ? previewStops.map((stop) => {
              const imageUri = resolveMediaUrl(stop.thumbnail);
              return (
                <Marker
                  key={`preview-stop-${stop.id}`}
                  coordinate={stop.coordinate}
                  anchor={{ x: 0.5, y: 0.92 }}
                  tracksViewChanges
                >
                  <View style={{ alignItems: "center" }}>
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 14,
                        backgroundColor: "#FFFFFF",
                        padding: 3,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.22,
                        shadowRadius: 5,
                        elevation: 5,
                      }}
                    >
                      {imageUri ? (
                        <Image
                          source={{ uri: imageUri }}
                          style={{ width: "100%", height: "100%", borderRadius: 11 }}
                          contentFit="cover"
                        />
                      ) : (
                        <View
                          style={{
                            flex: 1,
                            borderRadius: 11,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#F3F4F6",
                          }}
                        >
                          <MaterialIconsRounded name="place" size={24} color="#6B7280" />
                        </View>
                      )}
                    </View>
                    <View
                      style={{
                        marginTop: -8,
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor:
                          previewSegments[stop.sequence - 1]?.color ||
                          previewSegments[stop.sequence - 2]?.color ||
                          "#EF4444",
                        borderWidth: 2,
                        borderColor: "#FFFFFF",
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 12,
                          fontFamily: TOKENS.font.bold,
                        }}
                      >
                        {stop.sequence}
                      </Text>
                    </View>
                  </View>
                </Marker>
              );
            })
          : null}

        {!isTripPreviewMode && isActiveTripMode && activeRouteCoordinates.length > 1 ? (
          <RoutePolyline
            coordinates={activeRouteCoordinates}
            source={activeRouteSource || "osrm"}
            strokeWidth={6}
            isPrimary
            dashed={activeRouteSource === "fallback"}
            color="hsl(145, 63%, 38%)"
            strokeOpacity={navigationController.isGpsLost ? 0.4 : 0.95}
          />
        ) : !isTripPreviewMode && routeCoordinates.length > 1 ? (
          <RoutePolyline
            coordinates={routeCoordinates}
            source={routeSource || "osrm"}
            strokeWidth={5}
            isPrimary
            dashed={routeSource === "fallback"}
          />
        ) : null}

        {isActiveTripMode &&
        !navigationController.isGpsLost &&
        navigationController.snappedPoint &&
        Number(navigationController.distanceToRoute) > 8 ? (
          <SnapLine
            from={activeTripLocation}
            to={navigationController.snappedPoint}
          />
        ) : null}

        {isActiveTripMode &&
        navigationController.isGpsLost &&
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
      </MapView>
    </View>
  );
}
