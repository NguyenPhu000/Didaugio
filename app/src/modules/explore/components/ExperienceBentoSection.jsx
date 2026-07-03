import { memo, useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import * as Haptics from "expo-haptics";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import { getPlaceLocation } from "../utils/exploreHelpers";

function BentoTile({ place, large = false, onPress, defaultCategoryLabel, defaultExperienceLabel }) {
  const imageUri = resolvePlaceImageUri(place);
  const category = place?.category?.name || defaultCategoryLabel;
  const location = getPlaceLocation(place);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        { borderCurve: "continuous", opacity: pressed ? 0.92 : 1 },
      ]}
      className={`overflow-hidden rounded-[20px] relative ${
        large ? "flex-[1.2]" : "flex-1"
      }`}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          contentFit="cover"
          transition={220}
          cachePolicy="memory-disk"
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />
      ) : (
        <View
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: APPLE_THEME.surfaceMuted }}
        >
          <MaterialIconsRounded
            name="restaurant"
            size={large ? 34 : 26}
            color={APPLE_THEME.textMuted}
          />
        </View>
      )}

      <View
        pointerEvents="none"
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        className={large ? "bg-black/45" : "bg-black/30"}
      />

      <View className="absolute left-2.5 right-2.5 bottom-2.5">
        {!large ? (
          <View
            className="self-start px-2 h-5 rounded-full justify-center mb-1.5"
            style={{ backgroundColor: "rgba(255,255,255,0.88)" }}
          >
            <Text
              className="text-[10px] font-semibold tracking-[0.2px]"
              style={{ color: APPLE_THEME.text, fontFamily: TOKENS.font.semibold }}
              numberOfLines={1}
            >
              {category}
            </Text>
          </View>
        ) : null}

        <Text
          className={`text-white tracking-[-0.3px] font-bold ${
            large ? "text-[26px] leading-[30px]" : "text-[17px] leading-[21px]"
          }`}
          style={{ fontFamily: TOKENS.font.heading }}
          numberOfLines={2}
        >
          {place?.name || defaultExperienceLabel}
        </Text>

        {large && location ? (
          <Text
            className="mt-0.5 text-[11px] font-medium"
            style={{ color: "rgba(255,255,255,0.75)", fontFamily: TOKENS.font.medium }}
            numberOfLines={1}
          >
            {location}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function ExperienceBentoSectionInner({ places, onPressPlace }) {
  const { t } = useTranslation();

  if (!Array.isArray(places) || places.length < 3) return null;

  const [hero, topRight, bottomRight] = places;
  const defaultCategoryLabel = t("explore.card.defaultCategory");
  const defaultExperienceLabel = t("explore.card.defaultExperience");

  return (
    <View
      style={{ paddingHorizontal: TAB_SCREEN_PADDING }}
      className="mt-7"
    >
      <View className="flex-row items-center gap-2.5 mb-3.5">
        <View
          className="w-1 h-6 rounded-full"
          style={{ backgroundColor: APPLE_THEME.focusBlue }}
        />
        <Text
          className="text-[22px] leading-7 tracking-[-0.5px] font-bold"
          style={{ color: APPLE_THEME.text, fontFamily: TOKENS.font.heading }}
        >
          {t("explore.sections.culinary")}
        </Text>
      </View>

      <View
        className="rounded-[28px] p-2.5 bg-white border-[0.5px]"
        style={{ borderColor: APPLE_THEME.border, ...TOKENS.shadow.sm }}
      >
        <View className="flex-row gap-2 h-[300px]">
          <BentoTile
            place={hero}
            large
            defaultCategoryLabel={defaultCategoryLabel}
            defaultExperienceLabel={defaultExperienceLabel}
            onPress={() => onPressPlace(hero)}
          />

          <View className="flex-1 gap-2">
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
    </View>
  );
}

export const ExperienceBentoSection = memo(ExperienceBentoSectionInner);
