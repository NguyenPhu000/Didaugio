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
  const timeline = getTimelineLabel(trip);
  const placesLabel =
    destinationCount === 0
      ? "Chưa có điểm đến"
      : `${destinationCount} điểm đến`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
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
              colors={["transparent", "rgba(0,0,0,0.12)"]}
              style={StyleSheet.absoluteFill}
            />
          </>
        ) : (
          <View style={styles.thumbFallback}>
            <MaterialIcons name="landscape" size={22} color="rgba(0,0,0,0.2)" />
          </View>
        )}
        {/* Status indicator */}
        <View
          style={[styles.statusDot, { backgroundColor: status.accent }]}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {trip.title || "Chuyến đi mới"}
        </Text>

        <View style={styles.metaRow}>
          <MaterialIcons
            name="event"
            size={12}
            color={APPLE_THEME.textMuted}
          />
          <Text style={styles.metaText} numberOfLines={1}>
            {dateRange}
          </Text>
          <View style={styles.metaDot} />
          <MaterialIcons
            name="schedule"
            size={12}
            color={APPLE_THEME.textMuted}
          />
          <Text style={styles.metaText}>{daysLabel}</Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <View
              style={[styles.statusBadgeDot, { backgroundColor: status.text }]}
            />
            <Text style={[styles.statusLabel, { color: status.text }]}>
              {status.label}
            </Text>
          </View>
          <Text style={styles.placesText}>{placesLabel}</Text>
        </View>
      </View>

      {/* Arrow */}
      <View style={styles.arrowWrap}>
        <MaterialIcons
          name="chevron-right"
          size={18}
          color={APPLE_THEME.textMuted}
        />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: TAB_SCREEN_PADDING,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    padding: 12,
    paddingRight: 8,
    gap: 14,
  },
  cardPressed: {
    backgroundColor: "#FAFAFA",
    transform: [{ scale: 0.985 }],
  },
  thumbWrap: {
    width: 76,
    height: 76,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F5F5F7",
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
    backgroundColor: "#F0F0F2",
  },
  statusDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  title: {
    color: APPLE_THEME.text,
    fontSize: 16,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: APPLE_THEME.textMuted,
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    flexShrink: 1,
    letterSpacing: -0.1,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(0,0,0,0.15)",
    marginHorizontal: 2,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 999,
  },
  statusBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusLabel: {
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.1,
  },
  placesText: {
    color: APPLE_THEME.textMuted,
    fontSize: 11,
    fontFamily: TOKENS.font.body,
    letterSpacing: -0.1,
  },
  arrowWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.03)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
