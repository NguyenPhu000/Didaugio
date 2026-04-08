import { memo, useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Linking,
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
import { useHomeData } from "./hooks/useHomeData";
import { useMapPlaces } from "./hooks/useMapPlaces";
import {
  CATEGORY_MARKER_STYLES,
  DEFAULT_CATEGORY_ICON,
} from "./config/mapConfig";
import {
  PlacePreviewCard,
  getPlaceRatingValue,
  getPlaceReviewCount,
} from "../../components/composed/PlacePreviewCard";
import { TOKENS } from "../../constants/design-tokens";

const QUICK_FILTER_OPTIONS = [
  { key: "topRated", label: "Danh gia cao", icon: "star" },
  { key: "trending", label: "Trending", icon: "local-fire-department" },
  { key: "budget", label: "Gia re", icon: "savings" },
  { key: "premium", label: "Cao cap", icon: "workspace-premium" },
  { key: "openNow", label: "Mo cua", icon: "schedule" },
];

const BUDGET_PRICE_RANGES = new Set(["FREE", "BUDGET", "MODERATE"]);
const PREMIUM_PRICE_RANGES = new Set(["EXPENSIVE", "LUXURY"]);

const toSearchableText = (place) =>
  [
    place?.name,
    place?.address,
    place?.category?.name,
    place?.ward?.name,
    place?.district?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const parseTimeToMinutes = (timeText) => {
  if (typeof timeText !== "string") return null;
  const [hourText, minuteText] = timeText.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
};

const isPlaceOpenNow = (place) => {
  const openingHours = Array.isArray(place?.openingHours)
    ? place.openingHours
    : [];

  if (openingHours.length === 0) return true;

  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSchedule = openingHours.find(
    (item) => Number(item?.dayOfWeek) === currentDay,
  );

  if (!currentSchedule) return true;
  if (currentSchedule?.isClosed) return false;

  const openMinutes = parseTimeToMinutes(currentSchedule?.openTime);
  const closeMinutes = parseTimeToMinutes(currentSchedule?.closeTime);

  if (openMinutes == null || closeMinutes == null) return true;

  if (closeMinutes >= openMinutes) {
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }

  return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
};

const CategoryChip = memo(({ category, active, onToggle }) => {
  const meta =
    category.id === null
      ? { ...DEFAULT_CATEGORY_ICON, icon: "apps" }
      : CATEGORY_MARKER_STYLES[category.id] || DEFAULT_CATEGORY_ICON;

  return (
    <Pressable
      onPress={() => onToggle(category.id)}
      style={[styles.chip, active ? styles.chipActive : null]}
    >
      <MaterialIcons
        name={meta.icon}
        size={14}
        color={active ? "#FFFFFF" : "#475569"}
      />
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>
        {category.name}
      </Text>
    </Pressable>
  );
});

const QuickFilterChip = memo(({ option, active, onToggle }) => (
  <Pressable
    onPress={() => onToggle(option.key)}
    style={[
      styles.chip,
      active ? styles.quickFilterChipActive : styles.quickFilterChip,
    ]}
  >
    <MaterialIcons
      name={option.icon}
      size={14}
      color={active ? "#FFFFFF" : "#475569"}
    />
    <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>
      {option.label}
    </Text>
  </Pressable>
));

export default function MapScreenWeb() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [searchText, setSearchText] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [quickFilters, setQuickFilters] = useState({
    topRated: false,
    trending: false,
    budget: false,
    premium: false,
    openNow: false,
  });

  const {
    data: mapPlaces,
    isLoading: isPlacesLoading,
    error: placesError,
    refetch: refetchPlaces,
  } = useMapPlaces();

  const { data: homeData } = useHomeData({ limit: 12 });

  const allPlaces = useMemo(
    () => (Array.isArray(mapPlaces) ? mapPlaces : []),
    [mapPlaces],
  );

  const categories = useMemo(() => {
    const homeCategories =
      homeData?.categories ||
      homeData?.data?.categories ||
      homeData?.data?.data?.categories ||
      [];

    if (Array.isArray(homeCategories) && homeCategories.length > 0) {
      return homeCategories
        .map((item) => ({ id: item?.id, name: item?.name }))
        .filter((item) => item.id != null && item.name);
    }

    const derived = new Map();
    allPlaces.forEach((place) => {
      const id = place?.categoryId ?? place?.category?.id;
      const name = place?.category?.name;
      if (id == null || !name) return;
      const key = String(id);
      if (!derived.has(key)) {
        derived.set(key, { id, name });
      }
    });

    return Array.from(derived.values());
  }, [homeData, allPlaces]);

  const visiblePlaces = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return allPlaces.filter((place) => {
      const categoryId = place?.categoryId ?? place?.category?.id;
      if (
        activeCategoryId !== null &&
        String(categoryId ?? "") !== String(activeCategoryId)
      ) {
        return false;
      }

      if (
        normalizedSearch &&
        !toSearchableText(place).includes(normalizedSearch)
      ) {
        return false;
      }

      if (quickFilters.topRated && getPlaceRatingValue(place) < 4.5) {
        return false;
      }

      if (quickFilters.trending && getPlaceReviewCount(place) < 20) {
        return false;
      }

      const priceRangeKey = String(place?.priceRange || "").toUpperCase();
      if (quickFilters.budget && !BUDGET_PRICE_RANGES.has(priceRangeKey)) {
        return false;
      }
      if (quickFilters.premium && !PREMIUM_PRICE_RANGES.has(priceRangeKey)) {
        return false;
      }

      if (quickFilters.openNow && !isPlaceOpenNow(place)) {
        return false;
      }

      return true;
    });
  }, [activeCategoryId, allPlaces, quickFilters, searchText]);

  const handleCategoryToggle = useCallback((categoryId) => {
    setActiveCategoryId((prev) => (prev === categoryId ? null : categoryId));
  }, []);

  const handleQuickFilterToggle = useCallback((filterKey) => {
    setQuickFilters((prev) => {
      if (filterKey === "budget") {
        return {
          ...prev,
          budget: !prev.budget,
          premium: false,
        };
      }

      if (filterKey === "premium") {
        return {
          ...prev,
          premium: !prev.premium,
          budget: false,
        };
      }

      return {
        ...prev,
        [filterKey]: !prev[filterKey],
      };
    });
  }, []);

  const handleOpenPlaceDetail = useCallback(
    (place) => {
      if (!place?.id) return;
      router.push(`/place/${place.id}`);
    },
    [router],
  );

  const handleOpenExternalMap = useCallback(async (place) => {
    if (
      !Number.isFinite(place?.latitude) ||
      !Number.isFinite(place?.longitude)
    ) {
      return;
    }

    const query = encodeURIComponent(`${place.latitude},${place.longitude}`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

    try {
      await Linking.openURL(mapsUrl);
    } catch {
      // Do nothing on web-open failures.
    }
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: (insets.top || 0) + 12 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.noticeCard}>
          <MaterialIcons
            name="public"
            size={18}
            color={TOKENS.color.primary[600]}
          />
          <View style={styles.noticeTextWrap}>
            <Text style={styles.noticeTitle}>
              Che do web dang su dung danh sach
            </Text>
            <Text style={styles.noticeSubtext}>
              Ban do native khong ho tro tren web. Ban van co the tim, loc va mo
              dia diem tren Google Maps.
            </Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <MaterialIcons
            name="search"
            size={18}
            color={TOKENS.color.neutral[500]}
          />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Tim kiem dia diem..."
            placeholderTextColor={TOKENS.color.neutral[400]}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {searchText ? (
            <Pressable onPress={() => setSearchText(" ".trim())}>
              <MaterialIcons
                name="close"
                size={18}
                color={TOKENS.color.neutral[500]}
              />
            </Pressable>
          ) : null}
        </View>

        {categories.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            keyboardShouldPersistTaps="handled"
          >
            <CategoryChip
              category={{ id: null, name: "Tat ca" }}
              active={activeCategoryId === null}
              onToggle={handleCategoryToggle}
            />
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                category={category}
                active={activeCategoryId === category.id}
                onToggle={handleCategoryToggle}
              />
            ))}
          </ScrollView>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          keyboardShouldPersistTaps="handled"
        >
          {QUICK_FILTER_OPTIONS.map((option) => (
            <QuickFilterChip
              key={option.key}
              option={option}
              active={quickFilters[option.key] === true}
              onToggle={handleQuickFilterToggle}
            />
          ))}
        </ScrollView>

        <Text style={styles.summaryText}>
          Tim thay {visiblePlaces.length} dia diem
        </Text>

        {isPlacesLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={TOKENS.color.primary[500]} />
            <Text style={styles.stateText}>Dang tai du lieu...</Text>
          </View>
        ) : null}

        {placesError ? (
          <View style={styles.centerState}>
            <MaterialIcons
              name="wifi-off"
              size={24}
              color={TOKENS.color.error}
            />
            <Text style={styles.stateText}>
              Khong tai duoc du lieu dia diem
            </Text>
            <Pressable
              onPress={() => refetchPlaces?.()}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Thu lai</Text>
            </Pressable>
          </View>
        ) : null}

        {!isPlacesLoading && !placesError && visiblePlaces.length === 0 ? (
          <View style={styles.centerState}>
            <MaterialIcons
              name="search-off"
              size={24}
              color={TOKENS.color.neutral[500]}
            />
            <Text style={styles.stateText}>
              Khong co dia diem phu hop bo loc
            </Text>
          </View>
        ) : null}

        {!isPlacesLoading && !placesError
          ? visiblePlaces.map((place, index) => (
              <View key={place?.id ?? index} style={styles.placeBlock}>
                <PlacePreviewCard
                  place={place}
                  compact={false}
                  showCloseButton={false}
                  onViewDetail={handleOpenPlaceDetail}
                />

                <Pressable
                  onPress={() => handleOpenExternalMap(place)}
                  style={styles.mapButton}
                >
                  <MaterialIcons
                    name="map"
                    size={16}
                    color={TOKENS.color.primary[700]}
                  />
                  <Text style={styles.mapButtonText}>Mo tren Google Maps</Text>
                </Pressable>
              </View>
            ))
          : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.color.background.light,
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 24,
    gap: 10,
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.28)",
    backgroundColor: "rgba(239,246,255,0.95)",
    padding: 12,
  },
  noticeTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  noticeTitle: {
    fontSize: 13,
    lineHeight: 18,
    color: TOKENS.color.neutral[900],
    fontFamily: TOKENS.font.semibold,
  },
  noticeSubtext: {
    fontSize: 12,
    lineHeight: 17,
    color: TOKENS.color.neutral[600],
    fontFamily: TOKENS.font.body,
  },
  searchWrap: {
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.28)",
    backgroundColor: "rgba(255,255,255,0.95)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    color: TOKENS.color.neutral[900],
    fontSize: 14,
    fontFamily: TOKENS.font.medium,
  },
  chipRow: {
    gap: 8,
    paddingHorizontal: 2,
  },
  chip: {
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  chipActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  quickFilterChip: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
  },
  quickFilterChipActive: {
    backgroundColor: TOKENS.color.primary[500],
    borderColor: TOKENS.color.primary[500],
  },
  chipText: {
    fontSize: 12,
    color: TOKENS.color.neutral[700],
    fontFamily: TOKENS.font.semibold,
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  summaryText: {
    fontSize: 12,
    color: TOKENS.color.neutral[600],
    fontFamily: TOKENS.font.medium,
    marginTop: 4,
  },
  centerState: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.24)",
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 22,
    gap: 10,
  },
  stateText: {
    fontSize: 13,
    color: TOKENS.color.neutral[700],
    fontFamily: TOKENS.font.medium,
  },
  retryButton: {
    height: 32,
    borderRadius: 999,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TOKENS.color.primary[600],
  },
  retryText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontFamily: TOKENS.font.semibold,
  },
  placeBlock: {
    gap: 8,
    marginTop: 2,
  },
  mapButton: {
    alignSelf: "flex-end",
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.28)",
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mapButtonText: {
    fontSize: 12,
    color: TOKENS.color.primary[700],
    fontFamily: TOKENS.font.semibold,
  },
});
