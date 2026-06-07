import { useCallback, useMemo, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
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
import { BOOKING_APPLE_THEME as APPLE_THEME, TOKENS } from "../../src/constants/design-tokens";
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
  const categoryOptions = useMemo(() => buildCategoryOptions(savedData), [savedData]);

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

  const isFiltered = activeArea !== ALL_AREAS_KEY || activeCategory !== ALL_CATEGORIES_KEY;

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
  }, [
    handleCloseNoteEditor,
    noteDraft,
    noteTarget?.placeId,
    saveMutation,
  ]);

  const handleUnsave = useCallback(
    (placeId) => {
      if (!placeId || unsaveMutation.isPending) return;
      Alert.alert(
        t("saved.alert.unsaveTitle"),
        t("common.confirmDelete"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.delete"),
            style: "destructive",
            onPress: () => unsaveMutation.mutate(placeId),
          },
        ],
      );
    },
    [unsaveMutation],
  );

  const handleOpenPlace = useCallback(
    (placeId) => {
      if (!placeId) return;
      router.push(`/place/${placeId}`);
    },
    [router],
  );

  const handleExplore = useCallback(() => router.push("/explore"), [router]);

  const renderItem = useCallback(
    ({ item }) => {
      const place = item?.place || item;
      return (
        <Animated.View
          entering={FadeIn.delay(40).duration(200)}
          exiting={FadeOut.duration(150)}
          layout={LinearTransition.duration(200)}
          className="flex-1 px-1.5 mb-3"
        >
          <SavedCard
            entry={item}
            onPress={() => handleOpenPlace(place?.id)}
            onOpenNote={handleOpenNoteEditor}
            onUnsave={handleUnsave}
          />
        </Animated.View>
      );
    },
    [handleOpenNoteEditor, handleOpenPlace, handleUnsave],
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  const getCategoryIcon = (categoryName) => {
    const name = String(categoryName || "").toLowerCase();
    if (name.includes("ăn") || name.includes("nhà hàng") || name.includes("ẩm thực"))
      return { Icon: Utensils, color: "#F97316" };
    if (name.includes("cà phê") || name.includes("cafe") || name.includes("trà"))
      return { Icon: Coffee, color: "#EAB308" };
    if (name.includes("khách sạn") || name.includes("lưu trú") || name.includes("homestay"))
      return { Icon: Hotel, color: "#0EA5E9" };
    if (name.includes("tham quan") || name.includes("du lịch") || name.includes("di tích"))
      return { Icon: Compass, color: "#10B981" };
    if (name.includes("vui chơi") || name.includes("giải trí") || name.includes("bar"))
      return { Icon: Sparkles, color: "#A855F7" };
    return { Icon: Grid3x3, color: "#6B7280" };
  };

  // Build category items with counts
  const catItems = useMemo(() => {
    const items = [{ key: ALL_CATEGORIES_KEY, name: t("common.all"), count: savedData.length }];
    categoryOptions.forEach((opt) => {
      const count = savedData.filter((entry) => {
        const place = entry?.place || entry;
        const cat = place?.category;
        if (!cat) return false;
        const catKey = cat.id != null ? `category:${cat.id}` : `category-name:${(cat.name || "").trim().toLowerCase()}`;
        return catKey === opt.key;
      }).length;
      items.push({ ...opt, count });
    });
    return items;
  }, [savedData, categoryOptions]);

  // Build area items with counts
  const areaItems = useMemo(() => {
    const items = [{ key: ALL_AREAS_KEY, name: t("common.all"), count: savedData.length }];
    areaOptions.forEach((opt) => {
      const count = savedData.filter((entry) => {
        const place = entry?.place || entry;
        const districtId = place?.district?.id ?? place?.ward?.districtId ?? place?.districtId;
        const districtName = place?.district?.name ?? place?.ward?.district?.name ?? null;
        let key;
        if (districtId != null) key = `id:${districtId}`;
        else if (districtName) key = `name:${districtName.trim().toLowerCase()}`;
        else return false;
        return key === opt.key;
      }).length;
      items.push({ ...opt, count });
    });
    return items;
  }, [savedData, areaOptions]);

  const renderHeader = useCallback(() => {
    if (isLoading || isError) return null;

    const showCategories = catItems.length > 1;
    const showAreas = areaItems.length > 1;

    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        style={{ paddingTop: 16, paddingBottom: 14, paddingHorizontal: 16 }}
      >
        {/* Tiêu đề + Badge */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Text style={{ fontSize: 28, fontFamily: TOKENS.font.heading, color: "#0F172A", letterSpacing: -0.8 }}>
            {t("saved.title")}
          </Text>
          {filteredSavedData.length > 0 && (
            <Animated.View
              entering={FadeIn.delay(200).duration(250)}
              style={{ height: 26, borderRadius: 13, paddingHorizontal: 10, backgroundColor: "rgba(0,0,0,0.06)", alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ fontSize: 13, fontFamily: TOKENS.font.semibold, color: "#6B7280" }}>
                {filteredSavedData.length}
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Category pills */}
        {showCategories && (
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2.5 pr-1 items-center"
              className={showAreas ? "mb-2" : ""}
            >
              {catItems.map((item) => {
                const active = activeCategory === item.key;
                const isAll = item.key === ALL_CATEGORIES_KEY;
                const { Icon, color: iconColor } = isAll
                  ? { Icon: Grid3x3, color: "#6B7280" }
                  : getCategoryIcon(item.name);
                return (
                  <View key={item.key}>
                    <Pressable
                      onPress={() => setActiveCategory(item.key)}
                      className={`flex-row items-center gap-1.5 px-4 py-2.5 rounded-full ${
                        active
                          ? "bg-slate-900 border-0"
                          : "bg-white border-[1.5px] border-black/[0.08]"
                      }`}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.85 : 1,
                        ...(active && {
                          shadowColor: "#0F172A",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.2,
                          shadowRadius: 6,
                          elevation: 3,
                        }),
                      })}
                    >
                      <Icon size={15} color={active ? "#FFFFFF" : iconColor} strokeWidth={2.2} />
                      <Text
                        numberOfLines={1}
                        className={`text-[13px] tracking-tight ${
                          active ? "text-white font-semibold" : "text-slate-900 font-medium"
                        }`}
                      >
                        {item.name}
                      </Text>
                      <View className={`rounded-full px-1.5 py-px min-w-[22px] items-center ${
                        active ? "bg-white/20" : "bg-black/[0.06]"
                      }`}>
                        <Text
                          numberOfLines={1}
                          className={`text-[11px] font-semibold ${
                            active ? "text-white/85" : "text-black/45"
                          }`}
                        >
                          {item.count}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
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
                  <View key={item.key}>
                    <Pressable
                      onPress={() => setActiveArea(item.key)}
                      className={`flex-row items-center gap-1.5 px-4 py-2.5 rounded-full ${
                        active
                          ? "bg-slate-900 border-0"
                          : "bg-white border-[1.5px] border-black/[0.08]"
                      }`}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.85 : 1,
                        ...(active && {
                          shadowColor: "#0F172A",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.2,
                          shadowRadius: 6,
                          elevation: 3,
                        }),
                      })}
                    >
                      <MapPin size={15} color={active ? "#FFFFFF" : "#0EA5E9"} strokeWidth={2.2} />
                      <Text
                        numberOfLines={1}
                        className={`text-[13px] tracking-tight ${
                          active ? "text-white font-semibold" : "text-slate-900 font-medium"
                        }`}
                      >
                        {item.name}
                      </Text>
                      <View className={`rounded-full px-1.5 py-px min-w-[22px] items-center ${
                        active ? "bg-white/20" : "bg-black/[0.06]"
                      }`}>
                        <Text
                          numberOfLines={1}
                          className={`text-[11px] font-semibold ${
                            active ? "text-white/85" : "text-black/45"
                          }`}
                        >
                          {item.count}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
      </Animated.View>
    );
  }, [isLoading, isError, catItems, areaItems, activeArea, activeCategory, filteredSavedData.length]);

  if (!isLoggedIn) {
    return (
      <GuestGate
        icon="bookmark-border"
        title={t("guestGate.title")}
        description={t("guestGate.description")}
      />
    );
  }

  return (
    <View
      className="flex-1"
      style={{ paddingTop: insets.top, backgroundColor: APPLE_THEME.background }}
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
      <Animated.FlatList
        data={!isLoading && !isError ? filteredSavedData : []}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 6 }}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 6,
          paddingBottom: TAB_BAR_HEIGHT + 24,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#1D1D1F"
            colors={["#1D1D1F"]}
          />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          isLoading ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : (
            <EmptyState
              activeFilter={isFiltered}
              onExplore={handleExplore}
            />
          )
        }
        ListFooterComponent={<View className="h-4" />}
      />
    </View>
  );
}
