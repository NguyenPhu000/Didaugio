import { memo, useCallback, useEffect, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { normalizeText } from "../utils/exploreHelpers";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = TOKENS.spring.press;

const ACTIONS = Object.freeze([
  {
    key: "restaurants",
    title: "Ẩm thực",
    icon: "silverware-fork-knife",
    keywords: ["ẩm thực", "food", "nhà hàng", "quán ăn"],
    gradient: ["#FFF5F0", "#FFE8D6"],
    iconColor: "#F97316",
  },
  {
    key: "hotel",
    title: "Khách sạn",
    icon: "bed-outline",
    keywords: ["khách sạn", "lưu trú", "hotel", "resort", "homestay"],
    gradient: ["#F0F4FF", "#D6E4FF"],
    iconColor: "#3B82F6",
  },
  {
    key: "cafe",
    title: "Cafe",
    icon: "coffee-outline",
    keywords: ["cafe", "cà phê", "coffee", "quán nước"],
    gradient: ["#FFF8F0", "#FFE4C4"],
    iconColor: "#D97706",
  },
  {
    key: "shopping",
    title: "Mua sắm",
    icon: "shopping-outline",
    keywords: ["mua sắm", "shopping", "chợ", "siêu thị", "cửa hàng"],
    gradient: ["#FFF0F5", "#FFD6E8"],
    iconColor: "#EC4899",
  },
  {
    key: "culture",
    title: "Văn hóa",
    icon: "bank-outline",
    keywords: ["văn hóa", "bảo tàng", "di tích", "lịch sử", "chùa"],
    gradient: ["#F5F0FF", "#E4D6FF"],
    iconColor: "#8B5CF6",
  },
  {
    key: "events",
    title: "Sự kiện",
    icon: "calendar-blank-outline",
    keywords: ["sự kiện", "lễ hội", "festival"],
    gradient: ["#F0FFF5", "#D6FFE4"],
    iconColor: "#22C55E",
  },
  {
    key: "nature",
    title: "Thiên nhiên",
    icon: "leaf",
    keywords: ["thiên nhiên", "sinh thái", "nature", "khu du lịch"],
    gradient: ["#F0FFF8", "#D6FFE8"],
    iconColor: "#14B8A6",
  },
  {
    key: "more",
    title: "Tất cả",
    icon: "dots-horizontal",
    keywords: [],
    gradient: ["#F5F5F5", "#E8E8E8"],
    iconColor: "#71717A",
  },
]);

function QuickActionItem({ item, index, onPress }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  // Staggered entrance animation
  useEffect(() => {
    const delay = index * 60;
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
    translateY.value = withDelay(
      delay,
      withSpring(0, TOKENS.spring.entrance),
    );
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.88, SPRING_CONFIG);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(item);
  }, [item, onPress]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle]}
      className="w-[25%] items-center gap-2.5"
    >
      <View className="shadow-sm elevation-1 rounded-[20px] overflow-hidden">
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="w-16 h-16 rounded-[20px] items-center justify-center border border-black/[0.04]"
        >
          <MaterialCommunityIcons
            name={item.icon}
            size={26}
            color={item.iconColor}
          />
        </LinearGradient>
      </View>
      <Text className="text-[#1D1D1F] text-[12.5px] font-semibold text-center tracking-[-0.1px]" numberOfLines={1}>
        {item.title}
      </Text>
    </AnimatedPressable>
  );
}

function ExploreQuickActionsInner({
  categories = [],
  onSelectCategory,
  onOpenSearch,
}) {
  const items = useMemo(() => ACTIONS, []);

  const handlePress = useCallback(
    (item) => {
      if (item.key === "more") {
        onSelectCategory?.(null);
        return;
      }

      const matchedCat = categories.find((c) => {
        const catName = normalizeText(c.name);
        return item.keywords.some((kw) => catName.includes(normalizeText(kw)));
      });

      if (matchedCat?.id) {
        onSelectCategory?.(matchedCat.id);
      } else {
        onOpenSearch?.();
      }
    },
    [categories, onOpenSearch, onSelectCategory],
  );

  return (
    <View className="flex-row flex-wrap px-4 gap-y-5 mt-5 mb-2.5 justify-start">
      {items.map((item, index) => (
        <QuickActionItem
          key={item.key}
          item={item}
          index={index}
          onPress={handlePress}
        />
      ))}
    </View>
  );
}

export const ExploreQuickActions = memo(ExploreQuickActionsInner);
