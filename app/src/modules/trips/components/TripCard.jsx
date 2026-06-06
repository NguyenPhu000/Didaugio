import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
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
import { TOKENS } from "../../../../src/constants/design-tokens";
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

const CARD_MIN_HEIGHT = 240;
const COVER_WIDTH = 720;

const GLASS = {
  fill: "rgba(0,0,0,0.16)",
  border: "rgba(255,255,255,0.12)",
  blur: 8,
};

function GlassPanel({ style, children, compact = false, tint }) {
  const flat = StyleSheet.flatten(style) ?? {};
  const radius = flat.borderRadius ?? (compact ? 999 : 14);

  return (
    <View 
      className="overflow-hidden"
      style={{ borderRadius: radius }}
    >
      <BlurView
        intensity={GLASS.blur}
        tint="dark"
        style={StyleSheet.absoluteFillObject}
      />
      <View
        className="absolute inset-0 bg-black/22"
        style={tint ? { backgroundColor: tint } : null}
        pointerEvents="none"
      />
      <View 
        className="z-[1]"
        style={[style, { borderRadius: radius }]}
      >
        {children}
      </View>
    </View>
  );
}

function TripDateLine({ dateDisplay }) {
  const { t } = useTranslation();
  if (dateDisplay.kind === "range") {
    return (
      <View className="flex-row items-center gap-[5px]">
        <MaterialIconsRounded name="event" size={13} color="rgba(255,255,255,0.76)" />
        <Text 
          className="flex-1 text-[12px] font-medium text-white tracking-[0.05px]"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {dateDisplay.start}
          <Text className="text-white/60"> — </Text>
          {dateDisplay.end}
        </Text>
      </View>
    );
  }

  if (dateDisplay.kind === "single" || dateDisplay.kind === "from" || dateDisplay.kind === "to") {
    return (
      <View className="flex-row items-center gap-[5px]">
        <MaterialIconsRounded name="event" size={13} color="rgba(255,255,255,0.76)" />
        <Text 
          className="flex-1 text-[12px] font-medium text-white tracking-[0.05px]"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {dateDisplay.label}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-[5px]">
      <MaterialIconsRounded name="event-busy" size={13} color="rgba(255,255,255,0.4)" />
      <Text className="flex-1 text-[12px] text-white/40 font-sans">
        {t('tripCard.noDate')}
      </Text>
    </View>
  );
}

export const TripCard = memo(function TripCard({ trip, onPress, onSave, isSaved }) {
  const { t } = useTranslation();
  const displayStatus = getDisplayStatus(trip);
  const status = STATUS_THEME[displayStatus] || STATUS_THEME.upcoming;
  const coverUri = resolveTripCoverUri(trip, COVER_WIDTH);
  const [displayUri, setDisplayUri] = useState(coverUri);
  const scale = useSharedValue(1);
  const [cardLayout, setCardLayout] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setDisplayUri(coverUri);
  }, [coverUri, trip?.id]);

  const destinationCount = trip.destinations?.length || 0;
  const dateDisplay = useMemo(() => getTripCardDateDisplay(trip), [trip]);

  const handleLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setCardLayout({ width, height });
    }
  }, []);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.982, TOKENS.spring.press);
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
    <View style={{ marginHorizontal: TAB_SCREEN_PADDING }}>
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLayout={handleLayout}
        accessibilityRole="button"
        accessibilityLabel={t('tripCard.tripAccessibility', { name: trip.title || t('tripCard.newTrip'), status: status.label })}
        className="min-h-[240px] rounded-[22px] overflow-hidden bg-neutral-900"
        style={[
          cardAnimStyle,
          {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 20,
            elevation: 6,
          }
        ]}
      >
        {/* ── LAYER 1: Ảnh gốc nét căng phía sau ── */}
        {displayUri ? (
          <Image
            source={{ uri: displayUri }}
            recyclingKey={`trip-${trip?.id}-cover`}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={280}
            cachePolicy="memory-disk"
            onError={() => setDisplayUri(null)}
          />
        ) : (
          <LinearGradient
            colors={["#1C1C1E", "#2C2C2E", "#3A3A3C"]}
            style={StyleSheet.absoluteFillObject}
          />
        )}

        {/* ── LAYER 2: Fake Foreground Blur Box ── */}
        {displayUri && cardLayout.width > 0 && cardLayout.height > 0 ? (
          <View className="absolute bottom-0 left-0 w-full h-[37%] overflow-hidden">
            <Image
              source={{ uri: displayUri }}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: cardLayout.width,
                height: cardLayout.height,
              }}
              contentFit="cover"
              blurRadius={8}
            />
          </View>
        ) : null}

        {/* ── LAYER 3: Gradient Vignette tối ── */}
        <LinearGradient
          colors={[
            "transparent",
            "rgba(9,15,26,0.28)",
            "rgba(9,15,26,0.88)",
          ]}
          locations={[0, 0.40, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        {/* ── LAYER 4: Badge trạng thái + Bookmark (góc trên) ── */}
        <View className="absolute top-3.5 left-3.5 right-3.5 flex-row items-center justify-between z-20">
          <GlassPanel 
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 11,
              paddingVertical: 6,
              borderRadius: 999,
            }} 
            compact 
            tint={status.bg}
          >
            <View 
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: status.text }} 
            />
            <Text 
              className="text-[11px] font-semibold tracking-[0.2px]"
              style={{ color: status.text }}
            >
              {status.label}
            </Text>
          </GlassPanel>

          {onSave ? (
            <Pressable
              onPress={handleSavePress}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={isSaved ? t('tripCard.unsaveAccessibility') : t('tripCard.saveAccessibility')}
            >
              <GlassPanel 
                style={{
                  width: 34,
                  height: 34,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 17,
                }} 
                compact
              >
                <MaterialIconsRounded
                  name={isSaved ? "bookmark" : "bookmark-border"}
                  size={18}
                  color={isSaved ? "#FF9F0A" : "rgba(255,255,255,0.88)"}
                />
              </GlassPanel>
            </Pressable>
          ) : null}
        </View>

        {/* ── LAYER 5: Nội dung đáy - Naked Typography ── */}
        <View className="absolute bottom-0 left-0 right-0 px-3.5 pb-3.5 pt-2.5 gap-2">
          {/* Tiêu đề */}
          <Text 
            className="text-[18px] font-bold text-white tracking-[-0.4px]"
            style={{ 
              lineHeight: 23, 
              textShadowColor: "rgba(0,0,0,0.35)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4 
            }}
            numberOfLines={2}
          >
            {trip.title || t('tripCard.newTrip')}
          </Text>

          {/* Row: ngày tháng bên trái | stats bên phải */}
          <View className="flex-row items-center justify-between gap-2">
            {/* Ngày tháng */}
            <View className="flex-1 min-w-0">
              <TripDateLine dateDisplay={dateDisplay} />
            </View>

            {/* Stats: số ngày | điểm đến */}
            <View className="flex-row items-center gap-0">
              <View className="items-center px-2 gap-[1px]">
                <Text className="text-[14px] font-semibold text-white tracking-[-0.2px]">
                  {trip.totalDays ?? 1}
                </Text>
                <Text className="text-[9px] font-sans text-white/50 tracking-[0.2px]">
                  {t('tripCard.days')}
                </Text>
              </View>

              <View className="h-5 bg-white/12" style={{ width: StyleSheet.hairlineWidth }} />

              <View className="items-center px-2 gap-[1px]">
                <Text className="text-[14px] font-semibold text-white tracking-[-0.2px]">
                  {destinationCount === 0 ? "—" : destinationCount}
                </Text>
                <Text className="text-[9px] font-sans text-white/50 tracking-[0.2px]">
                  {t('tripCard.destinations')}
                </Text>
              </View>

              <MaterialIconsRounded
                name="chevron-right"
                size={16}
                color="rgba(255,255,255,0.52)"
                style={{ marginLeft: 2, opacity: 0.8 }}
              />
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </View>
  );
});
