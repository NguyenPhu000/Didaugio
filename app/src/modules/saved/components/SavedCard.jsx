import { memo, useCallback, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { MapPin, Star, Pencil, Heart } from "lucide-react-native";
import { TOKENS } from "../../../constants/design-tokens";
import { resolvePlaceImageUri } from "../../../lib/media-url";

// Tạo aspect ratio khác nhau cho mỗi card dựa trên placeId
// để tạo cảm giác masonry staggered như Pinterest
const getAspectRatioFromId = (id) => {
  const str = String(id || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  // Chia thành 4 nhóm ratio: tall, medium-tall, medium, square
  const ratios = [0.72, 0.82, 0.95, 1.1];
  return ratios[Math.abs(hash) % ratios.length];
};

export const SavedCard = memo(function SavedCard({
  entry,
  onPress,
  onOpenNote,
  onUnsave,
}) {
  const { t } = useTranslation();
  const place = entry?.place || entry;
  const imageUri = resolvePlaceImageUri(place);
  const ratingValue = Number(place?.ratingAvg ?? place?.averageRating ?? 0);
  const rating =
    Number.isFinite(ratingValue) && ratingValue > 0
      ? ratingValue.toFixed(1)
      : null;
  const note = String(entry?.note || "").trim();

  const imageAspectRatio = useMemo(
    () => getAspectRatioFromId(place?.id),
    [place?.id],
  );

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);

  const handleNotePress = useCallback(
    (e) => {
      e?.stopPropagation?.();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onOpenNote?.(entry);
    },
    [entry, onOpenNote],
  );

  const handleUnsavePress = useCallback(
    (e) => {
      e?.stopPropagation?.();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onUnsave?.(place?.id);
    },
    [place?.id, onUnsave],
  );

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      layout={Layout.duration(200)}
    >
      <Pressable
        onPress={handlePress}
        style={TOKENS.shadow.sm}
      >
        {/* Ảnh với aspect ratio khác nhau */}
        <View
          style={{
            borderRadius: TOKENS.radius.md,
            overflow: "hidden",
            backgroundColor: "#F1F1F4",
          }}
        >
          <View style={{ aspectRatio: imageAspectRatio }}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#E8E8ED",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MapPin size={28} color="#C7C7CC" strokeWidth={1.5} />
              </View>
            )}
          </View>

          {/* Nút tương tác - góc trên phải */}
          <View
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              flexDirection: "row",
              gap: 6,
            }}
          >
            <Pressable
              onPress={handleNotePress}
              hitSlop={8}
              style={{
                width: 30,
                height: 30,
                borderRadius: TOKENS.radius.full,
                backgroundColor: "rgba(255,255,255,0.85)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Pencil
                size={13}
                color={note ? "#FF9F0A" : "#636366"}
                strokeWidth={2}
              />
            </Pressable>
            <Pressable
              onPress={handleUnsavePress}
              hitSlop={8}
              style={{
                width: 30,
                height: 30,
                borderRadius: TOKENS.radius.full,
                backgroundColor: "rgba(255,255,255,0.85)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Heart size={13} color="#FF3B30" fill="#FF3B30" strokeWidth={0} />
            </Pressable>
          </View>

          {/* Note indicator - góc dưới trái */}
          {note ? (
            <View
              style={{
                position: "absolute",
                bottom: 8,
                left: 8,
                maxWidth: "70%",
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.88)",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: TOKENS.radius.sm,
                }}
              >
                <Text
                  style={{
                    fontFamily: TOKENS.font.medium,
                    fontSize: 10,
                    color: "#3A3A3D",
                  }}
                  numberOfLines={1}
                >
                  {note}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Thông tin địa điểm */}
        <View style={{ paddingTop: 8, paddingHorizontal: 2 }}>
          <Text
            style={{
              fontFamily: TOKENS.font.semibold,
              fontSize: 14,
              color: "#1C1C1E",
              lineHeight: 19,
            }}
            numberOfLines={2}
          >
            {place?.name || t("savedCard.favoritePlace")}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 3,
              gap: 3,
            }}
          >
            <MapPin size={11} color="#AEAEB2" strokeWidth={2} />
            <Text
              style={{
                fontFamily: TOKENS.font.body,
                fontSize: 12,
                color: "#8E8E93",
                flex: 1,
              }}
              numberOfLines={1}
            >
              {place?.address || t("savedCard.canThoVietnam")}
            </Text>
          </View>

          {rating && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 4,
                gap: 3,
              }}
            >
              <Star size={11} fill="#FFB800" color="#FFB800" strokeWidth={0} />
              <Text
                style={{
                  fontFamily: TOKENS.font.semibold,
                  fontSize: 12,
                  color: "#3A3A3D",
                }}
              >
                {rating}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
});

export default SavedCard;
