import { COLORS } from "../../../constants/colors";

export const CAN_THO_CENTER = {
  lat: 10.0345852,
  lng: 105.7200532,
};

export const MAP_CONFIGS = {
  BOUNDS: [
    [105.18, 9.9],
    [105.9, 10.4],
  ],
  INITIAL_VIEW: {
    centerCoordinate: [CAN_THO_CENTER.lng, CAN_THO_CENTER.lat],
    zoomLevel: 11,
  },
  CONSTRAINTS: {
    minZoomLevel: 10,
    maxZoomLevel: 18,
  },
};

export const MAP_STYLES = {
  CARTO_LIGHT: {
    key: "carto_light",
    label: "Tối giản",
    url: "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  },
  OSM: {
    key: "osm",
    label: "Bản đồ",
    url: "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
  },
  SATELLITE: {
    key: "satellite",
    label: "Vệ tinh",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  },
};

export const DEFAULT_MAP_STYLE = MAP_STYLES.CARTO_LIGHT;

export const MAP_STYLE = {
  version: 8,
  name: "CartoDB Light",
  sources: {
    carto: {
      type: "raster",
      tiles: [MAP_STYLES.CARTO_LIGHT.url],
      tileSize: 256,
      attribution: "© CartoDB © OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "carto",
      type: "raster",
      source: "carto",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export const MAP_THEME = {
  PRIMARY: COLORS.primary,
  GOLD: COLORS.gold,
  PRIMARY_DARK: COLORS.primaryDark,
};

export const CATEGORY_ICON_MAP = {
  "Ăn uống": { icon: "restaurant", color: "#FF6B35" },
  "Lưu trú": { icon: "hotel", color: COLORS.primary },
  "Tham quan": { icon: "camera-alt", color: "#9C27B0" },
  "Mua sắm": { icon: "shopping-bag", color: "#4CAF50" },
  "Giải trí": { icon: "sports-esports", color: "#FF5722" },
  "Dịch vụ": { icon: "miscellaneous-services", color: "#607D8B" },
};

export const DEFAULT_CATEGORY_ICON = { icon: "place", color: COLORS.textSecondary };
