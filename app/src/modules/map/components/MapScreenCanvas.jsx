import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Marker } from "react-native-maps";
import { Image } from "expo-image";
import { MaterialIconsRounded } from "../../../components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";
import { resolveMediaUrl, resolvePlaceImageUri } from "../../../lib/media-url";
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

        {(isTripPreviewMode || (isActiveTripMode && previewStops.length > 0)) && previewSegments.length > 0
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
                    {/* Directional Arrow Icon rotated to segment bearing */}
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

        {(isTripPreviewMode || (isActiveTripMode && previewStops.length > 0)) && previewStops.length > 0
          ? previewStops.map((stop) => {
              const placeData = stop.place || stop.destination?.place || stop;
              const imageUri =
                resolvePlaceImageUri(placeData) ||
                resolveMediaUrl(stop.thumbnail || placeData?.thumbnail || placeData?.images?.[0]);
              const badgeColor =
                previewSegments[stop.sequence - 1]?.color ||
                previewSegments[stop.sequence - 2]?.color ||
                "#EF4444";
              const stopName = stop.name || placeData?.name || `Điểm ${stop.sequence}`;

              return (
                <Marker
                  key={`preview-stop-${stop.id}`}
                  coordinate={stop.coordinate}
                  anchor={{ x: 0.2, y: 0.5 }}
                  zIndex={100 - stop.sequence}
                  tracksViewChanges
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }} pointerEvents="none">
                    {/* 1. Khung Ảnh Marker Tương Tự MapView PlaceMarker */}
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        backgroundColor: "#FFFFFF",
                        borderWidth: 2.5,
                        borderColor: badgeColor,
                        padding: 2,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                        elevation: 6,
                        position: "relative",
                      }}
                    >
                      {imageUri ? (
                        <Image
                          source={{ uri: imageUri }}
                          style={{ width: "100%", height: "100%", borderRadius: 10 }}
                          contentFit="cover"
                        />
                      ) : (
                        <View
                          style={{
                            flex: 1,
                            borderRadius: 10,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#F3F4F6",
                          }}
                        >
                          <MaterialIconsRounded name="place" size={22} color={badgeColor} />
                        </View>
                      )}

                      {/* 2. Tag Số Thứ Tự (Sequence Badge) Nổi Bật Sắc Nét */}
                      <View
                        style={{
                          position: "absolute",
                          top: -9,
                          left: -9,
                          minWidth: 24,
                          height: 24,
                          borderRadius: 12,
                          paddingHorizontal: 5,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#181819",
                          borderWidth: 2,
                          borderColor: "#FFFFFF",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.35,
                          shadowRadius: 4,
                          elevation: 5,
                        }}
                      >
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 11.5,
                            fontFamily: TOKENS.font.bold,
                            textAlign: "center",
                          }}
                        >
                          {stop.sequence}
                        </Text>
                      </View>
                    </View>

                    {/* 3. Label Tên Địa Điểm Đi Kèm Giống MapView PlaceMarker */}
                    <View
                      style={{
                        marginLeft: 6,
                        maxWidth: 154,
                        borderRadius: 14,
                        backgroundColor: "#FFFFFF",
                        paddingHorizontal: 10,
                        paddingVertical: 5.5,
                        borderWidth: 1,
                        borderColor: "rgba(0,0,0,0.08)",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.16,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11.5,
                          fontFamily: TOKENS.font.bold,
                          color: "#181819",
                          letterSpacing: -0.2,
                        }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {stopName}
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
