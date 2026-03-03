import { memo, useMemo } from "react";
import { Geojson } from "react-native-maps";
import { COLORS } from "../../../constants/colors";

const DISTRICT_COLORS = [
  "#2B7CB8", "#1E8A5E", "#C47F17", "#B83040", "#6840A8",
  "#1A8A7F", "#B85520", "#3450A0", "#3A7830",
];

const DISTRICT_STYLE = {
  fillColor: "rgba(186,215,233,0.25)",
  strokeColor: COLORS.primary,
  strokeWidth: 2,
};

const WARD_STYLE = {
  fillColor: "transparent",
  strokeColor: "rgba(148,163,184,0.45)",
  strokeWidth: 0.8,
};

const DistrictLayer = memo(({ geojson }) => {
  const features = useMemo(() => {
    if (!geojson?.features?.length) return [];
    return geojson.features
      .filter((f) => f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon")
      .map((feature, idx) => ({
        ...feature,
        _strokeColor: DISTRICT_COLORS[idx % DISTRICT_COLORS.length],
      }));
  }, [geojson]);

  if (features.length === 0) return null;

  return features.map((feature, idx) => (
    <Geojson
      key={`district-${feature.properties?.id || idx}`}
      geojson={{ type: "FeatureCollection", features: [feature] }}
      fillColor={DISTRICT_STYLE.fillColor}
      strokeColor={feature._strokeColor}
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
