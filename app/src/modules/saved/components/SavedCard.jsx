import { memo, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
  Layout,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  MapPin,
  Coffee,
  Utensils,
  Hotel,
  Compass,
  Sparkles,
  Star,
  Pencil,
  Heart,
} from "lucide-react-native";
import { TOKENS } from "../../../constants/design-tokens";
import { resolvePlaceImageUri } from "../../../lib/media-url";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Lấy nhãn thể loại hiển thị cho Prime Pick Tag
const getCategoryLabel = (categoryName) => {
  const name = String(categoryName || "").toLowerCase();
  if (name.includes("ăn") || name.includes("uống") || name.includes("nhà hàng") || name.includes("ẩm thực"))
    return "Ẩm thực";
  if (name.includes("cà phê") || name.includes("cafe") || name.includes("trà"))
    return "Cà phê";
  if (name.includes("khách sạn") || name.includes("lưu trú") || name.includes("homestay") || name.includes("nhà nghỉ"))
    return "Lưu trú";
  if (name.includes("tham quan") || name.includes("du lịch") || name.includes("di tích") || name.includes("bảo tàng"))
    return "Tham quan";
  if (name.includes("vui chơi") || name.includes("giải trí") || name.includes("bar") || name.includes("pub"))
    return "Giải trí";
  return "Địa điểm";
};

// Lấy màu icon và icon Lucide theo thể loại
const getCategoryMeta = (categoryName) => {
  const name = String(categoryName || "").toLowerCase();
  if (name.includes("ăn") || name.includes("uống") || name.includes("nhà hàng") || name.includes("ẩm thực"))
    return { icon: "utensils", color: "#FB923C" };
  if (name.includes("cà phê") || name.includes("cafe") || name.includes("trà"))
    return { icon: "coffee", color: "#FBBF24" };
  if (name.includes("khách sạn") || name.includes("lưu trú") || name.includes("homestay") || name.includes("nhà nghỉ"))
    return { icon: "hotel", color: "#38BDF8" };
  if (name.includes("tham quan") || name.includes("du lịch") || name.includes("di tích") || name.includes("bảo tàng"))
    return { icon: "compass", color: "#34D399" };
  if (name.includes("vui chơi") || name.includes("giải trí") || name.includes("bar") || name.includes("pub"))
    return { icon: "sparkles", color: "#C084FC" };
  return { icon: "map-pin", color: "#94A3B8" };
};

const CategoryIcon = ({ iconKey, color }) => {
  const size = 11;
  switch (iconKey) {
    case "utensils": return <Utensils size={size} color={color} strokeWidth={2.5} />;
    case "coffee": return <Coffee size={size} color={color} strokeWidth={2.5} />;
    case "hotel": return <Hotel size={size} color={color} strokeWidth={2.5} />;
    case "compass": return <Compass size={size} color={color} strokeWidth={2.5} />;
    case "sparkles": return <Sparkles size={size} color={color} strokeWidth={2.5} />;
    default: return <MapPin size={size} color={color} strokeWidth={2.5} />;
  }
};

