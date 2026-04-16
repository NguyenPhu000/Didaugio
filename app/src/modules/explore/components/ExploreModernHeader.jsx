import { memo, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import {
  getGreeting,
  getUserName,
  getWeatherLabel,
} from "../utils/exploreHelpers";

const HEADER_HEIGHT = 248;
const COLLAPSE_RANGE = 110;

function ExploreModernHeaderInner({
  user,
  scrollY,
  onPressSearch,
  rightAction,
}) {
  const greeting = useMemo(() => getGreeting(), []);
  const userName = useMemo(() => getUserName(user), [user]);
  const weatherLabel = useMemo(() => getWeatherLabel(), []);

  const blurStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 18, 44],
      [0, 0.35, 0.92],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  const titleStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, COLLAPSE_RANGE],
      [0, -18],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      scrollY.value,
      [0, COLLAPSE_RANGE],
      [1, 0.92],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateY }, { scale }] };
  });

  return (
    <Animated.View style={styles.wrap}>
      <Animated.View style={[styles.blurLayer, blurStyle]} pointerEvents="none">
        <BlurView
          intensity={Platform.OS === "ios" ? 95 : 80}
          tint="light"
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.blurTint} />
      </Animated.View>

      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <View style={styles.badgePill}>
            <MaterialIcons
              name="wb-sunny"
              size={14}
              color={APPLE_THEME.textSecondary}
            />
            <Text style={styles.badgeText}>{weatherLabel}</Text>
          </View>
          <View style={styles.badgePill}>
            <MaterialIcons
              name="handshake"
              size={14}
              color={APPLE_THEME.textSecondary}
            />
            <Text style={styles.badgeText}>
              {greeting}, {userName}
            </Text>
          </View>
        </View>

        {rightAction ? (
          <View style={styles.rightAction}>{rightAction}</View>
        ) : null}
      </View>

      <Animated.View style={[styles.titleWrap, titleStyle]}>
        <Text style={styles.title}>Khám phá</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          Gợi ý địa điểm, tour, trải nghiệm theo gu của bạn.
        </Text>
      </Animated.View>

      <View style={styles.searchWrap}>
        <Pressable
          onPress={onPressSearch}
          style={({ pressed }) => [
            styles.searchBar,
            pressed && styles.searchPressed,
          ]}
        >
          <View style={styles.searchIconWrap}>
            <MaterialIcons name="search" size={20} color={APPLE_THEME.text} />
          </View>
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            Tìm kiếm địa điểm, món ăn...
          </Text>
          <View style={styles.searchFilterWrap}>
            <MaterialIcons
              name="filter-list"
              size={18}
              color={APPLE_THEME.textSecondary}
            />
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export const ExploreModernHeader = memo(ExploreModernHeaderInner);

export const EXPLORE_HEADER_HEIGHT = HEADER_HEIGHT;

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: HEADER_HEIGHT,
    paddingHorizontal: TOKENS.space[6],
    paddingTop: 8,
    zIndex: 20,
  },
  blurLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  blurTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(245,245,247,0.94)",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    flex: 1,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 10,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: APPLE_THEME.border,
  },
  badgeText: {
    color: APPLE_THEME.textSecondary,
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 0.3,
  },
  rightAction: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  titleWrap: {
    marginTop: 12,
    gap: 5,
  },
  title: {
    color: APPLE_THEME.text,
    fontSize: 46,
    lineHeight: 52,
    letterSpacing: -1.1,
    fontFamily: TOKENS.font.heading,
  },
  subtitle: {
    color: APPLE_THEME.textSecondary,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: TOKENS.font.body,
  },
  searchWrap: {
    marginTop: 14,
    width: "100%",
    alignSelf: "stretch",
  },
  searchBar: {
    height: 52,
    borderRadius: TOKENS.radius.xl,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: APPLE_THEME.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    ...TOKENS.shadow.sm,
  },
  searchPressed: {
    opacity: 0.94,
  },
  searchIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APPLE_THEME.primaryTint,
    borderWidth: 1,
    borderColor: APPLE_THEME.border,
  },
  searchPlaceholder: {
    flex: 1,
    minWidth: 0,
    color: APPLE_THEME.text,
    fontSize: 14.5,
    fontFamily: TOKENS.font.medium,
  },
  searchFilterWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APPLE_THEME.surfaceElevated,
    borderWidth: 1,
    borderColor: APPLE_THEME.border,
  },
});
