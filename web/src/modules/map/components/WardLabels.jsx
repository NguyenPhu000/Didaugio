import { useMemo } from "react";
import { Source, Layer } from "../adapters";

const WARD_LABEL_LAYER = {
  id: "ward-labels",
  type: "symbol",
  minzoom: 13,
  layout: {
    "text-field": ["get", "name"],
    "text-font": ["Noto Sans Regular"],
    "text-size": 9,
    "text-anchor": "center",
    "text-allow-overlap": false,
    "text-ignore-placement": false,
  },
  paint: {
    "text-color": "#64748b",
    "text-halo-color": "#ffffff",
    "text-halo-width": 1.5,
  },
};

const WardLabels = ({ wards }) => {
  const labelGeojson = useMemo(() => {
    if (!wards?.features) return null;
    const features = wards.features.filter((f) => f.geometry?.type === "Point");
    if (!features.length) return null;
    return { type: "FeatureCollection", features };
  }, [wards]);

  if (!labelGeojson) return null;

  return (
    <Source id="ward-labels-source" type="geojson" data={labelGeojson}>
      <Layer {...WARD_LABEL_LAYER} />
    </Source>
  );
};

export default WardLabels;
