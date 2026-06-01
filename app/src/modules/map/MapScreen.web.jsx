import { memo, useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useHomeData } from "./hooks/useHomeData";
import { useMapPlaces } from "./hooks/useMapPlaces";
import {
  CATEGORY_MARKER_STYLES,
  DEFAULT_CATEGORY_ICON,
} from "./config/mapConfig";
import { MAP_TEXT } from "./constants/mapText.constants";
import {
  BUDGET_PRICE_RANGES,
  PREMIUM_PRICE_RANGES,
  QUICK_FILTER_OPTIONS,
} from "./constants/filter.constants";
import {
  PlacePreviewCard,
  getPlaceRatingValue,
  getPlaceReviewCount,
} from "../../components/composed/PlacePreviewCard";
import { isPlaceOpenNow } from "./utils/placeFilter";
import { TOKENS } from "../../constants/design-tokens";
import { cn } from "../../lib/cn";

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

const CategoryChip = memo(({ category, active, onToggle }) => {
  const meta =
    category.id === null
      ? { ...DEFAULT_CATEGORY_ICON, icon: "apps" }
      : CATEGORY_MARKER_STYLES[category.id] || DEFAULT_CATEGORY_ICON;

  return (
    <Pressable
      onPress={() => onToggle(category.id)}
      className={cn(
        "h-[34px] flex-row items-center gap-[5px] rounded-full border px-3",
        active ? "border-ink bg-ink" : "border-[#E5E7EB] bg-white",
      )}
    >
      <MaterialIconsRounded
        name={meta.icon}
        size={14}
        color={active ? "#FFFFFF" : "#475569"}
      />
      <Text
        className={cn(
          "text-xs font-semibold",
          active ? "text-white" : "text-ink-secondary",
        )}
      >
        {category.name}
      </Text>
    </Pressable>
  );
});

