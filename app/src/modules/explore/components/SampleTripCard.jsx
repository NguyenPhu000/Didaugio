import { memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";
import { resolveTripCoverUri } from "../../../lib/media-url";
import { SampleTripRoutePreview } from "./SampleTripRoutePreview";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const SAMPLE_TRIP_CARD_W = 292;
const CARD_H = 378;

const compareDestination = (a, b) => {
  const dayDelta = Number(a?.dayNumber || 1) - Number(b?.dayNumber || 1);
  if (dayDelta !== 0) return dayDelta;
  const orderDelta = Number(a?.order || 0) - Number(b?.order || 0);
  if (orderDelta !== 0) return orderDelta;
  return Number(a?.id || 0) - Number(b?.id || 0);
};

const getTripDayCount = (trip, destinations) => {
  const maxDestinationDay = destinations.reduce(
    (max, destination) => Math.max(max, Number(destination?.dayNumber || 1)),
    1,
  );
  return Math.max(Number(trip?.totalDays) || 1, maxDestinationDay);
};

function SampleTripCardInner({ trip, onPress }) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const destinations = useMemo(
    () => (Array.isArray(trip?.destinations) ? [...trip.destinations].sort(compareDestination) : []),
    [trip?.destinations],
  );

  const dayCount = useMemo(
    () => getTripDayCount(trip, destinations),
    [trip, destinations],
  );

  const destinationNames = useMemo(
    () => destinations.map((destination) => destination?.place?.name).filter(Boolean),
    [destinations],
  );

  const travelStyleLabel = useMemo(() => {
    const labels = {
      adventure: t("explore.sampleTrip.adventure"),
      cultural: t("explore.sampleTrip.culture"),
      culture: t("explore.sampleTrip.culture"),
      nature: t("explore.sampleTrip.nature", "Thiên nhiên"),
      foodie: t("explore.sampleTrip.food"),
      food: t("explore.sampleTrip.food"),
      relaxation: t("explore.sampleTrip.relax"),
      relax: t("explore.sampleTrip.relax"),
      family: t("explore.sampleTrip.family"),
      budget: t("explore.sampleTrip.budget"),
      luxury: t("explore.sampleTrip.luxury"),
    };
    return trip?.travelStyle ? labels[trip.travelStyle] || trip.travelStyle : "Hành trình mẫu";
  }, [t, trip?.travelStyle]);

  const routeSummary = useMemo(() => {
    if (destinationNames.length === 0) return "Map demo và lịch trình sẽ hiện khi có điểm dừng";
    const visibleNames = destinationNames.slice(0, 3).join(" → ");
    const remaining = destinationNames.length - 3;
    return remaining > 0 ? `${visibleNames} +${remaining}` : visibleNames;
  }, [destinationNames]);

  const imageUri = useMemo(
    () =>
      resolveTripCoverUri(trip, 640) ||
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=640&q=72",
    [trip],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.975, TOKENS.spring.press);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, TOKENS.spring.press);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(trip);
  }, [trip, onPress]);

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[animatedStyle, styles.card]}
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: imageUri }}
          contentFit="cover"
          transition={240}
          cachePolicy="memory-disk"
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.imageScrim} />
        <View style={styles.topBadges}>
          <View style={styles.styleBadge}>
            <MaterialIconsRounded name="route" size={12} color="#FFF" />
            <Text style={styles.styleText} numberOfLines={1}>
              {String(travelStyleLabel).toUpperCase()}
            </Text>
          </View>
          <View style={styles.daysBadge}>
            <Text style={styles.daysText}>{dayCount}N</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {trip?.title || "Chuyến đi mẫu"}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialIconsRounded name="place" size={13} color="#007BFF" />
            <Text style={styles.metaText}>{destinations.length} chặng</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialIconsRounded name="calendar-today" size={12} color="#F59E0B" />
            <Text style={styles.metaText}>{dayCount} ngày</Text>
          </View>
          {trip?.cloneCount != null ? (
            <View style={styles.metaItem}>
              <MaterialIconsRounded name="content-copy" size={12} color="#10B981" />
              <Text style={styles.metaText}>{trip.cloneCount} clone</Text>
            </View>
          ) : null}
        </View>

        <SampleTripRoutePreview destinations={destinations} totalDays={dayCount} />

        <View style={styles.routeLine}>
          <MaterialIconsRounded name="near-me" size={13} color="rgba(24,24,25,0.44)" />
          <Text style={styles.routeText} numberOfLines={1}>
            {routeSummary}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Xem & clone hành trình</Text>
          <View style={styles.footerIcon}>
            <MaterialIconsRounded name="arrow-forward" size={14} color="#FFF" />
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SAMPLE_TRIP_CARD_W,
    height: CARD_H,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.07)",
    ...TOKENS.shadow.sm,
  },
  imageWrap: {
    height: 128,
    backgroundColor: "#EDEDF2",
  },
  imageScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  topBadges: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  styleBadge: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    height: 27,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.46)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.24)",
  },
  styleText: {
    color: "#FFF",
    fontSize: 9,
    fontFamily: TOKENS.font.bold,
    letterSpacing: 0.8,
  },
  daysBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  daysText: {
    color: "#007BFF",
    fontSize: 12,
    fontFamily: TOKENS.font.bold,
  },
  body: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  title: {
    color: "#181819",
    fontSize: 17,
    lineHeight: 21,
    fontFamily: TOKENS.font.heading,
    letterSpacing: -0.35,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: "rgba(24,24,25,0.62)",
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
  },
  routeLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  routeText: {
    flex: 1,
    color: "rgba(24,24,25,0.48)",
    fontSize: 11,
    lineHeight: 15,
    fontFamily: TOKENS.font.medium,
  },
  footer: {
    marginTop: "auto",
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F0F7FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 13,
    paddingRight: 4,
  },
  footerText: {
    color: "#0055CC",
    fontSize: 12,
    fontFamily: TOKENS.font.bold,
  },
  footerIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#007BFF",
    alignItems: "center",
    justifyContent: "center",
  },
});

export const SampleTripCard = memo(SampleTripCardInner);
