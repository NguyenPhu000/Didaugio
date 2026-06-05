import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { TOKENS, BOOKING_APPLE_THEME as APPLE_THEME } from "../../../../src/constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import {
  STATUS_THEME,
  getTripCardDateDisplay,
  getDisplayStatus,
} from "../utils/tripHelpers";
import {
  resolveTripCoverUri,
} from "../../../lib/media-url";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CARD_MIN_HEIGHT = 236;
const COVER_WIDTH = 720;

const GLASS = {
  fill: "rgba(255, 255, 255, 0.11)",
  border: "rgba(255, 255, 255, 0.14)",
  blur: 14,
};

const INK = {
  primary: "#FFFFFF",
  soft: "rgba(255, 255, 255, 0.88)",
  muted: "rgba(255, 255, 255, 0.62)",
};

function GlassPanel({ style, children, compact = false, tint }) {
  const flat = StyleSheet.flatten(style) ?? {};
  const radius = flat.borderRadius ?? (compact ? 12 : 14);

  return (
    <View style={[styles.glassShell, { borderRadius: radius }]}>
      <BlurView
        intensity={GLASS.blur}
        tint="light"
        style={StyleSheet.absoluteFillObject}
      />
      <View
        style={[
          styles.glassTint,
          tint ? { backgroundColor: tint } : null,
        ]}
        pointerEvents="none"
      />
      <View style={[style, styles.glassContent, { borderRadius: radius }]}>
        {children}
      </View>
    </View>
  );
}

function MetaDot() {
  return <View style={styles.metaDot} />;
}

function TripDateLine({ dateDisplay }) {
  if (dateDisplay.kind === "range") {
    return (
      <View style={styles.dateLine}>
        <MaterialIconsRounded name="event" size={15} color={INK.muted} />
        <Text style={styles.dateLineText}>
          {dateDisplay.start}
          <Text style={styles.dateLineSep}> — </Text>
          {dateDisplay.end}
        </Text>
      </View>
    );
  }

  if (dateDisplay.kind === "single" || dateDisplay.kind === "from" || dateDisplay.kind === "to") {
    return (
      <View style={styles.dateLine}>
        <MaterialIconsRounded name="event" size={15} color={INK.muted} />
        <Text style={styles.dateLineText}>{dateDisplay.label}</Text>
      </View>
    );
  }

  return (
    <View style={styles.dateLine}>
      <MaterialIconsRounded name="event-busy" size={15} color={INK.muted} />
      <Text style={[styles.dateLineText, styles.dateLineMuted]}>Chưa chọn ngày</Text>
    </View>
  );
}

export const TripCard = memo(function TripCard({ trip, onPress, onSave, isSaved }) {
  const displayStatus = getDisplayStatus(trip);
  const status = STATUS_THEME[displayStatus] || STATUS_THEME.upcoming;
  const coverUri = resolveTripCoverUri(trip, COVER_WIDTH);
  const [displayUri, setDisplayUri] = useState(coverUri);
  const scale = useSharedValue(1);

  useEffect(() => {
    setDisplayUri(coverUri);
  }, [coverUri, trip?.id]);

  const destinationCount = trip.destinations?.length || 0;
  const dateDisplay = useMemo(() => getTripCardDateDisplay(trip), [trip]);
  const daysLabel = `${trip.totalDays ?? 1} ngày`;
  const placesLabel =
    destinationCount === 0
      ? "Chưa có điểm"
      : `${destinationCount} điểm`;

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.988, TOKENS.spring.press);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, TOKENS.spring.press);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);

  const handleSavePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave?.(trip.id);
  }, [onSave, trip?.id]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.wrap}>
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`Chuyến đi ${trip.title || "mới"}, ${status.label}`}
        style={[styles.card, cardAnimStyle]}
      >
        {displayUri ? (
          <Image
            source={{ uri: displayUri }}
            recyclingKey={`trip-${trip?.id}-cover`}
            style={styles.coverImage}
            contentFit="cover"
            transition={280}
            cachePolicy="memory-disk"
            onError={() => setDisplayUri(null)}
          />
        ) : (
          <LinearGradient
            colors={["#1C1C1E", "#2C2C2E", "#3A3A3C"]}
            style={styles.coverImage}
          />
        )}

        <LinearGradient
          colors={[
            "rgba(0,0,0,0.02)",
            "transparent",
            "rgba(0,0,0,0.38)",
            "rgba(0,0,0,0.58)",
          ]}
          locations={[0, 0.28, 0.72, 1]}
          style={styles.coverGradient}
          pointerEvents="none"
        />

        <View style={styles.overlay}>
          <View style={styles.topRow}>
            <GlassPanel style={styles.statusPill} compact tint={status.bg}>
              <View style={[styles.statusDot, { backgroundColor: status.text }]} />
              <Text
                style={[styles.statusText, { color: status.text }]}
              >
                {status.label}
              </Text>
            </GlassPanel>

            {onSave ? (
              <Pressable
                onPress={handleSavePress}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={isSaved ? "Bỏ lưu chuyến đi" : "Lưu chuyến đi"}
              >
                <GlassPanel style={styles.bookmarkBtn} compact>
                  <MaterialIconsRounded
                    name={isSaved ? "bookmark" : "bookmark-border"}
                    size={18}
                    color={isSaved ? "#FF9F0A" : INK.soft}
                  />
                </GlassPanel>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.bottomBlock}>
            <Text style={styles.title} numberOfLines={2}>
              {trip.title || "Chuyến đi mới"}
            </Text>

            <GlassPanel style={styles.metaPanel}>
              <TripDateLine dateDisplay={dateDisplay} />
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <MaterialIconsRounded name="schedule" size={14} color={INK.muted} />
                  <Text style={styles.metaText}>{daysLabel}</Text>
                </View>
                <MetaDot />
                <View style={[styles.metaItem, styles.metaItemFlex]}>
                  <MaterialIconsRounded name="place" size={14} color={INK.muted} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {placesLabel}
                  </Text>
                </View>
                <MaterialIconsRounded
                  name="chevron-right"
                  size={18}
                  color={INK.muted}
                  style={styles.metaChevron}
                />
              </View>
            </GlassPanel>
          </View>
        </View>
      </AnimatedPressable>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: TAB_SCREEN_PADDING,
  },
  card: {
    minHeight: CARD_MIN_HEIGHT,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: APPLE_THEME.background,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 5,
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  coverGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  glassShell: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS.border,
  },
  glassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GLASS.fill,
  },
  glassContent: {
    zIndex: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderColor: "rgba(255,255,255,0.3)",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
    fontFamily: TOKENS.font.semibold,
  },
  bookmarkBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBlock: {
    gap: 11,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: INK.primary,
    letterSpacing: -0.35,
    lineHeight: 26,
    fontFamily: TOKENS.font.heading,
    textShadowColor: "rgba(0,0,0,0.22)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  metaPanel: {
    gap: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 16,
  },
  dateLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateLineText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: INK.soft,
    letterSpacing: 0.15,
    fontVariant: ["tabular-nums"],
    fontFamily: TOKENS.font.semibold,
  },
  dateLineSep: {
    color: INK.muted,
    fontWeight: "500",
  },
  dateLineMuted: {
    color: INK.muted,
    fontWeight: "500",
    fontFamily: TOKENS.font.body,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaItemFlex: {
    flex: 1,
    minWidth: 0,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "500",
    color: INK.muted,
    fontFamily: TOKENS.font.body,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  metaChevron: {
    marginLeft: 2,
    opacity: 0.85,
  },
});
