import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BOOKING_APPLE_THEME as APPLE_THEME } from "../../../constants/design-tokens";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import {
  getPlaceLocation,
  formatRatingLabel,
} from "../utils/exploreHelpers";

const CARD_W = 164;
const CARD_H = 264;

function SmallPlaceCardInner({ place, onPress }) {
  const imageUri = resolvePlaceImageUri(place);
  const location = getPlaceLocation(place);
  const rating = Number(place?.ratingAvg ?? place?.averageRating);
  const hasRating = Number.isFinite(rating) && rating > 0;

  return (
    <Pressable
      onPress={onPress}
      style={{ width: CARD_W, height: CARD_H }}
      className="rounded-[22px] bg-white border border-black/[0.06] shadow-sm elevation-2 overflow-hidden justify-between active:opacity-90 active:scale-[0.97]"
    >
      {/* 1. Hình ảnh ở trên */}
      <View className="w-full h-[142px] bg-[#F4F4F5] relative overflow-hidden">
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            contentFit="cover"
            transition={280}
            cachePolicy="memory-disk"
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, width: "100%", height: "100%" }}
          />
        ) : (
          <View className="absolute inset-0 bg-[#F4F4F5] items-center justify-center">
            <MaterialCommunityIcons
              name="image-outline"
              size={32}
              color="#D1D5DB"
            />
          </View>
        )}
        
        {/* Rating badge góc trên-phải */}
        {hasRating ? (
          <View className="absolute top-2.5 right-2.5 flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 shadow-sm">
            <MaterialCommunityIcons name="star" size={12} color="#FBBF24" />
            <Text className="text-[#181819] text-[11px] font-bold">{rating.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>

      {/* 2. Khối Thông tin ở Dưới — Cố định layout chống đẩy card khi địa chỉ dài */}
      <View className="p-3 gap-1 bg-white">
        <Text className="text-[#181819] text-[14.5px] font-bold tracking-[-0.3px]" numberOfLines={1} ellipsizeMode="tail">
          {place?.name}
        </Text>
        
        <View className="flex-row items-center gap-1 h-[18px]">
          <MaterialCommunityIcons
            name="map-marker"
            size={12}
            color={APPLE_THEME.textMuted}
          />
          <Text className="text-[#6B7280] text-[12px] font-medium flex-1" numberOfLines={1} ellipsizeMode="tail">
            {location || "Cần Thơ"}
          </Text>
        </View>

        {/* Nút màu đen High-End */}
        <View className="mt-1.5 h-[34px] rounded-xl bg-[#181819] flex-row items-center justify-center gap-1.5">
          <Text className="text-white text-[12px] font-semibold">Khám phá</Text>
          <MaterialCommunityIcons name="arrow-right" size={14} color="#FFFFFF" />
        </View>
      </View>
    </Pressable>
  );
}

export const SmallPlaceCard = memo(SmallPlaceCardInner);
export { CARD_W as SMALL_CARD_W, CARD_H as SMALL_CARD_H };
