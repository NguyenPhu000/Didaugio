import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { TOKENS } from "../../constants/design-tokens";
import { cn } from "../../lib/cn";
import { resolvePlaceImageUri } from "../../lib/media-url";

const CARD_SHADOW = TOKENS.shadow.md;
const CARD_THEME = {
  background: "#0B1120",
  border: "rgba(255,255,255,0.08)",
  text: "#FFFFFF",
  textSecondary: "#94A3B8",
  textMuted: "#CBD5E1",
  chip: "rgba(255,255,255,0.08)",
  chipBorder: "rgba(255,255,255,0.08)",
  chipLight: "rgba(255,255,255,0.14)",
  chipLightBorder: "rgba(255,255,255,0.14)",
  heroOverlay: "rgba(0,0,0,0.72)",
  accent: "#22D3EE",
};

function MetaPill({ icon, label, light = false, action = false, onPress }) {
  const content = (
    <>
      <MaterialIcons
        name={icon}
        size={13}
        color={
          light
            ? CARD_THEME.text
            : action
              ? CARD_THEME.accent
              : CARD_THEME.textSecondary
        }
      />
      <Text
        className="text-[11px] font-semibold uppercase"
        style={{
          color: light
            ? CARD_THEME.text
            : action
              ? CARD_THEME.textMuted
              : CARD_THEME.textSecondary,
          letterSpacing: 0.7,
        }}
      >
        {label}
      </Text>
    </>
  );

  const sharedStyle = {
    backgroundColor: light ? CARD_THEME.chipLight : CARD_THEME.chip,
    borderWidth: 1,
    borderColor: light ? CARD_THEME.chipLightBorder : CARD_THEME.chipBorder,
  };

  if (action) {
    return (
      <Pressable
        onPress={onPress}
        className="flex-1 rounded-full px-3 py-3 flex-row items-center justify-center gap-2"
        style={sharedStyle}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      className="self-start rounded-full px-3 py-1.5 flex-row items-center gap-1.5"
      style={sharedStyle}
    >
      {content}
    </View>
  );
}

export function PlaceCard({ place, onSave, isSaved, style }) {
  const router = useRouter();

  const imageUri = resolvePlaceImageUri(place);
  const rating = Number(place?.ratingAvg || place?.averageRating || 0).toFixed(
    1,
  );
  const category = place?.category?.name || place?.categoryName || "";
  const address = place?.address || place?.ward?.name || "Cần Thơ";
  const district = place?.district?.name || "";
  const topChips = [category, district].filter(Boolean);

  return (
    <Pressable
      onPress={() => router.push(`/place/${place.id}`)}
      className={cn("rounded-[30px] overflow-hidden mb-4")}
      style={({ pressed }) => [
        CARD_SHADOW,
        {
          backgroundColor: CARD_THEME.background,
          borderWidth: 1,
          borderColor: CARD_THEME.border,
        },
        pressed && { transform: [{ scale: 0.985 }], opacity: 0.96 },
        style,
      ]}
    >
      <View className="relative">
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            className="w-full h-[188px]"
            contentFit="cover"
            transition={220}
          />
        ) : (
          <View className="w-full h-[188px] bg-primary-50 items-center justify-center">
            <MaterialIcons
              name="place"
              size={36}
              color={TOKENS.color.primary[500]}
            />
          </View>
        )}

        <View
          className="absolute inset-x-0 bottom-0 px-4 pt-10 pb-4"
          style={{ backgroundColor: CARD_THEME.heroOverlay }}
        />

        {onSave ? (
          <Pressable
            onPress={() => onSave(place.id)}
            hitSlop={12}
            className="absolute top-3 right-3 w-10 h-10 rounded-full items-center justify-center border border-white/60"
            style={{ backgroundColor: "rgba(0,0,0,0.28)" }}
          >
            <MaterialIcons
              name={isSaved ? "bookmark" : "bookmark-border"}
              size={22}
              color="#fff"
            />
          </Pressable>
        ) : null}

        <View className="absolute left-4 right-4 bottom-4">
          <Text
            className="text-[22px] font-bold"
            style={{ color: CARD_THEME.text }}
            numberOfLines={1}
          >
            {place?.name}
          </Text>
          <Text
            className="text-[13px] mt-1"
            style={{ color: CARD_THEME.textSecondary }}
            numberOfLines={1}
          >
            {address}
          </Text>
          {topChips.length > 0 ? (
            <View className="flex-row flex-wrap gap-2 mt-3">
              {topChips.map((chip) => (
                <MetaPill key={chip} icon="auto-awesome" label={chip} light />
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <View className="px-4 pt-4 pb-5">
        <View className="flex-row flex-wrap gap-2">
          <MetaPill icon="star" label={rating} />
          {place?.reviewCount > 0 ? (
            <MetaPill
              icon="rate-review"
              label={`${place.reviewCount} đánh giá`}
            />
          ) : null}
          {place?.viewCount > 0 ? (
            <MetaPill icon="visibility" label={`${place.viewCount}`} />
          ) : null}
        </View>

        <View className="flex-row gap-3 mt-4">
          <MetaPill
            icon="arrow-outward"
            label="chi tiết"
            action
            onPress={() => router.push(`/place/${place.id}`)}
          />
          <MetaPill
            icon={isSaved ? "bookmark" : "bookmark-border"}
            label={isSaved ? "đã lưu" : "lưu"}
            action
            onPress={
              onSave
                ? () => onSave(place.id)
                : () => router.push(`/place/${place.id}`)
            }
          />
        </View>
      </View>
    </Pressable>
  );
}
