import { memo, useCallback } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  MapPin,
  Map,
  Search,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react-native";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import { PosterMedia } from "./cinematic";
import { EXPLORE_THEME as C } from "./exploreTheme";
import { TOKENS } from "../../../constants/design-tokens";

// Ảnh mặc định chợ nổi Cần Thơ ánh hoàng hôn đậm chất miền Tây
const DEFAULT_CANTHO_HERO =
  "https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?q=80&w=1200&auto=format&fit=crop";

function ExploreModernHeaderInner({
  heroPlace,
  onPressHero,
  onPressMap,
  onPressSearch,
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const heroImage = resolvePlaceImageUri(heroPlace) || DEFAULT_CANTHO_HERO;

  const mapScale = useSharedValue(1);
  const searchScale = useSharedValue(1);
  const heroScale = useSharedValue(1);

  const mapAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mapScale.value }],
  }));

  const searchAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchScale.value }],
  }));

  const heroAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }],
  }));

  const handleMapPress = useCallback(
    (e) => {
      e?.stopPropagation?.();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPressMap?.();
    },
    [onPressMap],
  );

  const handleSearchPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressSearch?.();
  }, [onPressSearch]);

  const handleHeroPress = useCallback(() => {
    if (!heroPlace) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressHero?.();
  }, [heroPlace, onPressHero]);

  return (
    <View style={styles.headerRoot}>
      {/* Khung Hero Tràn Viền (Full-Bleed Edge-to-Edge) */}
      <View style={styles.heroOuter}>
        <Animated.View style={[styles.heroContainer, heroAnimStyle]}>
          {/* Ảnh nền Cinematic sông nước */}
          <PosterMedia
            uri={heroImage}
            width={900}
            fallbackIcon="landscape"
            fallbackBackground="#1C2E2A"
            fallbackIconColor="rgba(255, 255, 255, 0.4)"
          />

          {/* Scrim Gradient bảo vệ chữ và status bar nhưng giữ trọn ánh sáng mặt trời */}
          <LinearGradient
            colors={[
              "rgba(0, 0, 0, 0.55)",
              "rgba(0, 0, 0, 0.15)",
              "rgba(14, 22, 20, 0.45)",
              "rgba(10, 16, 15, 0.88)",
            ]}
            locations={[0, 0.28, 0.65, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* 1. Thanh Vị trí & Nút Bản đồ (Nằm TRONG Hero, dưới Status Bar) */}
          <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
            {/* Location Selector (Trái) */}
            <Pressable
              onPress={onPressMap}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Chọn địa điểm Cần Thơ"
              style={styles.locationButton}
            >
              <View style={styles.locationPinWrap}>
                <MapPin size={20} color="#FFFFFF" fill="#FFFFFF" />
              </View>
              <View>
                <View style={styles.locationTitleRow}>
                  <Text style={styles.locationTitle}>Cần Thơ</Text>
                  <ChevronDown
                    size={15}
                    color="#FFFFFF"
                    strokeWidth={2.4}
                    style={styles.chevronIcon}
                  />
                </View>
                <Text style={styles.locationSubtitle}>
                  Khám phá vùng đất Tây Đô
                </Text>
              </View>
            </Pressable>

            {/* Map Action Button (Phải - Nút tròn trắng/kem chuẩn screenshot) */}
            <Pressable
              onPress={handleMapPress}
              onPressIn={() => {
                mapScale.value = withSpring(0.92, TOKENS.spring.press);
              }}
              onPressOut={() => {
                mapScale.value = withSpring(1, TOKENS.spring.press);
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t("explore.header.openMap", "Mở bản đồ Cần Thơ")}
              style={styles.mapBtnWrap}
            >
              <Animated.View style={[styles.mapCircle, mapAnimStyle]}>
                <Map size={21} color="#A46C25" strokeWidth={2.2} />
              </Animated.View>
            </Pressable>
          </View>

          {/* 2. Tiêu đề Editorial & Cảm xúc du lịch (Giữa & Dưới Hero) */}
          <Pressable
            onPress={heroPlace ? handleHeroPress : undefined}
            disabled={!heroPlace}
            style={styles.editorialContent}
          >
            {/* Dấu gạch vàng phía trên trái */}
            <View style={styles.goldDashTop} />

            {/* "Trải nghiệm —" kèm dấu gạch vàng ngang */}
            <View style={styles.eyebrowRow}>
              <Text style={styles.eyebrowText}>Trải nghiệm</Text>
              <View style={styles.goldDashInline} />
            </View>

            {/* Headline chính Display Serif cao cấp */}
            <Text style={styles.mainHeadline}>
              {"Miền Tây\nđậm chất thật"}
            </Text>

            {/* Đoạn mô tả giàu cảm hứng */}
            <Text style={styles.bodyDescription}>
              Từ chợ nổi sông nước đến những điểm đến bình yên, gần gũi và đầy cảm hứng.
            </Text>
          </Pressable>

          {/* 3. Thanh Tìm kiếm dạng Viên thuốc Pill (Nằm gọn dưới đáy Hero) */}
          <View style={styles.searchContainer}>
            <Pressable
              onPress={handleSearchPress}
              onPressIn={() => {
                searchScale.value = withSpring(0.985, TOKENS.spring.press);
              }}
              onPressOut={() => {
                searchScale.value = withSpring(1, TOKENS.spring.press);
              }}
              accessibilityRole="button"
              accessibilityLabel="Tìm địa điểm, món ăn, hoạt động..."
              style={styles.searchPressable}
            >
              <Animated.View style={[styles.searchPill, searchAnimStyle]}>
                <Search size={19} color="#2C2C2E" strokeWidth={2.2} />
                <Text style={styles.searchPlaceholder} numberOfLines={1}>
                  Tìm địa điểm, món ăn, hoạt động...
                </Text>
                <SlidersHorizontal
                  size={18}
                  color="#2C2C2E"
                  strokeWidth={2.2}
                />
              </Animated.View>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRoot: {
    backgroundColor: C.background,
    marginBottom: 8,
  },
  heroOuter: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
    backgroundColor: "#181819",
  },
  heroContainer: {
    minHeight: 440,
    justifyContent: "space-between",
  },
  topBar: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationPinWrap: {
    marginTop: 1,
  },
  locationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationTitle: {
    fontFamily: C.font.bold,
    fontSize: 18,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  chevronIcon: {
    marginTop: 2,
  },
  locationSubtitle: {
    fontFamily: C.font.medium,
    fontSize: 11.5,
    color: "rgba(255, 255, 255, 0.82)",
    letterSpacing: -0.1,
    marginTop: 1,
  },
  mapBtnWrap: {
    zIndex: 20,
  },
  mapCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF8EE",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  editorialContent: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 6,
    zIndex: 5,
  },
  goldDashTop: {
    width: 22,
    height: 2.5,
    backgroundColor: "#D4A359",
    borderRadius: 1.5,
    marginBottom: 10,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  eyebrowText: {
    fontFamily: Platform.select({
      ios: "Georgia",
      android: "serif",
      default: C.font.semibold,
    }),
    fontSize: 17,
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  goldDashInline: {
    width: 24,
    height: 2,
    backgroundColor: "#D4A359",
    borderRadius: 1,
  },
  mainHeadline: {
    fontFamily: Platform.select({
      ios: "Georgia-Bold",
      android: "serif",
      default: C.font.displayBold,
    }),
    fontSize: 37,
    lineHeight: 41,
    color: "#FFFFFF",
    letterSpacing: -0.6,
    marginTop: 2,
  },
  bodyDescription: {
    fontFamily: C.font.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: "rgba(255, 255, 255, 0.88)",
    marginTop: 10,
    maxWidth: 320,
    letterSpacing: -0.1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 22,
    paddingTop: 12,
    zIndex: 15,
  },
  searchPressable: {
    width: "100%",
  },
  searchPill: {
    height: 52,
    borderRadius: 9999,
    borderCurve: "continuous",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    gap: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: C.font.body,
    fontSize: 14,
    color: "#8E8E93",
    letterSpacing: -0.1,
  },
});

export const ExploreModernHeader = memo(ExploreModernHeaderInner);


