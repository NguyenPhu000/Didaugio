import { COLORS } from "../../../constants/colors";

export const CAN_THO_CENTER = {
  lat: 10.0345852,
  lng: 105.7200532,
};

export const MAP_CONFIGS = {
  BOUNDS: [
    [105.18, 9.85],
    [106.0, 10.45],
  ],
  INITIAL_VIEW: {
    centerCoordinate: [CAN_THO_CENTER.lng, CAN_THO_CENTER.lat],
    zoomLevel: 11,
  },
  CONSTRAINTS: {
    minZoomLevel: 9,
    maxZoomLevel: 19,
  },
};

export const MAP_STYLES = {
  OSM: {
    key: "osm",
    label: "Ban do",
    urls: [
      "https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png",
      "https://b.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png",
      "https://c.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png",
    ],
  },
  CARTO_LIGHT: {
    key: "carto_light",
    label: "Toi gian",
    urls: [
      "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    ],
  },
  ADMIN: {
    key: "admin",
    label: "Hanh chinh",
    urls: [
      "https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",
      "https://b.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",
    ],
  },
  SATELLITE: {
    key: "satellite",
    label: "Ve tinh",
    urls: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
  },
  HYBRID: {
    key: "hybrid",
    label: "Hybrid",
    urls: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      "https://basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png",
    ],
  },
};

export const DEFAULT_MAP_STYLE = MAP_STYLES.OSM;

export const MAP_THEME = {
  PRIMARY: COLORS.primary,
  GOLD: COLORS.gold,
  PRIMARY_DARK: COLORS.primaryDark,
  DISTRICT: {
    STROKE_COLOR: "#334155",
    STROKE_WIDTH: 1.8,
  },
  WARD: {
    LINE_COLOR: "rgba(148,163,184,0.5)",
    LINE_WIDTH: 0.7,
  },
};

export const DISTRICT_COLORS = [
  { fill: "rgba(186,215,233,0.72)", line: "#2B7CB8" },
  { fill: "rgba(166,220,195,0.72)", line: "#1E8A5E" },
  { fill: "rgba(250,224,178,0.72)", line: "#C47F17" },
  { fill: "rgba(240,188,188,0.72)", line: "#B83040" },
  { fill: "rgba(208,195,232,0.72)", line: "#6840A8" },
  { fill: "rgba(178,226,218,0.72)", line: "#1A8A7F" },
  { fill: "rgba(248,203,168,0.72)", line: "#B85520" },
  { fill: "rgba(185,202,230,0.72)", line: "#3450A0" },
  { fill: "rgba(195,222,180,0.72)", line: "#3A7830" },
];

export const CATEGORY_MARKER_STYLES = {
  1: { icon: "restaurant", color: "#ef4444", bg: "#fef2f2", label: "Am thuc" },
  2: { icon: "hotel", color: "#f97316", bg: "#fff7ed", label: "Luu tru" },
  3: {
    icon: "photo-camera",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    label: "Tham quan",
  },
  4: {
    icon: "shopping-cart",
    color: "#06b6d4",
    bg: "#ecfeff",
    label: "Mua sam",
  },
  5: { icon: "park", color: "#22c55e", bg: "#f0fdf4", label: "Sinh thai" },
  6: { icon: "local-cafe", color: "#ec4899", bg: "#fdf2f8", label: "Cafe" },
  7: { icon: "home", color: "#f59e0b", bg: "#fffbeb", label: "Homestay" },
  8: { icon: "spa", color: "#14b8a6", bg: "#f0fdfa", label: "Khu sinh thai" },
  13: { icon: "restaurant", color: "#ef4444", bg: "#fef2f2", label: "Am thuc" },
};

export const DEFAULT_CATEGORY_ICON = {
  icon: "place",
  color: COLORS.textSecondary,
  bg: "#eef2ff",
  label: "Dia diem",
};
