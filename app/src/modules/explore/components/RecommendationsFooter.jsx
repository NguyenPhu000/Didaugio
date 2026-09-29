import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowUpRight, Check, ChevronDown, MapPin, Navigation } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { EXPLORE_THEME as C } from "./exploreTheme";

/* Vòng sóng định vị quanh đích đến trên thẻ bản đồ */
function PulseRing() {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pulseRing,
        {
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
          transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.85] }) }],
        },
      ]}
    />
  );
}

/* Họa tiết đường đồng mức trên nền bản đồ */
function ContourLines() {
  return (
    <View pointerEvents="none" style={styles.contourWrap}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[
            styles.contourCircle,
            {
              width: 120 + i * 62,
              height: 120 + i * 62,
              right: -70 - i * 26,
              top: -30 - i * 22,
            },
          ]}
        />
      ))}
    </View>
  );
}

/* Section nổi chuẩn UI hệ thống: Bao trọn Header + Khám phá bản đồ + Phân trang */
export function RecommendationsFooter({
  loadedCount,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onOpenMap,
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.sectionCard}>
      {/* 1. Header của section nổi */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <View style={styles.badgeRow}>
            <MapPin size={13} color={C.gold} />
            <Text style={styles.badgeText}>
              {t("explore.sections.recommendedForYou", "Gợi ý tiếp theo")}
            </Text>
          </View>
          <Text style={styles.title}>
            {t("explore.recommendationsFooter.title")}
          </Text>
          <Text style={styles.subtitle}>
            {t("explore.recommendationsFooter.loaded", { count: loadedCount })}
          </Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{loadedCount}</Text>
        </View>
      </View>

      {/* 2. Thẻ bản đồ tương tác trung tâm */}
      <Pressable
        onPress={onOpenMap}
        accessibilityRole="button"
        accessibilityLabel={t("explore.recommendationsFooter.openMap")}
        style={({ pressed }) => [
          styles.mapCard,
          pressed && styles.cardPressed,
        ]}
      >
        <LinearGradient
          colors={["#1C1E20", "#101113", "#0A0B0B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <ContourLines />

        {/* Quầng sáng điểm đến màu vàng đồng */}
        <LinearGradient
          colors={["rgba(212,163,89,0.25)", "rgba(212,163,89,0)"]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          pointerEvents="none"
          style={styles.glow}
        />

        {/* Highlight mảnh mép trên */}
        <View pointerEvents="none" style={styles.topHighlight} />

        <View style={styles.mapInner}>
          {/* Lộ trình định vị GPS */}
          <View style={styles.routeCol} accessibilityElementsHidden>
            <View style={styles.routeOriginDot} />
            <View style={styles.routeDash} />
            <View style={styles.routeTargetWrap}>
              <PulseRing />
              <View style={styles.routeTargetIcon}>
                <Navigation size={12} color="#181819" fill="#181819" strokeWidth={2.4} />
              </View>
            </View>
          </View>

          <View style={styles.mapTextCol}>
            <Text style={styles.mapTitle} numberOfLines={1}>
              {t("explore.recommendationsFooter.mapTitle")}
            </Text>
            <Text style={styles.mapDesc} numberOfLines={2}>
              {t("explore.recommendationsFooter.mapDescription")}
            </Text>
          </View>

          <View style={styles.mapActionCircle}>
            <ArrowUpRight size={17} color={C.ink} strokeWidth={2.2} />
          </View>
        </View>
      </Pressable>

      {/* 3. Phân trang hoặc Trạng thái hoàn tất */}
      <View style={styles.actionWrap}>
        {hasNextPage ? (
          <Pressable
            onPress={onLoadMore}
            disabled={isFetchingNextPage}
            accessibilityRole="button"
            accessibilityLabel={t("explore.recommendationsFooter.loadMore")}
            accessibilityState={{ disabled: isFetchingNextPage, busy: isFetchingNextPage }}
            style={({ pressed }) => [
              styles.loadMoreBtn,
              pressed && styles.btnPressed,
            ]}
          >
            {isFetchingNextPage ? (
              <ActivityIndicator size="small" color={C.ink} />
            ) : (
              <ChevronDown size={16} color={C.ink} strokeWidth={2.2} />
            )}
            <Text style={styles.loadMoreText}>
              {isFetchingNextPage
                ? t("explore.recommendationsFooter.loading")
                : t("explore.recommendationsFooter.loadMore")}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.completeRow}>
            <View style={styles.checkCircle}>
              <Check size={11} color="#FFFFFF" strokeWidth={2.8} />
            </View>
            <Text style={styles.completeText}>
              {t("explore.recommendationsFooter.complete", { count: loadedCount })}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default RecommendationsFooter;

const styles = StyleSheet.create({
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
    padding: 16,
    borderRadius: C.radius,
    backgroundColor: C.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
    gap: 13,
    ...Platform.select({
      ios: {
        shadowColor: C.ink,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  headerTextWrap: {
    flex: 1,
    gap: 3,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  badgeText: {
    fontFamily: C.font.semibold,
    fontSize: 11,
    color: C.gold,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  title: {
    fontFamily: C.font.displayBold,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.3,
    color: C.ink,
  },
  subtitle: {
    fontFamily: C.font.body,
    fontSize: 12,
    lineHeight: 17,
    color: C.muted,
  },
  countBadge: {
    minWidth: 32,
    height: 28,
    paddingHorizontal: 9,
    borderRadius: 14,
    backgroundColor: C.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    fontFamily: C.font.semibold,
    fontSize: 12,
    color: C.ink,
  },
  mapCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#101113",
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  contourWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    opacity: 0.15,
  },
  contourCircle: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  glow: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 140,
    height: 100,
  },
  topHighlight: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  mapInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
  },
  routeCol: {
    height: 56,
    width: 30,
    alignItems: "center",
    justifyContent: "space-between",
  },
  routeOriginDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.75)",
  },
  routeDash: {
    width: 1,
    flex: 1,
    marginVertical: 2,
    borderLeftWidth: 1,
    borderStyle: "dashed",
    borderLeftColor: "rgba(255, 255, 255, 0.35)",
  },
  routeTargetWrap: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  routeTargetIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.gold,
  },
  mapTextCol: {
    flex: 1,
    gap: 2,
  },
  mapTitle: {
    fontFamily: C.font.semibold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
    color: "#FFFFFF",
  },
  mapDesc: {
    fontFamily: C.font.body,
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255, 255, 255, 0.65)",
  },
  mapActionCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  actionWrap: {
    marginTop: 2,
  },
  loadMoreBtn: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    backgroundColor: C.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
  },
  btnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },
  loadMoreText: {
    fontFamily: C.font.medium,
    fontSize: 13,
    color: C.ink,
  },
  completeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 4,
  },
  checkCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  completeText: {
    fontFamily: C.font.body,
    fontSize: 12,
    color: C.muted,
  },
});