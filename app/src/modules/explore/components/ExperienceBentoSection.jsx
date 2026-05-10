import { memo, useCallback, useEffect } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
      style={[styles.tileBase, large ? styles.tileLarge : styles.tileSmall, animatedStyle]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          contentFit="cover"
          transition={220}
          cachePolicy="memory-disk"
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <View style={styles.placeholder}>
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
        style={[
          styles.overlayBase,
          large ? styles.overlayLarge : styles.overlaySmall,
        ]}
      />

      {/* Content */}
      <View style={styles.contentWrap}>
        {!large ? (
          <View style={styles.pillMini}>
            <Text style={styles.pillMiniText} numberOfLines={1}>
              {category}
            </Text>
          </View>
        ) : null}

        <Text
          style={[styles.title, large ? styles.titleLarge : styles.titleSmall]}
          numberOfLines={2}
        >
          {place?.name || "Trải nghiệm đặc sắc"}
        </Text>

        {large && location ? (
          <Text style={styles.subtitle} numberOfLines={1}>
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
    <Animated.View style={[styles.container, sectionAnimStyle]}>
      <Text style={styles.heading}>Ẩm thực nổi bật</Text>

      <View style={styles.glassShell}>
        <View style={styles.grid}>
          <BentoTile
            place={hero}
            large
            index={0}
            onPress={() => onPressPlace(hero)}
          />

          <View style={styles.sideColumn}>
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

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
    paddingHorizontal: TAB_SCREEN_PADDING,
  },
  heading: {
    color: APPLE_THEME.text,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.5,
    fontFamily: TOKENS.font.heading,
    marginBottom: 14,
  },
  glassShell: {
    borderRadius: 28,
    padding: 10,
    backgroundColor: APPLE_THEME.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APPLE_THEME.border,
    ...Platform.select({
      ios: TOKENS.shadow.sm,
      android: { elevation: 2 },
    }),
  },
  grid: {
    flexDirection: "row",
    gap: 8,
    height: 300,
  },
  sideColumn: {
    flex: 1,
    gap: 8,
  },
  tileBase: {
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: APPLE_THEME.surfaceMuted,
    position: "relative",
  },
  tileLarge: {
    flex: 1.2,
  },
  tileSmall: {
    flex: 1,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APPLE_THEME.surfaceMuted,
  },
  overlayBase: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayLarge: {
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  overlaySmall: {
    backgroundColor: "rgba(0,0,0,0.30)",
  },
  contentWrap: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
  },
  pillMini: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 999,
    justifyContent: "center",
    marginBottom: 5,
    backgroundColor: "rgba(255,255,255,0.88)",
  },
  pillMiniText: {
    color: APPLE_THEME.text,
    fontSize: 10,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 0.2,
  },
  title: {
    color: "#FFFFFF",
    letterSpacing: -0.3,
    fontFamily: TOKENS.font.heading,
  },
  titleLarge: {
    fontSize: 26,
    lineHeight: 30,
  },
  titleSmall: {
    fontSize: 17,
    lineHeight: 21,
  },
  subtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.76)",
    fontSize: 11,
    fontFamily: TOKENS.font.medium,
  },
});
