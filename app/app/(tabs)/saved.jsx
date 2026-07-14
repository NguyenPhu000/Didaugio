import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  Pressable,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { GuestGate } from "../../src/components/ui/GuestGate";
import { OfflineBanner } from "../../src/components/ui/OfflineBanner";
import {
  Utensils,
  Coffee,
  Hotel,
  Compass,
  Sparkles,
  Grid3x3,
  BookmarkCheck,
  SlidersHorizontal,
  X,
} from "lucide-react-native";
import {
  useSavePlace,
  useUnsavePlace,
} from "../../src/modules/saved/hooks/useSaved";
import { useSavedPlacesCached } from "../../src/modules/saved/hooks/useSavedOffline";
import { useAuthStore } from "../../src/stores/authStore";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../src/constants/design-tokens";
import { SavedCard } from "../../src/modules/saved/components/SavedCard";
import { NoteEditorModal } from "../../src/modules/saved/components/NoteEditorModal";
import FilterPickerModal from "../../src/modules/map/components/filters/FilterPickerModal";
import {
  LoadingState,
  EmptyState,
  ErrorState,
} from "../../src/modules/saved/components/SavedStates";
import {
  ALL_AREAS_KEY,
  ALL_CATEGORIES_KEY,
  ALL_COLLECTIONS_KEY,
  buildAreaOptions,
  buildCategoryOptions,
  filterSavedEntries,
} from "../../src/modules/saved/utils/savedHelpers";
import { TAB_BAR_HEIGHT } from "./_layout";

