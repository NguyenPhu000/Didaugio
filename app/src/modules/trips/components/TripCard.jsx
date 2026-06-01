import { memo, useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { LinearGradient } from "expo-linear-gradient";
import { cn } from "../../../lib/cn";
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
import { resolveMediaUrl, resolvePlaceImageUri } from "../../../lib/media-url";

const fallbackCover = "https://picsum.photos/id/408/600/400";

export const TripCard = memo(function TripCard({ trip, onPress, onSave, isSaved }) {
  const displayStatus = getDisplayStatus(trip);
  const status = STATUS_THEME[displayStatus] || STATUS_THEME.upcoming;
  const cover = trip.thumbnail
    ? resolveMediaUrl(trip.thumbnail)
    : (trip.destinations?.[0]?.place
      ? resolvePlaceImageUri(trip.destinations[0].place)
      : null);
  const coverUri = cover || fallbackCover;
  const destinationCount = trip.destinations?.length || 0;
  const dateRange = getDateRangeLabel(trip);
  const daysLabel = `${trip.totalDays ?? 1} ngày`;
  const timeline = getTimelineLabel(trip);
  const placesLabel =
    destinationCount === 0
      ? "Chưa có điểm đến"
      : `${destinationCount} điểm đến`;

  return (
    <View className="relative" style={{ marginHorizontal: TAB_SCREEN_PADDING }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        className="flex-row items-center bg-white rounded-[24px] p-4 gap-4.5"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 4,
        }}
      >
        {/* Thumbnail */}
        <View className="w-[108px] h-[108px] rounded-[18px] overflow-hidden bg-gray-100 flex-shrink-0">
          <Image
            source={{ uri: coverUri }}
            className="w-full h-full"
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.15)"]}
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
          />
        </View>

        {/* Content */}
        <View className="flex-1 gap-2 justify-center">
          <View className="flex-row items-center justify-between">
            <Text
              className="text-[19px] font-bold tracking-tight flex-1 pr-2"
              style={{ color: APPLE_THEME.text }}
              numberOfLines={1}
            >
              {trip.title || "Chuyến đi mới"}
            </Text>
            <View
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: status.accent }}
            />
          </View>

          <View className="flex-row items-center gap-1">
            <MaterialIconsRounded name="event" size={15} color={APPLE_THEME.textMuted} />
            <Text
              className="text-[14px] font-body flex-shrink tracking-tight"
              style={{ color: APPLE_THEME.textMuted }}
              numberOfLines={1}
            >
              {dateRange}
            </Text>
            <View className="w-[3.5px] h-[3.5px] rounded-full bg-black/15 mx-1" />
            <MaterialIconsRounded name="schedule" size={15} color={APPLE_THEME.textMuted} />
            <Text className="text-[14px] font-body tracking-tight" style={{ color: APPLE_THEME.textMuted }}>
              {daysLabel}
            </Text>
          </View>

          <View className="flex-row items-center gap-2.5 mt-0.5">
            <View
              className="px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: status.bg }}
            >
              <Text className="text-[11.5px] font-semibold tracking-tight" style={{ color: status.text }}>
                {status.label}
              </Text>
            </View>
            <Text className="text-[14px] font-body tracking-tight" style={{ color: APPLE_THEME.textMuted }}>
              {placesLabel}
            </Text>
          </View>
        </View>

        {/* Subtle Arrow */}
        <View className="justify-center items-center">
          <MaterialIconsRounded name="chevron-right" size={24} color="rgba(0,0,0,0.2)" />
        </View>
      </TouchableOpacity>

      {/* Sibling absolute Bookmark button to fix stopPropagation on Android/iOS */}
      {onSave ? (
        <TouchableOpacity
          onPress={() => onSave(trip.id)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="absolute top-6 left-[88px] w-[30px] h-[30px] rounded-[15px] items-center justify-center bg-black/35 z-10"
        >
          <MaterialIconsRounded
            name={isSaved ? "bookmark" : "bookmark-border"}
            size={18}
            color={isSaved ? "#FF9F0A" : "#FFFFFF"}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
});
