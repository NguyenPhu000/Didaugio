import { memo, useMemo } from "react";
import { Platform } from "react-native";
import { Polyline } from "react-native-maps";
import { geometryToCoordinates } from "../hooks/routeMapping";

const ROUTE_COLORS = {
  osrm: "#0284c7",
  fallback: "#f59e0b",
  mixed: "#8b5cf6",
  default: "#0284c7",
};

const ROUTE_OPACITY = {
  primary: 0.88,
  secondary: 0.42,
};

/**
 * RoutePolyline — vẽ cung đường trên bản đồ.
 *
 * Props:
 *   - coordinates: [{latitude, longitude}]    (ưu tiên dùng trực tiếp)
 *   - geometry: string | GeoJSON              (nếu chưa decode)
 *   - source: "osrm" | "fallback" | "mixed"   (ảnh hưởng màu sắc)
 *   - strokeWidth: number                     (default 4)
 *   - isPrimary: boolean                      (primary hoặc alternative)
 *   - dashed: boolean                         (nét đứt)
 */
const RoutePolyline = memo(function RoutePolyline({
  coordinates: coordsProp,
  geometry,
  source = "osrm",
  strokeWidth = 4,
  isPrimary = true,
  dashed = false,
  color,
  strokeOpacity,
}) {
  const coordinates = useMemo(() => {
    if (Array.isArray(coordsProp) && coordsProp.length > 0) {
      return coordsProp;
    }
    if (geometry) {
      return geometryToCoordinates(geometry);
    }
    return [];
  }, [coordsProp, geometry]);

  if (coordinates.length < 2) return null;

  const strokeColor = color ?? ROUTE_COLORS[source] ?? ROUTE_COLORS.default;
  const resolvedStrokeOpacity =
    typeof strokeOpacity === "number"
      ? strokeOpacity
      : isPrimary
        ? ROUTE_OPACITY.primary
        : ROUTE_OPACITY.secondary;
  const resolvedStrokeWidth = isPrimary ? strokeWidth : strokeWidth * 0.7;

  // react-native-maps Polyline không có dashed prop trực tiếp trên Android.
  // Dùng lineDashPattern để mô phỏng nét đứt trên cả 2 nền tảng.
  const lineDashPattern = dashed
    ? Platform.OS === "ios"
      ? [8, 6]
      : [10, 8]
    : undefined;

  return (
    <Polyline
      coordinates={coordinates}
      strokeColor={strokeColor}
      strokeWidth={resolvedStrokeWidth}
      strokeOpacity={resolvedStrokeOpacity}
      lineDashPattern={lineDashPattern}
      lineJoin="round"
      lineCap="round"
      geodesic={false}
    />
  );
});

export default RoutePolyline;
