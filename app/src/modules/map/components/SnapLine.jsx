import { memo, useMemo } from "react";
import { Platform } from "react-native";
import { Polyline } from "react-native-maps";

const SNAP_LINE_COLOR = "rgba(100,116,139,0.78)";

const normalizePoint = (point) => {
  if (!point) return null;
  const latitude = Number(point.latitude ?? point.lat);
  const longitude = Number(point.longitude ?? point.lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
};

const SnapLine = memo(function SnapLine({
  from,
  to,
  visible = true,
  strokeWidth = 2,
}) {
  const coordinates = useMemo(() => {
    const start = normalizePoint(from);
    const end = normalizePoint(to);
    return start && end ? [start, end] : [];
  }, [from, to]);

  if (!visible || coordinates.length < 2) return null;

  return (
    <Polyline
      coordinates={coordinates}
      strokeColor={SNAP_LINE_COLOR}
      strokeWidth={strokeWidth}
      lineDashPattern={Platform.OS === "ios" ? [5, 6] : [8, 8]}
      lineCap="round"
      geodesic={false}
    />
  );
});

export default SnapLine;
