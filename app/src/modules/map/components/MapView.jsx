/**
 * MapView — React Native (react-native-maps + OSM UrlTile)
 * Works with Expo Go — no native build required.
 * Mirrors web MapBase + PlaceMarkers interface.
 */
import { forwardRef, useImperativeHandle, useRef } from "react";
import { StyleSheet, View } from "react-native";
import RNMapView, {
  UrlTile,
  Marker,
  PROVIDER_DEFAULT,
} from "react-native-maps";
import { MAP_CONFIGS, MAP_THEME } from "../config/mapConfig";

// Can Tho initial region
const INITIAL_REGION = {
  latitude: MAP_CONFIGS.INITIAL_VIEW.centerCoordinate[1],
  longitude: MAP_CONFIGS.INITIAL_VIEW.centerCoordinate[0],
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

const MIN_DELTA = 0.004;
const MAX_DELTA = 0.5;

// ─── Place pin dot ────────────────────────────────────────────────────────────
const PinDot = ({ isFeatured, isActive }) => (
  <View
    style={[
      styles.pinOuter,
      isActive && styles.pinOuterActive,
      isFeatured && styles.pinOuterFeatured,
    ]}
  >
    <View
      style={[
        styles.pinInner,
        isActive && styles.pinInnerActive,
        isFeatured && styles.pinInnerFeatured,
      ]}
    />
  </View>
);

// ─── Main map component ───────────────────────────────────────────────────────
const MapView = forwardRef(
  (
    { places = [], selectedPlaceId = null, onSelectPlace, style, children },
    ref,
  ) => {
    const mapRef = useRef(null);
    const regionRef = useRef(INITIAL_REGION);

    useImperativeHandle(ref, () => ({
      flyTo: ([lng, lat], zoom = 14) => {
        const delta = zoom >= 15 ? 0.01 : zoom >= 13 ? 0.03 : 0.08;
        regionRef.current = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: delta,
          longitudeDelta: delta,
        };
        mapRef.current?.animateToRegion(regionRef.current, 800);
      },
      zoomIn: () => {
        const r = regionRef.current;
        const delta = Math.max(r.latitudeDelta * 0.5, MIN_DELTA);
        const next = { ...r, latitudeDelta: delta, longitudeDelta: delta };
        regionRef.current = next;
        mapRef.current?.animateToRegion(next, 300);
      },
      zoomOut: () => {
        const r = regionRef.current;
        const delta = Math.min(r.latitudeDelta * 2, MAX_DELTA);
        const next = { ...r, latitudeDelta: delta, longitudeDelta: delta };
        regionRef.current = next;
        mapRef.current?.animateToRegion(next, 300);
      },
    }));

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
        {/* CartoDB Light tiles — free, no User-Agent restriction */}
        <UrlTile
          urlTemplate="https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          maximumZ={19}
          tileSize={256}
          flipY={false}
          shouldReplaceMapContent
        />

        {/* Place markers */}
        {places.map((place) => {
          if (!place.latitude || !place.longitude) return null;
          return (
            <Marker
              key={place.id}
              coordinate={{
                latitude: place.latitude,
                longitude: place.longitude,
              }}
              onPress={() => onSelectPlace?.(place)}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <PinDot
                isFeatured={place.isFeatured}
                isActive={place.id === selectedPlaceId}
              />
            </Marker>
          );
        })}

        {children}
      </RNMapView>
    );
  },
);

MapView.displayName = "MapView";
export default MapView;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  map: { flex: 1 },

  pinOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: MAP_THEME.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  pinOuterActive: {
    backgroundColor: MAP_THEME.GOLD,
    borderColor: MAP_THEME.GOLD,
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  pinOuterFeatured: {
    borderColor: MAP_THEME.GOLD,
    borderWidth: 2.5,
  },
  pinInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: MAP_THEME.PRIMARY,
  },
  pinInnerActive: { backgroundColor: "#fff" },
  pinInnerFeatured: { backgroundColor: MAP_THEME.GOLD },
});
