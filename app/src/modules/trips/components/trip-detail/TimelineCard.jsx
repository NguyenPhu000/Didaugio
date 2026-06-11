import { memo, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { ScaleDecorator } from "react-native-draggable-flatlist";
import { TRIP_STATUS_META } from "../../utils/tripTheme";
import { formatPrice, formatDestinationTimeLabel, formatDuration } from "../../utils/tripHelpers";
import { T, ALPHA } from "../../utils/tripDetailTokens";
import { StatusBadge } from "./StatusBadge";

import { resolvePlaceImageUri } from "../../../../lib/media-url";

const ACTIVE_CARD_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 8,
};

function TimelineCard({
  dest,
  bookings,
  onOpenBooking,
  onRemove,
  onMoveRequest,
  onEditRequest,
  drag,
  isActive,
  tripStatus,
  isVisited = false,
}) {
  const { t } = useTranslation();
  const statusMeta = TRIP_STATUS_META[tripStatus] || TRIP_STATUS_META.upcoming;

  const handleEditPress = useCallback(() => {
    onEditRequest?.(dest);
  }, [dest, onEditRequest]);

  const handleMovePress = useCallback(() => {
    onMoveRequest?.(dest);
  }, [dest, onMoveRequest]);

  const router = useRouter();

  const handleViewPress = useCallback(() => {
    const placeId = dest.placeId || dest.place?.id;
    if (placeId) {
      router.push(`/place/${placeId}`);
    }
  }, [dest, router]);

  const placeName = dest.place?.name || t("trip.timeline.noName");
  const placeAddress = dest.place?.address || "";
  const thumbnail = resolvePlaceImageUri(dest.place);

  const hasTime = !!dest.startTime || !!dest.endTime;
  const timeLabel = formatDestinationTimeLabel(dest);

  return (
    <ScaleDecorator>
      <View
        className="bg-white rounded-[20px] p-4 gap-2.5 border border-black/[0.05]"
        style={isActive ? [{ opacity: 0.96, transform: [{ scale: 1.02 }] }, ACTIVE_CARD_SHADOW] : null}
      >
        <View className="flex-row items-center gap-2.5">
          <View className="items-center gap-0.5">
            <View
              className="w-2.5 h-2.5 rounded-full border border-white/80"
              style={{ backgroundColor: statusMeta.accent }}
            />
            <View className="w-0.5 h-2 bg-black/[0.06] rounded-[1px]" />
          </View>
          {!hasTime ? (
            <View className="flex-1 flex-row">
              <View
                className="flex-row items-center gap-1 px-2 py-0.75 rounded-md"
                style={{ backgroundColor: "rgba(255,159,10,0.10)" }}
              >
                <MaterialIconsRounded name="info-outline" size={12} color={T.warning} />
                <Text className="text-[11px] font-semibold" style={{ color: T.warning }}>
                  {timeLabel}
                </Text>
              </View>
            </View>
          ) : (
            <Text className="text-[14px] font-semibold text-[#1D1D1F] flex-1 tracking-tight" numberOfLines={1}>
              {timeLabel}
            </Text>
          )}
          <Pressable
            style={({ pressed }) => [
              pressed && { opacity: 0.5 },
            ]}
            onLongPress={drag}
            disabled={isActive}
            className="p-1 rounded-lg"
            accessibilityLabel={t("trip.timeline.dragToReorder")}
          >
            <MaterialIconsRounded name="drag-indicator" size={20} color="#C7C7CC" />
          </Pressable>
        </View>

        <View className="pl-5 gap-2.5">
          <View className="flex-row gap-3">
            <View className="w-[52px] h-[52px] rounded-[14px] overflow-hidden">
              {thumbnail ? (
                <Image
                  source={{ uri: thumbnail }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : (
                <View className="flex-1 bg-[#F5F5F7] items-center justify-center">
                  <MaterialIconsRounded name="place" size={20} color={ALPHA.iconFaint} />
                </View>
              )}
            </View>
            <View className="flex-1 gap-0.75">
              <View className="flex-row items-center gap-1.5">
                <Text className="flex-1 text-[15px] font-semibold text-[#1D1D1F] tracking-tight" numberOfLines={1}>
                  {placeName}
                </Text>
                {isVisited ? (
                  <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(52,199,89,0.12)" }}>
                    <MaterialIconsRounded name="check-circle" size={13} color={T.success} />
                    <Text className="text-[11px] font-semibold" style={{ color: T.success }}>{t("trip.timeline.visited")}</Text>
                  </View>
                ) : null}
              </View>
              {placeAddress ? (
                <Text className="text-[12px] text-black/40 font-normal tracking-tight" numberOfLines={1}>
                  {placeAddress}
                </Text>
              ) : null}
              {formatDuration(dest.durationMinutes) ? (
                <View className="flex-row items-center gap-1 mt-0.25">
                  <MaterialIconsRounded name="schedule" size={12} color={ALPHA.iconStrong} />
                  <Text className="text-[12px] text-black/40 font-normal tracking-tight">{formatDuration(dest.durationMinutes)}</Text>
                </View>
              ) : null}
              {dest.note ? (
                <Text className="text-[12px] text-black/40 font-normal italic mt-0.5 tracking-tight" numberOfLines={2}>
                  {dest.note}
                </Text>
              ) : null}
            </View>
          </View>

          {bookings?.length > 0 && (
            <View className="border-t border-black/[0.06] pt-2.5 gap-1.5">
              {bookings.slice(0, 2).map((b) => (
                <Pressable
                  key={b.id}
                  style={({ pressed }) => [
                    pressed && { opacity: 0.7 },
                  ]}
                  className="flex-row items-center gap-2 bg-[#FAFAFA] rounded-xl px-3 py-2"
                  onPress={() => onOpenBooking?.(b.id)}
                >
                  <StatusBadge status={b.status} />
                  <Text className="flex-1 text-[13px] text-[#1D1D1F] font-normal tracking-tight" numberOfLines={1}>
                    {b.serviceName || b.placeName}
                  </Text>
                  {b.totalAmount ? (
                    <Text className="text-[13px] font-semibold text-[#1D1D1F] tracking-tight">
                      {formatPrice(b.totalAmount)}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
              {bookings.length > 2 && (
                <Text className="text-[12px] text-black/40 font-normal pl-3 tracking-tight">
                  {t("trip.timeline.moreBookings", { count: bookings.length - 2 })}
                </Text>
              )}
            </View>
          )}

          <View className="flex-row items-center gap-2 mt-1">
            <Pressable
              onPress={handleViewPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [pressed && { backgroundColor: "#F2F2F7" }]}
              className="w-9 h-9 rounded-full items-center justify-center bg-white border border-black/[0.12]"
              accessibilityRole="button"
              accessibilityLabel={t("trip.timeline.viewDetail")}
            >
              <MaterialIconsRounded name="visibility" size={17} color={T.ink} />
            </Pressable>
            <Pressable
              onPress={handleMovePress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [pressed && { backgroundColor: "#F2F2F7" }]}
              className="w-9 h-9 rounded-full items-center justify-center bg-white border border-black/[0.12]"
              accessibilityRole="button"
              accessibilityLabel={t("trip.timeline.moveToDay")}
            >
              <MaterialIconsRounded name="swap-horiz" size={17} color={T.ink} />
            </Pressable>

            <View className="flex-1" />

            <Pressable
              onPress={handleEditPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [pressed && { backgroundColor: T.inkPressed }]}
              className="flex-row items-center justify-center gap-1 h-9 px-4 rounded-full bg-[#1D1D1F]"
              accessibilityRole="button"
              accessibilityLabel={t("trip.timeline.editItinerary")}
            >
              <MaterialIconsRounded name="edit" size={15} color={T.onPrimary} />
              <Text className="text-[13px] text-white font-semibold">{t("trip.timeline.edit")}</Text>
            </Pressable>
            <Pressable
              onPress={onRemove}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="w-9 h-9 rounded-full items-center justify-center"
              style={({ pressed }) => [
                { backgroundColor: "rgba(255,59,48,0.08)" },
                pressed && { opacity: 0.6 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("trip.timeline.removeFromItinerary")}
            >
              <MaterialIconsRounded name="delete-outline" size={17} color={T.danger} />
            </Pressable>
          </View>
        </View>
      </View>
    </ScaleDecorator>
  );
}

export default memo(TimelineCard);
