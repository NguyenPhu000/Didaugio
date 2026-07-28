import { memo, useCallback, useMemo } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";
import { resolveTripCoverUri } from "../../../lib/media-url";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const SAMPLE_TRIP_CARD_W = 360;
const CARD_H = 205;

const compareDestination = (a, b) => {
  const dayDelta = Number(a?.dayNumber || 1) - Number(b?.dayNumber || 1);
  if (dayDelta !== 0) return dayDelta;
  return Number(a?.order ?? a?.sequence ?? 0) - Number(b?.order ?? b?.sequence ?? 0);
};

function SampleTripCardInner({ trip, onPress }) {
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
    if (!names.length) return "Khám phá vẻ đẹp Cần Thơ theo nhịp riêng";
    const visible = names.slice(0, 3).join(" • ");
    return names.length > 3 ? `${visible} (+${names.length - 3} điểm)` : visible;
  }, [destinations]);

  const imageUri = useMemo(
    () =>
      resolveTripCoverUri(trip, 900) ||
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80",
    [trip],
  );

  const cardWidth = Math.min(
    SAMPLE_TRIP_CARD_W,
    screenWidth - TAB_SCREEN_PADDING * 2,
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(trip);
  }, [onPress, trip]);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.975, TOKENS.spring.press);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, TOKENS.spring.press);
      }}
      style={[{ width: cardWidth, height: CARD_H }, animatedStyle]}
      className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-xl border border-white/20 mb-4"
    >
      {/* Background Image */}
      <Image
        source={{ uri: imageUri }}
        contentFit="cover"
        transition={300}
        cachePolicy="memory-disk"
        className="absolute inset-0 w-full h-full"
      />

      {/* 3-Stop Linear Gradient Overlay */}
      <LinearGradient
        colors={["transparent", "rgba(8, 9, 12, 0.45)", "rgba(8, 9, 12, 0.95)"]}
        locations={[0, 0.55, 1]}
        className="absolute inset-0 w-full h-full"
      />

      {/* Top Floating Badge */}
      <View className="absolute top-3.5 left-3.5 flex-row items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#0B0D12]/80 border border-white/20">
        <MaterialIconsRounded name="explore" size={14} color="#38BDF8" />
        <Text className="text-[10px] font-bold tracking-wider text-sky-300 uppercase">
          LỊCH TRÌNH MẪU • CẦN THƠ
        </Text>
      </View>

      {/* Right Top Days Tag */}
      <View className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-400/40">
        <Text className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-tight" style={{ fontVariant: ["tabular-nums"] }}>
          {dayCount} NGÀY
        </Text>
      </View>

      {/* Card Content Footer */}
      <View className="absolute bottom-3.5 left-4 right-4 space-y-1.5">
        {/* Title */}
        <Text
          numberOfLines={2}
          className="text-xl font-bold text-white leading-snug tracking-tight"
        >
          {trip?.title || "Hành trình trải nghiệm Cần Thơ"}
        </Text>

        {/* Route Preview */}
        <View className="flex-row items-center space-x-1 pr-10">
          <MaterialIconsRounded name="place" size={13} color="#FCD34D" />
          <Text
            numberOfLines={1}
            className="text-xs font-medium text-amber-200/90"
          >
            {routeSummary}
          </Text>
        </View>

        {/* Bottom Meta & Action Arrow */}
        <View className="flex-row items-center justify-between pt-1.5 border-t border-white/15 mt-1">
          <View className="flex-row items-center space-x-3">
            <View className="flex-row items-center space-x-1">
              <MaterialIconsRounded
                name="schedule"
                size={14}
                color="#E2E8F0"
              />
              <Text className="text-xs font-semibold text-slate-200" style={{ fontVariant: ["tabular-nums"] }}>
                {dayCount} ngày
              </Text>
            </View>

            <View className="w-px h-3 bg-white/30" />

            <View className="flex-row items-center space-x-1">
              <MaterialIconsRounded name="route" size={14} color="#E2E8F0" />
              <Text className="text-xs font-semibold text-slate-200" style={{ fontVariant: ["tabular-nums"] }}>
                {destinations.length || 1} chặng dừng
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
