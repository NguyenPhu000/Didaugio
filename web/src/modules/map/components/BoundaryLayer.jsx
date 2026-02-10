import { useMemo } from "react";
import { Source, Layer } from "../adapters";
import { useMapContext } from "../context/MapProvider";
import { MAP_THEME, LAYER_IDS } from "../config/mapConfig";

const BoundaryLayer = ({ mask, districts, wards, onSelect }) => {
  const { hoveredFeature, selectedDistrict, setHoveredFeature } =
    useMapContext();

  const onClick = (e) => {
    const feature = e.features?.[0];
    if (feature && onSelect) {
      const type = feature.layer.id.includes("ward") ? "ward" : "district";
      onSelect(feature, type);
    }
  };

  // 1. Mask Style
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

  // 2. District Styles
  const districtFillStyle = useMemo(
    () => ({
      id: LAYER_IDS.DISTRICT_FILL,
      type: "fill",
      paint: {
        "fill-color": [
          "case",
          ["==", ["get", "id"], selectedDistrict?.id || ""],
          MAP_THEME.DISTRICT.SELECTED_FILL,
          ["==", ["get", "id"], hoveredFeature?.id || ""],
          MAP_THEME.DISTRICT.HOVER_FILL,
          MAP_THEME.DISTRICT.FILL_COLOR,
        ],
        "fill-outline-color": MAP_THEME.DISTRICT.LINE_COLOR,
      },
    }),
    [selectedDistrict, hoveredFeature],
  );

  const districtLineStyle = useMemo(
    () => ({
      id: LAYER_IDS.DISTRICT_LINE,
      type: "line",
      paint: {
        "line-color": MAP_THEME.DISTRICT.LINE_COLOR,
        "line-width": MAP_THEME.DISTRICT.LINE_WIDTH,
      },
    }),
    [],
  );

  // 3. Ward Styles (visible at zoom > 12)
  const wardLineStyle = useMemo(
    () => ({
      id: LAYER_IDS.WARD_LINE,
      type: "line",
      minzoom: 12,
      paint: {
        "line-color": MAP_THEME.WARD.LINE_COLOR,
        "line-width": MAP_THEME.WARD.LINE_WIDTH,
        "line-dasharray": [2, 1],
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
          <Layer {...districtFillStyle} onClick={onClick} />
          <Layer {...districtLineStyle} />
        </Source>
      )}

      {wards && (
        <Source id="wards-source" type="geojson" data={wards}>
          <Layer {...wardFillStyle} />
          <Layer {...wardLineStyle} />
        </Source>
      )}
    </>
  );
};

export default BoundaryLayer;
