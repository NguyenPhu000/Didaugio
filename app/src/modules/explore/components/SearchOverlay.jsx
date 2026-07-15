import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
} from "../../../constants/design-tokens";
import { useExplore, useCategories } from "../hooks/useExplore";
import { useBoundaryData } from "../../map/hooks/useBoundaryData";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import { getPlaceLocation, normalizeText } from "../utils/exploreHelpers";

const isNewArchitectureEnabled = global?.nativeFabricUIManager != null;
if (
  Platform.OS === "android" &&
  !isNewArchitectureEnabled &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const LAYOUT_ANIM = {
  duration: 200,
  create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
  update: { type: LayoutAnimation.Types.easeInEaseOut },
  delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
};
const SEARCH_DEBOUNCE_MS = 300;
const RATING_FILTERS = [
  { label: "4.5+", value: 4.5 },
  { label: "4.0+", value: 4 },
  { label: "3.5+", value: 3.5 },
];

const buildPlaceSearchIndex = (place) =>
  normalizeText(
    [
      place?.name,
      place?.shortDescription,
      place?.description,
      place?.address,
      place?.district?.name,
      place?.ward?.name,
      place?.category?.name,
    ]
      .filter(Boolean)
      .join(" "),
  );

const pickDistricts = (geojson) => {
  const features = Array.isArray(geojson?.features) ? geojson.features : [];
  return features
    .map((feature) => ({
      id:
        feature?.properties?.id ??
        feature?.properties?.districtId ??
        feature?.properties?.gid ??
        feature?.id ??
        null,
      name:
        feature?.properties?.name ||
        feature?.properties?.district ||
        feature?.properties?.ten ||
        "Khu vực",
    }))
    .filter((district) => district.id != null && district.name)
    .sort((a, b) => String(a.name).localeCompare(String(b.name), "vi"))
    .slice(0, 12);
};

const SearchResultItem = memo(function SearchResultItem({
  place,
  placeId,
  onPressPlace,
}) {
  const imageUri = resolvePlaceImageUri(place);
  const location = getPlaceLocation(place);
  const rating = Number(place?.ratingAvg ?? place?.averageRating ?? 0);
  const handlePress = useCallback(() => {
    if (placeId != null) {
      onPressPlace(placeId);
    }
  }, [onPressPlace, placeId]);

  return (
    <Pressable onPress={handlePress} className="flex-row items-center gap-3.5 py-3 border-b border-[#F2F2F7]">
      <View className="w-14 h-14 rounded-[14px] overflow-hidden bg-[#F2F2F7] items-center justify-center relative">
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            contentFit="cover"
            cachePolicy="memory-disk"
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, width: "100%", height: "100%" }}
          />
        ) : (
          <MaterialIconsRounded name="place" size={22} color="rgba(255,255,255,0.4)" />
        )}
      </View>

      <View className="flex-1 gap-0.5">
        <Text className="text-ink text-sm font-semibold" numberOfLines={1}>
          {place?.name}
        </Text>
        {location ? (
          <View className="flex-row items-center gap-0.75">
            <MaterialIconsRounded
              name="place"
              size={12}
              color={APPLE_THEME.focusBlue}
            />
            <Text className="text-ink-muted text-[11px] font-medium" numberOfLines={1}>
              {location}
            </Text>
          </View>
        ) : null}
        {rating > 0 ? (
          <View className="flex-row items-center gap-0.75">
            <MaterialIconsRounded name="star" size={12} color="#FBBF24" />
            <Text className="text-ink text-[11px] font-semibold">{rating.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>

      <MaterialIconsRounded
        name="chevron-right"
        size={20}
        color={APPLE_THEME.textMuted}
      />
    </Pressable>
  );
});

