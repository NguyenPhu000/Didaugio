import { useMemo } from "react";
import { Source, Layer } from "../adapters";
import { useMapContext } from "../context/MapProvider";
import { MAP_THEME, LAYER_IDS } from "../config/mapConfig";

const BoundaryLayer = ({ mask, districts, wards, onSelect }) => {
  const { hoveredFeature, selectedDistrict, setHoveredFeature } =
    useMapContext();

  const selectedId = selectedDistrict?.properties?.id ?? null;
  const hoveredId = hoveredFeature?.properties?.id ?? null;

  // ── Fill: transparent by default, only appears on hover / selected
  const districtFillStyle = useMemo(
    () => ({
      id: LAYER_IDS.DISTRICT_FILL,
      type: "fill",
      paint: {
        "fill-color": [
          "case",
          ["==", ["to-string", ["get", "id"]], String(selectedId)],
          MAP_THEME.DISTRICT.SELECTED_FILL,
          ["==", ["to-string", ["get", "id"]], String(hoveredId)],
          MAP_THEME.DISTRICT.HOVER_FILL,
          "rgba(0,0,0,0)", // fully transparent default
        ],
        "fill-opacity": 1,
      },
    }),
    [selectedId, hoveredId],
  );

  // ── Outline: single neutral stroke, thickens on hover/selected
  const districtLineStyle = useMemo(
    () => ({
      id: LAYER_IDS.DISTRICT_LINE,
      type: "line",
      paint: {
        "line-color": MAP_THEME.DISTRICT.STROKE_COLOR,
        "line-width": [
          "case",
          ["==", ["to-string", ["get", "id"]], String(selectedId)],
          MAP_THEME.DISTRICT.STROKE_WIDTH_SELECTED,
          ["==", ["to-string", ["get", "id"]], String(hoveredId)],
          MAP_THEME.DISTRICT.STROKE_WIDTH_HOVER,
          MAP_THEME.DISTRICT.STROKE_WIDTH,
        ],
        "line-opacity": [
          "case",
          ["==", ["to-string", ["get", "id"]], String(hoveredId)],
          1,
          ["==", ["to-string", ["get", "id"]], String(selectedId)],
          1,
          0.65,
        ],
      },
    }),
    [selectedId, hoveredId],
  );

  const maskLayerStyle = useMemo(
    () => ({
      id: LAYER_IDS.MASK,
      type: "fill",
      paint: {
        "fill-color": MAP_THEME.MASK_COLOR,
        "fill-opacity": MAP_THEME.MASK_OPACITY,
      },
    }),
    [],
  );

  const wardFillStyle = useMemo(
    () => ({
      id: LAYER_IDS.WARD_FILL,
      type: "fill",
      minzoom: 12,
      paint: {
        "fill-color": MAP_THEME.WARD.HOVER_FILL,
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          1,
          0,
        ],
      },
    }),
    [],
  );

  const wardLineStyle = useMemo(
    () => ({
      id: LAYER_IDS.WARD_LINE,
      type: "line",
      minzoom: 12,
      paint: {
        "line-color": MAP_THEME.WARD.LINE_COLOR,
        "line-width": MAP_THEME.WARD.LINE_WIDTH,
        "line-dasharray": [4, 3],
      },
    }),
    [],
  );

  const onClick = (e) => {
    const feature = e.features?.[0];
    if (feature && onSelect) {
      const type = feature.layer.id.includes("ward") ? "ward" : "district";
      onSelect(feature, type);
    }
  };

  const onHover = (e) => {
    const feature = e.features?.[0];
    setHoveredFeature(
      feature ? { id: feature.id, properties: feature.properties } : null,
    );
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
          <Layer
            {...districtFillStyle}
            onClick={onClick}
            onMouseMove={onHover}
            onMouseLeave={() => setHoveredFeature(null)}
          />
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