export const SavedCard = memo(function SavedCard({
  entry,
  onPress,
  onOpenNote,
  onUnsave,
}) {
  const { t } = useTranslation();
  const place = entry?.place || entry;
  const imageUri = resolvePlaceImageUri(place);
  const ratingValue = Number(place?.ratingAvg ?? place?.averageRating ?? 0);
  const rating = Number.isFinite(ratingValue) && ratingValue > 0 ? ratingValue.toFixed(1) : "4.5";
  const note = String(entry?.note || "").trim();
  const categoryName = place?.category?.name || place?.categoryName || "";
  const categoryLabel = getCategoryLabel(categoryName);
  const categoryMeta = getCategoryMeta(categoryName);

  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 14, stiffness: 180 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 160 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);

  const handleNotePress = useCallback(
    (e) => {
      e?.stopPropagation?.();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onOpenNote?.(entry);
    },
    [entry, onOpenNote],
  );

  const handleUnsavePress = useCallback(
    (e) => {
      e?.stopPropagation?.();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onUnsave?.(place?.id);
    },
    [place?.id, onUnsave],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(180)}
      layout={Layout.springify().damping(16).stiffness(160)}
    >
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        animatedStyle,
        {
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.10)",
        },
      ]}
      className="w-full h-[245px] rounded-[30px] overflow-hidden bg-zinc-950 relative"
    >
      {/* 1. Ảnh nền toàn màn hình */}
      <Animated.View
        style={StyleSheet.absoluteFillObject}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <LinearGradient
            colors={["#1E293B", "#334155", "#475569"]}
            style={StyleSheet.absoluteFillObject}
          />
        )}
      </Animated.View>

      {/* 2. Lớp phủ Vignette Gradient điện ảnh sâu thẳm - chìm từ 40% đáy xuống */}
      <LinearGradient
        colors={[
          "rgba(9,15,26,0.0)",
          "rgba(9,15,26,0.15)",
          "rgba(9,15,26,0.55)",
          "rgba(9,15,26,0.93)",
        ]}
        locations={[0, 0.35, 0.62, 1]}
        className="absolute inset-0"
      />

      {/* 3. TẦNG ĐỈNH: Nhãn thể loại Prime Pick trắng phẳng + nút tương tác */}
      <View className="absolute top-3.5 left-3.5 right-3.5 flex-row justify-between items-center z-20">
        {/* Nhãn Prime Pick trắng phẳng - giống ảnh mẫu */}
        <View className="bg-white flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full">
          <CategoryIcon iconKey={categoryMeta.icon} color={categoryMeta.color} />
          <Text
            style={{ fontFamily: TOKENS.font.semibold }}
            className="text-slate-900 text-[11px] tracking-tight"
          >
            {categoryLabel}
          </Text>
        </View>

        {/* Cụm nút tương tác bóng mờ tinh tế */}
        <View className="flex-row items-center gap-2">
          {/* Nút Sửa ghi chú */}
          <Pressable
            onPress={handleNotePress}
            className="w-8 h-8 rounded-full bg-black/25 active:bg-black/45 border border-white/15 items-center justify-center"
          >
            <Pencil
              size={13}
              color={note ? "#FF9F0A" : "rgba(255,255,255,0.85)"}
              strokeWidth={2}
            />
          </Pressable>

          {/* Nút Bỏ lưu trái tim */}
          <Pressable
            onPress={handleUnsavePress}
            className="w-8 h-8 rounded-full bg-black/25 active:bg-black/45 border border-white/15 items-center justify-center"
          >
            <Heart size={13} color="#EF4444" fill="#EF4444" strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      {/* 4. TẦNG NỘI DUNG CHÌM (Naked Immersive Layout) - Không có hộp kính */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-3 z-20">

        {/* Tên địa điểm - Phóng lớn, Bold rực rỡ trên gradient tối */}
        <Text
          style={{ fontFamily: TOKENS.font.semibold }}
          className="text-[19px] text-white font-bold tracking-tight leading-6"
          numberOfLines={2}
        >
          {place?.name || t('savedCard.favoritePlace')}
        </Text>

        {/* Hàng địa chỉ + Rating */}
        <View className="flex-row items-start justify-between mt-1.5">
          {/* Địa chỉ mờ sương nhẹ bên trái */}
          <View className="flex-row items-start gap-1 flex-1 mr-3">
            <MapPin size={11} color="rgba(255,255,255,0.5)" strokeWidth={2} style={{ marginTop: 1 }} />
            <Text
              style={{ fontFamily: TOKENS.font.body }}
              className="text-[12px] text-white/65 flex-1"
              numberOfLines={2}
            >
              {place?.address || t('savedCard.canThoVietnam')}
            </Text>
          </View>

          {/* Cụm Rating */}
          <View className="flex-col items-center">
            <View className="flex-row items-center gap-1">
              <Star size={11} fill="#FFB800" color="#FFB800" strokeWidth={0} />
              <Text
                style={{ fontFamily: TOKENS.font.semibold }}
                className="text-white text-[13px] font-bold"
              >
                {rating}
              </Text>
            </View>
            <Text
              style={{ fontFamily: TOKENS.font.body }}
              className="text-white/40 text-[9px] mt-0.5"
            >
              {t('savedCard.rating')}
            </Text>
          </View>
        </View>

      </View>

    </AnimatedPressable>

      {/* Note Badge nổi ra ngoài góc dưới bên phải của card */}
      {note ? (
        <Animated.View
          entering={FadeIn.delay(100)}
          style={{
            position: "absolute",
            bottom: -10,
            right: 12,
            maxWidth: "60%",
            zIndex: 50,
          }}
        >
          <View
            style={{
              backgroundColor: "rgba(251,191,36,0.15)",
              borderWidth: 1,
              borderColor: "rgba(251,191,36,0.45)",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 12,
            }}
          >
            <Text
              style={{ fontFamily: TOKENS.font.medium, fontSize: 10.5, color: "#FCD34D" }}
              numberOfLines={1}
            >
              {note}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
});

export default SavedCard;
