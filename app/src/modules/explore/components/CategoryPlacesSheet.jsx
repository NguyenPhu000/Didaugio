import { memo } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { resolvePlaceImageUri, PLACE_IMAGE_BLURHASH } from "../../../lib/media-url";
import { getPlaceLocation, formatRatingLabel } from "../utils/exploreHelpers";
import { getCategoryIconName } from "../../../constants/categoryIcons";

const SheetPlaceCard = memo(function SheetPlaceCard({ place, onPress }) {
  const { t } = useTranslation();
  const img = resolvePlaceImageUri(place);
  const location = getPlaceLocation(place);
  const rating = Number(place?.ratingAvg ?? place?.averageRating ?? 0);
  const ratingMeta = formatRatingLabel(place);
  const categoryName = place?.category?.name || t("explore.sheet.place");

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={place?.name || t("explore.sheet.place")}
      accessibilityHint={t("explore.accessibility.openPlace")}
      className="w-full rounded-[24px] bg-white border border-black/[0.06] shadow-sm elevation-2 overflow-hidden active:opacity-95 active:scale-[0.985]"
    >
      {/* 1. Hình ảnh ở trên */}
      <View className="w-full h-[160px] bg-[#F4F4F5] relative overflow-hidden">
        {img ? (
          <Image
            source={{ uri: img }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={240}
            placeholder={{ blurhash: PLACE_IMAGE_BLURHASH }}
            placeholderContentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View className="flex-1 items-center justify-center bg-[#F4F4F5]">
            <MaterialCommunityIcons
              name="image-outline"
              size={32}
              color="#9CA3AF"
            />
          </View>
        )}

        {/* Rating Badge */}
        {rating > 0 ? (
          <View className="absolute top-3 right-3 flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 shadow-sm">
            <MaterialCommunityIcons name="star" size={13} color="#F59E0B" />
            <Text className="text-[#181819] text-[12px] font-bold">
              {rating.toFixed(1)}
            </Text>
          </View>
        ) : null}

        {/* Category Pill */}
        <View className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md">
          <Text className="text-white text-[11px] font-medium">
            {categoryName}
          </Text>
        </View>
      </View>

      {/* 2. Khối thông tin ở dưới - Gom nhóm padding hợp lý */}
      <View className="p-4 bg-white">
        <Text className="text-[#181819] text-[17px] font-bold tracking-[-0.3px] mb-1" numberOfLines={1} ellipsizeMode="tail">
          {place?.name || t("explore.sheet.place")}
        </Text>

        <View className="flex-row items-center gap-1.5 mb-1">
          <MaterialCommunityIcons name="map-marker-outline" size={14} color="#6B7280" />
          <Text className="text-[#6B7280] text-[13px] font-medium flex-1" numberOfLines={1} ellipsizeMode="tail">
            {location || t("explore.header.location")}
          </Text>
        </View>

        <Text className="text-[#9CA3AF] text-[12px] font-medium mb-3" numberOfLines={1}>
          {ratingMeta}
        </Text>

        {/* Nút màu đen High-End với hiệu ứng tinh chỉnh */}
        <View className="h-11 rounded-2xl bg-[#181819] flex-row items-center justify-center gap-2 shadow-sm">
          <Text className="text-white text-[13px] font-semibold">{t("explore.sheet.openPlace")}</Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color="#FFFFFF" />
        </View>
      </View>
    </Pressable>
  );
});

export const CategoryPlacesSheet = memo(function CategoryPlacesSheet({
  visible,
  category,
  places = [],
  onClose,
  onPressPlace,
}) {
  const { t } = useTranslation();
  if (!visible) return null;

  const categoryName = category?.name || t("explore.sheet.allPlaces");
  const categoryIcon = getCategoryIconName(category);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        {/* Backdrop press to close */}
        <Pressable className="flex-1" onPress={onClose} />

        {/* Sheet Container */}
        <View className="w-full h-[85%] bg-white rounded-t-[32px] overflow-hidden shadow-2xl elevation-24 flex-col">
          {/* Top Handle Bar */}
          <View className="w-12 h-1.5 rounded-full bg-gray-300 self-center my-3" />

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pb-4 border-b border-gray-100">
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-[#ECE7DE]">
                <MaterialCommunityIcons name={categoryIcon} size={20} color="#181819" />
              </View>
              <View className="flex-1">
                <Text className="text-[19px] font-bold text-[#181819] tracking-[-0.4px]" numberOfLines={1}>
                  {categoryName}
                </Text>
                <Text className="text-[13px] font-medium text-gray-500">
                  {t("explore.sheet.placeCount", { count: places.length })}
                </Text>
              </View>
            </View>

            {/* Nút đóng X */}
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t("common.close")}
              className="w-9 h-9 rounded-full items-center justify-center bg-gray-100 active:bg-gray-200"
            >
              <MaterialIconsRounded name="close" size={20} color="#374151" />
            </Pressable>
          </View>

          {/* Body: Danh sách địa điểm */}
          <FlatList
            data={places}
            keyExtractor={(item, idx) => (item?.id ? String(item.id) : `sheet-place-${idx}`)}
            renderItem={({ item }) => (
              <SheetPlaceCard
                place={item}
                onPress={() => {
                  onClose();
                  onPressPlace(item);
                }}
              />
            )}
            contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
});
