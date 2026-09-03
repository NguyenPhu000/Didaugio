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
  INK,
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

      {/* Grain texture để ảnh editorial có cảm giác film, không quá digital. */}
      <View
        pointerEvents="none"
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(255,255,255,0.05)",
          opacity: 0.55,
        }}
      />

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
    <View style={{ paddingHorizontal: TAB_SCREEN_PADDING, marginTop: 38 }}>
      <View style={{ marginBottom: 18 }}>
        <SectionHeading
          title={t("explore.sections.culinary")}
          right={
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingHorizontal: 11,
                height: 26,
                borderRadius: 13,
                backgroundColor: "rgba(11,11,12,0.04)",
                borderWidth: 1,
                borderColor: "rgba(11,11,12,0.07)",
              }}
            >
              <MaterialIconsRounded
                name="auto-awesome"
                size={13}
                color={INK}
              />
              <Text
                style={{
                  color: INK,
                  fontSize: 11,
                  fontFamily: TOKENS.font.semibold,
                  letterSpacing: 0.2,
                }}
              >
                {t("explore.bento.curated", { defaultValue: "Tuyển chọn" })}
              </Text>
            </View>
          }
        />
      </View>

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
