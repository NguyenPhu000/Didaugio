import { memo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { TOKENS } from "../../../../src/constants/design-tokens";
import { TAB_THEME, TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { STATUS_THEME, getDateRangeLabel, getTimelineLabel } from "../utils/tripHelpers";

export const TripCard = memo(function TripCard({ trip, onPress }) {
  const status = STATUS_THEME[trip.status] || STATUS_THEME.draft;
  const cover = trip.thumbnail || trip.destinations?.[0]?.place?.thumbnail || null;
  const destinationCount = trip.destinations?.length || 0;
  const dateRange = getDateRangeLabel(trip);
  const daysLabel = `${trip.totalDays || 1} ngày`;
  const timelineLabel = getTimelineLabel(trip);
  const placesLabel =
    destinationCount === 0 ? "Chưa có điểm đến" : `${destinationCount} điểm đến`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tripCard, pressed && styles.tripCardPressed]}
    >
      <View style={styles.tripVisual}>
        {cover ? (
          <Image
            source={{ uri: cover }}
            style={styles.tripImage}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.tripImageFallback}>
            <View style={styles.tripFallbackGlow} />
            <MaterialIcons name="landscape" size={42} color="#93C5FD" />
          </View>
        )}

        {/* Gradient bóng mờ từ dưới lên cho text nổi bật */}
        <LinearGradient
          colors={["transparent", "rgba(15, 23, 42, 0.75)", "#0F172A"]}
          locations={[0, 0.6, 1]}
          style={styles.tripImageShade}
        />

        <View style={styles.tripTopRow}>
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <MaterialIcons name={status.icon} size={14} color={status.text} />
            <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
          </View>

          <View style={styles.timelinePill}>
            <MaterialIcons name="schedule" size={13} color="#FFFFFF" />
            <Text style={styles.timelinePillText}>{timelineLabel}</Text>
          </View>
        </View>

        <View style={styles.tripHeroText}>
          <Text style={styles.tripTitle} numberOfLines={2}>
            {trip.title || "Chuyến đi mới"}
          </Text>
          <Text style={styles.tripSubtitle} numberOfLines={2}>
            {trip.description ||
              "Sắp xếp điểm đến, lịch trình và ghi chú cho từng hành trình."}
          </Text>
        </View>
      </View>

      <View style={styles.tripBody}>
        <View style={styles.metricRow}>
          <View style={styles.metricPill}>
            <MaterialIcons name="calendar-month" size={15} color={TAB_THEME.primary} />
            <Text style={styles.metricText}>{dateRange}</Text>
          </View>
          <View style={styles.metricPill}>
            <MaterialIcons name="route" size={15} color={TAB_THEME.primary} />
            <Text style={styles.metricText}>{daysLabel}</Text>
          </View>
        </View>

        <View style={styles.tripFooter}>
          <View style={styles.tripPlaceSummary}>
            <View
              style={[styles.tripAccentDot, { backgroundColor: status.accent }]}
            />
            <Text style={styles.tripFooterText}>{placesLabel}</Text>
          </View>

          <View style={styles.openTripWrap}>
            <Text style={styles.openTripText}>Mở chi tiết</Text>
            <MaterialIcons name="arrow-forward" size={16} color={TAB_THEME.primary} />
          </View>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  tripCard: {
    marginHorizontal: TAB_SCREEN_PADDING,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.12)",
    ...TOKENS.shadow.md,
  },
  tripCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  tripVisual: {
    height: 240, // Tăng thêm 20px để tạo độ sâu, hình cover đã con mắt hơn
    backgroundColor: "#EFF6FF",
    justifyContent: "space-between",
  },
  tripImage: {
    ...StyleSheet.absoluteFillObject,
  },
  tripImageFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },
  tripFallbackGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  tripImageShade: {
    ...StyleSheet.absoluteFillObject,
  },
  tripTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 1, // Đảm bảo nổi lên trên cover
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    // Add backdrop filter / blur in real native layer if desired, 
    // basic background works for now
  },
  statusText: {
    fontSize: 12,
    fontFamily: TOKENS.font.bold,
  },
  timelinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  timelinePillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
  },
  tripHeroText: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    gap: 6,
    zIndex: 1,
  },
  tripTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    lineHeight: 30,
    fontFamily: TOKENS.font.heading,
  },
  tripSubtitle: {
    color: "rgba(241, 245, 249, 0.9)",
    fontSize: 14.5,
    lineHeight: 20,
    fontFamily: TOKENS.font.body,
    maxWidth: "94%",
  },
  tripBody: {
    padding: 18,
    gap: 16,
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  metricText: {
    color: "#334155",
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
  },
  tripFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  tripPlaceSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  tripAccentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tripFooterText: {
    color: "#64748B",
    fontSize: 13.5,
    fontFamily: TOKENS.font.medium,
  },
  openTripWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  openTripText: {
    color: TAB_THEME.primary,
    fontSize: 13,
    fontFamily: TOKENS.font.bold,
  },
});
