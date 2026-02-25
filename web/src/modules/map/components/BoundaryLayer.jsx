import { useMemo } from "react";
import { Source, Layer } from "../adapters";
import { useMapContext } from "../context/MapProvider";
import {
  MAP_THEME,
  LAYER_IDS,
  DISTRICT_COLORS,
  buildDistrictColorExpression,
} from "../config/mapConfig";

const BoundaryLayer = ({ mask, districts, wards, onSelect }) => {
  const { hoveredFeature, selectedDistrict, setHoveredFeature } = useMapContext();

  // Stable, sorted district id list for deterministic color assignment
  const districtIds = useMemo(() => {
    if (!districts?.features) return [];
    return [...districts.features]
      .sort((a, b) => a.properties.id - b.properties.id)
      .map((f) => f.properties.id);
  }, [districts]);

  const selectedId = selectedDistrict?.properties?.id ?? null;
  const hoveredId = hoveredFeature?.properties?.id ?? null;

  // Fill: unique color per district; hover/selected brightened from same palette
  const districtFillStyle = useMemo(() => {
    const defaultFillExpr = buildDistrictColorExpression(districtIds, "fill", "rgba(14,107,168,0.05)");
    const hoverFillExpr = buildDistrictColorExpression(districtIds, "hover", "rgba(14,107,168,0.2)");
    const selectedFillExpr = buildDistrictColorExpression(districtIds, "selected", "rgba(14,107,168,0.35)");

    return {
      id: LAYER_IDS.DISTRICT_FILL,
      type: "fill",
      paint: {
        "fill-color": [
          "case",
          ["==", ["to-string", ["get", "id"]], String(selectedId)], selectedFillExpr,
          ["==", ["to-string", ["get", "id"]], String(hoveredId)], hoverFillExpr,
          defaultFillExpr,
        ],
        "fill-opacity": 1,
      },
    };
  }, [districtIds, selectedId, hoveredId]);

  const districtLineStyle = useMemo(() => {
    const lineColorExpr = buildDistrictColorExpression(districtIds, "line", "#0E6BA8");
    return {
      id: LAYER_IDS.DISTRICT_LINE,
      type: "line",
      paint: {
        "line-color": lineColorExpr,
        "line-width": [
          "case",
          ["==", ["to-string", ["get", "id"]], String(selectedId)],
          MAP_THEME.DISTRICT.LINE_WIDTH_SELECTED,
          MAP_THEME.DISTRICT.LINE_WIDTH,
        ],
        "line-opacity": 0.9,
      },
    };
  }, [districtIds, selectedId]);

  const maskLayerStyle = useMemo(() => ({
    id: LAYER_IDS.MASK,
    type: "fill",
    paint: {
      "fill-color": MAP_THEME.MASK_COLOR,
      "fill-opacity": MAP_THEME.MASK_OPACITY,
    },
  }), []);

  const wardFillStyle = useMemo(() => ({
    id: LAYER_IDS.WARD_FILL,
    type: "fill",
    minzoom: 12,
    paint: {
      "fill-color": MAP_THEME.WARD.HOVER_FILL,
      "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 1, 0],
    },
  }), []);

  const wardLineStyle = useMemo(() => ({
    id: LAYER_IDS.WARD_LINE,
    type: "line",
    minzoom: 12,
    paint: {
      "line-color": MAP_THEME.WARD.LINE_COLOR,
      "line-width": MAP_THEME.WARD.LINE_WIDTH,
      "line-dasharray": [3, 2],
    },
  }), []);

  const onClick = (e) => {
    const feature = e.features?.[0];
    if (feature && onSelect) {
      const type = feature.layer.id.includes("ward") ? "ward" : "district";
      onSelect(feature, type);
    }
  };

  const onHover = (e) => {
    const feature = e.features?.[0];
    setHoveredFeature(feature ? { id: feature.id, properties: feature.properties } : null);
  };

  return (
    <>
      {mask && (
        <Source id="mask-source" type="geojson" data={mask}>
          <Layer {...maskLayerStyle} />
        </Source>
      )}

      {districts && (
        <Source id="districts-source" type="geojson" data={districts}>
          <Layer {...districtFillStyle} onClick={onClick} onMouseMove={onHover} onMouseLeave={() => setHoveredFeature(null)} />
          <Layer {...districtLineStyle} />
        </Source>
      )}

      {wards && (
        <Source id="wards-source" type="geojson" data={wards}>
          <Layer {...wardFillStyle} />
          <Layer {...wardLineStyle} onClick={onClick} />
        </Source>
      )}
    </>
  );
};

export default BoundaryLayer;
