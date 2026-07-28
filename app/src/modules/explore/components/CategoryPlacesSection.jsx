import { memo, useCallback, useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { Pressable } from "@/components/primitives/Pressable";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import {
  resolvePlaceImageUri,
  getOptimizedCloudinaryUrl,
  PLACE_IMAGE_BLURHASH,
} from "../../../lib/media-url";
import { getPlaceLocation } from "../utils/exploreHelpers";
import { getCategoryIconName } from "../../../constants/categoryIcons";

const CARD_W = 164;
const CARD_GAP = 14;
const ITEM_LENGTH = CARD_W + CARD_GAP;

const keyExtractor = (item, index) =>
  item?.id != null ? String(item.id) : `cat-place-${index}`;

function CategoryPlaceCard({ place, onPress }) {
  const rawImageUri = resolvePlaceImageUri(place);
  const imageUri = rawImageUri?.includes("res.cloudinary.com")
    ? getOptimizedCloudinaryUrl(rawImageUri, 400)
    : rawImageUri;

  const location = getPlaceLocation(place);
  const rating = Number(place?.ratingAvg ?? place?.averageRating);
  const hasRating = Number.isFinite(rating) && rating > 0;

  return (
    <Pressable
      haptic="light"
      onPress={onPress}
      className="w-[164px] h-[262px] bg-white rounded-[22px] border border-black/[0.06] p-2 shadow-sm elevation-2 justify-between active:opacity-90 active:scale-[0.97]"
    >
      {/* 1. Khối Hình Ảnh ở Trên */}
      <View className="w-full h-[148px] rounded-[16px] overflow-hidden bg-[#F4F4F5] relative">
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            contentFit="cover"
            transition={280}
            placeholder={{ blurhash: PLACE_IMAGE_BLURHASH }}
            placeholderContentFit="cover"
            cachePolicy="memory-disk"
            style={StyleSheet.absoluteFillObject}
          />
        ) : (
          <View className="flex-1 items-center justify-center bg-[#F4F4F5]">
            <MaterialIconsRounded
              name="travel-explore"
              size={32}
              color="#9CA3AF"
            />
          </View>
        )}

        {/* Rating Badge kiểu Glassmorphic góc trên phải */}
        {hasRating && (
          <View className="absolute top-2 right-2 flex-row items-center gap-1 px-2 py-1 rounded-full bg-white/92 shadow-sm elevation-1">
            <MaterialIconsRounded name="star" size={12} color="#FBBF24" />
            <Text className="text-[#181819] text-[11px] font-bold">
              {rating.toFixed(1)}
            </Text>
          </View>
        )}
      </View>

      {/* 2. Khối Thông Tin ở Dưới — Cố định layout 1 dòng */}
      <View className="mt-2.5 gap-1 px-0.5">
        <Text
          className="text-[14.5px] font-bold text-[#181819] tracking-[-0.3px]"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {place?.name}
        </Text>

        {/* Địa chỉ khống chế 1 dòng tuyệt đối */}
        <View className="flex-row items-center gap-1 h-[18px]">
          <MaterialIconsRounded name="place" size={12} color="#6B7280" />
          <Text
            className="text-[12px] font-medium text-[#6B7280] flex-1"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {location || "Cần Thơ"}
          </Text>
        </View>

        {/* Nút màu đen High-End ở đáy card */}
        <View className="mt-2 h-[34px] rounded-[12px] bg-[#181819] flex-row items-center justify-center gap-1">
          <Text className="text-white text-[12px] font-semibold">Khám phá</Text>
          <MaterialIconsRounded name="arrow-forward" size={13} color="#FFFFFF" />
        </View>
      </View>
    </Pressable>
  );
}

function ViewMoreButton({ onPress }) {
  return (
    <Pressable
      haptic="light"
      onPress={onPress}
      className="w-[164px] h-[262px] rounded-[22px] bg-[#F4F4F5] border border-black/[0.06] items-center justify-center active:opacity-85"
    >
      <View className="w-11 h-11 rounded-full items-center justify-center bg-[#181819] shadow-sm">
        <MaterialIconsRounded name="arrow-forward" size={20} color="#FFFFFF" />
      </View>
      <Text className="text-[#181819] text-[13px] font-bold mt-2">
        Xem tất cả
      </Text>
    </Pressable>
  );
}

function Separator() {
  return <View className="w-[14px]" />;
}

function CategoryPlacesSectionInner({
  categoryName,
  categoryId,
  places,
  onPressPlace,
  onPressViewAll,
  icon,
}) {
  const categoryIcon = getCategoryIconName({ name: categoryName, icon });

  const renderItem = useCallback(
    ({ item, index }) => {
      if (index === places.length) {
        return <ViewMoreButton onPress={onPressViewAll} />;
      }
      return (
        <CategoryPlaceCard place={item} onPress={() => onPressPlace(item)} />
      );
    },
    [places, onPressPlace, onPressViewAll],
  );

  const dataWithViewMore = useMemo(
    () => [...places, { id: "view-more-btn" }],
    [places],
  );

  if (!places?.length) return null;

  return (
    <View className="mt-8">
      {/* Section Header */}
      <View className="flex-row items-center justify-between px-6 mb-4">
        <View className="flex-row items-center gap-2.5 flex-1">
          <View className="w-8 h-8 rounded-full items-center justify-center bg-[#ECE7DE]">
            <MaterialCommunityIcons
              name={categoryIcon}
              size={16}
              color="#181819"
            />
          </View>
          <Text className="text-[20px] font-bold text-[#181819] tracking-[-0.5px]" numberOfLines={1}>
            {categoryName}
          </Text>
        </View>
      </View>

      {/* Danh sách cuộn ngang */}
      <FlatList
        data={dataWithViewMore}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_LENGTH}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: TAB_SCREEN_PADDING, paddingBottom: 8 }}
        ItemSeparatorComponent={Separator}
      />
    </View>
  );
}

export const CategoryPlacesSection = memo(CategoryPlacesSectionInner);
