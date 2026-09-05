import { memo, useMemo } from "react";
import { Marker, Geojson, Polygon } from "react-native-maps";
import { Text, View, StyleSheet } from "react-native";
import { MAP_THEME, DISTRICT_COLORS } from "../config/mapConfig";

const MASK_COLOR = "rgba(15, 23, 42, 0.45)";
const WORLD_MASK_COORDS = [
  { latitude: 85, longitude: -179.99 },
  { latitude: 85, longitude: 179.99 },
  { latitude: -85, longitude: 179.99 },
  { latitude: -85, longitude: -179.99 },
];

function extractDistrictExteriorRings(geometry) {
  if (!geometry) return [];
  const rings = [];
  if (geometry.type === "Polygon") {
    const exterior = geometry.coordinates?.[0];
    if (exterior && exterior.length >= 3) {
      rings.push(
        exterior.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
      );
    }
  } else if (geometry.type === "MultiPolygon") {
    geometry.coordinates?.forEach((poly) => {
      const exterior = poly?.[0];
      if (exterior && exterior.length >= 3) {
        rings.push(
          exterior.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
        );
      }
    });
  }
  return rings;
}

function getRepresentativeCoordinates(geometry) {
  if (!geometry?.coordinates) return null;
  if (geometry.type === "Point") {
    return [geometry.coordinates];
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates[0]?.[0] || null;
  }
  if (geometry.type === "Polygon") {
    return geometry.coordinates[0] || null;
  }
  return null;
}

function computeCentroid(geometry) {
  try {
    const coords = getRepresentativeCoordinates(geometry);

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
 * - Inverted mask: Surrounding provinces outside Can Tho (old border) are dimmed with dark fog mask.
 * - Can Tho 9 districts territory remains 100% bright and highlighted.
 * - All 9 district boundary lines and centroid labels are drawn.
 */
const ContextualBoundaryLayer = memo(
  ({
    geojson,
    activeArea,
    allAreasKey,
    showIslandMask = true,
    showDistrictBorders = true,
    showDistrictLabels = true,
  }) => {
    // 1. Single active district selection
    const activeDistrict = useMemo(() => {
      if (!geojson?.features?.length) return null;
      if (!activeArea || activeArea === allAreasKey) return null;

      const feature = geojson.features.find(
        (f) =>
          f.properties?.code === activeArea &&
          (f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon"),
      );

      if (!feature) return null;

      const idx = geojson.features.indexOf(feature) % DISTRICT_COLORS.length;
      const colors = DISTRICT_COLORS[Math.max(0, idx)];
      const centroid = computeCentroid(feature.geometry);
      const holes = extractDistrictExteriorRings(feature.geometry);
      const featureCollection = {
        type: "FeatureCollection",
        features: [feature],
      };

      return { feature, colors, centroid, holes, featureCollection };
    }, [geojson, activeArea, allAreasKey]);

    // 2. All districts summary (for full Can Tho Island Mode)
    const islandOverview = useMemo(() => {
      if (!geojson?.features?.length) return null;
      if (activeArea && activeArea !== allAreasKey) return null;
      if (!showIslandMask && !showDistrictBorders && !showDistrictLabels) return null;

      const polygonFeatures = geojson.features.filter(
        (f) =>
          f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon",
      );

      if (polygonFeatures.length === 0) return null;

      const allHoles = [];
      const districtItems = [];

      polygonFeatures.forEach((feature, idx) => {
        const featureHoles = extractDistrictExteriorRings(feature.geometry);
        featureHoles.forEach((hole) => {
          if (hole && hole.length >= 3) {
            allHoles.push(hole);
          }
        });

        const centroid = computeCentroid(feature.geometry);
        const name = (
          feature.properties?.name ||
          feature.properties?.code ||
          ""
        ).toUpperCase();

        districtItems.push({
          id: feature.properties?.id ?? feature.properties?.code ?? idx,
          feature,
          centroid,
          name,
        });
      });

      const bordersFeatureCollection = {
        type: "FeatureCollection",
        features: polygonFeatures,
      };

      return { allHoles, districtItems, bordersFeatureCollection };
    }, [geojson, activeArea, allAreasKey, showIslandMask, showDistrictBorders, showDistrictLabels]);

    // Case A: Specific district active
    if (activeDistrict) {
      const { colors, centroid, holes, featureCollection } = activeDistrict;
      return (
        <>
          {/* Outer dark fog mask: everything outside the selected district is dimmed */}
          <Polygon
            key="mask-active-district"
            coordinates={WORLD_MASK_COORDS}
            holes={holes}
            fillColor={MASK_COLOR}
            strokeColor="transparent"
            strokeWidth={0}
          />

          {/* Highlighted active district boundary */}
          <Geojson
            key="active-district-border"
            geojson={featureCollection}
            fillColor={colors.fill}
            strokeColor={colors.line}
            strokeWidth={MAP_THEME.DISTRICT.STROKE_WIDTH + 0.8}
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
              <View pointerEvents="none" style={styles.labelContainer}>
                <Text
                  style={[
                    styles.labelText,
                    {
                      color: colors.line,
                      fontSize: 14,
                      fontWeight: "900",
                    },
                  ]}
                >
                  {featureCollection.features[0]?.properties?.name?.toUpperCase() || ""}
                </Text>
              </View>
            </Marker>
          ) : null}
        </>
      );
    }

    // Case B: Island Overview Mode (All 9 Districts of Can Tho)
    if (islandOverview) {
      const { allHoles, districtItems, bordersFeatureCollection } = islandOverview;

      return (
        <>
          {/* 1. Inverted Outer Fog Mask: Covers surrounding provinces, leaves Can Tho 9 districts bright */}
          {showIslandMask && allHoles.length > 0 ? (
            <Polygon
              key="cantho-island-outer-fog-mask"
              coordinates={WORLD_MASK_COORDS}
              holes={allHoles}
              fillColor={MASK_COLOR}
              strokeColor="transparent"
              strokeWidth={0}
            />
          ) : null}

          {/* 2. All 9 District Boundary Strokes */}
          {showDistrictBorders && bordersFeatureCollection ? (
            <Geojson
              key="cantho-all-district-borders"
              geojson={bordersFeatureCollection}
              fillColor="transparent"
              strokeColor="#1E293B"
              strokeWidth={MAP_THEME.DISTRICT.STROKE_WIDTH}
            />
          ) : null}

          {/* 3. District Centroid Name Labels */}
          {showDistrictLabels
            ? districtItems.map((item) => {
                if (!item.centroid || !item.name) return null;
                return (
                  <Marker
                    key={`district-centroid-label-${item.id}`}
                    coordinate={{
                      latitude: item.centroid.lat,
                      longitude: item.centroid.lng,
                    }}
                    anchor={{ x: 0.5, y: 0.5 }}
                    tracksViewChanges={false}
                  >
                    <View pointerEvents="none" style={styles.labelContainer}>
                      <Text style={styles.labelText}>{item.name}</Text>
                    </View>
                  </Marker>
                );
              })
            : null}
        </>
      );
    }

    return null;
  },
);

const styles = StyleSheet.create({
  labelContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  labelText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textShadowColor: "rgba(255, 255, 255, 0.95)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
    textAlign: "center",
  },
});

/**
 * Legacy layers kept for direct use if needed (e.g. admin/debug).
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
