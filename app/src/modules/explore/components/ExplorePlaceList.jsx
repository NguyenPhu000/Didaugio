import { memo, useCallback } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { TOKENS } from "../../../constants/design-tokens";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import { getPlaceLocation, formatRatingLabel } from "../utils/exploreHelpers";

const EST_ITEM_SIZE = 100;

const PlaceRow = memo(function PlaceRow({ place, onPress }) {
  const img = resolvePlaceImageUri(place);
  const location = getPlaceLocation(place);
  const rating = Number(place?.ratingAvg ?? place?.averageRating ?? 0);
  const ratingMeta = formatRatingLabel(place);

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3.5 p-3 rounded-[20px] bg-white border border-[#F3F4F6] shadow-sm elevation-1 active:opacity-90 active:scale-[0.98]"
    >
      <View className="w-20 h-20 rounded-[16px] overflow-hidden bg-[#F9FAFB] border border-[#E5E7EB] relative">
        {img ? (
          <Image
            source={{ uri: img }}
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, width: "100%", height: "100%" }}
            contentFit="cover"
            transition={180}
            cachePolicy="memory-disk"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={24}
              color="#9CA3AF"
            />
          </View>
        )}
      </View>

      <View className="flex-1 min-w-0 gap-1.5">
        <Text className="text-black text-[16.5px] font-semibold tracking-[-0.3px]" numberOfLines={1}>
          {place?.name || "Địa điểm"}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <MaterialCommunityIcons name="map-marker-outline" size={14} color="#6B7280" />
          <Text className="text-[#6B7280] text-[13px] font-medium flex-1" numberOfLines={1}>
            {location}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <MaterialCommunityIcons name="star" size={14} color="#000000" />
          <Text className="text-black text-[13px] font-medium flex-1" numberOfLines={1}>
            {rating > 0 ? `${rating.toFixed(1)} • ${ratingMeta}` : ratingMeta}
          </Text>
        </View>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color="#D1D5DB"
      />
    </Pressable>
  );
});

function ExplorePlaceListInner({
  data = [],
  loading = false,
  fetchingMore = false,
  onEndReached,
  emptyTitle = "Chưa có dữ liệu",
  emptyCopy = "Hãy thử chọn mục khác để khám phá thêm.",
}) {
  const router = useRouter();

  const renderItem = useCallback(
    ({ item }) => (
      <PlaceRow
        place={item}
        onPress={() =>
          router.push({ pathname: "/place/[id]", params: { id: item.id } })
        }
      />
    ),
    [router],
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  if (!loading && (!Array.isArray(data) || data.length === 0)) {
    return (
      <View className="flex-1 items-center justify-center px-10 gap-3">
        <MaterialCommunityIcons
          name="compass-outline"
          size={50}
          color="#D1D5DB"
        />
        <Text className="text-black text-[18px] font-semibold text-center">{emptyTitle}</Text>
        <Text className="text-[#6B7280] text-[14px] leading-5 text-center font-normal">{emptyCopy}</Text>
      </View>
    );
  }

  return (
    <FlashList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={EST_ITEM_SIZE}
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 }}
      ItemSeparatorComponent={RowSeparator}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        fetchingMore ? (
          <ActivityIndicator
            color="#000000"
            className="py-5"
          />
        ) : null
      }
    />
  );

  function RowSeparator() {
    return <View className="h-3" />;
  }
}

export const ExplorePlaceList = memo(ExplorePlaceListInner);