const QuickFilterChip = memo(({ option, active, onToggle }) => (
  <Pressable
    onPress={() => onToggle(option.key)}
    className={cn(
      "h-[34px] flex-row items-center gap-[5px] rounded-full border px-3",
      active ? "border-primary-500 bg-primary-500" : "border-[#E5E7EB] bg-white",
    )}
  >
    <MaterialIconsRounded
      name={option.icon}
      size={14}
      color={active ? "#FFFFFF" : "#475569"}
    />
    <Text
      className={cn(
        "text-xs font-semibold",
        active ? "text-white" : "text-ink-secondary",
      )}
    >
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
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingBottom: 24,
          gap: 10,
          paddingTop: (insets.top || 0) + 12,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          className="flex-row items-start gap-2.5 rounded-[14px] border p-3"
          style={{
            borderColor: "rgba(59,130,246,0.28)",
            backgroundColor: "rgba(239,246,255,0.95)",
          }}
        >
          <MaterialIconsRounded
            name="public"
            size={18}
            color={TOKENS.color.primary[600]}
          />
          <View className="flex-1 min-w-0 gap-0.5">
            <Text
              className="text-[13px] font-semibold leading-[18px]"
              style={{ color: TOKENS.color.neutral[900], fontFamily: TOKENS.font.semibold }}
            >
              {MAP_TEXT.web.noticeTitle}
            </Text>
            <Text
              className="text-xs leading-[17px]"
              style={{ color: TOKENS.color.neutral[600], fontFamily: TOKENS.font.body }}
            >
              {MAP_TEXT.web.noticeSubtext}
            </Text>
          </View>
        </View>

        <View
          className="h-[46px] flex-row items-center gap-2 rounded-[23px] border px-3.5"
          style={{
            borderColor: "rgba(148,163,184,0.28)",
            backgroundColor: "rgba(255,255,255,0.95)",
          }}
        >
          <MaterialIconsRounded
            name="search"
            size={18}
            color={TOKENS.color.neutral[500]}
          />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder={MAP_TEXT.search.placeholder}
            placeholderTextColor={TOKENS.color.neutral[400]}
            className="flex-1 h-full text-sm"
            style={{
              color: TOKENS.color.neutral[900],
              fontFamily: TOKENS.font.medium,
            }}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {searchText ? (
            <Pressable onPress={() => setSearchText("")}>
              <MaterialIconsRounded
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
            contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
            keyboardShouldPersistTaps="handled"
          >
            <CategoryChip
              category={{ id: null, name: MAP_TEXT.web.allCategories }}
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
          contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
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

        <Text
          className="text-xs mt-1"
          style={{ color: TOKENS.color.neutral[600], fontFamily: TOKENS.font.medium }}
        >
          {MAP_TEXT.web.summaryFound(visiblePlaces.length)}
        </Text>

        {isPlacesLoading ? (
          <View
            className="items-center justify-center rounded-[14px] border py-[22px] gap-2.5"
            style={{
              borderColor: "rgba(148,163,184,0.24)",
              backgroundColor: "rgba(255,255,255,0.95)",
            }}
          >
            <ActivityIndicator size="large" color={TOKENS.color.primary[500]} />
            <Text
              className="text-[13px]"
              style={{ color: TOKENS.color.neutral[700], fontFamily: TOKENS.font.medium }}
            >
              {MAP_TEXT.web.loadingPlaces}
            </Text>
          </View>
        ) : null}

        {placesError ? (
          <View
            className="items-center justify-center rounded-[14px] border py-[22px] gap-2.5"
            style={{
              borderColor: "rgba(148,163,184,0.24)",
              backgroundColor: "rgba(255,255,255,0.95)",
            }}
          >
            <MaterialIconsRounded
              name="wifi-off"
              size={24}
              color={TOKENS.color.error}
            />
            <Text
              className="text-[13px]"
              style={{ color: TOKENS.color.neutral[700], fontFamily: TOKENS.font.medium }}
            >
              {MAP_TEXT.web.placesLoadError}
            </Text>
            <Pressable
              onPress={() => refetchPlaces?.()}
              className="h-8 items-center justify-center rounded-full px-3.5"
              style={{ backgroundColor: TOKENS.color.primary[600] }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: "#FFFFFF", fontFamily: TOKENS.font.semibold }}
              >
                {MAP_TEXT.errors.retry}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {!isPlacesLoading && !placesError && visiblePlaces.length === 0 ? (
          <View
            className="items-center justify-center rounded-[14px] border py-[22px] gap-2.5"
            style={{
              borderColor: "rgba(148,163,184,0.24)",
              backgroundColor: "rgba(255,255,255,0.95)",
            }}
          >
            <MaterialIconsRounded
              name="search-off"
              size={24}
              color={TOKENS.color.neutral[500]}
            />
            <Text
              className="text-[13px]"
              style={{ color: TOKENS.color.neutral[700], fontFamily: TOKENS.font.medium }}
            >
              {MAP_TEXT.web.noPlacesForFilters}
            </Text>
          </View>
        ) : null}

        {!isPlacesLoading && !placesError
          ? visiblePlaces.map((place, index) => (
              <View key={place?.id ?? index} className="gap-2 mt-0.5">
                <PlacePreviewCard
                  place={place}
                  compact={false}
                  showCloseButton={false}
                  onViewDetail={handleOpenPlaceDetail}
                />

                <Pressable
                  onPress={() => handleOpenExternalMap(place)}
                  className="self-end h-[34px] flex-row items-center gap-1.5 rounded-full border px-3"
                  style={{
                    borderColor: "rgba(59,130,246,0.28)",
                    backgroundColor: "rgba(255,255,255,0.94)",
                  }}
                >
                  <MaterialIconsRounded
                    name="map"
                    size={16}
                    color={TOKENS.color.primary[700]}
                  />
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: TOKENS.color.primary[700], fontFamily: TOKENS.font.semibold }}
                  >
                    {MAP_TEXT.web.openInGoogleMaps}
                  </Text>
                </Pressable>
              </View>
            ))
          : null}
      </ScrollView>
    </View>
  );
}
