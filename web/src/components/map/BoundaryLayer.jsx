import { useMemo } from "react";
import { Source, Layer } from "react-map-gl/maplibre";
import { useMapContext } from "@/providers";
import { MAP_THEME, LAYER_IDS } from "@/constants/mapConfigs";

const BoundaryLayer = ({ mask, districts, wards, onSelect }) => {
  const { hoveredFeature, selectedDistrict, setHoveredFeature } = useMapContext();

  // ... styles ...

  const onClick = (e) => {
    const feature = e.features && e.features[0];
    if (feature) {
      const layerId = feature.layer.id;
      const type = layerId.includes("ward") ? "ward" : "district";
      
      // Call the passed handler which will handle both Context update and Parent notification
      if (onSelect) {
        onSelect(feature, type);
      }
    }
  };

  // 1. Mask Style (Fog outside Can Tho)
  const maskLayerStyle = useMemo(() => ({
    id: LAYER_IDS.MASK,
    type: "fill",
    paint: {
      "fill-color": MAP_THEME.MASK_COLOR,
      "fill-opacity": MAP_THEME.MASK_OPACITY,
    },
  }), []);

  // 2. District Styles
  const districtFillStyle = useMemo(() => ({
    id: LAYER_IDS.DISTRICT_FILL,
    type: "fill",
    paint: {
      "fill-color": [
        "case",
        ["==", ["get", "id"], selectedDistrict?.id || ""],
        MAP_THEME.DISTRICT.SELECTED_FILL, // Selected
        ["==", ["get", "id"], hoveredFeature?.id || ""],
        MAP_THEME.DISTRICT.HOVER_FILL, // Hovered
        MAP_THEME.DISTRICT.FILL_COLOR, // Default (Transparent)
      ],
      "fill-outline-color": MAP_THEME.DISTRICT.LINE_COLOR,
    },
  }), [selectedDistrict, hoveredFeature]);

  const districtLineStyle = useMemo(() => ({
    id: LAYER_IDS.DISTRICT_LINE,
    type: "line",
    paint: {
      "line-color": MAP_THEME.DISTRICT.LINE_COLOR,
      "line-width": MAP_THEME.DISTRICT.LINE_WIDTH,
    },
  }), []);

  // 3. Ward Styles (Visible > zoom 12)
  const wardLineStyle = useMemo(() => ({
    id: LAYER_IDS.WARD_LINE,
    type: "line",
    minzoom: 12,
    paint: {
      "line-color": MAP_THEME.WARD.LINE_COLOR,
      "line-width": MAP_THEME.WARD.LINE_WIDTH,
      "line-dasharray": [2, 1],
    },
  }), []);

  const wardFillStyle = useMemo(() => ({
    id: LAYER_IDS.WARD_FILL,
    type: "fill",
    minzoom: 12,
    paint: {
      "fill-color": MAP_THEME.WARD.HOVER_FILL,
      "fill-opacity": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        1,
        0
      ]
    },
  }), []);

  // --- HANDLERS ---
  const onHover = (e) => {
    const feature = e.features && e.features[0];
    setHoveredFeature(feature ? { id: feature.id, properties: feature.properties } : null);
  };



  return (
    <>
      {/* 1. MASK LAYER (High z-index visual, actually rendered first here but React Map GL order depends on child order) */}
      {/* In MapLibre, later sources render on top. We want mask ON TOP of the base map, but transparent. */}
      {mask && (
        <Source id="mask-source" type="geojson" data={mask}>
          <Layer {...maskLayerStyle} />
        </Source>
      )}

      {/* 2. DISTRICTS */}
      {districts && (
        <Source id="districts-source" type="geojson" data={districts}>
           {/* Fill for interaction */}
          <Layer {...districtFillStyle} onClick={onClick} />
          {/* Outline */}
          <Layer {...districtLineStyle} />
        </Source>
      )}

      {/* 3. WARDS */}
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
