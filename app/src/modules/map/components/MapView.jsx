import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, Text, View } from "react-native";
import ClusteredMapView from "react-native-map-clustering";
import { Marker, PROVIDER_DEFAULT, UrlTile } from "react-native-maps";
import {
  CATEGORY_MARKER_STYLES,
  DEFAULT_MAP_STYLE,
  MAP_CONFIGS,
} from "../config/mapConfig";
import { resolvePlaceImageUri } from "../../../lib/media-url";

const CLEAN_NATIVE_MAP_STYLE = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "transit.station.bus", stylers: [{ visibility: "on" }] },
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

const MIN_DELTA = 0.004;
const MAX_DELTA = 0.5;
const ZOOM_FACTOR = 0.5;
const FLY_DURATION = 800;
const ZOOM_DURATION = 300;
const CLUSTER_COLORS = {
  low: {
    halo: "rgba(56, 189, 248, 0.22)",
    shell: "rgba(255,255,255,0.95)",
    core: "#38BDF8",
    accent: "#E0F2FE",
    text: "#0F172A",
  },
  medium: {
    halo: "rgba(59, 130, 246, 0.24)",
    shell: "rgba(255,255,255,0.96)",
    core: "#3B82F6",
    accent: "#DBEAFE",
    text: "#0F172A",
  },
  high: {
    halo: "rgba(14, 116, 144, 0.26)",
    shell: "rgba(255,255,255,0.97)",
    core: "#0F766E",
    accent: "#CCFBF1",
    text: "#06202A",
  },
};

const zoomToDelta = (zoom) => (zoom >= 15 ? 0.01 : zoom >= 13 ? 0.03 : 0.08);
const normalizeCoord = (value) =>
  typeof value === "string" ? parseFloat(value) : value;

const getClusterVisual = (pointCount) => {
  if (pointCount >= 50) {
    return {
      size: 64,
      ringSize: 52,
      coreSize: 40,
      colors: CLUSTER_COLORS.high,
    };
  }

  if (pointCount >= 20) {
    return {
      size: 58,
      ringSize: 46,
      coreSize: 35,
      colors: CLUSTER_COLORS.medium,
    };
  }

  return {
    size: 52,
    ringSize: 40,
    coreSize: 30,
    colors: CLUSTER_COLORS.low,
  };
};

/**
 * PlaceMarker — Image-based marker for New Architecture compatibility.
 * Custom view markers don't work on Fabric, so we use image + pinColor.
 */
const PlaceMarker = memo(({ place, isActive, onSelectPlace }) => {
  const handlePress = useCallback(() => {
    onSelectPlace?.(place);
  }, [onSelectPlace, place]);

  const markerColor = isActive
    ? "#0284c7"
    : place?.isFeatured
      ? "#f59e0b"
      : CATEGORY_MARKER_STYLES[place?.categoryId]?.color || "#ef4444";

  return (
    <Marker
      coordinate={{ latitude: place.latitude, longitude: place.longitude }}
      onPress={handlePress}
      anchor={{ x: 0.5, y: 1 }}
      image={place.markerImageUri ? { uri: place.markerImageUri } : undefined}
      pinColor={markerColor}
      tracksViewChanges={false}
      title={place?.name}
    />
  );
});

