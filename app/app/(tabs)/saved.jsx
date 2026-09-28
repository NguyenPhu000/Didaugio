// MAP: SavedTabScreen
// ├── UI: @/modules/saved/components/{SavedCard, NoteEditorModal, SavedStates}, @/modules/map/components/filters/FilterPickerModal
// └── API: @/modules/saved/hooks/useSaved, @/modules/saved/hooks/useSavedOffline

import { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  Pressable,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { showAppAlertLegacy } from "../../src/utils/appAlert";
import { GuestGate } from "../../src/components/ui/GuestGate";
import { OfflineBanner } from "../../src/components/ui/OfflineBanner";
import {
  Utensils,
  Coffee,
  Hotel,
  Compass,
  Sparkles,
  Grid3x3,
  Bookmark,
  Search,
  X,
  MapPin,
  ChevronDown,
  FileEdit,
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
  NOTES_COLLECTION_KEY,
  buildAreaOptions,
  buildCategoryOptions,
  filterSavedEntries,
} from "../../src/modules/saved/utils/savedHelpers";
import { TAB_BAR_HEIGHT } from "./_layout";

// Component Category Pill tương tác xúc giác Apple
function FilterPill({
  label,
  count,
  active,
  Icon,
  onPress,
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, TOKENS.spring.press);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, TOKENS.spring.press);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="mr-2"
    >
      <Animated.View
        style={[
          animStyle,
          {
            borderRadius: 9999,
            borderCurve: "continuous",
          },
        ]}
        className={`flex-row items-center px-3.5 py-2 border-[0.5px] ${
          active
            ? "bg-[#1D1D1F] border-[#1D1D1F] shadow-sm shadow-black/10"
            : "bg-white border-black/[0.08]"
        }`}
      >
        {Icon ? (
          <View className="mr-1.5">
            <Icon
              size={13}
              color={active ? "#FFFFFF" : "#636366"}
              strokeWidth={2.2}
            />
          </View>
        ) : null}
        <Text
          className={`text-[13px] tracking-tight ${
            active ? "text-white" : "text-[#1D1D1F]"
          }`}
          style={{
            fontFamily: active ? TOKENS.font.semibold : TOKENS.font.medium,
          }}
        >
          {label}
        </Text>
        {typeof count === "number" ? (
          <View
            className={`ml-1.5 px-1.5 py-0.5 rounded-full ${
              active ? "bg-white/20" : "bg-black/[0.05]"
            }`}
          >
            <Text
              className={`text-[11px] leading-[14px] ${
                active ? "text-white" : "text-[#636366]"
              }`}
              style={{ fontFamily: TOKENS.font.semibold }}
            >
              {count}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setActiveArea] = useState(ALL_AREAS_KEY);
  const [selectedCategory, setActiveCategory] = useState(ALL_CATEGORIES_KEY);
  const [showOnlyNotes, setShowOnlyNotes] = useState(false);
  const [filterPickerVisible, setFilterPickerVisible] = useState(false);
  const [noteTarget, setNoteTarget] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");

  const areaOptions = useMemo(() => buildAreaOptions(savedData), [savedData]);
  const categoryOptions = useMemo(
    () => buildCategoryOptions(savedData),
    [savedData],
  );

  const activeArea = areaOptions.some((option) => option.key === selectedArea)
    ? selectedArea
    : ALL_AREAS_KEY;
  const activeCategory = categoryOptions.some(
    (option) => option.key === selectedCategory,
  )
    ? selectedCategory
    : ALL_CATEGORIES_KEY;

  const getCategoryKey = useCallback((place) => {
    const categoryId = place?.category?.id ?? place?.categoryId;
    const categoryName = place?.category?.name ?? place?.categoryName;
    return categoryId != null
      ? `cat:${categoryId}`
      : `cat-name:${String(categoryName || "").trim().toLowerCase()}`;
  }, []);

  const getCategoryIcon = (categoryName) => {
    const name = String(categoryName || "").toLowerCase();
    if (
      name.includes("ăn") ||
      name.includes("nhà hàng") ||
      name.includes("ẩm thực")
    )
      return Utensils;
    if (
      name.includes("cà phê") ||
      name.includes("cafe") ||
      name.includes("trà")
    )
      return Coffee;
    if (
      name.includes("khách sạn") ||
      name.includes("lưu trú") ||
      name.includes("homestay")
    )
      return Hotel;
    if (
      name.includes("tham quan") ||
      name.includes("du lịch") ||
      name.includes("di tích")
    )
      return Compass;
    if (
      name.includes("vui chơi") ||
      name.includes("giải trí") ||
      name.includes("bar")
    )
      return Sparkles;
    return Grid3x3;
  };

  // Số lượng có ghi chú
  const notePlacesCount = useMemo(() => {
    return savedData.filter((entry) => Boolean(String(entry?.note || "").trim()))
      .length;
  }, [savedData]);

  // Danh sách Category kèm đếm
  const catItems = useMemo(() => {
    const items = [
      {
        key: ALL_CATEGORIES_KEY,
        name: t("common.all", "Tất cả"),
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

  // Danh sách Area kèm đếm
  const areaItems = useMemo(() => {
    const items = [
      { key: ALL_AREAS_KEY, name: t("common.all", "Tất cả"), count: savedData.length },
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

  const activeAreaName =
    areaItems.find((item) => item.key === activeArea)?.name ||
    t("common.all", "Tất cả");

  // Bộ lọc dữ liệu chuẩn kết hợp Search client-side
  const filteredSavedData = useMemo(() => {
    let result = filterSavedEntries({
      savedData,
      activeCollection: showOnlyNotes
        ? NOTES_COLLECTION_KEY
        : ALL_COLLECTIONS_KEY,
      activeArea,
      activeCategory: showOnlyNotes ? ALL_CATEGORIES_KEY : activeCategory,
    });

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((entry) => {
        const place = entry?.place || entry;
        const name = String(place?.name || "").toLowerCase();
        const address = String(place?.address || "").toLowerCase();
        const cat = String(
          place?.category?.name || place?.categoryName || "",
        ).toLowerCase();
        const district = String(
          place?.district?.name || place?.ward?.district?.name || "",
        ).toLowerCase();
        const note = String(entry?.note || "").toLowerCase();
        return (
          name.includes(query) ||
          address.includes(query) ||
          cat.includes(query) ||
          district.includes(query) ||
          note.includes(query)
        );
      });
    }

    return result;
  }, [
    activeArea,
    activeCategory,
    savedData,
    searchQuery,
    showOnlyNotes,
  ]);

  // Chia 2 cột xen kẽ Pinterest-style Masonry
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
    activeArea !== ALL_AREAS_KEY ||
    activeCategory !== ALL_CATEGORIES_KEY ||
    showOnlyNotes ||
    Boolean(searchQuery.trim());

  const handleClearFilters = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveArea(ALL_AREAS_KEY);
    setActiveCategory(ALL_CATEGORIES_KEY);
    setShowOnlyNotes(false);
    setSearchQuery("");
    setFilterPickerVisible(false);
  }, []);

  const handleOpenAreaPicker = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilterPickerVisible(true);
  }, []);

  const handleCloseFilterPicker = useCallback(() => {
    setFilterPickerVisible(false);
  }, []);

  const handleSelectAreaOption = useCallback((value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveArea(value ?? ALL_AREAS_KEY);
  }, []);

  const filterPickerOptions = useMemo(() => {
    return [
      {
        key: "area:all",
        value: ALL_AREAS_KEY,
        label: t("map.filters.allAreas", "Tất cả khu vực"),
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
  }, [activeArea, areaItems, t]);

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
      showAppAlertLegacy(
        t("saved.alert.noteError", "Không thể lưu ghi chú"),
        t("common.tryAgain", "Vui lòng thử lại"),
      );
    }
  }, [handleCloseNoteEditor, noteDraft, noteTarget, saveMutation, t]);

  const handleUnsave = useCallback(
    (placeId) => {
      if (!placeId || unsaveMutation.isPending) return;
      showAppAlertLegacy(
        t("saved.alert.unsaveTitle", "Bỏ lưu địa điểm"),
        t(
          "common.confirmDelete",
          "Bạn có chắc muốn xóa địa điểm này khỏi danh sách đã lưu?",
        ),
        [
          { text: t("common.cancel", "Hủy"), style: "cancel" },
          {
            text: t("common.delete", "Xóa"),
            style: "destructive",
            onPress: () => unsaveMutation.mutate(placeId),
          },
        ],
      );
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

  if (!isLoggedIn) {
    return (
      <GuestGate
        icon="bookmark-border"
        title={t("guestGate.title", "Đăng nhập để xem Đã lưu")}
        description={t(
          "guestGate.description",
          "Lưu lại các điểm du lịch, nhà hàng, quán cà phê yêu thích để tiện xem lại bất cứ lúc nào.",
        )}
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
        activeFilterGroup="area"
        activeFilterGroupLabel={t("map.filters.groupOptions.area", "Khu vực")}
        filterGroups={[
          {
            key: "area",
            label: t("map.filters.groupOptions.area", "Khu vực"),
            icon: "place",
          },
        ]}
        options={filterPickerOptions}
        onClose={handleCloseFilterPicker}
        onSelectFilterGroup={() => {}}
        onSelectOption={handleSelectAreaOption}
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
          paddingBottom: TAB_BAR_HEIGHT + 28,
        }}
      >
        {/* Apple-Editorial Header */}
        <View className="pt-3 pb-2 px-4">
          {/* Top Title & Counter Row */}
          <View className="flex-row items-end justify-between mb-3">
            <View>
              <Text
                className="text-[28px] leading-[32px] text-[#1D1D1F] tracking-tight"
                style={{ fontFamily: TOKENS.font.heading }}
              >
                {t("saved.title", "Đã lưu")}
              </Text>
            </View>

            <View
              className="flex-row items-center gap-1 px-3 py-1 bg-white border-[0.5px] border-black/[0.08]"
              style={{ borderRadius: 9999, borderCurve: "continuous" }}
            >
              <Bookmark size={12} color="#007BFF" strokeWidth={2.4} />
              <Text
                className="text-[12px] text-[#1D1D1F] tracking-tight"
                style={{ fontFamily: TOKENS.font.semibold }}
              >
                {savedData.length} {t("saved.countUnit", "địa điểm")}
              </Text>
            </View>
          </View>

          {/* Quick Search Bar */}
          <View
            className="flex-row items-center bg-white border-[0.5px] border-black/[0.08] px-3.5 py-2.5 mb-3"
            style={{
              borderRadius: 16,
              borderCurve: "continuous",
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.03,
              shadowRadius: 8,
              elevation: 1,
            }}
          >
            <Search size={16} color="#8E8E93" strokeWidth={2.2} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t(
                "saved.searchPlaceholder",
                "Tìm trong địa điểm đã lưu...",
              )}
              placeholderTextColor="#8E8E93"
              className="flex-1 ml-2.5 text-[14px] text-[#1D1D1F] py-0"
              style={{ fontFamily: TOKENS.font.body }}
              returnKeyType="search"
            />
            {searchQuery ? (
              <Pressable
                onPress={() => setSearchQuery("")}
                hitSlop={8}
                className="w-5 h-5 rounded-full bg-black/[0.08] items-center justify-center"
              >
                <X size={11} color="#636366" strokeWidth={2.6} />
              </Pressable>
            ) : null}
          </View>

          {/* Horizontal Category Scroll Pill Bar (Direct 1-Tap Filter) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-4 px-4 pb-2"
          >
            {/* Tất cả */}
            <FilterPill
              label={t("common.all", "Tất cả")}
              count={savedData.length}
              active={!showOnlyNotes && activeCategory === ALL_CATEGORIES_KEY}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowOnlyNotes(false);
                setActiveCategory(ALL_CATEGORIES_KEY);
              }}
            />

            {/* Có ghi chú */}
            {notePlacesCount > 0 ? (
              <FilterPill
                label={t("saved.hasNotes", "Có ghi chú")}
                count={notePlacesCount}
                active={showOnlyNotes}
                Icon={FileEdit}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowOnlyNotes((prev) => !prev);
                }}
              />
            ) : null}

            {/* Các danh mục */}
            {catItems
              .filter((c) => c.key !== ALL_CATEGORIES_KEY)
              .map((cat) => {
                const CatIcon = getCategoryIcon(cat.name);
                const isActive =
                  !showOnlyNotes && activeCategory === cat.key;
                return (
                  <FilterPill
                    key={cat.key}
                    label={cat.name}
                    count={cat.count}
                    active={isActive}
                    Icon={CatIcon}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowOnlyNotes(false);
                      setActiveCategory(
                        activeCategory === cat.key
                          ? ALL_CATEGORIES_KEY
                          : cat.key,
                      );
                    }}
                  />
                );
              })}
          </ScrollView>

          {/* Area Selector & Active Filter Strip */}
          <View className="flex-row items-center justify-between pt-1 pb-1">
            <Pressable
              onPress={handleOpenAreaPicker}
              hitSlop={6}
              className={`flex-row items-center px-3 py-1.5 border-[0.5px] ${
                activeArea !== ALL_AREAS_KEY
                  ? "bg-[#007BFF]/10 border-[#007BFF]/30"
                  : "bg-white border-black/[0.08]"
              }`}
              style={{ borderRadius: 12, borderCurve: "continuous" }}
            >
              <MapPin
                size={12}
                color={activeArea !== ALL_AREAS_KEY ? "#007BFF" : "#636366"}
                strokeWidth={2.2}
              />
              <Text
                className={`ml-1.5 text-[12px] tracking-tight ${
                  activeArea !== ALL_AREAS_KEY
                    ? "text-[#007BFF]"
                    : "text-[#636366]"
                }`}
                style={{
                  fontFamily:
                    activeArea !== ALL_AREAS_KEY
                      ? TOKENS.font.semibold
                      : TOKENS.font.medium,
                }}
              >
                {activeArea !== ALL_AREAS_KEY
                  ? activeAreaName
                  : t("saved.allAreas", "Tất cả quận/huyện")}
              </Text>
              <ChevronDown
                size={12}
                color={activeArea !== ALL_AREAS_KEY ? "#007BFF" : "#8E8E93"}
                className="ml-1"
              />
            </Pressable>

            {isFiltered ? (
              <Pressable
                onPress={handleClearFilters}
                hitSlop={6}
                className="flex-row items-center px-2.5 py-1 bg-black/[0.04] active:opacity-70"
                style={{ borderRadius: 10, borderCurve: "continuous" }}
              >
                <X size={11} color="#636366" strokeWidth={2.4} />
                <Text
                  className="ml-1 text-[11px] text-[#636366] tracking-tight"
                  style={{ fontFamily: TOKENS.font.medium }}
                >
                  {t("saved.resetFilter", "Đặt lại")}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Content Body: Masonry Grid or States */}
        {showContent ? (
          <View className="px-3.5 flex-row">
            {/* Cột trái */}
            <View className="flex-1 pr-1.5">
              {leftColumn.map(renderMasonryCard)}
            </View>
            {/* Cột phải - Staggered offset padding top */}
            <View className="flex-1 pl-1.5 pt-3">
              {rightColumn.map(renderMasonryCard)}
            </View>
          </View>
        ) : (
          <View className="px-3.5">
            {isLoading ? (
              <LoadingState />
            ) : isError ? (
              <ErrorState onRetry={refetch} />
            ) : (
              <EmptyState
                activeFilter={isFiltered}
                searchQuery={searchQuery}
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

