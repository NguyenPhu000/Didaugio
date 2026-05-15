import { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
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
  const timeline = getTimelineLabel(trip);
  const placesLabel =
    destinationCount === 0
      ? "Chưa có điểm đến"
      : `${destinationCount} điểm đến`;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.card}
    >
      {/* Thumbnail */}
      <View style={styles.thumbWrap}>
        {cover ? (
          <>
            <Image
              source={{ uri: cover }}
              style={styles.thumb}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.15)"]}
              style={StyleSheet.absoluteFill}
            />
          </>
        ) : (
          <View style={styles.thumbFallback}>
            <MaterialIcons name="landscape" size={28} color="rgba(0,0,0,0.2)" />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {trip.title || "Chuyến đi mới"}
          </Text>
          <View
            style={[styles.statusDot, { backgroundColor: status.accent }]}
          />
        </View>

        <View style={styles.metaRow}>
          <MaterialIcons
            name="event"
            size={14}
            color={APPLE_THEME.textMuted}
          />
          <Text style={styles.metaText} numberOfLines={1}>
            {dateRange}
          </Text>
          <View style={styles.metaDot} />
          <MaterialIcons
            name="schedule"
            size={14}
            color={APPLE_THEME.textMuted}
          />
          <Text style={styles.metaText}>{daysLabel}</Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusLabel, { color: status.text }]}>
              {status.label}
            </Text>
          </View>
          <Text style={styles.placesText}>{placesLabel}</Text>
        </View>
      </View>

      {/* Subtle Arrow */}
      <View style={styles.arrowWrap}>
        <MaterialIcons
          name="chevron-right"
          size={24}
          color="rgba(0,0,0,0.2)"
        />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: TAB_SCREEN_PADDING,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
    padding: 12,
    paddingRight: 12,
    gap: 16,
  },
  thumbWrap: {
    width: 90,
    height: 90,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#F2F2F7",
    flexShrink: 0,
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  thumbFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E5EA",
  },
  content: {
    flex: 1,
    gap: 6,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: APPLE_THEME.text,
    fontSize: 18,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.4,
    flex: 1,
    paddingRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: APPLE_THEME.textMuted,
    fontSize: 13,
    fontFamily: TOKENS.font.body,
    flexShrink: 1,
    letterSpacing: -0.1,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(0,0,0,0.15)",
    marginHorizontal: 4,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.1,
  },
  placesText: {
    color: APPLE_THEME.textMuted,
    fontSize: 13,
    fontFamily: TOKENS.font.body,
    letterSpacing: -0.1,
  },
  arrowWrap: {
    justifyContent: "center",
    alignItems: "center",
  },
});