export const SearchOverlay = memo(function SearchOverlayInner({ visible, onClose }) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const PRICE_FILTERS = useMemo(() => [
    { label: t("explore.search.price.free"), value: "FREE" },
    { label: t("explore.search.price.budget"), value: "BUDGET" },
    { label: t("explore.search.price.midRange"), value: "MODERATE" },
    { label: t("explore.search.price.premium"), value: "EXPENSIVE" },
  ], [t]);

  const SORT_OPTIONS = useMemo(() => [
    { label: t("explore.search.sort.newest"), value: "newest" },
    { label: t("explore.search.sort.rating"), value: "rating" },
    { label: t("explore.search.sort.popular"), value: "popular" },
  ], [t]);
  const [text, setText] = useState("");
  const [debouncedText, setDebouncedText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [selectedMinRating, setSelectedMinRating] = useState(null);
  const [selectedSortBy, setSelectedSortBy] = useState("newest");
  const { data: categories = [] } = useCategories();
  const { districts } = useBoundaryData();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(text.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const districtOptions = useMemo(() => pickDistricts(districts), [districts]);

  const isActive =
    debouncedText.length > 0 ||
    selectedCategory !== null ||
    selectedDistrict !== null ||
    selectedPriceRange !== null ||
    selectedMinRating !== null ||
    selectedSortBy !== "newest";

  const { data, isFetching, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useExplore({
      search: debouncedText,
      categoryId: selectedCategory,
      districtId: selectedDistrict,
      priceRange: selectedPriceRange,
      minRating: selectedMinRating,
      sortBy: selectedSortBy,
      enabled: visible && isActive,
    });

  const isInitialLoad = isPending && !data;

  const results = useMemo(() => {
    const raw = data?.pages.flatMap((page) => page?.data || []) ?? [];
    const normalizedQuery = normalizeText(debouncedText);
    const seen = new Set();

    return raw
      .filter((place) => {
        const placeId = place?.id;
        if (placeId == null) return false;
        if (seen.has(placeId)) return false;
        seen.add(placeId);
        return true;
      })
      .filter((place) => {
        if (!normalizedQuery) return true;
        return buildPlaceSearchIndex(place).includes(normalizedQuery);
      });
  }, [data, debouncedText]);

  const animateFilterChange = useCallback((setter, value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LAYOUT_ANIM);
    setter(value);
  }, []);

  const handleClose = useCallback(() => {
    setText("");
    setDebouncedText("");
    setSelectedCategory(null);
    setSelectedDistrict(null);
    setSelectedPriceRange(null);
    setSelectedMinRating(null);
    setSelectedSortBy("newest");
    onClose();
  }, [onClose]);

  const handlePressPlace = useCallback(
    (placeId) => {
      handleClose();
      if (placeId) {
        router.push({ pathname: "/place/[id]", params: { id: placeId } });
      }
    },
    [handleClose, router],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }) => (
      <SearchResultItem
        place={item}
        placeId={item?.id}
        onPressPlace={handlePressPlace}
      />
    ),
    [handlePressPlace],
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
        {/* Search header */}
        <View className="flex-row items-center gap-3.5 px-5 pb-2.5">
          <View className="flex-1 flex-row items-center gap-2.5 h-11 px-3.5 rounded-[14px] bg-[#FFFFFF] border border-[#F2F2F7]">
            <MaterialIconsRounded
              name="search"
              size={20}
              color={text ? APPLE_THEME.text : APPLE_THEME.textMuted}
            />
            <TextInput
              autoFocus
              value={text}
              onChangeText={setText}
              placeholder={t("explore.search.placeholder")}
              placeholderTextColor={APPLE_THEME.textMuted}
              className="flex-1 text-ink text-sm py-0 font-sans"
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {text ? (
              <Pressable onPress={() => setText("")} hitSlop={10}>
                <MaterialIconsRounded
                  name="close"
                  size={18}
                  color={APPLE_THEME.textMuted}
                />
              </Pressable>
            ) : null}
          </View>
          <Pressable onPress={handleClose} hitSlop={10}>
            <Text className="text-primary text-sm font-semibold">{t("explore.search.close")}</Text>
          </Pressable>
        </View>

        {isActive ? (
          <View className="flex-row items-center justify-between px-5 pb-2 gap-2">
            <Text className="text-ink-muted text-xs font-medium">
              {t("explore.search.resultsMatch", { count: results.length })}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                LayoutAnimation.configureNext(LAYOUT_ANIM);
                setText("");
                setDebouncedText("");
                setSelectedCategory(null);
                setSelectedDistrict(null);
                setSelectedPriceRange(null);
                setSelectedMinRating(null);
                setSelectedSortBy("newest");
              }}
              className="flex-row items-center gap-1 px-2.5 h-7 rounded-full bg-black/[0.04] border border-[#F2F2F7]"
            >
              <MaterialIconsRounded
                name="refresh"
                size={14}
                color={APPLE_THEME.focusBlue}
              />
              <Text className="text-primary-500 text-[11px] font-semibold">{t("explore.search.resetFilters")}</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Subtle fetching indicator */}
        {isFetching && !isInitialLoad ? (
          <View className="h-[2px] bg-primary-500/20">
            <View className="h-full w-1/3 bg-primary-500 rounded-full" />
          </View>
        ) : null}

        {/* Category chips */}
        {categories.length > 0 ? (
          <View className="shrink-0 mb-0.5">
            <Text className="px-5 pt-1.5 text-ink-muted text-[11px] font-semibold uppercase tracking-[0.4px]">{t("explore.search.tabs.categories")}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 8, alignItems: "center" }}
              keyboardShouldPersistTaps="handled"
            >
              <Pressable
                onPress={() => animateFilterChange(setSelectedCategory, null)}
                className={`px-4 py-2 rounded-full border self-center justify-center h-9 ${
                  selectedCategory === null ? "bg-primary-500 border-primary-500" : "bg-white border-[#E5E5EA]"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedCategory === null ? "text-white" : "text-ink-muted"
                  }`}
                >
                  {t("common.all")}
                </Text>
              </Pressable>

              {categories.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => animateFilterChange(setSelectedCategory, active ? null : cat.id)}
                    className={`px-4 py-2 rounded-full border self-center justify-center h-9 ${
                      active ? "bg-primary-500 border-primary-500" : "bg-white border-[#E5E5EA]"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        active ? "text-white" : "text-ink-muted"
                      }`}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {districtOptions.length > 0 ? (
          <View className="shrink-0 mb-0.5">
            <Text className="px-5 pt-1.5 text-ink-muted text-[11px] font-semibold uppercase tracking-[0.4px]">{t("explore.search.tabs.areas")}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 8, alignItems: "center" }}
              keyboardShouldPersistTaps="handled"
            >
              <Pressable
                onPress={() => animateFilterChange(setSelectedDistrict, null)}
                className={`px-4 py-2 rounded-full border self-center justify-center h-9 ${
                  selectedDistrict === null ? "bg-primary-500 border-primary-500" : "bg-white border-[#E5E5EA]"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedDistrict === null ? "text-white" : "text-ink-muted"
                  }`}
                >
                  {t("common.all")}
                </Text>
              </Pressable>

              {districtOptions.map((district) => {
                const id = Number(district.id);
                if (!Number.isInteger(id) || id <= 0) return null;
                const active = selectedDistrict === id;
                return (
                  <Pressable
                    key={String(district.id)}
                    onPress={() => animateFilterChange(setSelectedDistrict, active ? null : id)}
                    className={`px-4 py-2 rounded-full border self-center justify-center h-9 ${
                      active ? "bg-primary-500 border-primary-500" : "bg-white border-[#E5E5EA]"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        active ? "text-white" : "text-ink-muted"
                      }`}
                    >
                      {district.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View className="shrink-0 mb-0.5">
          <Text className="px-5 pt-1.5 text-ink-muted text-[11px] font-semibold uppercase tracking-[0.4px]">{t("explore.search.tabs.price")}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 8, alignItems: "center" }}
            keyboardShouldPersistTaps="handled"
          >
            {PRICE_FILTERS.map((item) => {
              const active = selectedPriceRange === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() =>
                    animateFilterChange(setSelectedPriceRange, active ? null : item.value)
                  }
                  className={`px-4 py-2 rounded-full border self-center justify-center h-9 ${
                    active ? "bg-primary-500 border-primary-500" : "bg-white border-[#E5E5EA]"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      active ? "text-white" : "text-ink-muted"
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View className="shrink-0 mb-0.5">
          <Text className="px-5 pt-1.5 text-ink-muted text-[11px] font-semibold uppercase tracking-[0.4px]">{t("explore.search.tabs.ratingSort")}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 8, alignItems: "center" }}
            keyboardShouldPersistTaps="handled"
          >
            {RATING_FILTERS.map((item) => {
              const active = selectedMinRating === item.value;
              return (
                <Pressable
                  key={String(item.value)}
                  onPress={() =>
                    animateFilterChange(setSelectedMinRating, active ? null : item.value)
                  }
                  className={`px-4 py-2 rounded-full border self-center justify-center h-9 ${
                    active ? "bg-primary-500 border-primary-500" : "bg-white border-[#E5E5EA]"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      active ? "text-white" : "text-ink-muted"
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
            {SORT_OPTIONS.map((item) => {
              const active = selectedSortBy === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => animateFilterChange(setSelectedSortBy, item.value)}
                  className={`px-4 py-2 rounded-full border self-center justify-center h-9 ${
                    active ? "bg-primary-500 border-primary-500" : "bg-white border-[#E5E5EA]"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      active ? "text-white" : "text-ink-muted"
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Results */}
        {isInitialLoad ? (
          <View className="flex-1 items-center justify-center gap-2.5 px-12">
            <ActivityIndicator color={APPLE_THEME.focusBlue} />
          </View>
        ) : !isActive ? (
          <View className="flex-1 items-center justify-center gap-2.5 px-12">
            <MaterialIconsRounded
              name="travel-explore"
              size={42}
              color={APPLE_THEME.textMuted}
            />
            <Text className="text-ink text-[17px] font-bold text-center mt-1">{t("explore.search.searchNext")}</Text>
            <Text className="text-ink-muted text-sm text-center leading-5">
              {t("explore.header.searchPlaceholder")}
            </Text>
          </View>
        ) : results.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-2.5 px-12">
            <MaterialIconsRounded
              name="search-off"
              size={42}
              color={APPLE_THEME.textMuted}
            />
            <Text className="text-ink text-[17px] font-bold text-center mt-1">{t("explore.search.noResults")}</Text>
            <Text className="text-ink-muted text-sm text-center leading-5">
              {t("explore.empty.noResultsDesc")}
            </Text>
          </View>
        ) : (
          <FlashList
            data={results}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            estimatedItemSize={84}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={
              isFetchingNextPage ? (
                <ActivityIndicator
                  color={APPLE_THEME.focusBlue}
                  className="py-5"
                />
              ) : null
            }
          />
        )}
      </View>
    </Modal>
  );
});
