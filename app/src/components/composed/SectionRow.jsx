import { memo, useCallback } from "react";
import {
  FlatList,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { cn } from "../../lib/cn";
import { GLASS_THEME, TOKENS } from "../../constants/design-tokens";
import { resolvePlaceImageUri } from "../../lib/media-url";

const CARD_WIDTH = 160;
const CARD_HEIGHT = 200;
const CARD_WIDTH_COMPACT = 146;
const CARD_HEIGHT_COMPACT = 188;

const PlaceCardBase = memo(function PlaceCardBase({
  place,
  onPressPlace,
  variant,
}) {
  const imgUri = resolvePlaceImageUri(place);
  const placeId = place?.id;
  const rating = Number(place?.ratingAvg ?? place?.averageRating ?? 0);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const location =
    place?.district?.name || place?.ward?.name || place?.address || "Cần Thơ";
  const handlePress = useCallback(() => {
    if (placeId != null) {
      onPressPlace(placeId);
    }
  }, [onPressPlace, placeId]);

  return (
    <Pressable
      onPress={handlePress}
      className={cn(
        "rounded-[20px] overflow-hidden bg-white border border-primary-200/95",
        variant.compact && "rounded-[18px]",
      )}
      style={({ pressed }) => [
        variant.sizeStyle,
        pressed && { opacity: 0.92, transform: [{ scale: 0.97 }] },
        {
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 14,
          elevation: 6,
        },
      ]}
    >
      {imgUri ? (
        <Image
          source={{ uri: imgUri }}
          className="w-full h-full"
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={180}
        />
      ) : (
        <View className="flex-1 bg-blue-100 items-center justify-center">
          <MaterialIconsRounded name="place" size={36} color="#60A5FA" />
        </View>
      )}

      <View className="absolute left-0 right-0 top-0 h-[52%] bg-ink/10" />

      <View
        className={cn(
          "absolute left-2 right-2 bottom-2 rounded-[14px] px-2.5 py-2 gap-1 bg-white/95 border border-blue-200/88",
          variant.compact && "rounded-xl px-2 py-[7px] gap-[3px]",
        )}
      >
        <Text
          className={cn(
            "text-ink font-semibold text-xs",
            variant.compact && "text-[11px]",
          )}
          numberOfLines={1}
        >
          {place?.name}
        </Text>

        <View className="flex-row items-center gap-[3px]">
          <MaterialIconsRounded name="place" size={variant.iconSize} color="#2563EB" />
          <Text
            numberOfLines={1}
            className={cn(
              "flex-1 text-slate-500 font-medium text-[10px]",
              variant.compact && "text-[9.5px]",
            )}
          >
            {location}
          </Text>
        </View>

        {hasRating ? (
          <View
            className={cn(
              "self-start h-5 rounded-full px-[7px] flex-row items-center gap-[3px] bg-amber-50 border border-amber-300",
              variant.compact && "h-[18px] px-1.5",
            )}
          >
            <MaterialIconsRounded
              name="star"
              size={variant.iconSize}
              color="#F59E0B"
            />
            <Text
              className={cn(
                "text-amber-800 font-semibold text-[10px]",
                variant.compact && "text-[9px]",
              )}
            >
              {rating.toFixed(1)}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

const StandardPlaceCard = memo(function StandardPlaceCard({
  place,
  onPressPlace,
}) {
  return (
    <PlaceCardBase
      place={place}
      onPressPlace={onPressPlace}
      variant={STANDARD_CARD_VARIANT}
    />
  );
});

const CompactPlaceCard = memo(function CompactPlaceCard({
  place,
  onPressPlace,
}) {
  return (
    <PlaceCardBase
      place={place}
      onPressPlace={onPressPlace}
      variant={COMPACT_CARD_VARIANT}
    />
  );
});

export function SectionRow({ title, data = [], onSeeAll, loading = false }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const CardComponent = compact ? CompactPlaceCard : StandardPlaceCard;
  const cardWidth = compact ? CARD_WIDTH_COMPACT : CARD_WIDTH;
  const cardHeight = compact ? CARD_HEIGHT_COMPACT : CARD_HEIGHT;

  const handlePressPlace = useCallback(
    (placeId) => {
      router.push(`/place/${placeId}`);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <CardComponent place={item} onPressPlace={handlePressPlace} />
    ),
    [CardComponent, handlePressPlace],
  );

  if (!loading && data.length === 0) return null;

  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center px-5 mb-3">
        <Text className="text-white text-xl font-bold">{title}</Text>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={8}>
            <Text style={{ color: GLASS_THEME.neon }} className="text-[13px] font-semibold">
              Xem tất cả
            </Text>
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <View className="px-5 flex-row gap-3">
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              className={cn(
                "bg-blue-50 border border-blue-200",
                compact ? "rounded-[18px]" : "rounded-[20px]",
              )}
              style={{ width: cardWidth, height: cardHeight }}
            />
          ))}
        </View>
      ) : (
        <FlatList
          horizontal
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        />
      )}
    </View>
  );
}

const STANDARD_CARD_SIZE = Object.freeze({
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
});

const COMPACT_CARD_SIZE = Object.freeze({
  width: CARD_WIDTH_COMPACT,
  height: CARD_HEIGHT_COMPACT,
});

const STANDARD_CARD_VARIANT = Object.freeze({
  compact: false,
  sizeStyle: STANDARD_CARD_SIZE,
  iconSize: 12,
});

const COMPACT_CARD_VARIANT = Object.freeze({
  compact: true,
  sizeStyle: COMPACT_CARD_SIZE,
  iconSize: 11,
});
