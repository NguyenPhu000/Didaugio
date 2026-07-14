import { Pressable, Text, View } from "react-native";
import {
  Compass,
  Bookmark,
  CloudOff,
  RefreshCw,
  FolderX,
  X,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";

export function LoadingState() {
  return (
    <View className="flex-row flex-wrap px-1.5 pt-4">
      {[1, 2, 3, 4].map((i) => (
        <Animated.View
          key={i}
          entering={FadeIn.duration(200)}
          className="w-1/2 px-1.5 mb-3"
        >
          {/* Thêm animate-pulse để tạo hiệu ứng nhịp đập khi loading */}
          <View
            className="w-full h-[220px] bg-[#F2F2F7] px-3 py-3 justify-between"
            style={{ borderRadius: 28, borderCurve: "continuous" }}
          >
            {/* Top Row: Category and Actions */}
            <View className="flex-row items-center justify-between">
              <View className="w-8 h-8 rounded-full bg-black/5" />
              <View className="flex-row items-center gap-1.5">
                <View className="w-8 h-8 rounded-full bg-black/5" />
                <View className="w-8 h-8 rounded-full bg-black/5" />
              </View>
            </View>

            {/* Bottom Panel */}
            <View
              className="bg-white/40 border border-white/30 px-2.5 py-2.5 gap-1.5"
              style={{ borderRadius: 16, borderCurve: "continuous" }}
            >
              <View className="w-4/5 h-3.5 rounded bg-black/5" />
              <View className="w-1/2 h-2.5 rounded bg-black/5" />
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

export function EmptyState({ onExplore, activeFilter, onClearFilters }) {
  const { t } = useTranslation();
  const isFiltered = Boolean(activeFilter);

  const handleExplore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onExplore?.();
  };

  const handleClearFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClearFilters?.();
  };

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      className="mt-4 p-9 items-center bg-white border border-black/5 shadow-sm shadow-black/5"
      style={{
        marginHorizontal: TAB_SCREEN_PADDING,
        borderRadius: 28,
        borderCurve: "continuous",
      }}
    >
      <View
        className={`w-[72px] h-[72px] items-center justify-center mb-3.5 ${
          isFiltered ? "bg-black/[0.03]" : "bg-black/5"
        }`}
        style={{ borderRadius: 24, borderCurve: "continuous" }}
      >
        {isFiltered ? (
          <FolderX size={32} color="#8E8E93" strokeWidth={1.5} />
        ) : (
          <Bookmark size={32} color={APPLE_THEME.text} strokeWidth={1.5} />
        )}
      </View>

      <Text
        className="text-[18px] text-center tracking-tight"
        style={{ color: APPLE_THEME.text, fontFamily: TOKENS.font.heading }}
      >
        {isFiltered ? t("saved.empty.noResults") : t("saved.empty.noSaved")}
      </Text>

      <Text
        className="text-[14px] text-center leading-[20px] mt-1.5 max-w-[280px]"
        style={{ color: APPLE_THEME.textMuted, fontFamily: TOKENS.font.body }}
      >
        {isFiltered
          ? t("saved.empty.noResultsDesc")
          : t("saved.empty.noSavedDesc")}
      </Text>

      {isFiltered && onClearFilters ? (
        <Pressable
          onPress={handleClearFilters}
          className="flex-row items-center gap-1.5 mt-5 px-5 py-3 bg-[#101E2C] active:opacity-80 active:scale-[0.97]"
          style={{ borderRadius: 14, borderCurve: "continuous" }}
        >
          <X size={16} color="#FFFFFF" strokeWidth={2.3} />
          <Text
            className="text-[14px] text-white tracking-tight"
            style={{ fontFamily: TOKENS.font.semibold }}
          >
            {t("saved.empty.clearFilters")}
          </Text>
        </Pressable>
      ) : !isFiltered && onExplore ? (
        <Pressable
          onPress={handleExplore}
          className="flex-row items-center gap-1.5 mt-5 px-5 py-3 bg-[#101E2C] active:opacity-80 active:scale-[0.97]"
          style={{ borderRadius: 14, borderCurve: "continuous" }}
        >
          <Compass size={17} color="#FFFFFF" strokeWidth={2} />
          <Text
            className="text-[14px] text-white tracking-tight"
            style={{ fontFamily: TOKENS.font.semibold }}
          >
            {t("saved.empty.explore")}
          </Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

export function ErrorState({ onRetry }) {
  const { t } = useTranslation();

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRetry?.();
  };

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      className="mt-4 p-9 items-center bg-white border border-black/5 shadow-sm shadow-black/5"
      style={{
        marginHorizontal: TAB_SCREEN_PADDING,
        borderRadius: 28,
        borderCurve: "continuous",
      }}
    >
      <View
        className="w-[72px] h-[72px] items-center justify-center mb-3.5 bg-[#FF3B30]/10"
        style={{ borderRadius: 24, borderCurve: "continuous" }}
      >
        <CloudOff size={32} color="#FF3B30" strokeWidth={1.5} />
      </View>

      <Text
        className="text-[18px] text-center tracking-tight"
        style={{ color: APPLE_THEME.text, fontFamily: TOKENS.font.heading }}
      >
        {t("common.error")}
      </Text>

      <Text
        className="text-[14px] text-center leading-[20px] mt-1.5 max-w-[280px]"
        style={{ color: APPLE_THEME.textMuted, fontFamily: TOKENS.font.body }}
      >
        {t("common.networkError")}
      </Text>

      {onRetry ? (
        <Pressable
          onPress={handleRetry}
          className="flex-row items-center gap-1.5 mt-5 px-5 py-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 active:opacity-80 active:scale-[0.97]"
          style={{ borderRadius: 14, borderCurve: "continuous" }}
        >
          <RefreshCw size={15} color="#FF3B30" strokeWidth={2} />
          <Text
            className="text-[14px] text-[#FF3B30] tracking-tight"
            style={{ fontFamily: TOKENS.font.semibold }}
          >
            {t("common.retry")}
          </Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}
