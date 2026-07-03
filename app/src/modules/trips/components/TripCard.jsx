import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
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
  const handlePress = useCallback(
    (event) => {
      event?.stopPropagation?.();
      onPress?.();
    },
    [onPress],
  );

  return (
    <PrimitivePressable
      onPress={handlePress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
      haptic="light"
      className="w-10 h-10 rounded-full items-center justify-center overflow-hidden border border-white/50 bg-white/85"
    >
      <MaterialIconsRounded
        name={isSaved ? "bookmark" : "bookmark-border"}
        size={19}
        color={isSaved ? "#FF9F0A" : APPLE_THEME.text}
      />
    </PrimitivePressable>
  );
}

function StatusPill({ status }) {
  return (
    <BlurView intensity={70} tint="light" className="rounded-full overflow-hidden border border-white/50">
      <Box className="flex-row items-center gap-1.5 px-3 py-2 bg-white/35">
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
    </BlurView>
  );
}

/* ── Card chính cho tất cả chuyến đi ── */
function MetaChip({ icon, label }) {
  return (
    <Box className="flex-1 flex-row items-center gap-1.5 rounded-full bg-white/[0.14] border border-white/15 px-3 py-2">
      <MaterialIconsRounded name={icon} size={13} color="#FFFFFF" />
      <Text
        className="flex-1 text-xs font-semibold text-white"
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
  displayUri,
  onImageError,
  dateText,
  destinationCount,
  onSave,
  isSaved,
  saveLabel,
  t,
}) {
  const firstStops = Array.isArray(trip.destinations)
    ? trip.destinations
        .slice(0, 2)
        .map((destination) => destination?.place?.name)
        .filter(Boolean)
    : [];

  return (
    <Box className="flex-1 bg-[#F6F7F9]">
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
        <Box className="absolute inset-0 bg-[#E9EEF5]" />
      )}

      {/* Overlay gradient mặc định */}
      <Box className="absolute inset-0 bg-black/15" pointerEvents="none" />
      <Box className="absolute left-0 right-0 bottom-0 h-[58%] bg-black/38" pointerEvents="none" />

      {/* Overlay theo trạng thái (completed/cancelled) */}
      <Box className="absolute top-4 left-4 right-4 flex-row items-center justify-between">
        <StatusPill status={status} />
        {onSave ? (
          <SaveButton
            onPress={onSave}
            isSaved={isSaved}
            label={saveLabel}
          />
        ) : null}
      </Box>

      <BlurView
        intensity={34}
        tint="dark"
        className="absolute left-4 right-4 bottom-4 rounded-[20px] overflow-hidden border border-white/15"
      >
        <Box className="gap-2.5 bg-black/20 px-3.5 py-3">
          <Box className="gap-1.5">
            <Text
              className="text-[22px] font-semibold text-white leading-[27px]"
              style={TITLE_TEXT_SHADOW}
              numberOfLines={2}
            >
              {trip.title || t("tripCard.newTrip")}
            </Text>

            {firstStops.length > 0 ? (
              <Box className="flex-row items-center gap-2">
                <Box className="w-7 h-7 rounded-full bg-white/90 items-center justify-center">
                  <MaterialIconsRounded name="route" size={15} color="#111827" />
                </Box>
                <Text
                  className="flex-1 text-white/90 text-[13px] font-medium"
                  numberOfLines={1}
                >
                  {firstStops.join(" -> ")}
                </Text>
              </Box>
            ) : null}
          </Box>

          <Box className="h-px bg-white/15" />

          <Box className="gap-1.5">
            {dateText ? <MetaChip icon="event" label={dateText} /> : null}
            <Box className="flex-row items-center gap-1.5">
              <MetaChip
                icon="today"
                label={t("tripCard.dayCount", { count: trip.totalDays ?? 1 })}
              />
              <MetaChip
                icon="place"
                label={t("tripCard.placeCount", { count: destinationCount })}
              />
              <Box className="w-10 h-10 rounded-full bg-white items-center justify-center">
                <MaterialIconsRounded name="arrow-forward" size={20} color="#111827" />
              </Box>
            </Box>
          </Box>
        </Box>
      </BlurView>
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
        className="rounded-[28px] overflow-hidden h-[246px] bg-[#F6F7F9] border border-white"
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
  shadowOffset: { width: 0, height: 14 },
  shadowOpacity: 0.16,
  shadowRadius: 24,
  elevation: 7,
};

const TITLE_TEXT_SHADOW = {
  textShadowColor: "rgba(0,0,0,0.3)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 6,
};
