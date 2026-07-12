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
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import ClusteredMapView from "react-native-map-clustering";
import { Marker, PROVIDER_DEFAULT, UrlTile } from "react-native-maps";
import {
  CATEGORY_MARKER_STYLES,
  DEFAULT_MAP_STYLE,
  MAP_CONFIGS,
} from "../config/mapConfig";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import { regionToZoom } from "../utils/mapZoom";

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

const MAP_EDGE_PADDING = { top: 120, right: 120, bottom: 120, left: 120 };
const MIN_DELTA = 0.004;
const MAX_DELTA = 0.5;
const ZOOM_FACTOR = 0.5;
const FLY_DURATION = 800;
const ZOOM_DURATION = 300;
const TILE_ERROR_RESET_DELAY_MS = 0;

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
    return { size: 64, ringSize: 52, coreSize: 40, colors: CLUSTER_COLORS.high };
  }

  if (pointCount >= 20) {
    return {
      size: 58,
      ringSize: 46,
      coreSize: 35,
      colors: CLUSTER_COLORS.medium,
    };
  }

  return { size: 52, ringSize: 40, coreSize: 30, colors: CLUSTER_COLORS.low };
};

const ClusterMarker = memo(function ClusterMarker({ cluster, onPress }) {
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
      coordinate={{ latitude: coordinates[1], longitude: coordinates[0] }}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
    >
      <View
        className="items-center justify-center"
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
          className="items-center justify-center border border-white/90"
          style={[
            styles.clusterRing,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              backgroundColor: colors.shell,
            },
          ]}
        >
          <View
            className="items-center justify-center overflow-hidden"
            style={{
              width: coreSize,
              height: coreSize,
              borderRadius: coreSize / 2,
              backgroundColor: colors.core,
            }}
          >
            <View
              className="absolute left-px top-px h-[38%] w-[62%] -rotate-[18deg] rounded-full opacity-90"
              style={{ backgroundColor: colors.accent }}
            />
          </View>
        </View>

        <View className="absolute items-center justify-center">
          <Text
            className="text-[14px] font-bold tracking-[-0.2px]"
            style={{ color: colors.text }}
          >
            {pointLabel}
          </Text>
        </View>
      </View>
    </Marker>
  );
});

const PlaceMarker = memo(
  ({ place, isActive, showLabel, onSelectPlace, onLongPressPlace }) => {
    const handlePress = useCallback(() => {
      onSelectPlace?.(place);
    }, [onSelectPlace, place]);

    const handleLongPress = useCallback(() => {
      onLongPressPlace?.(place);
    }, [onLongPressPlace, place]);

    const markerColor = isActive
      ? "#0F766E"
      : place?.isFeatured
        ? "#F59E0B"
        : CATEGORY_MARKER_STYLES[place?.categoryId]?.color || "#ef4444";
    const coordinate = {
      latitude: place.latitude,
      longitude: place.longitude,
    };
    const markerImage = place.markerImageUri
      ? { uri: place.markerImageUri }
      : undefined;

    return (
      <Marker
        coordinate={coordinate}
        onPress={handlePress}
        onLongPress={handleLongPress}
        anchor={{ x: 0.5, y: 1 }}
        image={markerImage}
        pinColor={markerColor}
        tracksViewChanges={false}
      >
        {showLabel && place?.name ? (
          <View
            className="absolute left-full top-1/2 ml-1.5 -translate-y-[7px]"
            pointerEvents="none"
          >
            <Text
              className="text-[11px] font-semibold tracking-[0.1px] text-black"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {place.name}
            </Text>
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
    prev.showLabel === next.showLabel,
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
        style,
        tileUrls,
        mapType = "standard",
        useNativeCleanStyle = false,
        mapPadding,
        courseUpEnabled = false,
        showsUserLocation = false,
        showsUserHeadingIndicator = false,
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
      const [showMarkerLabels, setShowMarkerLabels] = useState(false);

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
            markerImageUri: place?.markerUrl || resolvePlaceImageUri(place),
          });
        }

        return nextPlaces;
      }, [places]);

      const shouldUseTiles = resolvedTileUrls.length > 0 && !tileError;
      const customMapStyle = useNativeCleanStyle
        ? CLEAN_NATIVE_MAP_STYLE
        : undefined;
      const mapStyle = style ? [styles.map, style] : styles.map;

      const renderCluster = useCallback(
        (cluster, onPress) => (
          <ClusterMarker cluster={cluster} onPress={onPress} />
        ),
        [],
      );

      const handleRegionChangeComplete = useCallback(
        (region) => {
          regionRef.current = region;
          const zoomValue = regionToZoom(region, viewportWidth);
          const nextShowMarkerLabels = zoomValue >= 15;

          setShowMarkerLabels((previous) =>
            previous === nextShowMarkerLabels ? previous : nextShowMarkerLabels,
          );

          onZoomChange?.(Math.round(zoomValue));
        },
        [onZoomChange, viewportWidth],
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
          clusteringEnabled={preparedPlaces.length > 1}
          minPoints={2}
          radius={60}
          extent={256}
          nodeSize={32}
          maxZoom={16}
          spiralEnabled
          spiderLineColor="rgba(148,163,184,0.65)"
          animationEnabled
          renderCluster={renderCluster}
          mapType={shouldUseTiles ? "none" : mapType}
          customMapStyle={customMapStyle}
          showsUserLocation={showsUserLocation}
          showsUserHeadingIndicator={showsUserHeadingIndicator}
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

          {preparedPlaces.map((place) => (
            <PlaceMarker
              key={place.id}
              place={place}
              isActive={place.id === selectedPlaceId}
              showLabel={place.id === selectedPlaceId || showMarkerLabels}
              onSelectPlace={onSelectPlace}
              onLongPressPlace={onLongPressPlace}
            />
          ))}

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
  clusterHalo: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  clusterRing: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 6,
  },
});

export default MapView;
