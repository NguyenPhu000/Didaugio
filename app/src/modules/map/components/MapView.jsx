import {
  Fragment,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import ClusteredMapView from "react-native-map-clustering";
import { Marker, PROVIDER_DEFAULT, UrlTile } from "react-native-maps";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  CATEGORY_MARKER_STYLES,
  DEFAULT_MAP_STYLE,
  MAP_CONFIGS,
} from "../config/mapConfig";
import { resolveMediaUrl } from "../../../lib/media-url";
import { getCategoryIconName } from "../../../constants/categoryIcons";
import {
  getMarkerDensity,
  getMarkerPresentation,
  MARKER_DENSITY,
  regionToZoom,
} from "../utils/mapZoom";

const CLEAN_NATIVE_MAP_STYLE = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    featureType: "road",
    elementType: "labels.text",
    stylers: [{ visibility: "on" }],
  },
];

const INITIAL_REGION = {
  latitude: MAP_CONFIGS.INITIAL_VIEW.centerCoordinate[1],
  longitude: MAP_CONFIGS.INITIAL_VIEW.centerCoordinate[0],
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

const MAP_EDGE_PADDING = { top: 120, right: 120, bottom: 120, left: 120 };
const MIN_DELTA = 0.004;
const MAX_DELTA = 0.5;
const ZOOM_FACTOR = 0.5;
const FLY_DURATION = 800;
const ZOOM_DURATION = 300;
const TILE_ERROR_RESET_DELAY_MS = 0;

const zoomToDelta = (zoom) => (zoom >= 15 ? 0.01 : zoom >= 13 ? 0.03 : 0.08);

const normalizeCoord = (value) =>
  typeof value === "string" ? parseFloat(value) : value;

const SystemPlaceLabel = memo(({ place, isActive }) => {
  const [shouldTrackLabel, setShouldTrackLabel] = useState(true);

  useEffect(() => {
    setShouldTrackLabel(true);
    const timerId = setTimeout(() => setShouldTrackLabel(false), 300);
    return () => clearTimeout(timerId);
  }, [place?.name]);

  if (!place?.name) return null;

  return (
    <Marker
      coordinate={{ latitude: place.latitude, longitude: place.longitude }}
      anchor={{ x: 0.5, y: 1 }}
      tappable={false}
      tracksViewChanges={shouldTrackLabel}
      zIndex={isActive ? 4 : 1}
    >
      <View style={[styles.markerLabel, styles.systemMarkerLabel]} pointerEvents="none">
        <Text
          style={styles.markerLabelText}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {place.name}
        </Text>
      </View>
    </Marker>
  );
});

SystemPlaceLabel.displayName = "SystemPlaceLabel";

const PlaceMarker = memo(
  ({ place, isActive, density, onSelectPlace, onLongPressPlace }) => {
    const [shouldTrackDetail, setShouldTrackDetail] = useState(false);
    const handlePress = useCallback(() => {
      onSelectPlace?.(place);
    }, [onSelectPlace, place]);

    const handleLongPress = useCallback(() => {
      onLongPressPlace?.(place);
    }, [onLongPressPlace, place]);

    const categoryStyle = CATEGORY_MARKER_STYLES[place?.categoryId];
    const markerColor = isActive
      ? "#0F766E"
      : place?.isFeatured
        ? "#F59E0B"
        : place?.category?.color || categoryStyle?.color || "#ef4444";
    const markerBackground = categoryStyle?.bg || "#FFFFFF";
    const markerIcon = getCategoryIconName(place?.category);
    const coordinate = {
      latitude: place.latitude,
      longitude: place.longitude,
    };
    const { imageUri, density: resolvedDensity } = getMarkerPresentation(
      density,
      place?.markerImageUri,
    );
    const isDetail = resolvedDensity === MARKER_DENSITY.DETAIL;
    const usesMarkerImage = resolvedDensity !== MARKER_DENSITY.CATEGORY;
    const markerSize = isDetail ? 44 : 30;
    const markerImage = imageUri ? { uri: imageUri } : undefined;
    const showNativeImage = usesMarkerImage && Boolean(markerImage);

    // Bật trackViewChanges rất ngắn khi:
    //  - Marker vừa trở thành active (hiệu ứng glow).
    //  - Marker vừa được nâng cấp sang DETAIL (cần render ảnh).
    //  - Ảnh vừa load xong hoặc lỗi.
    // Mặc định tắt để marker không bị raster lại mỗi frame -> giảm giật.
    useEffect(() => {
      if (isActive || usesMarkerImage) {
        setShouldTrackDetail(true);
        const timerId = setTimeout(
          () => setShouldTrackDetail(false),
          imageUri ? 800 : 200,
        );
        return () => clearTimeout(timerId);
      }
      return undefined;
    }, [density, imageUri, isActive, usesMarkerImage]);

    return (
      <Marker
        coordinate={coordinate}
        onPress={handlePress}
        onLongPress={handleLongPress}
        anchor={showNativeImage ? { x: 0.5, y: 1 } : { x: 0.5, y: 0.5 }}
        image={showNativeImage ? markerImage : undefined}
        pinColor={markerColor}
        tracksViewChanges={!showNativeImage || shouldTrackDetail}
        zIndex={isActive ? 2 : 0}
      >
        {!showNativeImage ? (
          <View style={styles.markerContainer} pointerEvents="none">
            <View
              style={[
                styles.markerFrame,
                {
                  width: markerSize,
                  height: markerSize,
                  borderRadius: markerSize / 2,
                  backgroundColor: markerBackground,
                  shadowColor: markerColor,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isActive ? 0.32 : 0.18,
                  shadowRadius: isActive ? 10 : 6,
                  elevation: isActive ? 7 : 3,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={markerIcon}
                size={16}
                color={markerColor}
              />
              {isActive ? (
                <View
                  style={[
                    styles.activeMarkerBorder,
                    { borderColor: "#0F766E", borderRadius: markerSize / 2 },
                  ]}
                />
              ) : null}
            </View>
          </View>
        ) : null}
      </Marker>
    );
  },
  (prev, next) =>
    prev.place?.id === next.place?.id &&
    prev.place?.name === next.place?.name &&
    prev.place?.categoryId === next.place?.categoryId &&
    prev.place?.isFeatured === next.place?.isFeatured &&
    prev.place?.latitude === next.place?.latitude &&
    prev.place?.longitude === next.place?.longitude &&
    prev.place?.markerImageUri === next.place?.markerImageUri &&
    prev.isActive === next.isActive &&
    prev.density === next.density,
);

PlaceMarker.displayName = "PlaceMarker";

const MapView = memo(
  forwardRef(
    (
      {
        places = [],
        selectedPlaceId = null,
        onSelectPlace,
        onLongPressPlace,
        onPressMap,
        onLongPressMap,
        onZoomChange,
        onRegionChangeComplete,
        style,
        tileUrls,
        mapType = "standard",
        useNativeCleanStyle = false,
        mapPadding,
        courseUpEnabled = false,
        showsUserLocation = false,
        showsMyLocationButton = false,
        children,
      },
      ref,
    ) => {
      const { width: viewportWidth } = useWindowDimensions();
      const mapRef = useRef(null);
      const regionRef = useRef(INITIAL_REGION);
      const tileErrorTimerRef = useRef(null);
      const [tileError, setTileError] = useState(false);
      const [markerDensity, setMarkerDensity] = useState(() =>
        getMarkerDensity(regionToZoom(INITIAL_REGION, viewportWidth)),
      );

      useImperativeHandle(ref, () => ({
        flyTo: ([lng, lat], zoom = 14) => {
          const delta = zoomToDelta(zoom);
          const nextRegion = {
            latitude: lat,
            longitude: lng,
            latitudeDelta: delta,
            longitudeDelta: delta,
          };
          regionRef.current = nextRegion;
          mapRef.current?.animateToRegion(nextRegion, FLY_DURATION);
        },
        zoomIn: () => {
          const region = regionRef.current;
          const delta = Math.max(region.latitudeDelta * ZOOM_FACTOR, MIN_DELTA);
          const next = { ...region, latitudeDelta: delta, longitudeDelta: delta };
          regionRef.current = next;
          mapRef.current?.animateToRegion(next, ZOOM_DURATION);
        },
        zoomOut: () => {
          const region = regionRef.current;
          const delta = Math.min(region.latitudeDelta / ZOOM_FACTOR, MAX_DELTA);
          const next = { ...region, latitudeDelta: delta, longitudeDelta: delta };
          regionRef.current = next;
          mapRef.current?.animateToRegion(next, ZOOM_DURATION);
        },
        animateCamera: (camera, options) => {
          mapRef.current?.animateCamera(camera, options);
        },
      }));

      const resolvedTileUrls = useMemo(
        () =>
          Array.isArray(tileUrls)
            ? tileUrls.filter((tileUrl) => typeof tileUrl === "string" && tileUrl)
            : DEFAULT_MAP_STYLE.urls,
        [tileUrls],
      );
      const tileUrlsKey = resolvedTileUrls.join("|");
      const preparedPlaces = useMemo(() => {
        if (!Array.isArray(places) || places.length === 0) return [];

        const nextPlaces = [];
        for (const place of places) {
          const latitude = normalizeCoord(place.latitude);
          const longitude = normalizeCoord(place.longitude);
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            continue;
          }

          nextPlaces.push({
            ...place,
            latitude,
            longitude,
            // Native Marker.image is reliable with the pre-generated marker asset.
            // Do not fall back to an arbitrary cover thumbnail here: it can be a
            // transformed/data URL that Android maps silently drops.
            markerImageUri: resolveMediaUrl(place?.markerUrl),
          });
        }

        return nextPlaces;
      }, [places]);

      const shouldUseTiles = resolvedTileUrls.length > 0 && !tileError;
      const customMapStyle = useNativeCleanStyle
        ? CLEAN_NATIVE_MAP_STYLE
        : undefined;
      const mapStyle = style ? [styles.map, style] : styles.map;

      const handleRegionChangeComplete = useCallback(
        (region) => {
          regionRef.current = region;
          const zoomValue = regionToZoom(region, viewportWidth);
          const nextMarkerDensity = getMarkerDensity(zoomValue);

          setMarkerDensity((previous) =>
            previous === nextMarkerDensity ? previous : nextMarkerDensity,
          );

          onZoomChange?.(Math.round(zoomValue));
          onRegionChangeComplete?.(region);
        },
        [onRegionChangeComplete, onZoomChange, viewportWidth],
      );

      const handleTileError = useCallback(() => {
        if (tileError || tileErrorTimerRef.current) {
          return;
        }
        tileErrorTimerRef.current = setTimeout(() => {
          tileErrorTimerRef.current = null;
          setTileError(true);
        }, TILE_ERROR_RESET_DELAY_MS);
      }, [tileError]);

      useEffect(() => {
        if (tileErrorTimerRef.current) {
          clearTimeout(tileErrorTimerRef.current);
          tileErrorTimerRef.current = null;
        }
        setTileError(false);
      }, [tileUrlsKey]);

      useEffect(() => {
        return () => {
          if (tileErrorTimerRef.current) {
            clearTimeout(tileErrorTimerRef.current);
            tileErrorTimerRef.current = null;
          }
        };
      }, []);

      return (
        <ClusteredMapView
          ref={mapRef}
          style={mapStyle}
          provider={PROVIDER_DEFAULT}
          initialRegion={INITIAL_REGION}
          clusteringEnabled={false}
          mapType={shouldUseTiles ? "none" : mapType}
          customMapStyle={customMapStyle}
          showsUserLocation={showsUserLocation}
          showsMyLocationButton={showsMyLocationButton}
          userLocationUpdateInterval={3000}
          userLocationFastestInterval={2000}
          rotateEnabled={courseUpEnabled}
          pitchEnabled={courseUpEnabled}
          showsCompass={courseUpEnabled}
          showsScale={false}
          showsBuildings={false}
          showsTraffic={false}
          showsIndoors={false}
          showsIndoorLevelPicker={false}
          minZoomLevel={MAP_CONFIGS.CONSTRAINTS.minZoomLevel}
          maxZoomLevel={MAP_CONFIGS.CONSTRAINTS.maxZoomLevel}
          onPress={onPressMap}
          onLongPress={onLongPressMap}
          onRegionChangeComplete={handleRegionChangeComplete}
          edgePadding={MAP_EDGE_PADDING}
          mapPadding={mapPadding}
        >
          {shouldUseTiles
            ? resolvedTileUrls.map((tileUrl) => (
                <UrlTile
                  key={tileUrl}
                  urlTemplate={tileUrl}
                  maximumZ={19}
                  tileSize={256}
                  flipY={false}
                  shouldReplaceMapContent
                  onError={handleTileError}
                />
              ))
            : null}

          {preparedPlaces.map((place) => {
            const { showLabel } = getMarkerPresentation(
              markerDensity,
              place.markerImageUri,
            );
            const isActive = place.id === selectedPlaceId;

            return (
              <Fragment key={place.id}>
                <PlaceMarker
                  place={place}
                  isActive={isActive}
                  density={markerDensity}
                  onSelectPlace={onSelectPlace}
                  onLongPressPlace={onLongPressPlace}
                />
                {showLabel ? <SystemPlaceLabel place={place} isActive={isActive} /> : null}
              </Fragment>
            );
          })}

          {children}
        </ClusteredMapView>
      );
    },
  ),
);

MapView.displayName = "MapView";

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  markerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  markerFrame: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  markerImage: {
    width: "100%",
    height: "100%",
  },
  activeMarkerBorder: {
    position: "absolute",
    inset: 0,
    borderWidth: 2,
  },
  markerLabel: {
    maxWidth: 140,
    minWidth: 56,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
  },
  markerLabelText: {
    color: "#020617",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.1,
    textAlign: "center",
  },
  systemMarkerLabel: {
    transform: [{ translateY: -52 }],
  },
});

export default MapView;
