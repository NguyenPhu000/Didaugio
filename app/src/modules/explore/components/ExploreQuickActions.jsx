import { memo, useCallback, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { normalizeText } from "../utils/exploreHelpers";

// Tên khóa và keyword để match với danh sách category từ API
const ACTIONS = Object.freeze([
  {
    key: "restaurants",
    title: "Ẩm thực",
    icon: "silverware-fork-knife",
    keywords: ["ẩm thực", "food", "nhà hàng", "quán ăn"],
  },
  {
    key: "hotel",
    title: "Khách sạn",
    icon: "bed-outline",
    keywords: ["khách sạn", "lưu trú", "hotel", "resort", "homestay"],
  },
  {
    key: "cafe",
    title: "Cafe",
    icon: "coffee-outline",
    keywords: ["cafe", "cà phê", "coffee", "quán nước"],
  },
  {
    key: "shopping",
    title: "Mua sắm",
    icon: "shopping-outline",
    keywords: ["mua sắm", "shopping", "chợ", "siêu thị", "cửa hàng"],
  },
  {
    key: "culture",
    title: "Văn hóa",
    icon: "bank-outline",
    keywords: ["văn hóa", "bảo tàng", "di tích", "lịch sử", "chùa"],
  },
  {
    key: "events",
    title: "Sự kiện",
    icon: "calendar-blank-outline",
    keywords: ["sự kiện", "lễ hội", "festival"],
  },
  {
    key: "nature",
    title: "Thiên nhiên",
    icon: "leaf",
    keywords: ["thiên nhiên", "sinh thái", "nature", "khu du lịch"],
  },
  {
    key: "more",
    title: "Tất cả",
    icon: "dots-horizontal",
    keywords: [],
  },
]);

function ExploreQuickActionsInner({
  categories = [],
  onSelectCategory,
  onOpenSearch,
}) {
  const items = useMemo(() => ACTIONS, []);

  // Theme trắng/đen chủ đạo theo yêu cầu
  const ICON_COLOR = "#000000"; // Black accent
  const BORDER_COLOR = "#E5E5E5"; // Light gray border

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
    <View style={styles.grid}>
      {items.map((item) => (
        <View key={item.key} style={styles.itemContainer}>
          <Pressable
            onPress={() => handlePress(item)}
            style={({ pressed }) => [
              styles.iconWrapper,
              pressed && styles.iconWrapperPressed,
            ]}
          >
            <View style={[styles.iconCircle, { borderColor: BORDER_COLOR }]}>
              <MaterialCommunityIcons
                name={item.icon}
                size={24}
                color={ICON_COLOR}
              />
            </View>
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
      ))}
    </View>
  );
}

export const ExploreQuickActions = memo(ExploreQuickActionsInner);

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    rowGap: 24,
    marginTop: 20,
    marginBottom: 10,
    justifyContent: "flex-start",
  },
  itemContainer: {
    width: "25%",
    alignItems: "center",
    gap: 8,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapperPressed: {
    opacity: 0.5,
    transform: [{ scale: 0.94 }],
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ffffff", // Trắng nền
    borderWidth: 1, // Viền đen nhạt
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  title: {
    color: "#404040", // Đen nhạt / Xám đậm cho chữ phụ
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
    textAlign: "center",
  },
});
