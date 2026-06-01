import { memo, useState, useEffect } from "react";
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
  getDisplayStatus,
  getTimelineLabel,
} from "../utils/tripHelpers";
import { resolveMediaUrl } from "../../../lib/media-url";

const fallbackCover = "https://images.unsplash.com/photo-1527668752968-14ce70a6a7ae?w=600&auto=format&fit=crop";

export const TripCard = memo(function TripCard({ trip, onPress, onSave, isSaved }) {
  const displayStatus = getDisplayStatus(trip);
  const status = STATUS_THEME[displayStatus] || STATUS_THEME.upcoming;
  const cover = resolveMediaUrl(
    trip.thumbnail || trip.destinations?.[0]?.place?.thumbnail || null,
  );
  const destinationCount = trip.destinations?.length || 0;
  const dateRange = getDateRangeLabel(trip);
  const daysLabel = `${trip.totalDays ?? 1} ngày`;
  const timeline = getTimelineLabel(trip);
  const placesLabel =
    destinationCount === 0
      ? "Chưa có điểm đến"
      : `${destinationCount} điểm đến`;

  const [imgSrc, setImgSrc] = useState(cover ? { uri: cover } : { uri: fallbackCover });

  useEffect(() => {
    setImgSrc(cover ? { uri: cover } : { uri: fallbackCover });
  }, [cover]);

  return (
    <View style={styles.cardWrap}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={styles.card}
      >
        {/* Thumbnail */}
        <View style={styles.thumbWrap}>
          <Image
            source={imgSrc}
            style={styles.thumb}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            onError={() => setImgSrc({ uri: fallbackCover })}
          />
          {cover && (
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.15)"]}
              style={StyleSheet.absoluteFill}
            />
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

      {/* Sibling absolute Bookmark button to fix stopPropagation on Android/iOS */}
      {onSave ? (
        <TouchableOpacity
          onPress={() => onSave(trip.id)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.bookmarkBtnAbsolute}
        >
          <MaterialIcons
            name={isSaved ? "bookmark" : "bookmark-border"}
            size={18}
            color={isSaved ? "#FF9F0A" : "#FFFFFF"}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  cardWrap: {
    marginHorizontal: TAB_SCREEN_PADDING,
    position: "relative",
  },
  card: {
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
  bookmarkBtnAbsolute: {
    position: "absolute",
    top: 18,
    left: 66,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 10,
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
