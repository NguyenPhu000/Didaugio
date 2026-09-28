import { memo, useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useTranslation } from "react-i18next";
import { TOKENS } from "../../../constants/design-tokens";
import { resolveTripCoverUri } from "../../../lib/media-url";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { EXPLORE_THEME as C } from "./exploreTheme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const SAMPLE_TRIP_CARD_W = 360;
const CARD_H = 205;

const compareDestination = (a, b) => {
  const dayDelta = Number(a?.dayNumber || 1) - Number(b?.dayNumber || 1);
  if (dayDelta !== 0) return dayDelta;
  return Number(a?.order ?? a?.sequence ?? 0) - Number(b?.order ?? b?.sequence ?? 0);
};

function SampleTripCardInner({ trip, onPress }) {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const scale = useSharedValue(1);

  const destinations = useMemo(() => {
    const raw = trip?.stops || trip?.destinations;
    return Array.isArray(raw) ? [...raw].sort(compareDestination) : [];
  }, [trip?.stops, trip?.destinations]);

  const dayCount = useMemo(
    () =>
      Math.max(
        Number(trip?.totalDays) || 1,
        ...destinations.map((item) => Number(item?.dayNumber) || 1),
      ),
    [destinations, trip?.totalDays],
  );

  const routeSummary = useMemo(() => {
    const names = destinations
      .map((item) => item?.place?.name)
      .filter(Boolean);
    if (!names.length) return t("explore.sampleTrip.defaultRoute");
    const visible = names.slice(0, 3).join(" • ");
    return names.length > 3
      ? `${visible} (+${t("explore.countLabel", {
          count: names.length - 3,
        })})`
      : visible;
  }, [destinations, t]);

  const imageUri = useMemo(() => resolveTripCoverUri(trip, 900), [trip]);
  const [failedImageUri, setFailedImageUri] = useState(null);
  const displayImageUri = imageUri && imageUri !== failedImageUri ? imageUri : null;

  const cardWidth = Math.min(
    SAMPLE_TRIP_CARD_W,
    screenWidth - TAB_SCREEN_PADDING * 2,
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    onPress?.(trip);
  }, [onPress, trip]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => {
        scale.set(withSpring(0.975, TOKENS.spring.press));
      }}
      onPressOut={() => {
        scale.set(withSpring(1, TOKENS.spring.press));
      }}
      accessibilityRole="button"
      accessibilityLabel={trip?.title || t("explore.sampleTrip.defaultTitle")}
      accessibilityHint={t("explore.accessibility.openTrip")}
      style={[{ width: cardWidth, height: CARD_H, borderRadius: C.radius, overflow: "hidden", backgroundColor: C.ink, marginBottom: 12 }, animatedStyle]}
    >
      {displayImageUri ? (
        <Image
          source={{ uri: displayImageUri }}
          contentFit="cover"
          transition={240}
          cachePolicy="memory-disk"
          onError={() => setFailedImageUri(displayImageUri)}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
          <MaterialIconsRounded name="route" size={38} color="rgba(255,255,255,0.28)" />
        </View>
      )}

      {/* 3-Stop Linear Gradient Overlay */}
      <LinearGradient
        colors={["transparent", "rgba(8, 9, 12, 0.45)", "rgba(8, 9, 12, 0.95)"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full bg-black/55">
        <Text style={{ color: "#FFFFFF", fontFamily: C.font.semibold, fontSize: 11, fontVariant: ["tabular-nums"] }}>
          {t("explore.sampleTrip.days", { count: dayCount })}
        </Text>
      </View>

      {/* Card Content Footer */}
      <View className="absolute bottom-3.5 left-4 right-4 space-y-1.5">
        {/* Title */}
        <Text
          numberOfLines={2}
          className="text-xl font-bold text-white leading-snug tracking-tight"
        >
          {trip?.title || t("explore.sampleTrip.defaultTitle")}
        </Text>

        {/* Route Preview */}
        <View className="flex-row items-center space-x-1 pr-10">
          <MaterialIconsRounded name="place" size={13} color="#FFFFFF" />
          <Text
            numberOfLines={1}
            className="text-xs font-medium text-white/90"
          >
            {routeSummary}
          </Text>
        </View>

        {/* Bottom Meta & Action Arrow */}
        <View className="flex-row items-center justify-between pt-1.5 border-t border-white/15 mt-1">
          <View className="flex-row items-center space-x-3">
            <View className="flex-row items-center space-x-1">
              <MaterialIconsRounded name="route" size={14} color="#E2E8F0" />
              <Text className="text-xs font-semibold text-slate-200" style={{ fontVariant: ["tabular-nums"] }}>
                {t("explore.sampleTrip.legs", { count: destinations.length || 1 })}
              </Text>
            </View>
          </View>

          {/* Action Arrow Icon Button */}
          <View className="w-8 h-8 rounded-full bg-white/20 border border-white/30 items-center justify-center">
            <MaterialIconsRounded
              name="arrow-forward"
              size={16}
              color="#FFFFFF"
            />
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export const SampleTripCard = memo(SampleTripCardInner);
