/**
 * PlaceCard — reusable card for displaying a place in lists.
 */
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS } from "../../constants/colors";
import { Badge } from "./Badge";
import { cn } from "../../lib/cn";

/** Native card shadow — can’t be expressed in Tailwind on RN */
const CARD_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 8,
  elevation: 3,
};

export function PlaceCard({ place, onSave, isSaved, style }) {
  const router = useRouter();

  const imageUri =
    place?.images?.[0]?.imageData || place?.images?.[0]?.url || null;
  const rating = (place?.ratingAvg || place?.averageRating || 0).toFixed(1);
  const category = place?.category?.name || place?.categoryName || "";

  return (
    <Pressable
      onPress={() => router.push(`/place/${place.id}`)}
      className={cn("bg-white rounded-2xl overflow-hidden mb-3")}
      style={({ pressed }) => [
        CARD_SHADOW,
        pressed && { transform: [{ scale: 0.99 }], opacity: 0.92 },
        style,
      ]}
    >
      {/* Thumbnail */}
      <View className="relative">
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            className="w-full h-[150px]"
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View className="w-full h-[150px] bg-slate-100 items-center justify-center">
            <MaterialIcons name="place" size={32} color={COLORS.textMuted} />
          </View>
        )}

        {/* Save button */}
        {onSave && (
          <Pressable
            onPress={() => onSave(place.id)}
            hitSlop={12}
            className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-black/35 items-center justify-center"
          >
            <MaterialIcons
              name={isSaved ? "bookmark" : "bookmark-border"}
              size={22}
              color={isSaved ? COLORS.primary : "#fff"}
            />
          </Pressable>
        )}

        {/* Category badge */}
        {category ? (
          <Badge
            variant="primary"
            style={{ position: "absolute", bottom: 10, left: 10 }}
          >
            {category}
          </Badge>
        ) : null}
      </View>

      {/* Info */}
      <View className="p-3">
        <Text className="text-sm font-bold text-ink mb-[3px]" numberOfLines={1}>
          {place?.name}
        </Text>
        <Text className="text-xs text-ink-secondary mb-1.5" numberOfLines={1}>
          {place?.address || place?.ward?.name || ""}
        </Text>

        <View className="flex-row gap-3">
          {/* Rating */}
          <View className="flex-row items-center gap-[3px]">
            <MaterialIcons name="star" size={13} color={COLORS.starFill} />
            <Text className="text-xs font-semibold text-ink">{rating}</Text>
            {place?.reviewCount > 0 && (
              <Text className="text-[11px] text-ink-muted">
                ({place.reviewCount})
              </Text>
            )}
          </View>

          {/* View count */}
          {place?.viewCount > 0 && (
            <View className="flex-row items-center gap-[3px]">
              <MaterialIcons
                name="remove-red-eye"
                size={13}
                color={COLORS.textMuted}
              />
              <Text className="text-[11px] text-ink-muted">
                {place.viewCount.toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
