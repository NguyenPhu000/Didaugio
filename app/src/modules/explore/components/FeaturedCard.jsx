import { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { BlurView } from "expo-blur";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import Animated from "react-native-reanimated";
import { BOOKING_APPLE_THEME as APPLE_THEME, TOKENS } from "../../../constants/design-tokens";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import {
  getPlaceLocation,
  formatRatingLabel,
  formatPriceLine,
} from "../utils/exploreHelpers";
import {
  ArrowCircle,
  CREAM,
  Eyebrow,
  MetaChip,
  POSTER_INSET,
  POSTER_MEDIA_RADIUS,
  POSTER_RADIUS,
  PosterMedia,
  PosterScrim,
  STAR,
  posterShadow,
  usePressScale,
} from "./cinematic";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PAD = 24;
const CARD_H = 424;

/** Nguồn duy nhất cho bề rộng hero — FeaturedSection dùng lại để snap chính xác. */
export function getFeaturedCardWidth(screenWidth) {
  return Math.min(322, screenWidth - PAD * 2 - 24);
}

/**
 * Hero editorial. Bản cũ đặt một khối BlurView sáng ở đáy card, ăn ~35% chiều
 * cao ảnh và cắt tấm hình thành hai nửa. Ở đây chữ nằm trực tiếp trên ảnh
 * qua scrim, nên toàn bộ 424px là ảnh — đúng nghĩa cinematic.
 */
function FeaturedCardInner({ place, onPress, onSave, isSaved }) {
  const { t } = useTranslation();
  const { width: SCREEN_W } = useWindowDimensions();
  const CARD_W = getFeaturedCardWidth(SCREEN_W);
  const MEDIA_W = CARD_W - POSTER_INSET * 2;

  const rawImageUri = resolvePlaceImageUri(place);
  const location = getPlaceLocation(place);
  const rating = Number(place?.ratingAvg ?? place?.averageRating);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const ratingCap = formatRatingLabel(place);
  const priceLine = formatPriceLine(place);
  const categoryName = place?.category?.name || t("explore.card.recommended");

  const { onPressIn, onPressOut, cardStyle, mediaStyle } = usePressScale({
    to: 0.975,
    mediaTo: 1.04,
  });

  const handleSave = useCallback(() => {
    onSave?.(place);
  }, [onSave, place]);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={place?.name}
      accessibilityHint={t("explore.accessibility.openPlace")}
      style={[
        cardStyle,
        {
          width: CARD_W,
          height: CARD_H,
          padding: POSTER_INSET,
          borderRadius: POSTER_RADIUS,
          borderCurve: "continuous",
          backgroundColor: "#F7F3EB",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "rgba(11,11,12,0.06)",
          ...posterShadow,
        },
      ]}
    >
      <View
        style={{
          flex: 1,
          borderRadius: POSTER_MEDIA_RADIUS,
          borderCurve: "continuous",
          overflow: "hidden",
          backgroundColor: CREAM,
        }}
      >
        <Animated.View style={[StyleSheet.absoluteFillObject, mediaStyle]}>
          <PosterMedia uri={rawImageUri} width={MEDIA_W} />
        </Animated.View>

        {/* Grain texture overlay: tạo cảm giác film/emulsion, tránh ảnh trông
            quá "kỹ thuật số". Rất nhẹ, không ảnh hưởng readability của scrim. */}
        <View
          pointerEvents="none"
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(255,255,255,0.04)",
            opacity: 0.6,
          }}
        />

        <PosterScrim bottomHeight="62%" topHeight="26%" strength={0.82} />

        {/* Hàng chip trên: flex-row nên không còn phụ thuộc toạ độ cứng
            left-[94px] — badge dài do dịch thuật không đẩy lệch nữa. */}
        <View
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            right: 58,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <MetaChip label={t("explore.card.featuredBadge")} />
          {hasRating ? (
            <MetaChip icon="star" iconColor={STAR} label={rating.toFixed(1)} />
          ) : null}
        </View>

        {/* Save là hành động phụ nhưng vẫn cần nổi trên ảnh: blur ở đây an toàn
            vì hero rail chỉ render vài card, không phải grid dài. */}
        <Pressable
          onPress={handleSave}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t(
            isSaved ? "explore.accessibility.unsavePlace" : "explore.accessibility.savePlace",
            { name: place?.name },
          )}
          accessibilityHint={t("explore.accessibility.saveHint")}
          accessibilityState={{ selected: isSaved }}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: "rgba(255,255,255,0.34)",
          }}
        >
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
          <MaterialIconsRounded
            name={isSaved ? "favorite" : "favorite-border"}
            size={18}
            color={isSaved ? APPLE_THEME.danger : "#FFFFFF"}
          />
        </Pressable>

        <View style={{ position: "absolute", left: 18, right: 18, bottom: 18 }}>
          <Eyebrow>{categoryName}</Eyebrow>

          <Text
            style={{
              marginTop: 6,
              color: "#FFFFFF",
              fontSize: 25,
              lineHeight: 30,
              letterSpacing: -0.8,
              fontFamily: TOKENS.font.heading,
            }}
            numberOfLines={2}
          >
            {place?.name}
          </Text>

          {location ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginTop: 7,
              }}
            >
              <MaterialIconsRounded
                name="place"
                size={13}
                color="rgba(255,255,255,0.6)"
              />
              <Text
                style={{
                  flex: 1,
                  color: "rgba(255,255,255,0.74)",
                  fontSize: 12.5,
                  fontFamily: TOKENS.font.medium,
                }}
                numberOfLines={1}
              >
                {location}
              </Text>
            </View>
          ) : null}

          {/* Chân card: hairline chia meta khỏi tiêu đề, giá bên trái,
              nút tròn flush mép phải. */}
          <View
            style={{
              marginTop: 14,
              paddingTop: 13,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: "rgba(255,255,255,0.22)",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              {priceLine ? (
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 3 }}>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 18,
                      letterSpacing: -0.4,
                      fontFamily: TOKENS.font.heading,
                    }}
                  >
                    {priceLine.main}
                  </Text>
                  {priceLine.suffix ? (
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.62)",
                        fontSize: 12,
                        fontFamily: TOKENS.font.medium,
                      }}
                    >
                      {priceLine.suffix}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              <Text
                style={{
                  color: "rgba(255,255,255,0.58)",
                  fontSize: 12,
                  letterSpacing: 0.3,
                  fontFamily: TOKENS.font.semibold,
                }}
                numberOfLines={1}
              >
                {ratingCap}
              </Text>
            </View>

            <ArrowCircle size={38} tone="light" />
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export const FeaturedCard = memo(FeaturedCardInner);
export { CARD_H as FEATURED_CARD_H };
