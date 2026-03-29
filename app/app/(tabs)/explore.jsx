import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import {
  useExplore,
  useCategories,
} from "../../src/modules/explore/hooks/useExplore";
import {
  getHomeApi,
  searchPlacesApi,
} from "../../src/modules/explore/api/exploreApi";
import { QUERY_KEYS } from "../../src/constants/query-keys";
import { PLACE_STATUS } from "../../src/constants/preferences";
import { normalizePlaces } from "../../src/lib/place";
import { useAuthStore } from "../../src/stores/authStore";
import { TOKENS } from "../../src/constants/design-tokens";
import { TAB_BAR_HEIGHT } from "./_layout";
import { resolvePlaceImageUri } from "../../src/lib/media-url";

/** Mockup Voyager: nền slate-50, primary blue-600, glass chip */
const BG = TOKENS.color.background.light;
const SURFACE = "#FFFFFF";
const TEXT = "#0F172A";
const TEXT_MUTED = "#64748B";
const TEXT_SOFT = "#94A3B8";
const BORDER = "#E2E8F0";
const NAVY = "#0F4C75";
const PRIMARY = "#2563EB";
const PAD = 24;
const GAP = 24;
const SCREEN_W = Dimensions.get("window").width;
const CONTENT_W = SCREEN_W - PAD * 2;
/** Card điểm đến ngang theo mockup tham chiếu (thấy được card kế bên). */
const DEST_CARD_W = Math.min(238, Math.max(212, CONTENT_W - 84));
const DEST_CARD_H = 260;
const FALLBACK_EXPLORE_PLACES = [
  {
    id: "fallback-1",
    name: "Hồ Núi Xanh",
    district: { name: "Cần Thơ" },
    ward: { name: "Tân An" },
    ratingAvg: 4.9,
    reviewCount: 2500,
    favoriteCount: 2500,
    categoryId: null,
    priceFrom: 120000,
    images: [
      {
        secureUrl:
          "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    id: "fallback-2",
    name: "Đèo Mây",
    district: { name: "Cần Thơ" },
    ward: { name: "Bình Thủy" },
    ratingAvg: 4.8,
    reviewCount: 1800,
    favoriteCount: 1900,
    categoryId: null,
    priceFrom: 145000,
    images: [
      {
        secureUrl:
          "https://images.unsplash.com/photo-1464822759844-d150baec93f5?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    id: "fallback-3",
    name: "Rừng Ánh Sáng",
    district: { name: "Phong Điền" },
    ward: { name: "Nhơn Ái" },
    ratingAvg: 4.7,
    reviewCount: 1200,
    favoriteCount: 1300,
    categoryId: null,
    priceFrom: 98000,
    images: [
      {
        secureUrl:
          "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    id: "fallback-4",
    name: "Hồ Lam",
    district: { name: "Cái Răng" },
    ward: { name: "Lê Bình" },
    ratingAvg: 4.6,
    reviewCount: 900,
    favoriteCount: 1000,
    categoryId: null,
    priceFrom: 115000,
    images: [
      {
        secureUrl:
          "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
];

function normalizeText(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Placeholder kiểu travel poster — lớp gradient + icon (không khối xanh phẳng như trước) */
function PlaceImagePlaceholder({ compact = false }) {
  const iconSize = compact ? 34 : 54;
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: "#0c4a6e" }]}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "50%",
          backgroundColor: "#38bdf8",
          opacity: 0.45,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "48%",
          backgroundColor: "#0f172a",
          opacity: 0.35,
        }}
      />
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialIcons
          name="travel-explore"
          size={iconSize}
          color="rgba(255,255,255,0.3)"
        />
      </View>
    </View>
  );
}

function getUserName(user) {
  return (
    user?.profile?.fullName?.split(" ").filter(Boolean).pop() ||
    user?.email?.split("@")[0] ||
    "Bạn"
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Xin chào";
  if (hour < 18) return "Chào bạn";
  return "Buổi tối";
}

/** Tiêu đề section kiểu “New Zealand” — chữ hoa đầu câu */
function getDurationLabel(place) {
  const days = Number(place?.durationDays ?? place?.suggestedDays ?? 0);
  if (Number.isFinite(days) && days > 0) {
    return `${Math.round(days)} NGÀY`;
  }
  return "2 NGÀY";
}

function getGroupLabel(place, index = 0) {
  const min = Number(place?.groupMin ?? place?.minGroupSize ?? 0);
  const max = Number(place?.groupMax ?? place?.maxGroupSize ?? 0);

  if (min > 0 && max >= min) {
    return `${min}-${max} NGƯỜI`;
  }

  if (place?.suitableForSolo === true) {
    return "CÁ NHÂN";
  }

  return index % 2 === 0 ? "2-5 NGƯỜI" : "CÁ NHÂN";
}

function formatCount(value) {
  if (!value) return "Mới";
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

function formatRatingLabel(place) {
  const n = Number(place?.ratingCount ?? place?.reviewCount ?? 0);
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k đánh giá`;
  if (n > 0) return `${n} đánh giá`;
  return "Mới";
}

/** Giá hiển thị kiểu mockup (VND); không hardcode số — lấy từ place */
function formatPriceLine(place) {
  const from = place?.priceFrom ?? place?.price_from;
  if (from != null && Number(from) > 0) {
    const n = Number(from);
    let main;
    if (n >= 1_000_000) {
      main = `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}tr`;
    } else if (n >= 1000) {
      main = `${Math.round(n / 1000)}k`;
    } else {
      main = String(n);
    }
    return { main: `${main}đ`, suffix: "/lượt" };
  }
  if (place?.priceRange) return { main: String(place.priceRange), suffix: "" };
  return null;
}

function getPlaceLocation(place) {
  const location = [place?.district?.name, place?.ward?.name, place?.address]
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");

  if (!location) return location;
  return normalizeText(location).includes("ninh kieu")
    ? location.replace(/Ninh\s*Ki[eê]u/gi, "Cần Thơ")
    : location;
}

function getCategoryIcon(name = "") {
  const value = normalizeText(name);
  if (value.includes("bien") || value.includes("beach")) return "beach-access";
  if (
    value.includes("nui") ||
    value.includes("mount") ||
    value.includes("nature")
  ) {
    return "terrain";
  }
  if (value.includes("an") || value.includes("food")) return "restaurant";
  if (
    value.includes("van hoa") ||
    value.includes("bao tang") ||
    value.includes("museum")
  ) {
    return "museum";
  }
  return "explore";
}

function SearchOverlay({ visible, onClose }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { data: categories = [] } = useCategories();

  const isActive = text.trim().length > 0 || selectedCategory !== null;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useExplore({
      search: text.trim(),
      categoryId: selectedCategory,
    });

  const results = useMemo(
    () => data?.pages.flatMap((page) => page?.data || []) ?? [],
    [data],
  );

  const handleClose = useCallback(() => {
    setText("");
    setSelectedCategory(null);
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={styles.searchScreen}>
        <View style={styles.searchHeader}>
          <View style={styles.searchInputWrap}>
            <MaterialIcons
              name="search"
              size={20}
              color={text ? NAVY : TEXT_MUTED}
            />
            <TextInput
              autoFocus
              value={text}
              onChangeText={setText}
              placeholder="Tìm địa điểm, quán ăn, điểm vui chơi..."
              placeholderTextColor={TEXT_SOFT}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {text ? (
              <Pressable onPress={() => setText("")} hitSlop={10}>
                <MaterialIcons name="close" size={18} color={TEXT_MUTED} />
              </Pressable>
            ) : null}
          </View>

          <Pressable onPress={handleClose} hitSlop={10}>
            <Text style={styles.searchCancel}>Đóng</Text>
          </Pressable>
        </View>

        {categories.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.searchChipRow}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable
              onPress={() => setSelectedCategory(null)}
              style={[
                styles.filterChip,
                selectedCategory === null && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === null && styles.filterChipTextActive,
                ]}
              >
                Tất cả
              </Text>
            </Pressable>

            {categories.map((category) => {
              const active = selectedCategory === category.id;
              return (
                <Pressable
                  key={category.id}
                  onPress={() =>
                    setSelectedCategory(active ? null : category.id)
                  }
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      active && styles.filterChipTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {isLoading ? (
          <View style={styles.searchEmptyState}>
            <ActivityIndicator color={NAVY} />
          </View>
        ) : !isActive ? (
          <View style={styles.searchEmptyState}>
            <MaterialIcons name="travel-explore" size={42} color={TEXT_SOFT} />
            <Text style={styles.searchEmptyTitle}>Tìm điểm đến tiếp theo</Text>
            <Text style={styles.searchEmptyCopy}>
              Nhập tên địa điểm hoặc chọn danh mục để khám phá thêm.
            </Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.searchEmptyState}>
            <MaterialIcons name="search-off" size={40} color={TEXT_SOFT} />
            <Text style={styles.searchEmptyTitle}>
              Không tìm thấy địa điểm phù hợp
            </Text>
            <Text style={styles.searchEmptyCopy}>
              Thử từ khóa khác hoặc đổi sang danh mục khác nhé.
            </Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.searchResults}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const imageUri = resolvePlaceImageUri(item);

              return (
                <Pressable
                  onPress={() => {
                    handleClose();
                    router.push(`/place/${item.id}`);
                  }}
                  style={({ pressed }) => [
                    styles.searchResultCard,
                    pressed && styles.pressedCard,
                  ]}
                >
                  <View style={styles.searchResultThumb}>
                    {imageUri ? (
                      <Image
                        source={{ uri: imageUri }}
                        contentFit="cover"
                        transition={180}
                        cachePolicy="memory-disk"
                        style={StyleSheet.absoluteFillObject}
                      />
                    ) : (
                      <View style={styles.searchResultFallback}>
                        <MaterialIcons name="place" size={22} color={NAVY} />
                      </View>
                    )}
                  </View>

                  <View style={styles.searchResultBody}>
                    <Text style={styles.searchResultTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.searchResultMeta} numberOfLines={1}>
                      {getPlaceLocation(item) || "Cần Thơ"}
                    </Text>
                  </View>

                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color={TEXT_SOFT}
                  />
                </Pressable>
              );
            }}
            onEndReached={() =>
              hasNextPage && !isFetchingNextPage && fetchNextPage()
            }
            onEndReachedThreshold={0.35}
            ListFooterComponent={
              isFetchingNextPage ? (
                <ActivityIndicator
                  color={NAVY}
                  style={{ marginVertical: 18 }}
                />
              ) : null
            }
          />
        )}
      </View>
    </Modal>
  );
}

function FeaturedImageGradient() {
  return (
    <>
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: "rgba(0,0,0,0.14)" },
        ]}
        pointerEvents="none"
      />
      <View style={styles.featuredGradientBottom} pointerEvents="none" />
    </>
  );
}

function FeaturedCard({ place, variant = "primary", onPress, style }) {
  const imageUri = resolvePlaceImageUri(place);
  const location = getPlaceLocation(place);
  const rating = Number(place?.ratingAvg ?? place?.averageRating);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const ratingCap = formatRatingLabel(place);
  const priceLine = formatPriceLine(place);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.featuredCard,
        variant === "secondary" && styles.featuredCardSecondary,
        style,
        pressed && styles.pressedCard,
      ]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          contentFit="cover"
          transition={280}
          cachePolicy="memory-disk"
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <PlaceImagePlaceholder />
      )}

      <FeaturedImageGradient />

      <View style={styles.featuredFavoriteBtn} pointerEvents="none">
        <MaterialIcons name="favorite" size={22} color="#FFFFFF" />
      </View>

      <View style={styles.featuredFooterGlass}>
        <View style={styles.featuredFooterTopRow}>
          <View style={styles.featuredFooterTextCol}>
            <Text style={styles.featuredTitle} numberOfLines={2}>
              {place?.name}
            </Text>
            {location ? (
              <View style={styles.featuredLocRow}>
                <MaterialIcons name="place" size={14} color={PRIMARY} />
                <Text style={styles.featuredLocation} numberOfLines={1}>
                  {location}
                </Text>
              </View>
            ) : null}
          </View>
          {hasRating ? (
            <View style={styles.featuredRatingPill}>
              <MaterialIcons name="star" size={15} color={PRIMARY} />
              <Text style={styles.featuredRatingNum}>{rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.featuredFooterBottomRow}>
          <Text style={styles.featuredRatingsCap}>{ratingCap}</Text>
          {priceLine ? (
            <View style={styles.featuredPriceRow}>
              <Text style={styles.featuredPriceMain}>{priceLine.main}</Text>
              {priceLine.suffix ? (
                <Text style={styles.featuredPriceSuffix}>
                  {priceLine.suffix}
                </Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.featuredPriceSpacer} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

function RecommendationCard({ place, index, onPress }) {
  const imageUri = resolvePlaceImageUri(place);
  const loc = getPlaceLocation(place) || "Cần Thơ";
  const likeLabel = formatCount(
    Number(place?.favoriteCount || 0) || Number(place?.viewCount || 0),
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.recommendMiniCard,
        pressed && styles.pressedCard,
      ]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          contentFit="cover"
          transition={220}
          cachePolicy="memory-disk"
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <PlaceImagePlaceholder compact />
      )}

      <View style={styles.recommendMiniShade} pointerEvents="none" />

      <View style={styles.recommendMiniBadge}>
        <MaterialIcons name="favorite-border" size={12} color="#E2E8F0" />
        <Text style={styles.recommendMiniBadgeText}>{likeLabel}</Text>
      </View>

      <View style={styles.recommendMiniBody}>
        <Text style={styles.recommendMiniTitle} numberOfLines={1}>
          {place?.name}
        </Text>
        <Text style={styles.recommendMiniSub} numberOfLines={1}>
          {loc}
        </Text>

        <View style={styles.recommendMiniMeta}>
          <View style={styles.recommendMiniMetaItem}>
            <MaterialIcons name="schedule" size={14} color="#2dd4bf" />
            <Text style={styles.recommendMiniMetaText}>
              {getDurationLabel(place)}
            </Text>
          </View>
          <View style={styles.recommendMiniMetaItem}>
            <MaterialIcons name="group" size={14} color="#a5b4fc" />
            <Text style={styles.recommendMiniMetaText}>
              {getGroupLabel(place, index)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { data: categories = [] } = useCategories();

  const {
    data: homeData,
    isLoading: homeLoading,
    isError: homeError,
  } = useQuery({
    queryKey: QUERY_KEYS.places.home(),
    queryFn: () => getHomeApi({ limit: 24 }),
    staleTime: 5 * 60 * 1000,
  });

  /** API /places/home chỉ có featuredPlaces — không có danh sách “places”.
   *  Thêm gọi /places (approved) để luôn có địa điểm hiển thị. */
  const {
    data: approvedPlaces = [],
    isLoading: listLoading,
    isError: listError,
  } = useQuery({
    queryKey: [...QUERY_KEYS.places.all(), "explore-feed"],
    queryFn: async () => {
      const res = await searchPlacesApi({
        page: 1,
        limit: 40,
        status: PLACE_STATUS.APPROVED,
      });
      return normalizePlaces(res?.data || []);
    },
    staleTime: 3 * 60 * 1000,
  });

  const allPlaces = useMemo(() => {
    const featured = normalizePlaces(
      homeData?.data?.featuredPlaces ?? homeData?.featuredPlaces ?? [],
    );
    const seen = new Set();
    const out = [];

    for (const place of featured) {
      if (!place?.id || seen.has(place.id)) continue;
      seen.add(place.id);
      out.push(place);
    }
    for (const place of approvedPlaces) {
      if (!place?.id || seen.has(place.id)) continue;
      seen.add(place.id);
      out.push(place);
    }
    if (out.length > 0) return out;
    return FALLBACK_EXPLORE_PLACES;
  }, [homeData, approvedPlaces]);

  const isLoading =
    (homeLoading || listLoading) &&
    allPlaces.length === 0 &&
    !homeError &&
    !listError;

  const filteredPlaces = useMemo(() => {
    if (!selectedCategory) return allPlaces;
    return allPlaces.filter((place) => place.categoryId === selectedCategory);
  }, [allPlaces, selectedCategory]);

  const renderPlaces =
    filteredPlaces.length > 0 ? filteredPlaces : FALLBACK_EXPLORE_PLACES;
  const heroCarousel = renderPlaces.slice(0, 10);
  const recommendations =
    renderPlaces.length > 10
      ? renderPlaces.slice(10, 18)
      : renderPlaces.slice(1, Math.min(renderPlaces.length, 7));
  const userName = getUserName(user);
  const greetingName = String(userName);
  const weatherLabel = new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
  })
    .format(new Date())
    .toUpperCase();
  const regionTitle = "Điểm đến nổi bật";
  const bottomPad = (insets.bottom || 0) + TAB_BAR_HEIGHT + 34;

  useEffect(() => {
    if (!__DEV__) return;
    const first = heroCarousel[0];
    // eslint-disable-next-line no-console
    console.log("[Explore][debug]", {
      homeLoading,
      listLoading,
      homeError,
      listError,
      allPlaces: allPlaces.length,
      filteredPlaces: filteredPlaces.length,
      heroCarousel: heroCarousel.length,
      recommendations: recommendations.length,
      firstPlaceId: first?.id,
      firstPlaceName: first?.name,
      firstImageUri: first ? resolvePlaceImageUri(first) : null,
    });
  }, [
    homeLoading,
    listLoading,
    homeError,
    listError,
    allPlaces,
    filteredPlaces,
    heroCarousel,
    recommendations,
  ]);

  const displayCategories = useMemo(() => {
    if (categories.length > 0) {
      return categories.slice(0, 6).map((category) => ({
        key: `cat-${category.id}`,
        label: category.name,
        icon: getCategoryIcon(category.name),
        categoryId: category.id,
      }));
    }

    return [
      { key: "mountains", label: "Núi", icon: "terrain", categoryId: null },
      { key: "beaches", label: "Biển", icon: "beach-access", categoryId: null },
      { key: "forests", label: "Rừng", icon: "park", categoryId: null },
      {
        key: "cities",
        label: "Thành phố",
        icon: "location-city",
        categoryId: null,
      },
    ];
  }, [categories]);

  const toggleCategory = useCallback((categoryId) => {
    setSelectedCategory((current) =>
      current === categoryId ? null : categoryId,
    );
  }, []);

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: (insets.top || 0) + 12,
            paddingBottom: bottomPad,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <View style={styles.greetingBlock}>
            <Text
              style={styles.greetingTitle}
            >{`${getGreeting()}, ${greetingName} 👋`}</Text>
          </View>

          <View style={styles.topBarRight}>
            <View style={styles.weatherChip}>
              <MaterialIcons name="wb-cloudy" size={18} color={PRIMARY} />
              <Text style={styles.weatherChipLabel}>{weatherLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.heroIntro}>
          <View style={styles.heroHeader}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Khám phá{"\n"}thế giới</Text>
            </View>

            <Pressable
              onPress={() => setSearchVisible(true)}
              hitSlop={12}
              style={({ pressed }) => [
                styles.searchLauncher,
                pressed && styles.searchLauncherPressed,
              ]}
            >
              <MaterialIcons name="search" size={28} color={TEXT} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => setSelectedCategory(null)}
            style={[
              styles.categoryChip,
              !selectedCategory && styles.categoryChipActive,
              !selectedCategory && styles.categoryChipActiveShadow,
            ]}
          >
            <MaterialIcons
              name="apps"
              size={15}
              color={!selectedCategory ? "#FFFFFF" : "#475569"}
            />
            <Text
              style={[
                styles.categoryChipText,
                !selectedCategory && styles.categoryChipTextActive,
              ]}
            >
              Tất cả
            </Text>
          </Pressable>

          {displayCategories.map((category) => {
            const active =
              category.categoryId != null &&
              selectedCategory === category.categoryId;

            return (
              <Pressable
                key={category.key}
                onPress={() => {
                  if (category.categoryId == null) return;
                  toggleCategory(category.categoryId);
                }}
                style={[
                  styles.categoryChip,
                  active && styles.categoryChipActive,
                  active && styles.categoryChipActiveShadow,
                ]}
              >
                <MaterialIcons
                  name={category.icon}
                  size={15}
                  color={active ? "#FFFFFF" : "#475569"}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    active && styles.categoryChipTextActive,
                  ]}
                >
                  {category.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={PRIMARY} />
          </View>
        ) : (
          <>
            {heroCarousel.length > 0 ? (
              <View style={styles.heroSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{regionTitle}</Text>
                  <Pressable
                    onPress={() => setSearchVisible(true)}
                    hitSlop={10}
                  >
                    <Text style={styles.sectionAction}>Xem tất cả</Text>
                  </Pressable>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  contentContainerStyle={styles.heroCarousel}
                  keyboardShouldPersistTaps="handled"
                >
                  {heroCarousel.map((place) => (
                    <FeaturedCard
                      key={place.id}
                      place={place}
                      style={{
                        width: DEST_CARD_W,
                        height: DEST_CARD_H,
                      }}
                      onPress={() => router.push(`/place/${place.id}`)}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {recommendations.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Gợi ý hàng đầu</Text>
                  <Pressable
                    onPress={() => setSearchVisible(true)}
                    hitSlop={10}
                  >
                    <Text style={styles.sectionAction}>Xem thêm</Text>
                  </Pressable>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recommendRow}
                  keyboardShouldPersistTaps="handled"
                >
                  {recommendations.map((place, index) => (
                    <RecommendationCard
                      key={place.id}
                      place={place}
                      index={index}
                      onPress={() => router.push(`/place/${place.id}`)}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {!heroCarousel.length && !recommendations.length ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="explore-off" size={42} color={TEXT_SOFT} />
                <Text style={styles.emptyStateTitle}>
                  Chưa có địa điểm phù hợp
                </Text>
                <Text style={styles.emptyStateCopy}>
                  Hãy chọn danh mục khác hoặc mở tìm kiếm để xem toàn bộ địa
                  điểm.
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <SearchOverlay
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingHorizontal: PAD,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  greetingBlock: {
    flex: 1,
  },
  greetingTitle: {
    color: TEXT,
    fontSize: 35 / 1.75,
    letterSpacing: -0.2,
    fontFamily: TOKENS.font.semibold,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroIntro: {
    marginTop: 20,
  },
  greetingEyebrow: {
    color: "#64748B",
    fontSize: 12,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    fontFamily: TOKENS.font.semibold,
  },
  weatherChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F4F8FD",
    borderWidth: 1,
    borderColor: "#DFE7F1",
  },
  weatherChipLabel: {
    color: "#334155",
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 10,
    gap: 16,
  },
  heroCopy: {
    flex: 1,
    maxWidth: 232,
  },
  heroTitle: {
    color: TEXT,
    fontSize: 60 / 1.5,
    lineHeight: 66 / 1.5,
    letterSpacing: -1.1,
    fontFamily: TOKENS.font.heading,
  },
  searchLauncher: {
    width: 56,
    height: 112,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
    }),
  },
  searchLauncherPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.985 }],
  },
  categoryRow: {
    gap: 12,
    paddingTop: 18,
    paddingBottom: 6,
    paddingRight: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFE7F1",
  },
  categoryChipActive: {
    backgroundColor: "#0F2942",
    borderColor: "#0F2942",
  },
  categoryChipActiveShadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#0F2942",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  categoryChipText: {
    color: "#475569",
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  loadingBlock: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  heroSection: {
    marginTop: 12,
  },
  heroCarousel: {
    gap: 14,
    paddingRight: PAD,
    paddingBottom: 6,
  },
  featuredCard: {
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#0c4a6e",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
      },
      android: { elevation: 9 },
    }),
  },
  featuredCardSecondary: {
    backgroundColor: "#155e75",
  },
  featuredGradientBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "62%",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  featuredFavoriteBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 2,
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.38)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  featuredFooterGlass: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    zIndex: 2,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
    }),
  },
  featuredFooterTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  featuredFooterTextCol: {
    flex: 1,
    minWidth: 0,
  },
  featuredLocRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  featuredRatingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(239, 246, 255, 0.95)",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  featuredRatingNum: {
    color: PRIMARY,
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    fontWeight: "800",
  },
  featuredFooterBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  featuredRatingsCap: {
    color: TEXT_MUTED,
    fontSize: 9,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  featuredPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  featuredPriceMain: {
    color: TEXT,
    fontSize: 16,
    fontFamily: TOKENS.font.heading,
    fontWeight: "800",
  },
  featuredPriceSuffix: {
    color: TEXT_MUTED,
    fontSize: 9,
    fontFamily: TOKENS.font.semibold,
    marginLeft: 2,
  },
  featuredPriceSpacer: {
    minWidth: 8,
  },
  featuredTitle: {
    color: "#0f172a",
    fontSize: 15,
    lineHeight: 19,
    letterSpacing: -0.4,
    fontFamily: TOKENS.font.heading,
    fontWeight: "700",
  },
  featuredLocation: {
    color: "#475569",
    fontSize: 10,
    lineHeight: 14,
    fontFamily: TOKENS.font.medium,
    flex: 1,
  },
  section: {
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 30 / 1.5,
    letterSpacing: -0.7,
    fontFamily: TOKENS.font.heading,
    fontWeight: "800",
  },
  sectionAction: {
    color: PRIMARY,
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
  },
  recommendRow: {
    gap: 12,
    paddingRight: PAD,
  },
  recommendMiniCard: {
    width: 196,
    height: 134,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#0c4a6e",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 14,
      },
      android: { elevation: 6 },
    }),
  },
  recommendMiniShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 20, 40, 0.24)",
  },
  recommendMiniBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  recommendMiniBadgeText: {
    color: "#F8FAFC",
    fontSize: 10,
    fontFamily: TOKENS.font.semibold,
  },
  recommendMiniBody: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.93)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  recommendMiniTitle: {
    color: TEXT,
    fontSize: 13,
    lineHeight: 16,
    fontFamily: TOKENS.font.heading,
    fontWeight: "700",
  },
  recommendMiniSub: {
    color: TEXT_MUTED,
    fontSize: 10,
    marginTop: 2,
    fontFamily: TOKENS.font.medium,
  },
  recommendMiniMeta: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  recommendMiniMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recommendMiniMetaText: {
    color: "#334155",
    fontSize: 9,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 36,
    padding: 24,
    borderRadius: 24,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyStateTitle: {
    color: TEXT,
    fontSize: 18,
    fontFamily: TOKENS.font.semibold,
    marginTop: 10,
  },
  emptyStateCopy: {
    color: TEXT_MUTED,
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    fontFamily: TOKENS.font.body,
  },
  pressedCard: {
    opacity: 0.95,
    transform: [{ scale: 0.985 }],
  },
  searchScreen: {
    flex: 1,
    backgroundColor: BG,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: PAD,
    paddingTop: 56,
    paddingBottom: 12,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  searchInput: {
    flex: 1,
    color: TEXT,
    fontSize: 15,
    fontFamily: TOKENS.font.body,
  },
  searchCancel: {
    color: NAVY,
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
  searchChipRow: {
    gap: 10,
    paddingHorizontal: PAD,
    paddingTop: 4,
    paddingBottom: 14,
    paddingRight: PAD + 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  filterChipActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  filterChipText: {
    color: NAVY,
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  searchEmptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  searchEmptyTitle: {
    color: TEXT,
    fontSize: 18,
    marginTop: 12,
    fontFamily: TOKENS.font.semibold,
  },
  searchEmptyCopy: {
    color: TEXT_MUTED,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
    fontFamily: TOKENS.font.body,
  },
  searchResults: {
    paddingHorizontal: PAD,
    paddingBottom: 40,
    gap: 10,
  },
  searchResultCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 12,
    borderRadius: 22,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  searchResultThumb: {
    width: 64,
    height: 64,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#DDEFF8",
  },
  searchResultFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDEFF8",
  },
  searchResultBody: {
    flex: 1,
  },
  searchResultTitle: {
    color: TEXT,
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
  },
  searchResultMeta: {
    color: TEXT_MUTED,
    fontSize: 12,
    marginTop: 4,
    fontFamily: TOKENS.font.body,
  },
});
