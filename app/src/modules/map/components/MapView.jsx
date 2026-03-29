import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Image as RNImage, Platform, StyleSheet, View } from "react-native";
import RNMapView, {
  Marker,
  PROVIDER_DEFAULT,
  UrlTile,
} from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import {
  CATEGORY_MARKER_STYLES,
  DEFAULT_CATEGORY_ICON,
  DEFAULT_MAP_STYLE,
  MAP_CONFIGS,
} from "../config/mapConfig";
import { resolvePlaceImageUri } from "../../../lib/media-url";

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

const PIN_SIZE = 42;
const PIN_SIZE_ACTIVE = 52;
const STEM_W = 12;
const STEM_H = 9;
const PIN_CANVAS_W = PIN_SIZE_ACTIVE + 8;
const PIN_CANVAS_H = PIN_SIZE_ACTIVE + STEM_H + 6;

const zoomToDelta = (zoom) => (zoom >= 15 ? 0.01 : zoom >= 13 ? 0.03 : 0.08);

/**
 * PlacePin — Circular photo marker with stem, matching web style.
 * Uses React Native Image (not expo-image) so the marker snapshot captures
 * the image synchronously when tracksViewChanges cycles from true → false.
 */
const PlacePin = memo(({ place, imageUri, isActive, onImageLoad }) => {
  const catCfg =
    CATEGORY_MARKER_STYLES[place?.categoryId] ?? DEFAULT_CATEGORY_ICON;
  const catColor = catCfg.color || "#6366f1";

  const borderColor = isActive
    ? "#3b82f6"
    : place?.isFeatured
      ? "#f59e0b"
      : catColor;
  const size = isActive ? PIN_SIZE_ACTIVE : PIN_SIZE;
  const borderW = isActive ? 3 : 2.5;
  const innerSize = size - borderW * 2;
  const wrapperStyle = {
    width: PIN_CANVAS_W,
    height: PIN_CANVAS_H,
  };
  const circleStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    padding: borderW,
    backgroundColor: borderColor,
  };
  const mediaStyle = {
    width: innerSize,
    height: innerSize,
    borderRadius: innerSize / 2,
    backgroundColor: catCfg.bg || "#eef2ff",
  };

  return (
    <View style={[styles.pinWrapper, wrapperStyle]} collapsable={false}>
      {/*
       * Border via padding trick — avoids the Android bug:
       *   elevation + overflow:hidden + borderRadius = half-circle artifact
       * Solution: outer ring uses backgroundColor=borderColor + padding,
       * inner image has its own borderRadius. No overflow:hidden, no elevation.
       */}
      <View style={[styles.pinBubble, circleStyle]} collapsable={false}>
        {imageUri ? (
          <RNImage
            source={{ uri: imageUri }}
            style={mediaStyle}
            resizeMode="cover"
            onLoad={onImageLoad}
          />
        ) : (
          <View style={[styles.pinFallback, mediaStyle]}>
            <MaterialIcons
              name={catCfg.icon || "place"}
              size={isActive ? 20 : 16}
              color={catColor}
            />
          </View>
        )}
      </View>

      <View
        style={[
          styles.pinStem,
          {
            width: STEM_W,
            height: STEM_W,
            backgroundColor: borderColor,
            bottom: STEM_H - 1,
          },
        ]}
        collapsable={false}
      />
    </View>
  );
});

/**
 * PlaceMarker — wraps Marker + PlacePin and manages tracksViewChanges.
 * Starts tracking, stops after image loads (or if no image, stops immediately).
 */
const PlaceMarker = memo(({ place, isActive, onSelectPlace }) => {
  const [tracked, setTracked] = useState(true);

  const imgUri = resolvePlaceImageUri(place);

  const handleImageLoad = useCallback(() => {
    setTracked(false);
  }, []);

  const handlePress = useCallback(() => {
    onSelectPlace?.(place);
  }, [onSelectPlace, place]);

  // tracksViewChanges: only true while the pin image is loading, then false.
  // Do NOT override to always-true on Android — that re-renders every marker
  // on every frame causing severe lag with many pins.
  const shouldTrackViewChanges = isActive || tracked;

  return (
    <Marker
      coordinate={{ latitude: place.latitude, longitude: place.longitude }}
      onPress={handlePress}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={shouldTrackViewChanges}
    >
      <PlacePin
        place={place}
        imageUri={imgUri}
        isActive={isActive}
        onImageLoad={imgUri ? handleImageLoad : undefined}
      />
    </Marker>
  );
});

const MapView = forwardRef(
  (
    {
      places = [],
      selectedPlaceId = null,
      onSelectPlace,
      style,
      tileUrls,
      children,
    },
    ref,
  ) => {
    const mapRef = useRef(null);
    const regionRef = useRef(INITIAL_REGION);

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
    }));

    const resolvedTileUrls = tileUrls?.length
      ? tileUrls
      : DEFAULT_MAP_STYLE.urls;

    return (
      <RNMapView
        ref={mapRef}
        style={[styles.map, style]}
        provider={PROVIDER_DEFAULT}
        initialRegion={INITIAL_REGION}
        mapType="none"
        rotateEnabled={false}
        pitchEnabled={false}
        showsCompass={false}
        showsScale={false}
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
        minZoomLevel={MAP_CONFIGS.CONSTRAINTS.minZoomLevel}
        maxZoomLevel={MAP_CONFIGS.CONSTRAINTS.maxZoomLevel}
        onRegionChangeComplete={(region) => {
          regionRef.current = region;
        }}
      >
        {resolvedTileUrls.map((tileUrl) => (
          <UrlTile
            key={tileUrl}
            urlTemplate={tileUrl}
            maximumZ={19}
            tileSize={256}
            flipY={false}
            shouldReplaceMapContent
          />
        ))}

        {places.map((place) => {
          if (!place.latitude || !place.longitude) return null;
          const isActive = place.id === selectedPlaceId;

          return (
            <PlaceMarker
              key={place.id}
              place={place}
              isActive={isActive}
              onSelectPlace={onSelectPlace}
            />
          );
        })}

        {children}
      </RNMapView>
    );
  },
);

MapView.displayName = "MapView";
export default MapView;

const styles = StyleSheet.create({
  map: { flex: 1 },
  pinWrapper: {
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  pinBubble: {
    zIndex: 2,
  },
  pinFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  pinStem: {
    position: "absolute",
    transform: [{ rotate: "45deg" }],
    borderBottomLeftRadius: 2,
    zIndex: 1,
  },
});
