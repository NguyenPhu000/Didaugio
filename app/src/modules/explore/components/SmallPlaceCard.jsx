import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import Animated from "react-native-reanimated";
import { TOKENS } from "../../../constants/design-tokens";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import { getPlaceLocation } from "../utils/exploreHelpers";
import {
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

/** Cùng khuôn với card rail ở Explore để hai màn hình đọc như một hệ. */
const CARD_W = 212;
const CARD_H = 282;
const MEDIA_W = CARD_W - POSTER_INSET * 2;

function SmallPlaceCardInner({ place, onPress }) {
  const imageUri = resolvePlaceImageUri(place);
  const location = getPlaceLocation(place);
  const rating = Number(place?.ratingAvg ?? place?.averageRating);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const categoryName = place?.category?.name;

  const { onPressIn, onPressOut, cardStyle, mediaStyle } = usePressScale();

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        cardStyle,
        {
          width: CARD_W,
          height: CARD_H,
          padding: POSTER_INSET,
          borderRadius: POSTER_RADIUS,
          borderCurve: "continuous",
          backgroundColor: "#FFFFFF",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "rgba(11,11,12,0.08)",
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
          <PosterMedia uri={imageUri} width={MEDIA_W} />
        </Animated.View>

        <PosterScrim bottomHeight="66%" topHeight="30%" strength={0.88} />

        {hasRating ? (
          <View style={{ position: "absolute", top: 10, right: 10 }}>
            <MetaChip icon="star" iconColor={STAR} label={rating.toFixed(1)} compact />
          </View>
        ) : null}

        <View style={{ position: "absolute", left: 13, right: 13, bottom: 13, gap: 3 }}>
          {categoryName ? <Eyebrow>{categoryName}</Eyebrow> : null}

          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 16.5,
              lineHeight: 21,
              letterSpacing: -0.4,
              fontFamily: TOKENS.font.heading,
            }}
            numberOfLines={2}
          >
            {place?.name}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 1 }}>
            <MaterialIconsRounded name="place" size={12} color="rgba(255,255,255,0.62)" />
            <Text
              style={{
                flex: 1,
                color: "rgba(255,255,255,0.72)",
                fontSize: 11.5,
                fontFamily: TOKENS.font.medium,
              }}
              numberOfLines={1}
            >
              {location}
            </Text>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export const SmallPlaceCard = memo(SmallPlaceCardInner);
export { CARD_W as SMALL_CARD_W, CARD_H as SMALL_CARD_H };
