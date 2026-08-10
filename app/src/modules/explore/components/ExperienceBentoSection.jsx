import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import Animated from "react-native-reanimated";
import { TOKENS } from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import { getPlaceLocation } from "../utils/exploreHelpers";
import {
  CREAM,
  Eyebrow,
  POSTER_MEDIA_RADIUS,
  PosterMedia,
  PosterScrim,
  SectionHeading,
  usePressScale,
} from "./cinematic";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const BENTO_H = 344;
const TILE_GAP = 10;

function BentoTile({ place, large = false, onPress, defaultCategoryLabel, defaultExperienceLabel }) {
  const { t } = useTranslation();
  const imageUri = resolvePlaceImageUri(place);
  const category = place?.category?.name || defaultCategoryLabel;
  const location = getPlaceLocation(place);

  const { onPressIn, onPressOut, cardStyle, mediaStyle } = usePressScale({
    to: 0.975,
    mediaTo: 1.05,
  });

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={place?.name || defaultExperienceLabel}
      accessibilityHint={t("explore.accessibility.openPlace")}
      style={[
        cardStyle,
        {
          flex: large ? 1.28 : 1,
          borderRadius: POSTER_MEDIA_RADIUS + 4,
          borderCurve: "continuous",
          overflow: "hidden",
          backgroundColor: CREAM,
        },
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, mediaStyle]}>
        <PosterMedia
          uri={imageUri}
          width={large ? 420 : 260}
          fallbackIcon="restaurant"
        />
      </Animated.View>

      {/* Bản cũ phủ một lớp đen phẳng bg-black/45 lên toàn ảnh khiến hình xỉn
          màu. Scrim có hướng giữ nguyên vùng sáng phía trên. */}
      <PosterScrim
        bottomHeight={large ? "58%" : "72%"}
        topHeight="22%"
        strength={large ? 0.82 : 0.76}
        withTop={large}
      />

      <View
        style={{
          position: "absolute",
          left: large ? 15 : 12,
          right: large ? 15 : 12,
          bottom: large ? 15 : 12,
        }}
      >
        <Eyebrow>{category}</Eyebrow>

        <Text
          style={{
            marginTop: 5,
            color: "#FFFFFF",
            fontSize: large ? 24 : 15.5,
            lineHeight: large ? 29 : 19.5,
            letterSpacing: large ? -0.7 : -0.3,
            fontFamily: TOKENS.font.heading,
          }}
          numberOfLines={2}
        >
          {place?.name || defaultExperienceLabel}
        </Text>

        {large && location ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              marginTop: 6,
            }}
          >
            <MaterialIconsRounded
              name="place"
              size={12}
              color="rgba(255,255,255,0.6)"
            />
            <Text
              style={{
                flex: 1,
                color: "rgba(255,255,255,0.74)",
                fontSize: 12,
                fontFamily: TOKENS.font.medium,
              }}
              numberOfLines={1}
            >
              {location}
            </Text>
          </View>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

function ExperienceBentoSectionInner({ places, onPressPlace }) {
  const { t } = useTranslation();

  if (!Array.isArray(places) || places.length < 3) return null;

  const [hero, topRight, bottomRight] = places;
  const defaultCategoryLabel = t("explore.card.defaultCategory");
  const defaultExperienceLabel = t("explore.card.defaultExperience");

  return (
    <View style={{ paddingHorizontal: TAB_SCREEN_PADDING, marginTop: 34 }}>
      <View style={{ marginBottom: 14 }}>
        <SectionHeading title={t("explore.sections.culinary")} />
      </View>

      {/* Không còn khung trắng bọc ngoài: mỗi ô ăn thẳng ra mép content,
          rộng thêm ~20px mỗi bên so với bản cũ. Cố ý không đổ bóng —
          overflow:hidden cần cho bo góc sẽ cắt mất shadow trên iOS. */}
      <View style={{ flexDirection: "row", gap: TILE_GAP, height: BENTO_H }}>
        <BentoTile
          place={hero}
          large
          defaultCategoryLabel={defaultCategoryLabel}
          defaultExperienceLabel={defaultExperienceLabel}
          onPress={() => onPressPlace(hero)}
        />

        <View style={{ flex: 1, gap: TILE_GAP }}>
          <BentoTile
            place={topRight}
            defaultCategoryLabel={defaultCategoryLabel}
            defaultExperienceLabel={defaultExperienceLabel}
            onPress={() => onPressPlace(topRight)}
          />
          <BentoTile
            place={bottomRight}
            defaultCategoryLabel={defaultCategoryLabel}
            defaultExperienceLabel={defaultExperienceLabel}
            onPress={() => onPressPlace(bottomRight)}
          />
        </View>
      </View>
    </View>
  );
}

export const ExperienceBentoSection = memo(ExperienceBentoSectionInner);