export default function SavedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isGuest = useAuthStore((s) => s.isGuest);
  const isLoggedIn = !!accessToken && !isGuest;

  const {
    savedData = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useSavedPlacesCached(isLoggedIn);

  const unsaveMutation = useUnsavePlace();
  const saveMutation = useSavePlace();

  const [activeArea, setActiveArea] = useState(ALL_AREAS_KEY);
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES_KEY);
  const [activeFilterGroup, setActiveFilterGroup] = useState("category");
  const [filterPickerVisible, setFilterPickerVisible] = useState(false);
  const [noteTarget, setNoteTarget] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");

  const areaOptions = useMemo(() => buildAreaOptions(savedData), [savedData]);
  const categoryOptions = useMemo(
    () => buildCategoryOptions(savedData),
    [savedData],
  );

  const filteredSavedData = useMemo(
    () =>
      filterSavedEntries({
        savedData,
        activeCollection: ALL_COLLECTIONS_KEY,
        activeArea,
        activeCategory,
      }),
    [activeArea, activeCategory, savedData],
  );

  // Chia dữ liệu thành 2 cột xen kẽ cho layout Masonry
  const { leftColumn, rightColumn } = useMemo(() => {
    const left = [];
    const right = [];
    filteredSavedData.forEach((item, index) => {
      if (index % 2 === 0) left.push(item);
      else right.push(item);
    });
    return { leftColumn: left, rightColumn: right };
  }, [filteredSavedData]);

  const isFiltered =
    activeArea !== ALL_AREAS_KEY || activeCategory !== ALL_CATEGORIES_KEY;

  useEffect(() => {
    if (
      activeCategory !== ALL_CATEGORIES_KEY &&
      !categoryOptions.some((option) => option.key === activeCategory)
    ) {
      setActiveCategory(ALL_CATEGORIES_KEY);
    }
  }, [activeCategory, categoryOptions]);

  useEffect(() => {
    if (
      activeArea !== ALL_AREAS_KEY &&
      !areaOptions.some((option) => option.key === activeArea)
    ) {
      setActiveArea(ALL_AREAS_KEY);
    }
  }, [activeArea, areaOptions]);

  const handleClearFilters = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveArea(ALL_AREAS_KEY);
    setActiveCategory(ALL_CATEGORIES_KEY);
    setFilterPickerVisible(false);
  }, []);

  const handleOpenFilterPicker = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilterPickerVisible(true);
  }, []);

  const handleCloseFilterPicker = useCallback(() => {
    setFilterPickerVisible(false);
  }, []);

  const handleSelectFilterGroup = useCallback((groupKey) => {
    setActiveFilterGroup(groupKey);
  }, []);

  const handleOpenNoteEditor = useCallback((entry) => {
    const place = entry?.place || entry;
    setNoteTarget({
      placeId: place?.id,
      placeName: place?.name,
    });
    setNoteDraft(entry?.note || "");
  }, []);

  const handleCloseNoteEditor = useCallback(() => {
    if (saveMutation.isPending) return;
    setNoteTarget(null);
    setNoteDraft("");
  }, [saveMutation.isPending]);

  const handleSaveNote = useCallback(async () => {
    if (!noteTarget?.placeId) return;
    try {
      await saveMutation.mutateAsync({
        placeId: noteTarget.placeId,
        note: noteDraft.trim() || null,
      });
      handleCloseNoteEditor();
    } catch {
      Alert.alert(t("saved.alert.noteError"), t("common.tryAgain"));
    }
  }, [handleCloseNoteEditor, noteDraft, noteTarget?.placeId, saveMutation, t]);

  const handleUnsave = useCallback(
    (placeId) => {
      if (!placeId || unsaveMutation.isPending) return;
      Alert.alert(t("saved.alert.unsaveTitle"), t("common.confirmDelete"), [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => unsaveMutation.mutate(placeId),
        },
      ]);
    },
    [unsaveMutation, t],
  );

  const handleOpenPlace = useCallback(
    (placeId) => {
      if (!placeId) return;
      router.push(`/place/${placeId}`);
    },
    [router],
  );

  const handleExplore = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/explore");
  }, [router]);

  const getCategoryIcon = (categoryName) => {
    const name = String(categoryName || "").toLowerCase();
    if (
      name.includes("ăn") ||
      name.includes("nhà hàng") ||
      name.includes("ẩm thực")
    )
      return { Icon: Utensils, color: "#F97316" };
    if (
      name.includes("cà phê") ||
      name.includes("cafe") ||
      name.includes("trà")
    )
      return { Icon: Coffee, color: "#EAB308" };
    if (
      name.includes("khách sạn") ||
      name.includes("lưu trú") ||
      name.includes("homestay")
    )
      return { Icon: Hotel, color: "#0EA5E9" };
    if (
      name.includes("tham quan") ||
      name.includes("du lịch") ||
      name.includes("di tích")
    )
      return { Icon: Compass, color: "#10B981" };
    if (
      name.includes("vui chơi") ||
      name.includes("giải trí") ||
      name.includes("bar")
    )
      return { Icon: Sparkles, color: "#A855F7" };
    return { Icon: Grid3x3, color: "#6B7280" };
  };

  const getCategoryKey = useCallback((place) => {
    const categoryId = place?.category?.id ?? place?.categoryId;
    const categoryName = place?.category?.name ?? place?.categoryName;
    return categoryId != null
      ? `cat:${categoryId}`
      : `cat-name:${String(categoryName || "").trim().toLowerCase()}`;
  }, []);

  // Build category items with counts
  const catItems = useMemo(() => {
    const items = [
      {
        key: ALL_CATEGORIES_KEY,
        name: t("common.all"),
        count: savedData.length,
      },
    ];
    categoryOptions.forEach((opt) => {
      const count = savedData.filter((entry) => {
        const place = entry?.place || entry;
        return getCategoryKey(place) === opt.key;
      }).length;
      items.push({ ...opt, count });
    });
    return items;
  }, [savedData, categoryOptions, getCategoryKey, t]);

  // Build area items with counts
  const areaItems = useMemo(() => {
    const items = [
      { key: ALL_AREAS_KEY, name: t("common.all"), count: savedData.length },
    ];
    areaOptions.forEach((opt) => {
      const count = savedData.filter((entry) => {
        const place = entry?.place || entry;
        const districtId =
          place?.district?.id ?? place?.ward?.districtId ?? place?.districtId;
        const districtName =
          place?.district?.name ?? place?.ward?.district?.name ?? null;
        let key;
        if (districtId != null) key = `id:${districtId}`;
        else if (districtName)
          key = `name:${districtName.trim().toLowerCase()}`;
        else return false;
        return key === opt.key;
      }).length;
      items.push({ ...opt, count });
    });
    return items;
  }, [savedData, areaOptions, t]);

  const activeCategoryName =
    catItems.find((item) => item.key === activeCategory)?.name ||
    t("common.all");
  const activeAreaName =
    areaItems.find((item) => item.key === activeArea)?.name || t("common.all");
  const activeCategoryIconMeta = useMemo(
    () => getCategoryIcon(activeCategoryName),
    [activeCategoryName],
  );

  const filterGroups = useMemo(
    () => [
      {
        key: "category",
        label: t("map.filters.groupOptions.category"),
        icon: "apps",
      },
      {
        key: "area",
        label: t("map.filters.groupOptions.area"),
        icon: "place",
      },
    ],
    [t],
  );

  const activeFilterGroupMeta = useMemo(
    () =>
      filterGroups.find((group) => group.key === activeFilterGroup) ||
      filterGroups[0],
    [activeFilterGroup, filterGroups],
  );

  const activeFilterSummaryLabel =
    activeFilterGroup === "area" ? activeAreaName : activeCategoryName;

  const filterPickerOptions = useMemo(() => {
    if (activeFilterGroup === "area") {
      return [
        {
          key: "area:all",
          value: ALL_AREAS_KEY,
          label: t("map.filters.allAreas"),
          icon: "public",
          active: activeArea === ALL_AREAS_KEY,
        },
        ...areaItems
          .filter((area) => area.key !== ALL_AREAS_KEY)
          .map((area) => ({
            key: `area:${area.key}`,
            value: area.key,
            label: `${area.name} (${area.count})`,
            icon: "place",
            active: area.key === activeArea,
          })),
      ];
    }

    return [
      {
        key: "category:all",
        value: ALL_CATEGORIES_KEY,
        label: t("map.filters.allCategories"),
        icon: "apps",
        active: activeCategory === ALL_CATEGORIES_KEY,
      },
      ...catItems
        .filter((category) => category.key !== ALL_CATEGORIES_KEY)
        .map((category) => ({
          key: `category:${category.key}`,
          value: category.key,
          label: `${category.name} (${category.count})`,
          icon: "category",
          active: category.key === activeCategory,
        })),
    ];
  }, [activeArea, activeCategory, activeFilterGroup, areaItems, catItems, t]);

  const handleSelectFilterOption = useCallback(
    (value) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (activeFilterGroup === "area") {
        setActiveArea(value ?? ALL_AREAS_KEY);
        return;
      }
      setActiveCategory(value ?? ALL_CATEGORIES_KEY);
    },
    [activeFilterGroup],
  );

  const renderMasonryCard = useCallback(
    (item) => {
      const place = item?.place || item;
      return (
        <View key={String(item.id)} className="mb-3.5">
          <SavedCard
            entry={item}
            onPress={() => handleOpenPlace(place?.id)}
            onOpenNote={handleOpenNoteEditor}
            onUnsave={handleUnsave}
          />
        </View>
      );
    },
    [handleOpenNoteEditor, handleOpenPlace, handleUnsave],
  );

  const renderHeader = useCallback(() => {
    if (isLoading || isError) return null;

    const canFilter = catItems.length > 1 || areaItems.length > 1;
    const FilterIcon =
      activeFilterGroup === "category"
        ? activeCategoryIconMeta.Icon
        : SlidersHorizontal;
    const filterIconColor =
      activeFilterGroup === "category" ? activeCategoryIconMeta.color : "#0EA5E9";

    return (
      <View className="pt-3 pb-4 px-4">
        {/* Tiêu đề + Badge */}
        <View
          className="bg-[#101E2C] overflow-hidden mb-4"
          style={{ borderRadius: 30, borderCurve: "continuous" }}
        >
          <View
            className="absolute rounded-full"
            style={{
              right: -40,
              top: -48,
              width: 160,
              height: 160,
              backgroundColor: "rgba(213,228,247,0.2)",
            }}
          />
          <View
            className="absolute rounded-full"
            style={{
              left: -48,
              bottom: -42,
              width: 144,
              height: 144,
              backgroundColor: "rgba(255,255,255,0.1)",
            }}
          />
          <View className="px-5 pt-5 pb-4">
            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-2">
                  <BookmarkCheck size={17} color="#D5E4F7" strokeWidth={2} />
                  <Text
                    className="text-[12px] uppercase tracking-[1.8px]"
                    style={{
                      color: "rgba(255,255,255,0.65)",
                      fontFamily: TOKENS.font.semibold,
                    }}
                  >
                    {t("tabs.saved")}
                  </Text>
                </View>
                <Text
                  className="text-[30px] leading-[34px] tracking-tight text-white"
                  style={{ fontFamily: TOKENS.font.heading }}
                >
                  {t("saved.title")}
                </Text>
              </View>

              <View className="items-end">
                <Text
                  className="text-[32px] leading-[36px] text-white"
                  style={{ fontFamily: TOKENS.font.heading }}
                >
                  {filteredSavedData.length}
                </Text>
                <Text
                  className="text-[12px]"
                  style={{
                    color: "rgba(255,255,255,0.62)",
                    fontFamily: TOKENS.font.medium,
                  }}
                >
                  {t("saved.countLabel", { count: filteredSavedData.length })}
                </Text>
              </View>
            </View>

            <View className="mt-5 flex-row gap-2">
              <View
                className="flex-1 px-3 py-2.5 border"
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderColor: "rgba(255,255,255,0.1)",
                  borderRadius: 18,
                  borderCurve: "continuous",
                }}
              >
                <Text
                  numberOfLines={1}
                  className="text-[11px]"
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: TOKENS.font.medium,
                  }}
                >
                  {t("common.filter")}
                </Text>
                <Text
                  numberOfLines={1}
                  className="text-[14px] text-white mt-0.5"
                  style={{ fontFamily: TOKENS.font.semibold }}
                >
                  {activeCategoryName}
                </Text>
              </View>
              <View
                className="flex-1 px-3 py-2.5 border"
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderColor: "rgba(255,255,255,0.1)",
                  borderRadius: 18,
                  borderCurve: "continuous",
                }}
              >
                <Text
                  numberOfLines={1}
                  className="text-[11px]"
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: TOKENS.font.medium,
                  }}
                >
                  {t("savedDashboard.areas")}
                </Text>
                <Text
                  numberOfLines={1}
                  className="text-[14px] text-white mt-0.5"
                  style={{ fontFamily: TOKENS.font.semibold }}
                >
                  {activeAreaName}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {canFilter && (
          <View className="flex-row items-center justify-between mb-3">
            <Pressable
              onPress={handleOpenFilterPicker}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`${activeFilterGroupMeta.label}: ${activeFilterSummaryLabel}`}
              className="flex-1 flex-row items-center gap-3 bg-white border border-[#E3E7EC] px-3.5 py-3 active:opacity-80"
              style={{
                borderRadius: 18,
                borderCurve: "continuous",
                shadowColor: "#101E2C",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.06,
                shadowRadius: 14,
                elevation: 2,
              }}
            >
              <View
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(16,30,44,0.08)" }}
              >
                <FilterIcon size={16} color={filterIconColor} strokeWidth={2.2} />
              </View>
              <View className="flex-1">
                <Text
                  numberOfLines={1}
                  className="text-[11px] uppercase tracking-[1.3px] text-[#74777C]"
                  style={{ fontFamily: TOKENS.font.semibold }}
                >
                  {activeFilterGroupMeta.label}
                </Text>
                <Text
                  numberOfLines={1}
                  className="mt-0.5 text-[15px] tracking-tight text-[#101E2C]"
                  style={{ fontFamily: TOKENS.font.semibold }}
                >
                  {activeFilterSummaryLabel}
                </Text>
              </View>
            </Pressable>

            {isFiltered ? (
              <Pressable
                onPress={handleClearFilters}
                className="ml-2 w-11 h-11 items-center justify-center active:opacity-80"
                style={{
                  backgroundColor: "rgba(0,0,0,0.04)",
                  borderRadius: 16,
                  borderCurve: "continuous",
                }}
              >
                <X size={13} color="#54647A" strokeWidth={2.4} />
              </Pressable>
            ) : null}
          </View>
        )}

      </View>
    );
  }, [
    isLoading,
    isError,
    catItems,
    areaItems,
    activeAreaName,
    activeCategoryName,
    activeCategoryIconMeta,
    activeFilterGroup,
    activeFilterGroupMeta,
    activeFilterSummaryLabel,
    filteredSavedData.length,
    isFiltered,
    t,
    handleClearFilters,
    handleOpenFilterPicker,
  ]);

  if (!isLoggedIn) {
    return (
      <GuestGate
        icon="bookmark-border"
        title={t("guestGate.title")}
        description={t("guestGate.description")}
      />
    );
  }

  const showContent = !isLoading && !isError && filteredSavedData.length > 0;

  return (
    <View
      className="flex-1"
      style={{
        paddingTop: insets.top,
        backgroundColor: APPLE_THEME.background,
      }}
    >
      <OfflineBanner />
      <NoteEditorModal
        visible={!!noteTarget}
        placeName={noteTarget?.placeName}
        value={noteDraft}
        saving={saveMutation.isPending}
        onChangeText={setNoteDraft}
        onClose={handleCloseNoteEditor}
        onSubmit={handleSaveNote}
      />
      <FilterPickerModal
        visible={filterPickerVisible}
        activeFilterGroup={activeFilterGroup}
        activeFilterGroupLabel={activeFilterGroupMeta.label}
        filterGroups={filterGroups}
        options={filterPickerOptions}
        onClose={handleCloseFilterPicker}
        onSelectFilterGroup={handleSelectFilterGroup}
        onSelectOption={handleSelectFilterOption}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#1D1D1F"
            colors={["#1D1D1F"]}
          />
        }
        contentContainerStyle={{
          paddingBottom: TAB_BAR_HEIGHT + 24,
        }}
      >
        {renderHeader()}

        {showContent ? (
          <View className="px-3 flex-row">
            {/* Cột trái */}
            <View className="flex-1 pr-1">
              {leftColumn.map(renderMasonryCard)}
            </View>
            {/* Cột phải - Offset padding top để tạo hiệu ứng so le (Staggered Masonry) */}
            <View className="flex-1 pl-1 pt-4">
              {rightColumn.map(renderMasonryCard)}
            </View>
          </View>
        ) : (
          <View className="px-3">
            {isLoading ? (
              <LoadingState />
            ) : isError ? (
              <ErrorState onRetry={refetch} />
            ) : (
              <EmptyState
                activeFilter={isFiltered}
                onExplore={handleExplore}
                onClearFilters={handleClearFilters}
              />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
