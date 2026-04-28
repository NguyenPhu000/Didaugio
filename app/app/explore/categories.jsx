import { memo, useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { TOKENS } from "../../src/constants/design-tokens";
import {
  useCategories,
  useExplore,
} from "../../src/modules/explore/hooks/useExplore";
import { ExploreListScaffold } from "../../src/modules/explore/components/ExploreListScaffold";
import {
  SmallPlaceCard,
  SMALL_CARD_W,
} from "../../src/modules/explore/components/SmallPlaceCard";

// Map custom modern icons for categories
const CATEGORY_ICON_MAP = {
  "ẩm thực": "silverware-fork-knife",
  "khách sạn": "bed-outline",
  "lưu trú": "bed-outline",
  "cafe": "coffee-outline",
  "cà phê": "coffee-outline",
  "mua sắm": "shopping-outline",
  "chợ": "storefront-outline",
  "văn hóa": "bank-outline",
  "bảo tàng": "bank-outline",
  "lịch sử": "bank-outline",
  "thiên nhiên": "leaf",
  "sinh thái": "pine-tree",
  "sự kiện": "calendar-blank-outline",
  "chùa": "temple-buddhist",
  "giải trí": "gamepad-variant-outline",
  "phương tiện": "bus",
  "di chuyển": "car-outline",
  "biển": "beach",
};

function getModernIcon(name) {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  return "shape-outline";
}

// ==== CATEGORY ROW SECTION ====
const CategorySection = memo(function CategorySection({ category }) {
  const router = useRouter();
  // Fetch places specific to this category
  const { data, isLoading } = useExplore({
    categoryId: category.id,
    enabled: true,
  });

  const places = useMemo(
    () => data?.pages.flatMap((p) => p?.data || []) ?? [],
    [data],
  );

  // If no places and done loading, hide the row entirely
  if (!isLoading && places.length === 0) return null;

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrap}>
          <View style={styles.sectionIcon}>
            <MaterialCommunityIcons name={category.icon} size={18} color="#000" />
          </View>
          <Text style={styles.sectionTitle}>{category.name}</Text>
        </View>

        <Pressable
          hitSlop={10}
          onPress={() =>
            router.push({
              pathname: "/explore/category/[id]",
              params: { id: String(category.id) },
            })
          }
          style={({ pressed }) => [
            styles.viewAllBtn,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.viewAllText}>Xem tất cả</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#6B7280" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color="#000" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          snapToInterval={SMALL_CARD_W + 16}
          decelerationRate="fast"
        >
          {places.slice(0, 8).map((place) => ( // Show max 8 places per row inline
            <View key={place.id} style={styles.cardWrapper}>
              <SmallPlaceCard
                place={place}
                onPress={() =>
                  router.push({ pathname: "/place/[id]", params: { id: place.id } })
                }
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
});

// ==== MAIN SCREEN ====
export default function ExploreCategoriesScreen() {
  const { data: categories = [], isLoading } = useCategories();

  const items = useMemo(
    () =>
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        icon: getModernIcon(c.name),
      })),
    [categories],
  );

  return (
    <ExploreListScaffold
      title="Khám phá theo danh mục"
      subtitle="Tìm điểm đến hoàn hảo cho bạn."
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mainScroll}
      >
        {isLoading ? (
          <Text style={styles.loadingText}>Đang tải danh mục...</Text>
        ) : (
          items.map((item) => (
            <CategorySection key={item.id} category={item} />
          ))
        )}
      </ScrollView>
    </ExploreListScaffold>
  );
}

const styles = StyleSheet.create({
  mainScroll: {
    paddingTop: 10,
    paddingBottom: 80,
    gap: 36, // Large spacing between category rows like App Store
  },
  loadingText: {
    color: "#6B7280",
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    paddingVertical: 30,
    textAlign: "center",
  },
  sectionContainer: {
    // each section block
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: TOKENS.space[6],
    marginBottom: 14,
  },
  sectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F4F6", 
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: "#000000",
    fontSize: 22, // App Store big heading
    fontFamily: TOKENS.font.heading,
    letterSpacing: -0.5,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    color: "#8E8E93", // iOS System secondary color
    fontSize: 15,
    fontFamily: TOKENS.font.medium,
  },
  loaderWrap: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: TOKENS.space[6],
    paddingBottom: 8, // slight shadow bleed space
  },
  cardWrapper: {
    marginRight: 16,
  },
});
