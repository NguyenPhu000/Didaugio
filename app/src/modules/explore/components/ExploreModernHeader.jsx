import { memo, useCallback } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { getGreeting, getUserName } from "../utils/exploreHelpers";
import { resolveMediaUrl } from "../../../lib/media-url";
import { NotificationBell } from "../../../components/composed/NotificationBell";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = TOKENS.spring.snappy;
const SCROLL_THRESHOLD = 60;

function ExploreModernHeaderInner({ user, onPressSearch, scrollY }) {
  const searchScale = useSharedValue(1);
  const userName = getUserName(user);
  const avatarUri = resolveMediaUrl(
    user?.profile?.avatar || user?.avatar || user?.avatarURL || user?.photoURL,
  );

  const handleSearchPressIn = useCallback(() => {
    searchScale.value = withSpring(0.97, SPRING_CONFIG);
  }, [searchScale]);

  const handleSearchPressOut = useCallback(() => {
    searchScale.value = withSpring(1, SPRING_CONFIG);
  }, [searchScale]);

  const handleSearchPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressSearch?.();
  }, [onPressSearch]);

  // Title fades out and shrinks as user scrolls
  const titleAnimStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    const y = scrollY.value;
    const opacity = interpolate(y, [0, SCROLL_THRESHOLD], [1, 0], {
      extrapolateRight: "clamp",
    });
    const scale = interpolate(y, [0, SCROLL_THRESHOLD], [1, 0.92], {
      extrapolateRight: "clamp",
    });
    const translateY = interpolate(y, [0, SCROLL_THRESHOLD], [0, -12], {
      extrapolateRight: "clamp",
    });
    return {
      opacity,
      transform: [{ scale }, { translateY }],
    };
  });

  // Subtitle hides faster
  const subtitleAnimStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    const y = scrollY.value;
    const opacity = interpolate(y, [0, SCROLL_THRESHOLD * 0.6], [1, 0], {
      extrapolateRight: "clamp",
    });
    const height = interpolate(y, [0, SCROLL_THRESHOLD * 0.6], [1, 0], {
      extrapolateRight: "clamp",
    });
    return {
      opacity,
      transform: [{ scaleY: height }],
    };
  });

  // Search bar press scale
  const searchAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Top Row: User & Notification */}
      <View style={styles.topRow}>
        <View style={styles.userInfo}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarWrap}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <MaterialIcons
                  name="person"
                  size={24}
                  color={APPLE_THEME.textSoft}
                />
              )}
            </View>
          </View>
          <View>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.userNameText}>{userName}</Text>
          </View>
        </View>

        <NotificationBell size={44} />
      </View>

      {/* Title - animated */}
      <Animated.View style={[styles.titleWrap, titleAnimStyle]}>
        <Text style={styles.title}>Bạn muốn khám phá gì hôm nay?</Text>
        <Animated.Text style={[styles.subtitle, subtitleAnimStyle]}>
          Chọn danh mục, xem địa điểm nổi bật và bắt đầu hành trình tại Cần
          Thơ.
        </Animated.Text>
      </Animated.View>

      {/* Search Bar - Pill Shape with Glass Effect */}
      <AnimatedPressable
        onPress={handleSearchPress}
        onPressIn={handleSearchPressIn}
        onPressOut={handleSearchPressOut}
        style={[styles.searchBarOuter, searchAnimStyle]}
      >
        <View style={styles.searchBarGlass}>
          <BlurView
            intensity={Platform.OS === "ios" ? 40 : 20}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.searchBarInner}>
            <View style={styles.searchIconWrap}>
              <MaterialIcons
                name="search"
                size={20}
                color={APPLE_THEME.textMuted}
              />
            </View>
            <Text style={styles.searchText}>
              Tìm địa điểm, món ăn, hoạt động...
            </Text>

            {/* Location Button */}
            <View style={styles.locationButton}>
              <MaterialIcons name="place" size={14} color="#FFF" />
              <Text style={styles.locationButtonText}>Cần Thơ</Text>
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </View>
  );
}

export const ExploreModernHeader = memo(ExploreModernHeaderInner);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: APPLE_THEME.background,
  },
  /* — Top row — */
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    backgroundColor: APPLE_THEME.focusBlue,
    ...Platform.select({
      ios: {
        shadowColor: APPLE_THEME.focusBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  greetingText: {
    fontSize: 13,
    color: APPLE_THEME.textMuted,
    fontFamily: TOKENS.font.medium,
  },
  userNameText: {
    fontSize: 16,
    color: APPLE_THEME.text,
    fontFamily: TOKENS.font.semibold,
  },
  /* — Title — */
  titleWrap: {
    marginBottom: 22,
    overflow: "hidden",
  },
  title: {
    fontSize: 26,
    color: APPLE_THEME.text,
    fontFamily: TOKENS.font.heading,
    letterSpacing: -0.45,
    lineHeight: 32,
  },
  subtitle: {
    marginTop: 8,
    color: APPLE_THEME.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: TOKENS.font.medium,
  },
  /* — Search bar — */
  searchBarOuter: {
    borderRadius: 999,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 3 },
    }),
  },
  searchBarGlass: {
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
  searchBarInner: {
    flexDirection: "row",
    alignItems: "center",
    height: 54,
    paddingLeft: 14,
    paddingRight: 6,
    backgroundColor: Platform.select({
      ios: "rgba(255,255,255,0.6)",
      android: "rgba(255,255,255,0.92)",
    }),
  },
  searchIconWrap: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  searchText: {
    flex: 1,
    marginLeft: 4,
    fontSize: 15,
    color: APPLE_THEME.textMuted,
    fontFamily: TOKENS.font.medium,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: APPLE_THEME.primary,
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 999,
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: APPLE_THEME.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  locationButtonText: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
  },
});
