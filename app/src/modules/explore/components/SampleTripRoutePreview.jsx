import { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { Image } from "expo-image";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";
import { resolvePlaceImageUri, getOptimizedCloudinaryUrl } from "../../../lib/media-url";

const PREVIEW_W = 216;
const PREVIEW_H = 92;
const PAD = 16;
const ROUTE_COLORS = ["#007BFF", "#10B981", "#F59E0B", "#EF4444"];

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const compareDestination = (a, b) => {
  const dayDelta = Number(a?.dayNumber || 1) - Number(b?.dayNumber || 1);
  if (dayDelta !== 0) return dayDelta;
  const orderDelta = Number(a?.order || 0) - Number(b?.order || 0);
  if (orderDelta !== 0) return orderDelta;
  return Number(a?.id || 0) - Number(b?.id || 0);
};

function normalizeStops(destinations = []) {
  return [...destinations]
    .sort(compareDestination)
    .map((destination, index) => {
      const place = destination?.place;
      if (!place?.name) return null;
      const latitude = toNumber(place.latitude);
      const longitude = toNumber(place.longitude);
      return {
        id: destination?.id ?? `${place.id || "place"}-${index}`,
        sequence: index + 1,
        dayNumber: Number(destination?.dayNumber || 1),
        name: place.name,
        imageUri: resolvePlaceImageUri(place),
        latitude,
        longitude,
        hasCoordinate: latitude !== null && longitude !== null,
      };
    })
    .filter(Boolean);
}

function projectStops(stops) {
  const coordinateStops = stops.filter((stop) => stop.hasCoordinate);
  const sourceStops = coordinateStops.length >= 2 ? coordinateStops : stops;

  if (coordinateStops.length >= 2) {
    const latitudes = coordinateStops.map((stop) => stop.latitude);
    const longitudes = coordinateStops.map((stop) => stop.longitude);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    const latRange = Math.max(maxLat - minLat, 0.0001);
    const lngRange = Math.max(maxLng - minLng, 0.0001);

    return coordinateStops.map((stop) => ({
      ...stop,
      x: PAD + ((stop.longitude - minLng) / lngRange) * (PREVIEW_W - PAD * 2),
      y: PAD + (1 - (stop.latitude - minLat) / latRange) * (PREVIEW_H - PAD * 2),
    }));
  }

  return sourceStops.map((stop, index) => {
    const progress = sourceStops.length <= 1 ? 0.5 : index / (sourceStops.length - 1);
    return {
      ...stop,
      x: PAD + progress * (PREVIEW_W - PAD * 2),
      y: PREVIEW_H / 2 + Math.sin(progress * Math.PI * 1.35) * 18,
    };
  });
}

function buildPath(points) {
  if (points.length === 0) return "";
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
}

function SampleTripRoutePreviewInner({ destinations, totalDays }) {
  const stops = useMemo(() => normalizeStops(destinations), [destinations]);
  const plottedStops = useMemo(() => projectStops(stops), [stops]);
  const path = useMemo(() => buildPath(plottedStops), [plottedStops]);
  const visibleStops = plottedStops.slice(0, 5);
  const dayCount = Math.max(Number(totalDays) || 1, ...stops.map((stop) => stop.dayNumber || 1));

  if (stops.length === 0) {
    return (
      <View style={styles.emptyPreview}>
        <MaterialIconsRounded name="route" size={18} color="rgba(24,24,25,0.42)" />
        <Text style={styles.emptyText}>Map demo sẽ hiện khi chuyến đi có điểm dừng.</Text>
      </View>
    );
  }

  return (
    <View style={styles.preview}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${PREVIEW_W} ${PREVIEW_H}`} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <SvgLinearGradient id="sampleTripMapBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#EEF7FF" />
            <Stop offset="1" stopColor="#ECFDF5" />
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width={PREVIEW_W} height={PREVIEW_H} rx="18" fill="url(#sampleTripMapBg)" />
        <Path d="M 14 22 L 68 10 L 120 26 L 202 14" stroke="rgba(0,123,255,0.08)" strokeWidth="2" fill="none" />
        <Path d="M 8 74 L 64 66 L 116 80 L 204 68" stroke="rgba(16,185,129,0.10)" strokeWidth="2" fill="none" />
        {path ? (
          <Path
            d={path}
            stroke={ROUTE_COLORS[(dayCount - 1) % ROUTE_COLORS.length]}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ) : null}
        {visibleStops.map((stop, index) => (
          <Circle
            key={`stop-dot-${stop.id}`}
            cx={stop.x}
            cy={stop.y}
            r={index === 0 ? 6 : 5}
            fill="#FFFFFF"
            stroke={ROUTE_COLORS[(stop.dayNumber - 1) % ROUTE_COLORS.length]}
            strokeWidth="3"
          />
        ))}
      </Svg>

      <View style={styles.daysOverlay}>
        {Array.from({ length: Math.min(dayCount, 4) }).map((_, index) => (
          <View
            key={`day-${index + 1}`}
            style={[
              styles.dayPill,
              { backgroundColor: ROUTE_COLORS[index % ROUTE_COLORS.length] },
            ]}
          >
            <Text style={styles.dayPillText}>D{index + 1}</Text>
          </View>
        ))}
      </View>

      <View style={styles.stopThumbs}>
        {stops.slice(0, 3).map((stop) => {
          const imageUri = stop.imageUri ? getOptimizedCloudinaryUrl(stop.imageUri, 96) : null;
          return (
            <View key={`thumb-${stop.id}`} style={styles.thumbWrap}>
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  contentFit="cover"
                  transition={160}
                  cachePolicy="memory-disk"
                  style={StyleSheet.absoluteFillObject}
                />
              ) : (
                <MaterialIconsRounded name="place" size={14} color="#007BFF" />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    height: PREVIEW_H,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#EEF7FF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,123,255,0.14)",
  },
  emptyPreview: {
    height: PREVIEW_H,
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#F6F7F9",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyText: {
    color: "rgba(24,24,25,0.48)",
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
    fontFamily: TOKENS.font.medium,
  },
  daysOverlay: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    gap: 4,
  },
  dayPill: {
    height: 20,
    paddingHorizontal: 7,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dayPillText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: TOKENS.font.bold,
  },
  stopThumbs: {
    position: "absolute",
    right: 8,
    bottom: 8,
    flexDirection: "row",
  },
  thumbWrap: {
    width: 26,
    height: 26,
    marginLeft: -7,
    borderRadius: 13,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
});

export const SampleTripRoutePreview = memo(SampleTripRoutePreviewInner);
