import { memo, useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import {
  Compass,
  Bookmark,
  CloudOff,
  RefreshCw,
  SearchX,
  X,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";

// Skeleton card với animation nhấp nháy êm dịu (Breathing Shimmer)
const SkeletonCard = memo(function SkeletonCard({ aspectRatio = 0.95, hasOffset = false }) {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 900 }),
        withTiming(0.45, { duration: 900 }),
      ),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View className={`mb-3.5 ${hasOffset ? "pt-3" : ""}`}>
      <Animated.View style={animatedStyle}>
        {/* Khung ảnh giả lập */}
        <View
          className="bg-[#E9ECF0] border-[0.5px] border-black/[0.04]"
          style={{
            aspectRatio,
            borderRadius: 20,
            borderCurve: "continuous",
            overflow: "hidden",
            padding: 10,
            justifyContent: "space-between",
          }}
        >
          {/* Top row */}
          <View className="flex-row items-center justify-between">
            <View className="w-14 h-4 rounded-full bg-black/10" />
            <View className="flex-row gap-1.5">
              <View className="w-7 h-7 rounded-full bg-black/10" />
              <View className="w-7 h-7 rounded-full bg-black/10" />
            </View>
          </View>
        </View>

        {/* Info lines giả lập */}
        <View className="pt-2 px-1 gap-1.5">
          <View className="w-4/5 h-3.5 rounded-md bg-[#E2E6EA]" />
          <View className="w-1/2 h-2.5 rounded-md bg-[#E9ECF0]" />
        </View>
      </Animated.View>
    </View>
  );
});

export function LoadingState() {
  return (
    <View className="flex-row px-1">
      {/* Cột trái */}
      <View className="flex-1 pr-1.5">
        <SkeletonCard aspectRatio={0.88} />
        <SkeletonCard aspectRatio={1.05} />
      </View>
      {/* Cột phải với offset so le */}
      <View className="flex-1 pl-1.5 pt-4">
        <SkeletonCard aspectRatio={1.08} />
        <SkeletonCard aspectRatio={0.85} />
      </View>
    </View>
  );
}

// Nút tương tác xúc giác Apple với Reanimated spring
const TactileButton = memo(function TactileButton({
  onPress,
  children,
  className = "",
  style = {},
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, TOKENS.spring.press);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, TOKENS.spring.press);
      }}
    >
      <Animated.View className={className} style={[animStyle, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
});

export function EmptyState({
  onExplore,
  activeFilter,
  onClearFilters,
  searchQuery,
}) {
  const { t } = useTranslation();
  const isFiltered = Boolean(activeFilter || String(searchQuery || "").trim());

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
      entering={FadeIn.duration(280)}
      className="mt-6 mx-2 p-8 items-center bg-white border-[0.5px] border-black/[0.06] shadow-sm shadow-black/[0.04]"
      style={{
        borderRadius: 28,
        borderCurve: "continuous",
      }}
    >
      <View
        className="w-[72px] h-[72px] items-center justify-center mb-4"
        style={{
          backgroundColor: isFiltered ? "rgba(0,0,0,0.04)" : "rgba(0,123,255,0.08)",
          borderRadius: 24,
          borderCurve: "continuous",
        }}
      >
        {isFiltered ? (
          <SearchX size={32} color="#636366" strokeWidth={1.8} />
        ) : (
          <Bookmark size={32} color="#007BFF" strokeWidth={1.8} />
        )}
      </View>

      <Text
        className="text-[18px] text-center text-[#1D1D1F] tracking-tight"
        style={{ fontFamily: TOKENS.font.heading }}
      >
        {isFiltered
          ? t("saved.empty.noResults", "Không tìm thấy địa điểm")
          : t("saved.empty.noSaved", "Chưa có địa điểm đã lưu")}
      </Text>

      <Text
        className="text-[13.5px] text-center leading-[19px] mt-1.5 max-w-[280px] text-[#636366]"
        style={{ fontFamily: TOKENS.font.body }}
      >
        {isFiltered
          ? t(
              "saved.empty.noResultsDesc",
              "Thử tìm kiếm với từ khóa khác hoặc bỏ chọn các bộ lọc đang kích hoạt.",
            )
          : t(
              "saved.empty.noSavedDesc",
              "Khám phá các danh lam, quán ăn, quán cà phê đặc sắc tại Cần Thơ và chạm vào biểu tượng trái tim để lưu lại.",
            )}
      </Text>

      {isFiltered && onClearFilters ? (
        <TactileButton
          onPress={handleClearFilters}
          className="flex-row items-center gap-1.5 mt-5 px-5 py-3 bg-[#1D1D1F]"
          style={{ borderRadius: 16, borderCurve: "continuous" }}
        >
          <X size={15} color="#FFFFFF" strokeWidth={2.4} />
          <Text
            className="text-[14px] text-white tracking-tight"
            style={{ fontFamily: TOKENS.font.semibold }}
          >
            {t("saved.empty.clearFilters", "Xóa bộ lọc")}
          </Text>
        </TactileButton>
      ) : !isFiltered && onExplore ? (
        <TactileButton
          onPress={handleExplore}
          className="flex-row items-center gap-2 mt-5 px-5 py-3 bg-[#1D1D1F]"
          style={{ borderRadius: 16, borderCurve: "continuous" }}
        >
          <Compass size={16} color="#FFFFFF" strokeWidth={2.2} />
          <Text
            className="text-[14px] text-white tracking-tight"
            style={{ fontFamily: TOKENS.font.semibold }}
          >
            {t("saved.empty.explore", "Khám phá Cần Thơ ngay")}
          </Text>
        </TactileButton>
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
      entering={FadeIn.duration(280)}
      className="mt-6 mx-2 p-8 items-center bg-white border-[0.5px] border-black/[0.06] shadow-sm shadow-black/[0.04]"
      style={{
        borderRadius: 28,
        borderCurve: "continuous",
      }}
    >
      <View
        className="w-[72px] h-[72px] items-center justify-center mb-4 bg-[#FF3B30]/10"
        style={{ borderRadius: 24, borderCurve: "continuous" }}
      >
        <CloudOff size={32} color="#FF3B30" strokeWidth={1.8} />
      </View>

      <Text
        className="text-[18px] text-center text-[#1D1D1F] tracking-tight"
        style={{ fontFamily: TOKENS.font.heading }}
      >
        {t("common.error", "Đã xảy ra lỗi")}
      </Text>

      <Text
        className="text-[13.5px] text-center leading-[19px] mt-1.5 max-w-[280px] text-[#636366]"
        style={{ fontFamily: TOKENS.font.body }}
      >
        {t(
          "common.networkError",
          "Không thể tải danh sách đã lưu. Vui lòng kiểm tra lại kết nối mạng.",
        )}
      </Text>

      {onRetry ? (
        <TactileButton
          onPress={handleRetry}
          className="flex-row items-center gap-1.5 mt-5 px-5 py-3 bg-[#FF3B30]/10 border-[0.5px] border-[#FF3B30]/25"
          style={{ borderRadius: 16, borderCurve: "continuous" }}
        >
          <RefreshCw size={14} color="#FF3B30" strokeWidth={2.2} />
          <Text
            className="text-[14px] text-[#FF3B30] tracking-tight"
            style={{ fontFamily: TOKENS.font.semibold }}
          >
            {t("common.retry", "Thử lại")}
          </Text>
        </TactileButton>
      ) : null}
    </Animated.View>
  );
}

