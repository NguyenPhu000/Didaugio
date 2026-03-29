import { Pressable, View, Text } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/cn";
import { TOKENS, CATEGORY_COLORS } from "../../constants/design-tokens";
import { QUERY_KEYS } from "../../constants/query-keys";
import { resolvePlaceImageUri } from "../../lib/media-url";

const CARD_SHADOW = TOKENS.shadow.md;

function getImageSource(place) {
  return resolvePlaceImageUri(place);
}

function getCategorySlug(place) {
  return place?.category?.slug ?? place?.categorySlug ?? "default";
}

export function PlaceCard({ place, onSave, isSaved, style }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const thumbnailUri = getImageSource(place);
  const rating = Number(place?.ratingAvg ?? place?.averageRating ?? 0).toFixed(
    1,
  );
  const category = place?.category?.name ?? place?.categoryName ?? "";
  const categorySlug = getCategorySlug(place);
  const placeholderColor =
    CATEGORY_COLORS[categorySlug] ?? CATEGORY_COLORS.default;

  const handlePressIn = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.places.detail(place.id),
      staleTime: 1000 * 60 * 5,
    });
  };

  return (
    <Pressable
      onPress={() => router.push(`/place/${place.id}`)}
      onPressIn={handlePressIn}
      className={cn(
        "bg-white rounded-[28px] overflow-hidden border border-slate-100 mb-4",
      )}
      style={({ pressed }) => [
        CARD_SHADOW,
        pressed && { transform: [{ scale: 0.985 }], opacity: 0.96 },
        style,
      ]}
    >
      <View className="relative">
        {thumbnailUri ? (
          <Image
            source={{ uri: thumbnailUri }}
            placeholder={{ color: `${placeholderColor}22` }}
            contentFit="cover"
            transition={220}
            cachePolicy="memory-disk"
            className="w-full h-[188px]"
          />
        ) : (
          <View
            className="w-full h-[188px] items-center justify-center"
            style={{ backgroundColor: `${placeholderColor}22` }}
          >
            <MaterialIcons name="place" size={36} color={placeholderColor} />
          </View>
        )}

        <View
          className="absolute left-0 right-0 bottom-0 h-20"
          style={{ backgroundColor: "rgba(15,23,42,0.18)" }}
        />

        {onSave ? (
          <Pressable
            onPress={() => onSave(place.id)}
            hitSlop={12}
            className="absolute top-3 right-3 w-10 h-10 rounded-full items-center justify-center border border-white/60"
            style={{ backgroundColor: "rgba(255,255,255,0.24)" }}
          >
            <MaterialIcons
              name={isSaved ? "bookmark" : "bookmark-border"}
              size={22}
              color="#fff"
            />
          </Pressable>
        ) : null}

        {category ? (
          <Badge
            variant="primary"
            style={{ position: "absolute", bottom: 14, left: 14 }}
          >
            {category}
          </Badge>
        ) : null}
      </View>

      <View className="px-4 pt-4 pb-4">
        <Text className="text-[18px] font-bold text-ink mb-1" numberOfLines={1}>
          {place?.name}
        </Text>
        <Text
          className="text-[13px] text-ink-secondary leading-5"
          numberOfLines={1}
        >
          {place?.address ?? place?.ward?.name ?? ""}
        </Text>

        <View className="flex-row items-center gap-3 mt-3">
          <View className="flex-row items-center gap-1">
            <MaterialIcons name="star" size={15} color={TOKENS.color.warning} />
            <Text className="text-[13px] font-semibold text-ink">{rating}</Text>
          </View>

          {place?.reviewCount > 0 ? (
            <Text className="text-[12px] text-ink-muted">
              {place.reviewCount} đánh giá
            </Text>
          ) : null}

          {place?.viewCount > 0 ? (
            <View className="flex-row items-center gap-1">
              <MaterialIcons
                name="remove-red-eye"
                size={14}
                color={TOKENS.color.neutral[400]}
              />
              <Text className="text-[12px] text-ink-muted">
                {place.viewCount.toLocaleString()}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
