import { useCallback, useMemo, useState } from "react";
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
  MapPin,
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

  const handleCategoryPress = useCallback((key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(key);
  }, []);

  const handleAreaPress = useCallback((key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveArea(key);
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
        const cat = place?.category;
        if (!cat) return false;
        const catKey =
          cat.id != null
            ? `category:${cat.id}`
            : `category-name:${(cat.name || "").trim().toLowerCase()}`;
        return catKey === opt.key;
      }).length;
      items.push({ ...opt, count });
    });
    return items;
  }, [savedData, categoryOptions, t]);

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

    const showCategories = catItems.length > 1;
    const showAreas = areaItems.length > 1;

    return (
      <View className="pt-4 pb-3.5 px-4">
        {/* Tiêu đề + Badge */}
        <View className="flex-row items-center justify-between mb-4">
          <Text
            className="text-[28px] tracking-tight text-[#0F172A]"
            style={{ fontFamily: TOKENS.font.heading }}
          >
            {t("saved.title")}
          </Text>
          {filteredSavedData.length > 0 && (
            <View className="h-7 px-2.5 rounded-full bg-black/5 items-center justify-center">
              <Text
                className="text-[13px] text-[#6B7280]"
                style={{ fontFamily: TOKENS.font.semibold }}
              >
                {filteredSavedData.length}
              </Text>
            </View>
          )}
        </View>

        {/* Category pills */}
        {showCategories && (
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2.5 pr-1 items-center"
              className={showAreas ? "mb-2.5" : ""}
            >
              {catItems.map((item) => {
                const active = activeCategory === item.key;
                const isAll = item.key === ALL_CATEGORIES_KEY;
                const { Icon, color: iconColor } = isAll
                  ? { Icon: Grid3x3, color: "#6B7280" }
                  : getCategoryIcon(item.name);
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => handleCategoryPress(item.key)}
                    className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-full border active:scale-[0.97] active:opacity-90 ${
                      active
                        ? "bg-[#1C1C1E] border-[#1C1C1E] shadow-sm shadow-black/20"
                        : "bg-white border-black/5"
                    }`}
                  >
                    <Icon
                      size={15}
                      color={active ? "#FFFFFF" : iconColor}
                      strokeWidth={2.2}
                    />
                    <Text
                      numberOfLines={1}
                      className={`text-[13px] tracking-tight ${
                        active ? "text-white" : "text-[#1C1C1E]"
                      }`}
                      style={{
                        fontFamily: active
                          ? TOKENS.font.semibold
                          : TOKENS.font.medium,
                      }}
                    >
                      {item.name}
                    </Text>
                    <View
                      className={`rounded-full px-1.5 py-[1px] min-w-[22px] items-center ${
                        active ? "bg-white/20" : "bg-black/5"
                      }`}
                    >
                      <Text
                        numberOfLines={1}
                        className={`text-[11px] ${
                          active ? "text-white/90" : "text-black/45"
                        }`}
                        style={{ fontFamily: TOKENS.font.semibold }}
                      >
                        {item.count}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Area pills */}
        {showAreas && (
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2.5 pr-1 items-center"
            >
              {areaItems.map((item) => {
                const active = activeArea === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => handleAreaPress(item.key)}
                    className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-full border active:scale-[0.97] active:opacity-90 ${
                      active
                        ? "bg-[#1C1C1E] border-[#1C1C1E] shadow-sm shadow-black/20"
                        : "bg-white border-black/5"
                    }`}
                  >
                    <MapPin
                      size={15}
                      color={active ? "#FFFFFF" : "#0EA5E9"}
                      strokeWidth={2.2}
                    />
                    <Text
                      numberOfLines={1}
                      className={`text-[13px] tracking-tight ${
                        active ? "text-white" : "text-[#1C1C1E]"
                      }`}
                      style={{
                        fontFamily: active
                          ? TOKENS.font.semibold
                          : TOKENS.font.medium,
                      }}
                    >
                      {item.name}
                    </Text>
                    <View
                      className={`rounded-full px-1.5 py-[1px] min-w-[22px] items-center ${
                        active ? "bg-white/20" : "bg-black/5"
                      }`}
                    >
                      <Text
                        numberOfLines={1}
                        className={`text-[11px] ${
                          active ? "text-white/90" : "text-black/45"
                        }`}
                        style={{ fontFamily: TOKENS.font.semibold }}
                      >
                        {item.count}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    );
  }, [
    isLoading,
    isError,
    catItems,
    areaItems,
    activeArea,
    activeCategory,
    filteredSavedData.length,
    t,
    handleAreaPress,
    handleCategoryPress,
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
              <EmptyState activeFilter={isFiltered} onExplore={handleExplore} />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
