import { memo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../../src/constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import {
  STATUS_THEME,
  getDateRangeLabel,
  getTimelineLabel,
} from "../utils/tripHelpers";

export const TripCard = memo(function TripCard({ trip, onPress }) {
  const status = STATUS_THEME[trip.status] || STATUS_THEME.draft;
  const cover =
    trip.thumbnail || trip.destinations?.[0]?.place?.thumbnail || null;
  const destinationCount = trip.destinations?.length || 0;
  const dateRange = getDateRangeLabel(trip);
  const daysLabel = `${trip.totalDays || 1} ngày`;
  const timelineLabel = getTimelineLabel(trip);
  const placesLabel =
    destinationCount === 0
      ? "Chưa có điểm đến"
      : `${destinationCount} điểm đến`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tripCard,
        pressed && styles.tripCardPressed,
      ]}
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
            <MaterialIcons
              name="landscape"
              size={42}
              color={APPLE_THEME.textMuted}
            />
          </View>
        )}

        <LinearGradient
          colors={["transparent", "rgba(0, 0, 0, 0.36)", "rgba(0, 0, 0, 0.62)"]}
          locations={[0, 0.6, 1]}
          style={styles.tripImageShade}
        />

        <View style={styles.tripTopRow}>
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <MaterialIcons name={status.icon} size={14} color={status.text} />
            <Text style={[styles.statusText, { color: status.text }]}>
              {status.label}
            </Text>
          </View>

          <View style={styles.timelinePill}>
            <MaterialIcons name="schedule" size={13} color={APPLE_THEME.text} />
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
            <MaterialIcons
              name="calendar-month"
              size={15}
              color={APPLE_THEME.primary}
            />
            <Text style={styles.metricText}>{dateRange}</Text>
          </View>
          <View style={styles.metricPill}>
            <MaterialIcons name="route" size={15} color={APPLE_THEME.primary} />
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
            <MaterialIcons
              name="arrow-forward"
              size={16}
              color={APPLE_THEME.white}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  tripCard: {
    marginHorizontal: TAB_SCREEN_PADDING,
    borderRadius: TOKENS.radius["2xl"],
    overflow: "hidden",
    backgroundColor: APPLE_THEME.surface,
    borderWidth: 1,
    borderColor: APPLE_THEME.borderSoft,
    ...TOKENS.shadow.sm,
  },
  tripCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  tripVisual: {
    height: 228,
    backgroundColor: APPLE_THEME.surfaceMuted,
    justifyContent: "space-between",
  },
  tripImage: {
    ...StyleSheet.absoluteFillObject,
  },
  tripImageFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APPLE_THEME.surfaceMuted,
  },
  tripFallbackGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: APPLE_THEME.primaryTint,
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
    zIndex: 1,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  statusText: {
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
  },
  timelinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.92)",
  },
  timelinePillText: {
    color: APPLE_THEME.text,
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
    color: "rgba(245, 245, 247, 0.88)",
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
    backgroundColor: APPLE_THEME.surfaceElevated,
    borderWidth: 1,
    borderColor: APPLE_THEME.border,
  },
  metricText: {
    color: APPLE_THEME.textSecondary,
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
    color: APPLE_THEME.textMuted,
    fontSize: 13.5,
    fontFamily: TOKENS.font.medium,
  },
  openTripWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: APPLE_THEME.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  openTripText: {
    color: APPLE_THEME.white,
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
  },
});
