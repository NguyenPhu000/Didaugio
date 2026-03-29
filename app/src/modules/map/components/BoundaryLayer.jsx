import { memo, useMemo } from "react";
import { Geojson } from "react-native-maps";
import { MAP_THEME } from "../config/mapConfig";

const DISTRICT_STYLE = {
  fillColor: "transparent",
  strokeColor: MAP_THEME.DISTRICT.STROKE_COLOR,
  strokeWidth: MAP_THEME.DISTRICT.STROKE_WIDTH,
};

const WARD_STYLE = {
  fillColor: "transparent",
  strokeColor: MAP_THEME.WARD.LINE_COLOR,
  strokeWidth: MAP_THEME.WARD.LINE_WIDTH,
};

const DistrictLayer = memo(({ geojson }) => {
  const features = useMemo(() => {
    if (!geojson?.features?.length) return [];
    return geojson.features.filter(
      (feature) =>
        feature.geometry?.type === "Polygon" ||
        feature.geometry?.type === "MultiPolygon",
    );
  }, [geojson]);

  if (features.length === 0) return null;

  return features.map((feature, idx) => (
    <Geojson
      key={`district-${feature.properties?.id || idx}`}
      geojson={{ type: "FeatureCollection", features: [feature] }}
      fillColor={DISTRICT_STYLE.fillColor}
      strokeColor={DISTRICT_STYLE.strokeColor}
      strokeWidth={DISTRICT_STYLE.strokeWidth}
    />
  ));
});

const WardLayer = memo(({ geojson }) => {
  if (!geojson?.features?.length) return null;

  return (
    <Geojson
      geojson={geojson}
      fillColor={WARD_STYLE.fillColor}
      strokeColor={WARD_STYLE.strokeColor}
      strokeWidth={WARD_STYLE.strokeWidth}
    />
  );
});

DistrictLayer.displayName = "DistrictLayer";
WardLayer.displayName = "WardLayer";

export { DistrictLayer, WardLayer };
