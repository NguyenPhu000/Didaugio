import { memo, useMemo } from "react";
import { Marker, Geojson, Polygon } from "react-native-maps";
import { Text, View } from "react-native";
import { MAP_THEME, DISTRICT_COLORS } from "../config/mapConfig";

const MASK_COLOR = "rgba(15,23,42,0.45)";
const WORLD_COORDS = [
  { latitude: -85, longitude: -180 },
  { latitude: -85, longitude: 180 },
  { latitude: 85, longitude: 180 },
  { latitude: 85, longitude: -180 },
];

function extractCoords(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat();
  return [];
}

function computeCentroid(geometry) {
  try {
    const coords =
      geometry.type === "Point"
        ? [geometry.coordinates]
        : geometry.type === "MultiPolygon"
          ? geometry.coordinates[0][0]
          : geometry.coordinates[0];

    if (!coords?.length) return null;

    let sumLng = 0;
    let sumLat = 0;
    for (const [lng, lat] of coords) {
      sumLng += lng;
      sumLat += lat;
    }
    return { lng: sumLng / coords.length, lat: sumLat / coords.length };
  } catch {
    return null;
  }
}

/**
 * Contextual boundary layer:
 * - activeArea === null or ALL_AREAS_KEY → no boundaries shown (clean map)
 * - activeArea === district code → highlight that district + mask outside + label
 */
const ContextualBoundaryLayer = memo(({ geojson, activeArea, allAreasKey }) => {
  const result = useMemo(() => {
    if (!geojson?.features?.length) return null;
    if (!activeArea || activeArea === allAreasKey) return null;

    const feature = geojson.features.find(
      (f) =>
        f.properties?.code === activeArea &&
        (f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon"),
    );

    if (!feature) return null;

    const idx =
      geojson.features.indexOf(feature) % DISTRICT_COLORS.length;
    const colors = DISTRICT_COLORS[Math.max(0, idx)];
    const centroid = computeCentroid(feature.geometry);
    const coords = extractCoords(feature.geometry);

    return { feature, colors, centroid, coords };
  }, [geojson, activeArea, allAreasKey]);

  if (!result) return null;

  const { feature, colors, centroid, coords } = result;

  return (
    <>
      {/* Mask: darken everything outside the selected district */}
      {coords.map((ring, i) => (
        <Polygon
          key={`mask-${i}`}
          coordinates={[
            ...WORLD_COORDS,
            ...ring.map(([lng, lat]) => ({
              latitude: lat,
              longitude: lng,
            })),
          ]}
          fillColor={MASK_COLOR}
          strokeColor="transparent"
          strokeWidth={0}
          holes={[ring.map(([lng, lat]) => ({
            latitude: lat,
            longitude: lng,
          }))]}
        />
      ))}

      {/* Highlighted district boundary */}
      <Geojson
        geojson={{ type: "FeatureCollection", features: [feature] }}
        fillColor={colors.fill}
        strokeColor={colors.line}
        strokeWidth={MAP_THEME.DISTRICT.STROKE_WIDTH + 0.5}
      />

      {/* District label at centroid */}
      {centroid ? (
        <Marker
          coordinate={{
            latitude: centroid.lat,
            longitude: centroid.lng,
          }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View pointerEvents="none">
            <Text
              style={{
                color: colors.line,
                fontSize: 13,
                fontWeight: "800",
                letterSpacing: 1.5,
                textShadowColor: "rgba(255,255,255,0.95)",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 8,
              }}
            >
              {feature.properties?.name?.toUpperCase() || ""}
            </Text>
          </View>
        </Marker>
      ) : null}
    </>
  );
});

/**
 * Legacy layers kept for direct use if needed (e.g. admin/debug).
 * Default map screen should use ContextualBoundaryLayer instead.
 */
const DistrictLayer = memo(({ geojson }) => {
  if (!geojson?.features?.length) return null;

  const features = geojson.features.filter(
    (f) =>
      f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon",
  );

  if (features.length === 0) return null;

  return (
    <>
      {features.map((feature, idx) => {
        const colorIdx = (feature.properties?.id ?? idx) % DISTRICT_COLORS.length;
        const colors = DISTRICT_COLORS[colorIdx];
        return (
          <Geojson
            key={`district-${feature.properties?.id ?? idx}`}
            geojson={{ type: "FeatureCollection", features: [feature] }}
            fillColor={colors.fill}
            strokeColor={colors.line}
            strokeWidth={MAP_THEME.DISTRICT.STROKE_WIDTH}
          />
        );
      })}
    </>
  );
});

const WardLayer = memo(({ geojson }) => {
  if (!geojson?.features?.length) return null;

  return (
    <Geojson
      geojson={geojson}
      fillColor="transparent"
      strokeColor={MAP_THEME.WARD.LINE_COLOR}
      strokeWidth={MAP_THEME.WARD.LINE_WIDTH}
    />
  );
});

ContextualBoundaryLayer.displayName = "ContextualBoundaryLayer";
DistrictLayer.displayName = "DistrictLayer";
WardLayer.displayName = "WardLayer";

export { ContextualBoundaryLayer, DistrictLayer, WardLayer };
