import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Box, Text } from "../../../components/primitives";
import { MaterialIconsRounded } from "../../../components/primitives/MaterialIconsRounded";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { TOKENS } from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import {
  STATUS_THEME,
  getDateRangeLabel,
  getDisplayStatus,
} from "../utils/tripHelpers";
import { resolveTripCoverUri } from "../../../lib/media-url";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const IMMERSIVE_COVER_WIDTH = 720;

function StatusPill({ status }) {
  return (
    <Box className="flex-row items-center gap-1.5 rounded-full bg-black/50 border border-white/20 px-3 py-1.5">
      <Box
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: status.accent || "#34D399" }}
      />
      <Text
        className="text-[11px] font-bold uppercase tracking-wider text-white"
        style={{ color: status.accent || "#FFFFFF" }}
        numberOfLines={1}
      >
        {status.label}
      </Text>
    </Box>
  );
}

function MetaRow({ icon, label }) {
  return (
    <Box className="flex-row items-center gap-1.5">
      <MaterialIconsRounded name={icon} size={14} color="#FFFFFF" />
      <Text
        className="text-xs font-semibold text-white"
        style={{ fontVariant: ["tabular-nums"] }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Box>
  );
}

function ImmersiveCard({
  trip,
  status,
  displayStatus,
  displayUri,
  onImageError,
  dateText,
  destinationCount,
  t,
}) {
  const isCompleted = displayStatus === "completed";

  return (
    <Box className="flex-1 bg-[#0B0D12]">
      {displayUri ? (
        <Image
          source={{ uri: displayUri }}
          recyclingKey={`trip-${trip?.id}-cover`}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={280}
          cachePolicy="memory-disk"
          onError={onImageError}
        />
      ) : (
        <Box className="absolute inset-0 bg-[#121620]" />
      )}

      {/* 3-stop Linear Gradient Overlay cho độ tương phản tối ưu */}
      <LinearGradient
        colors={["transparent", "rgba(8, 9, 12, 0.35)", "rgba(8, 9, 12, 0.9)"]}
        locations={[0, 0.5, 1.0]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Top Header: Status Pill (Left) & Arrow Button (Right) */}
      <Box className="absolute top-4 left-4 right-4 flex-row items-center justify-between z-10">
        <StatusPill status={status} />
        <Box className="w-8 h-8 rounded-full bg-black/40 border border-white/25 items-center justify-center">
          <MaterialIconsRounded name="arrow-forward" size={16} color="#FFFFFF" />
        </Box>
      </Box>

      {/* Watermark Con Dấu "ĐÃ HOÀN THÀNH" ở giữa Card cho chuyến đi đã kết thúc */}
      {isCompleted ? (
        <Box className="absolute inset-0 items-center justify-center pointer-events-none z-10">
          <Box className="border-2 border-slate-300/70 rounded-xl px-4 py-1.5 rotate-[-12deg] bg-black/40">
            <Text className="text-[12px] font-black tracking-[0.22em] text-slate-200 uppercase">
              ĐÃ HOÀN THÀNH
            </Text>
          </Box>
        </Box>
      ) : null}

      {/* Card Content Footer */}
      <Box className="absolute bottom-0 left-0 right-0 gap-2.5 px-5 pb-4 pt-8 z-20">
        <Text
          className="text-[20px] font-bold text-white leading-[25px] tracking-[-0.3px]"
          numberOfLines={2}
        >
          {trip.title || t("tripCard.newTrip")}
        </Text>

        <Box className="flex-row items-center justify-between pt-2 border-t border-white/20">
          <Box className="flex-row flex-1 items-center gap-3 flex-wrap">
            {dateText ? <MetaRow icon="event" label={dateText} /> : null}
            <MetaRow
              icon="today"
              label={t("tripCard.dayCount", { count: trip.totalDays ?? 1 })}
            />
            <MetaRow
              icon="place"
              label={t("tripCard.placeCount", { count: destinationCount })}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export const TripCard = memo(function TripCard({
  trip,
  onPress,
}) {
  const { t } = useTranslation();
  const displayStatus = getDisplayStatus(trip);
  const status = STATUS_THEME[displayStatus] || STATUS_THEME.upcoming;

  const coverUri = resolveTripCoverUri(trip, IMMERSIVE_COVER_WIDTH);
  const [displayUri, setDisplayUri] = useState(coverUri);
  const scale = useSharedValue(1);

  useEffect(() => {
    setDisplayUri(coverUri);
  }, [coverUri, trip?.id]);

  const destinationCount = trip.destinations?.length || 0;
  const dateText = useMemo(() => getDateRangeLabel(trip), [trip]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.975, TOKENS.spring.press);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, TOKENS.spring.press);
  }, [scale]);

  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  const handleImageError = useCallback(() => setDisplayUri(null), []);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Box style={{ marginHorizontal: TAB_SCREEN_PADDING }} className="mb-1">
      {/* Outer Shell (Double-Bezel Architecture) */}
      <Box className="p-1 rounded-[28px] bg-white/5 border border-white/10">
        <AnimatedPressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel={t("tripCard.tripAccessibility", {
            name: trip.title || t("tripCard.newTrip"),
            status: status.label,
          })}
          accessibilityHint={t("tripCard.tripHint")}
          style={[cardAnimStyle, SHADOW_IMMERSIVE]}
          className="rounded-[24px] overflow-hidden h-[248px] bg-[#0B0D12] border border-white/15"
        >
          <ImmersiveCard
            trip={trip}
            status={status}
            displayStatus={displayStatus}
            displayUri={displayUri}
            onImageError={handleImageError}
            dateText={dateText}
            destinationCount={destinationCount}
            t={t}
          />
        </AnimatedPressable>
      </Box>
    </Box>
  );
});

const SHADOW_IMMERSIVE = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.25,
  shadowRadius: 20,
  elevation: 6,
};