const MapView = memo(
  forwardRef(
    (
      {
        places = [],
        selectedPlaceId = null,
        onSelectPlace,
        onPressMap,
        style,
        tileUrls,
        mapType = "standard",
        useNativeCleanStyle = false,
        children,
      },
      ref,
    ) => {
      const mapRef = useRef(null);
      const regionRef = useRef(INITIAL_REGION);
      const [tileError, setTileError] = useState(false);

      useImperativeHandle(ref, () => ({
        flyTo: ([lng, lat], zoom = 14) => {
          const delta = zoomToDelta(zoom);
          regionRef.current = {
            latitude: lat,
            longitude: lng,
            latitudeDelta: delta,
            longitudeDelta: delta,
          };
          mapRef.current?.animateToRegion(regionRef.current, FLY_DURATION);
        },
        zoomIn: () => {
          const region = regionRef.current;
          const delta = Math.max(region.latitudeDelta * ZOOM_FACTOR, MIN_DELTA);
          const next = {
            ...region,
            latitudeDelta: delta,
            longitudeDelta: delta,
          };
          regionRef.current = next;
          mapRef.current?.animateToRegion(next, ZOOM_DURATION);
        },
        zoomOut: () => {
          const region = regionRef.current;
          const delta = Math.min(region.latitudeDelta / ZOOM_FACTOR, MAX_DELTA);
          const next = {
            ...region,
            latitudeDelta: delta,
            longitudeDelta: delta,
          };
          regionRef.current = next;
          mapRef.current?.animateToRegion(next, ZOOM_DURATION);
        },
      }));

      const resolvedTileUrls = useMemo(
        () => (Array.isArray(tileUrls) ? tileUrls : DEFAULT_MAP_STYLE.urls),
        [tileUrls],
      );
      const mapStyleArray = useMemo(() => [styles.map, style], [style]);
      const preparedPlaces = useMemo(() => {
        if (!Array.isArray(places) || places.length === 0) return [];

        const nextPlaces = [];
        for (const place of places) {
          const lat = normalizeCoord(place.latitude);
          const lng = normalizeCoord(place.longitude);

          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            continue;
          }

          nextPlaces.push({
            ...place,
            latitude: lat,
            longitude: lng,
            markerImageUri: place?.markerUrl || resolvePlaceImageUri(place),
          });
        }

        return nextPlaces;
      }, [places]);
      const hasTileSource = resolvedTileUrls.length > 0;
      const shouldUseTiles = hasTileSource && !tileError;
      const customMapStyle = useNativeCleanStyle
        ? CLEAN_NATIVE_MAP_STYLE
        : undefined;
      const renderCluster = useCallback((cluster, onPress) => {
        const {
          id,
          geometry: { coordinates },
          properties,
        } = cluster;
        const pointCount = properties?.point_count || 0;
        const pointLabel =
          properties?.point_count_abbreviated ||
          (pointCount > 99 ? "99+" : String(pointCount));
        const { size, ringSize, coreSize, colors } = getClusterVisual(pointCount);

        return (
          <Marker
            key={`cluster-${id}`}
            coordinate={{
              latitude: coordinates[1],
              longitude: coordinates[0],
            }}
            onPress={onPress}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View
              style={[
                styles.clusterHalo,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: colors.halo,
                },
              ]}
            >
              <View
                style={[
                  styles.clusterShell,
                  {
                    width: ringSize,
                    height: ringSize,
                    borderRadius: ringSize / 2,
                    backgroundColor: colors.shell,
                  },
                ]}
              >
                <View
                  style={[
                    styles.clusterCore,
                    {
                      width: coreSize,
                      height: coreSize,
                      borderRadius: coreSize / 2,
                      backgroundColor: colors.core,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.clusterAccent,
                      { backgroundColor: colors.accent },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.clusterLabelWrap}>
                <Text style={[styles.clusterText, { color: colors.text }]}>
                  {pointLabel}
                </Text>
                {pointCount >= 100 ? (
                  <Text style={styles.clusterCaption}>hotspots</Text>
                ) : null}
              </View>
            </View>
          </Marker>
        );
      }, []);
      const handleRegionChangeComplete = useCallback((region) => {
        regionRef.current = region;
      }, []);

      useEffect(() => {
        setTileError(false);
      }, [tileUrls]);

      return (
        <ClusteredMapView
          ref={mapRef}
          style={mapStyleArray}
          provider={PROVIDER_DEFAULT}
          initialRegion={INITIAL_REGION}
          clusteringEnabled={preparedPlaces.length > 1}
          minPoints={2}
          radius={52}
          extent={512}
          nodeSize={64}
          maxZoom={17}
          spiralEnabled
          spiderLineColor="rgba(148,163,184,0.65)"
          animationEnabled
          renderCluster={renderCluster}
          mapType={shouldUseTiles ? "none" : mapType}
          customMapStyle={customMapStyle}
          rotateEnabled={false}
          pitchEnabled={false}
          showsCompass={false}
          showsScale={false}
          showsBuildings={false}
          showsTraffic={false}
          showsIndoors={false}
          minZoomLevel={MAP_CONFIGS.CONSTRAINTS.minZoomLevel}
          maxZoomLevel={MAP_CONFIGS.CONSTRAINTS.maxZoomLevel}
          onPress={onPressMap}
          onRegionChangeComplete={handleRegionChangeComplete}
          edgePadding={{ top: 120, right: 120, bottom: 120, left: 120 }}
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
                  onError={() => {
                    setTileError(true);
                  }}
                />
              ))
            : null}

          {preparedPlaces.map((place) => (
            <PlaceMarker
              key={place.id}
              place={place}
              isActive={place.id === selectedPlaceId}
              onSelectPlace={onSelectPlace}
            />
          ))}

          {children}
        </ClusteredMapView>
      );
    },
  ),
);

MapView.displayName = "MapView";
export default MapView;

const styles = StyleSheet.create({
  map: { flex: 1 },
  clusterHalo: {
    alignItems: "center",
    justifyContent: "center",
  },
  clusterShell: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 10,
  },
  clusterCore: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  clusterAccent: {
    position: "absolute",
    top: 4,
    left: 4,
    width: "62%",
    height: "38%",
    borderRadius: 999,
    opacity: 0.92,
    transform: [{ rotate: "-18deg" }],
  },
  clusterLabelWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  clusterText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  clusterCaption: {
    marginTop: 1,
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "rgba(15,23,42,0.58)",
  },
});
