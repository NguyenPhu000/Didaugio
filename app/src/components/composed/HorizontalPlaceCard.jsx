import React, { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Star, MapPin } from "lucide-react-native";
import { resolvePlaceImageUri } from "../../lib/media-url";
import { TOKENS } from "../../constants/design-tokens";

const PRICE_RANGE_LABELS = {
  FREE: "Miễn phí",
  BUDGET: "Bình dân",
  MODERATE: "Trung bình",
  EXPENSIVE: "Cao cấp",
  LUXURY: "Sang trọng",
};

const formatCompactPrice = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  if (parsed >= 1_000_000) {
    return `${(parsed / 1_000_000).toFixed(1).replace(/\.0$/, "")} triệu`;
  }
  if (parsed >= 1000) {
    return `${Math.round(parsed / 1000)}k`;
  }
  return `${parsed}đ`;
};

const getPreviewPriceLabel = (place) => {
  const compactFrom = formatCompactPrice(place?.priceFrom ?? place?.price_from);
  if (compactFrom) return `Từ ${compactFrom}`;

  const priceRangeKey = String(place?.priceRange || "").toUpperCase();
  return PRICE_RANGE_LABELS[priceRangeKey] || "Liên hệ";
};

export const HorizontalPlaceCard = memo(({ place, onPressDetail }) => {
  if (!place) return null;

  const previewImg = resolvePlaceImageUri(place);
  const rating = Number(place?.ratingAvg ?? place?.averageRating ?? 0);
  const priceLabel = getPreviewPriceLabel(place);
  const locationLabel =
    place?.address ||
    [place?.ward?.name, place?.district?.name].filter(Boolean).join(", ") ||
    "Cần Thơ";

  // Rút gọn địa chỉ
  const shortAddress = locationLabel.length > 28 
    ? locationLabel.substring(0, 26) + "..." 
    : locationLabel;

  return (
    <Pressable 
      onPress={() => onPressDetail && onPressDetail(place.id)}
      className="bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm mr-3"
      style={styles.card}
    >
      {/* Container Ảnh */}
      <View className="relative w-full h-32 bg-zinc-100">
        {previewImg ? (
          <Image
            source={{ uri: previewImg }}
            style={StyleSheet.absoluteFillObject}
            transition={200}
            contentFit="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center bg-zinc-200">
            <Text className="text-zinc-400 text-xs">Không có ảnh</Text>
          </View>
        )}
        {/* Tag danh mục */}
        <View className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded-full">
          <Text className="text-[10px] text-white font-medium">
            {place.categoryName || place.category?.name || "Địa điểm"}
          </Text>
        </View>
      </View>

      {/* Nội dung thông tin */}
      <View className="p-3 justify-between flex-1">
        <View>
          {/* Tên địa điểm */}
          <Text className="text-zinc-900 text-sm font-semibold tracking-tight mb-1" numberOfLines={1}>
            {place.name}
          </Text>

          {/* Vị trí */}
          <View className="flex-row items-center gap-1 mb-2">
            <MapPin size={11} color="#71717a" />
            <Text className="text-zinc-500 text-[11px]" numberOfLines={1}>
              {shortAddress}
            </Text>
          </View>
        </View>

        {/* Footer: Giá & Rating */}
        <View className="flex-row items-center justify-between mt-1 pt-2 border-t border-zinc-50">
          <Text className="text-zinc-900 text-xs font-semibold">
            {priceLabel}
          </Text>
          
          <View className="flex-row items-center gap-0.5">
            <Star size={12} color="#f59e0b" fill="#f59e0b" />
            <Text className="text-zinc-800 text-xs font-semibold">
              {rating > 0 ? rating.toFixed(1) : "—"}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 256, // tương đương w-64
    height: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  }
});
