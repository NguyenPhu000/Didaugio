import { memo, useCallback, useEffect } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import { getPlaceLocation } from "../utils/exploreHelpers";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = TOKENS.spring.press;

function BentoTile({ place, large = false, onPress, index = 0 }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const tileScale = useSharedValue(0.92);
  const imageUri = resolvePlaceImageUri(place);
  const category = place?.category?.name || "Ẩm thực";
  const location = getPlaceLocation(place);

  // Staggered entrance
  useEffect(() => {
    const delay = 150 + index * 80;
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 350 }),
    );
    tileScale.value = withDelay(
      delay,
      withSpring(1, TOKENS.spring.entrance),
    );
  }, [index, opacity, tileScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * tileScale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, SPRING_CONFIG);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle]}
      className={`overflow-hidden rounded-[20px] bg-[#EDEDF2] relative ${
        large ? "flex-[1.2]" : "flex-1"
      }`}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          contentFit="cover"
          transition={220}
          cachePolicy="memory-disk"
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, width: "100%", height: "100%" }}
        />
      ) : (
        <View className="absolute inset-0 items-center justify-center bg-[#EDEDF2]">
          <MaterialIcons
            name="restaurant"
            size={large ? 34 : 26}
            color="rgba(0,0,0,0.15)"
          />
        </View>
      )}

      {/* Cinematic overlay */}
      <View
        pointerEvents="none"
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        className={large ? "bg-black/45" : "bg-black/30"}
      />

      {/* Content */}
      <View className="absolute left-2.5 right-2.5 bottom-2.5">
        {!large ? (
          <View className="self-start px-2 h-5 rounded-full justify-center mb-1.5 bg-white/85">
            <Text className="text-[#1D1D1F] text-[10px] font-semibold tracking-[0.2px]" style={{ fontFamily: TOKENS.font.semibold }} numberOfLines={1}>
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
          {place?.name || "Trải nghiệm đặc sắc"}
        </Text>

        {large && location ? (
          <Text className="mt-0.5 text-white/75 text-[11px] font-medium" style={{ fontFamily: TOKENS.font.medium }} numberOfLines={1}>
            {location}
          </Text>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

function ExperienceBentoSectionInner({ places, onPressPlace }) {
  const sectionOpacity = useSharedValue(0);
  const sectionY = useSharedValue(24);

  useEffect(() => {
    sectionOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 400 }),
    );
    sectionY.value = withDelay(
      200,
      withSpring(0, { damping: 18, stiffness: 160 }),
    );
  }, [sectionOpacity, sectionY]);

  const sectionAnimStyle = useAnimatedStyle(() => ({
    opacity: sectionOpacity.value,
    transform: [{ translateY: sectionY.value }],
  }));

  if (!Array.isArray(places) || places.length < 3) return null;

  const [hero, topRight, bottomRight] = places;

  return (
    <Animated.View style={[sectionAnimStyle, { paddingHorizontal: TAB_SCREEN_PADDING }]} className="mt-7">
      <Text className="text-[#1D1D1F] text-[22px] leading-7 tracking-[-0.5px] font-bold mb-3.5" style={{ fontFamily: TOKENS.font.heading }}>Ẩm thực nổi bật</Text>

      <View className="rounded-[28px] p-2.5 bg-white border-[0.5px] border-[#D2D2D7] shadow-sm elevation-2">
        <View className="flex-row gap-2 h-[300px]">
          <BentoTile
            place={hero}
            large
            index={0}
            onPress={() => onPressPlace(hero)}
          />

          <View className="flex-1 gap-2">
            <BentoTile
              place={topRight}
              index={1}
              onPress={() => onPressPlace(topRight)}
            />
            <BentoTile
              place={bottomRight}
              index={2}
              onPress={() => onPressPlace(bottomRight)}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export const ExperienceBentoSection = memo(ExperienceBentoSectionInner);
