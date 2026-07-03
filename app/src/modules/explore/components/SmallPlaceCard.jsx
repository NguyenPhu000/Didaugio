import { memo } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BOOKING_APPLE_THEME as APPLE_THEME, TOKENS } from "../../../constants/design-tokens";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import {
  getPlaceLocation,
  formatRatingLabel,
} from "../utils/exploreHelpers";

const CARD_W = 156;
const CARD_H = 224;

function SmallPlaceCardInner({ place, onPress }) {
  const imageUri = resolvePlaceImageUri(place);
  const location = getPlaceLocation(place);
  const rating = Number(place?.ratingAvg ?? place?.averageRating);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const ratingCap = formatRatingLabel(place);

  return (
    <Pressable
      onPress={onPress}
      style={{ width: CARD_W }}
      className="rounded-[20px] bg-white shadow-md elevation-2 active:opacity-85 active:scale-[0.97]"
    >
      <View className="w-full h-[156px] rounded-t-[20px] rounded-b-[6px] overflow-hidden bg-[#F9FAFB] border border-black/[0.02] relative">
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, width: "100%", height: "100%" }}
          />
        ) : (
          <View className="absolute inset-0 bg-[#F3F4F6] items-center justify-center">
            <MaterialCommunityIcons
              name="image-outline"
              size={32}
              color="#D1D5DB"
            />
          </View>
        )}
        
        {/* Rating badge absolutely positioned */}
        {hasRating ? (
          <View className="absolute top-2.5 right-2.5 rounded-full overflow-hidden border border-white/20">
            <BlurView intensity={80} tint="dark" style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }} />
            <View className="flex-row items-center px-2 py-1.25 gap-1">
              <MaterialCommunityIcons name="star" size={12} color="#FBBF24" />
              <Text className="text-white text-[11px] font-semibold">{rating.toFixed(1)}</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View className="pt-3 px-1 pb-3 gap-0.75">
        <Text className="text-ink text-base font-semibold leading-5 tracking-[-0.3px]" numberOfLines={1}>
          {place?.name}
        </Text>
        
        <View className="flex-row items-center gap-1">
          <MaterialCommunityIcons
            name="map-marker"
            size={12}
            color={APPLE_THEME.textMuted}
          />
          <Text className="text-ink-muted text-xs font-medium flex-1" numberOfLines={1}>
            {location}
          </Text>
        </View>

        <Text className="text-ink-muted text-[11px] font-medium mt-0.5 tracking-[-0.1px]" numberOfLines={1}>
          {ratingCap}
        </Text>
      </View>
    </Pressable>
  );
}

export const SmallPlaceCard = memo(SmallPlaceCardInner);
export { CARD_W as SMALL_CARD_W, CARD_H as SMALL_CARD_H };
