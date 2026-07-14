import React, { memo } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { MaterialIconsRounded } from "../../../components/primitives/MaterialIconsRounded";
import { PALETTE } from "../constants/placeSheetConstants";
import { TOKENS } from "../../../constants/design-tokens";
import { cn } from "../../../lib/cn";

const DAY_NAMES_DEFAULT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SECTION_CARD_SHADOW = TOKENS.shadow.sm;

export const OpeningHours = memo(function OpeningHours({ hours, t }) {
  const today = new Date().getDay();
  const dayNames = t("place.dayNames", { returnObjects: true }) || DAY_NAMES_DEFAULT;

  return (
    <View className="gap-2">
      {dayNames.map((day, index) => {
        const dayNumber = index === 6 ? 0 : index + 1;
        const item = hours?.find((entry) => entry.dayOfWeek === dayNumber);
        const isToday = today === dayNumber;
        const label = item?.isClosed
          ? t("place.detail.closed")
          : item?.openTime && item?.closeTime
            ? `${item.openTime} - ${item.closeTime}`
            : t("place.detail.notUpdated");

        return (
          <View
            key={day}
            className={cn(
              "flex-row items-center justify-between gap-3 rounded-[16px] px-[14px] py-3",
              isToday ? "bg-blue-50/60" : "bg-[#F5F5F7]"
            )}
            style={{ borderCurve: "continuous" }}
          >
            <Text
              className="text-[13px]"
              style={{
                color: isToday ? PALETTE.accent : PALETTE.textMuted,
                fontFamily: isToday ? TOKENS.font.semibold : TOKENS.font.medium,
              }}
            >
              {day}
            </Text>
            <Text
              className="text-[13px]"
              style={{
                color: isToday ? PALETTE.accent : PALETTE.textMuted,
                fontFamily: isToday ? TOKENS.font.semibold : TOKENS.font.medium,
              }}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
});

export const SectionCard = memo(function SectionCard({
  title,
  actionLabel,
  actionNode,
  onActionPress,
  children,
}) {
  return (
    <View
      className="mt-[14px] rounded-[26px] p-[18px] bg-white"
      style={[SECTION_CARD_SHADOW, { borderCurve: "continuous" }]}
    >
      <View className="flex-row items-center justify-between mb-[14px]">
        <Text
          className="text-xl"
          style={{ color: PALETTE.text, fontFamily: TOKENS.font.heading }}
        >
          {title}
        </Text>
        {actionNode || (actionLabel ? (
          <Pressable onPress={onActionPress} hitSlop={8}>
            <Text
              className="text-[13px]"
              style={{ color: PALETTE.primary, fontFamily: TOKENS.font.semibold }}
            >
              {actionLabel}
            </Text>
          </Pressable>
        ) : null)}
      </View>
      {children}
    </View>
  );
});

export const StatPill = memo(function StatPill({ icon, label }) {
  return (
    <View className="flex-row items-center gap-1.5 px-[14px] py-2 rounded-full bg-[#F5F5F7]">
      <MaterialIconsRounded name={icon} size={15} color={PALETTE.textMuted} />
      <Text
        className="max-w-[120px] text-xs"
        style={{ color: PALETTE.textMuted, fontFamily: TOKENS.font.medium }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
});

export function FactCard({ icon, label, value }) {
  return (
    <View
      className="flex-row items-center gap-3.5 min-h-[78px] rounded-[22px] px-[14px] py-3 bg-[#F5F5F7]"
      style={{ borderCurve: "continuous" }}
    >
      <View
        className="w-[46px] h-[46px] rounded-[14px] items-center justify-center bg-white"
        style={{ borderCurve: "continuous" }}
      >
        <MaterialIconsRounded
          name={icon}
          size={18}
          color={PALETTE.accent}
        />
      </View>
      <View className="flex-1 min-w-0">
        <Text
          className="text-[11px] mb-1 tracking-[0.3px] uppercase"
          style={{ color: PALETTE.textSoft, fontFamily: TOKENS.font.semibold }}
        >
          {label}
        </Text>
        <Text
          className="text-sm leading-[19px]"
          style={{ color: PALETTE.text, fontFamily: TOKENS.font.semibold }}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
      <MaterialIconsRounded
        name="chevron-right"
        size={18}
        color={PALETTE.textSoft}
      />
    </View>
  );
}

export const AmenityCard = memo(function AmenityCard({ icon, label, tag, onPress }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, TOKENS.spring.press);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, TOKENS.spring.entrance);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View className="flex-1 items-center justify-start" style={animatedStyle}>
        <View className="w-[52px] h-[52px] rounded-full items-center justify-center mb-2 bg-[#F5F5F7]">
          <MaterialIconsRounded
            name={icon}
            size={22}
            color={PALETTE.accent}
          />
        </View>
        <Text
          className="text-[13px] text-center"
          style={{ color: PALETTE.text, fontFamily: TOKENS.font.semibold }}
          numberOfLines={1}
        >
          {label}
        </Text>
        {tag ? (
          <Text
            className="text-[11px] text-center mt-0.5"
            style={{ color: PALETTE.textSoft, fontFamily: TOKENS.font.medium }}
            numberOfLines={1}
          >
            {tag}
          </Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
});

export const DetailRow = memo(function DetailRow({ icon, label, value, onPress, highlight = false }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, TOKENS.spring.press);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, TOKENS.spring.entrance);
  };

  const content = (
    <View
      className="flex-row items-center gap-2.5 rounded-[16px] bg-[#F5F5F7] px-3 py-[11px]"
      style={{ borderCurve: "continuous" }}
    >
      <View
        className="w-[34px] h-[34px] rounded-[10px] items-center justify-center bg-white"
        style={{ borderCurve: "continuous" }}
      >
        <MaterialIconsRounded
          name={icon}
          size={17}
          color={highlight ? PALETTE.accent : PALETTE.textMuted}
        />
      </View>
      <View className="flex-1 min-w-0">
        <Text
          className="text-[11px] mb-0.5"
          style={{ color: PALETTE.textSoft, fontFamily: TOKENS.font.medium }}
        >
          {label}
        </Text>
        <Text
          className="text-[13px] leading-[19px]"
          style={{
            color: highlight ? PALETTE.accent : PALETTE.text,
            fontFamily: TOKENS.font.semibold,
          }}
          numberOfLines={3}
        >
          {value}
        </Text>
      </View>
      {onPress ? (
        <MaterialIconsRounded
          name="open-in-new"
          size={17}
          color={PALETTE.textSoft}
        />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View className="rounded-[16px]" style={animatedStyle}>
          {content}
        </Animated.View>
      </Pressable>
    );
  }

  return content;
});
