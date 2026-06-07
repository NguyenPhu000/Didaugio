import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Compass, Bookmark, CloudOff, RefreshCw, FolderX } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import { BOOKING_APPLE_THEME as APPLE_THEME, TOKENS } from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";

export function LoadingState() {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 6, paddingTop: 16 }}>
      {[1, 2, 3, 4].map((i, index) => (
        <Animated.View
          key={i}
          entering={FadeInUp.delay(index * 60).springify().damping(16)}
          style={{
            width: "50%",
            paddingHorizontal: 6,
            marginBottom: 12,
          }}
        >
          <View style={styles.skeletonCard}>
            {/* Top Row: Category and Actions */}
            <View style={styles.skeletonTopRow}>
              <View style={styles.skeletonCategoryPill} />
              <View style={styles.skeletonActionBtns}>
                <View style={styles.skeletonRoundBtn} />
                <View style={styles.skeletonRoundBtn} />
              </View>
            </View>

            {/* Bottom Panel */}
            <View style={styles.skeletonMetaPanel}>
              <View style={styles.skeletonLineTitle} />
              <View style={styles.skeletonLineText} />
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

export function EmptyState({ onExplore, activeFilter }) {
  const { t } = useTranslation();
  const isFiltered = Boolean(activeFilter);
  return (
    <Animated.View
      entering={FadeInUp.springify().damping(16).stiffness(160)}
      style={styles.stateCard}
    >
      <Animated.View entering={FadeInUp.delay(100).springify().damping(16)}>
        <View style={[styles.stateIconWrap, isFiltered && styles.stateIconWrapMuted]}>
          {isFiltered ? (
            <FolderX size={32} color="#64748B" strokeWidth={1.5} />
          ) : (
            <Bookmark size={32} color="#0F172A" strokeWidth={1.5} />
          )}
        </View>
      </Animated.View>
      <Text style={styles.stateTitle}>
        {isFiltered ? t("saved.empty.noResults") : t("saved.empty.noSaved")}
      </Text>
      <Text style={styles.stateDesc}>
        {isFiltered
          ? t("saved.empty.noResultsDesc")
          : t("saved.empty.noSavedDesc")}
      </Text>
      {!isFiltered && onExplore ? (
        <Pressable
          onPress={onExplore}
          style={({ pressed }) => [styles.stateCta, pressed && styles.stateCtaPressed]}
        >
          <Compass size={17} color="#FFFFFF" strokeWidth={1.75} />
          <Text style={styles.stateCtaText}>{t("saved.empty.explore")}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

export function ErrorState({ onRetry }) {
  const { t } = useTranslation();
  return (
    <Animated.View
      entering={FadeInUp.springify().damping(16).stiffness(160)}
      style={styles.stateCard}
    >
      <Animated.View entering={FadeInUp.delay(80).springify().damping(16)}>
        <View style={[styles.stateIconWrap, styles.stateIconError]}>
          <CloudOff size={32} color="#FF3B30" strokeWidth={1.5} />
        </View>
      </Animated.View>
      <Text style={styles.stateTitle}>{t("common.error")}</Text>
      <Text style={styles.stateDesc}>
        {t("common.networkError")}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [styles.stateRetry, pressed && styles.stateRetryPressed]}
        >
          <RefreshCw size={15} color="#FF3B30" strokeWidth={1.75} />
          <Text style={styles.stateRetryText}>{t("common.retry")}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stateCard: {
    marginHorizontal: TAB_SCREEN_PADDING,
    marginTop: 16,
    borderRadius: 28,
    padding: 36,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.05)",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
    elevation: 1,
  },
  stateIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.04)",
    marginBottom: 14,
  },
  stateIconWrapMuted: {
    backgroundColor: "rgba(15, 23, 42, 0.03)",
  },
  stateIconError: {
    backgroundColor: "rgba(255, 59, 48, 0.08)",
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
    textAlign: "center",
    fontFamily: TOKENS.font.heading,
    letterSpacing: -0.3,
  },
  stateDesc: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
    fontFamily: TOKENS.font.body,
    marginTop: 6,
  },
  stateCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#0F172A", // slate-900
  },
  stateCtaPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  stateCtaText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: TOKENS.font.semibold,
  },
  stateRetry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255, 59, 48, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.12)",
  },
  stateRetryPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  stateRetryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF3B30",
    fontFamily: TOKENS.font.semibold,
  },
  skeletonCard: {
    width: "100%",
    height: 220,
    borderRadius: 28,
    backgroundColor: "rgba(15, 23, 42, 0.04)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "space-between",
  },
  skeletonTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skeletonCategoryPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(15, 23, 42, 0.05)",
  },
  skeletonActionBtns: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  skeletonRoundBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(15, 23, 42, 0.05)",
  },
  skeletonMetaPanel: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
  },
  skeletonLineTitle: {
    width: "80%",
    height: 14,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  skeletonLineText: {
    width: "50%",
    height: 10,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
});
