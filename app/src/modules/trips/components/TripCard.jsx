import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { Box, Text, Pressable as PrimitivePressable } from "../../../components/primitives";
import { MaterialIconsRounded } from "../../../components/primitives/MaterialIconsRounded";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import {
  STATUS_THEME,
  getTripCardDateDisplay,
  getDisplayStatus,
} from "../utils/tripHelpers";
import { resolveTripCoverUri } from "../../../lib/media-url";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const IMMERSIVE_COVER_WIDTH = 720;

// Overlay gradient cho từng trạng thái — rất nhẹ, chỉ tint mờ mờ

function dateLabel(dateDisplay) {
  if (dateDisplay.kind === "empty") return null;
  if (dateDisplay.kind === "range") {
    return `${dateDisplay.start} — ${dateDisplay.end}`;
  }
  return dateDisplay.label;
}

function SaveButton({ onPress, isSaved, label }) {
  return (
    <PrimitivePressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
      haptic="light"
      className="w-[34px] h-[34px] rounded-[17px] items-center justify-center bg-white/90"
    >
      <MaterialIconsRounded
        name={isSaved ? "bookmark" : "bookmark-border"}
        size={18}
        color={isSaved ? "#FF9F0A" : APPLE_THEME.text}
      />
    </PrimitivePressable>
  );
}

function StatusPill({ status }) {
  return (
    <Box className="rounded-full overflow-hidden bg-white/90">
      <Box className="flex-row items-center gap-1.5 px-[11px] py-1.5">
        <Box
          className="w-1.5 h-1.5 rounded-[3px]"
          style={{ backgroundColor: status.accent || status.text }}
        />
        <Text
          className="text-[11px] font-semibold"
          style={{ color: status.text }}
          numberOfLines={1}
        >
          {status.label}
        </Text>
      </Box>
    </Box>
  );
}

/* ── Card chính cho tất cả chuyến đi ── */
function ImmersiveCard({
  trip,
  status,
  displayUri,
  onImageError,
  dateText,
  destinationCount,
  onSave,
  isSaved,
  saveLabel,
  t,
}) {
  return (
    <Box className="flex-1">
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
        <Box className="absolute inset-0 bg-[#25272D]" />
      )}

      {/* Overlay gradient mặc định */}
      <Box className="absolute inset-0 bg-black/35" pointerEvents="none" />

      {/* Overlay theo trạng thái (completed/cancelled) */}
      <Box className="absolute top-3 left-3 right-3 flex-row items-center justify-between">
        <StatusPill status={status} />
        {onSave ? (
          <SaveButton
            onPress={onSave}
            isSaved={isSaved}
            label={saveLabel}
          />
        ) : null}
      </Box>

      <Box className="absolute left-0 right-0 bottom-0 px-4 pb-[15px] gap-2.5">
        <Text
          className="text-[20px] font-semibold text-white leading-[25px]"
          style={TITLE_TEXT_SHADOW}
          numberOfLines={2}
        >
          {trip.title || t("tripCard.newTrip")}
        </Text>

        <Box className="flex-row items-center flex-wrap gap-[7px]">
          {dateText ? (
            <Box className="flex-row items-center gap-[5px] bg-white/[0.18] px-[9px] py-[5px] rounded-full">
              <MaterialIconsRounded name="event" size={13} color="#FFFFFF" />
              <Text
                className="text-xs font-semibold text-white"
                style={{ fontVariant: ["tabular-nums"] }}
                numberOfLines={1}
              >
                {dateText}
              </Text>
            </Box>
          ) : null}
          <Box className="flex-row items-center gap-[5px] bg-white/[0.18] px-[9px] py-[5px] rounded-full">
            <MaterialIconsRounded name="today" size={13} color="#FFFFFF" />
            <Text
              className="text-xs font-semibold text-white"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {t("tripCard.dayCount", { count: trip.totalDays ?? 1 })}
            </Text>
          </Box>
          <Box className="flex-row items-center gap-[5px] bg-white/[0.18] px-[9px] py-[5px] rounded-full">
            <MaterialIconsRounded name="place" size={13} color="#FFFFFF" />
            <Text
              className="text-xs font-semibold text-white"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {t("tripCard.placeCount", { count: destinationCount })}
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export const TripCard = memo(function TripCard({
  trip,
  onPress,
  onSave,
  isSaved,
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
  const dateText = useMemo(
    () => dateLabel(getTripCardDateDisplay(trip)),
    [trip],
  );

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, TOKENS.spring.press);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, TOKENS.spring.press);
  }, [scale]);

  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  const handleSavePress = useCallback(() => {
    onSave?.(trip.id);
  }, [onSave, trip?.id]);

  const handleImageError = useCallback(() => setDisplayUri(null), []);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const saveLabel = isSaved
    ? t("tripCard.unsaveAccessibility")
    : t("tripCard.saveAccessibility");

  // Shadow theo trạng thái (nếu có), không thì dùng mặc định

  return (
    <Box style={{ marginHorizontal: TAB_SCREEN_PADDING }}>
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
        accessibilityActions={[{ name: "save", label: saveLabel }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "save") {
            handleSavePress();
          }
        }}
        style={[cardAnimStyle, SHADOW_IMMERSIVE]}
        className="rounded-2xl overflow-hidden h-[188px] bg-[#1C1F25]"
      >
        <ImmersiveCard
          trip={trip}
          status={status}
          displayUri={displayUri}
          onImageError={handleImageError}
          dateText={dateText}
          destinationCount={destinationCount}
          onSave={onSave ? handleSavePress : null}
          isSaved={isSaved}
          saveLabel={saveLabel}
          t={t}
        />
      </AnimatedPressable>
    </Box>
  );
});

const SHADOW_IMMERSIVE = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 3,
};

const TITLE_TEXT_SHADOW = {
  textShadowColor: "rgba(0,0,0,0.3)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 6,
};
