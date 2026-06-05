import { useCallback, useMemo, useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler 
} from "react-native-reanimated";
import { GuestGate } from "../../src/components/ui/GuestGate";
import { OfflineBanner } from "../../src/components/ui/OfflineBanner";
import { Map, MapPin, Utensils, Coffee, Hotel, Compass, Sparkles, Grid3x3 } from "lucide-react-native";
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isGuest = useAuthStore((s) => s.isGuest);
  const isLoggedIn = !!accessToken && !isGuest;

  const scrollY = useSharedValue(0);

  const handleScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

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
      Alert.alert("Không lưu được ghi chú", "Vui lòng thử lại sau ít phút.");
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
        "Bỏ lưu địa điểm?",
        "Địa điểm này sẽ được gỡ khỏi danh sách yêu thích.",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Bỏ lưu",
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
    ({ item, index }) => {
      const place = item?.place || item;
      return (
        <View 
          className={`flex-1 px-1.5 mb-3 ${index % 2 === 0 ? "pt-0" : "pt-6"}`}
        >
          <SavedCard
            entry={item}
            index={index}
            scrollY={scrollY}
            onPress={() => handleOpenPlace(place?.id)}
            onOpenNote={handleOpenNoteEditor}
            onUnsave={handleUnsave}
          />
        </View>
      );
    },
    [handleOpenNoteEditor, handleOpenPlace, handleUnsave, scrollY],
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
    const items = [{ key: ALL_CATEGORIES_KEY, name: "Tất cả", count: savedData.length }];
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
    const items = [{ key: ALL_AREAS_KEY, name: "Tất cả", count: savedData.length }];
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
      <View style={{ paddingTop: 16, paddingBottom: 14, paddingHorizontal: 16 }}>
        {/* Tiêu đề + Badge */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Text style={{ fontSize: 28, fontFamily: TOKENS.font.heading, color: "#0F172A", letterSpacing: -0.8 }}>
            Yêu thích
          </Text>
          {filteredSavedData.length > 0 && (
            <View style={{ height: 26, borderRadius: 13, paddingHorizontal: 10, backgroundColor: "rgba(0,0,0,0.06)", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 13, fontFamily: TOKENS.font.semibold, color: "#6B7280" }}>
                {filteredSavedData.length}
              </Text>
            </View>
          )}
        </View>

        {/* Category pills */}
        {showCategories && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 4, alignItems: "center" }}
            style={{ marginBottom: showAreas ? 8 : 0 }}
          >
            {catItems.map((item) => {
              const active = activeCategory === item.key;
              return (
                <View key={item.key} style={{ overflow: "visible" }}>
                  <Pressable
                    onPress={() => setActiveCategory(item.key)}
                    style={({ pressed }) => [
                      pressed && { opacity: 0.9 },
                      {
                        paddingHorizontal: 12,
                        borderRadius: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        height: 56,
                        minWidth: 64,
                        maxWidth: 88,
                        backgroundColor: active ? "#1D1D1F" : "rgba(0,0,0,0.04)",
                      },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 13,
                        fontFamily: TOKENS.font.semibold,
                        color: active ? "#FFFFFF" : "#1D1D1F",
                        letterSpacing: -0.2,
                      }}
                    >
                      {item.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 10,
                        fontFamily: TOKENS.font.body,
                        color: active ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.35)",
                        marginTop: 1,
                      }}
                    >
                      {item.count} địa điểm
                    </Text>
                  </Pressable>
                  {item.count > 0 && !active ? (
                    <View
                      style={{
                        position: "absolute",
                        top: -7,
                        alignSelf: "center",
                        zIndex: 1,
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 5,
                        backgroundColor: active ? "#1D1D1F" : "rgba(0,0,0,0.12)",
                      }}
                    >
                      <Text style={{ fontSize: 10, fontFamily: TOKENS.font.semibold, color: active ? "#FFFFFF" : "#1D1D1F" }}>
                        {item.count}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Area pills */}
        {showAreas && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 4, alignItems: "center" }}
          >
            {areaItems.map((item) => {
              const active = activeArea === item.key;
              return (
                <View key={item.key} style={{ overflow: "visible" }}>
                  <Pressable
                    onPress={() => setActiveArea(item.key)}
                    style={({ pressed }) => [
                      pressed && { opacity: 0.9 },
                      {
                        paddingHorizontal: 12,
                        borderRadius: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        height: 56,
                        minWidth: 64,
                        maxWidth: 88,
                        backgroundColor: active ? "#1D1D1F" : "rgba(0,0,0,0.04)",
                      },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 13,
                        fontFamily: TOKENS.font.semibold,
                        color: active ? "#FFFFFF" : "#1D1D1F",
                        letterSpacing: -0.2,
                      }}
                    >
                      {item.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 10,
                        fontFamily: TOKENS.font.body,
                        color: active ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.35)",
                        marginTop: 1,
                      }}
                    >
                      {item.count} địa điểm
                    </Text>
                  </Pressable>
                  {item.count > 0 && !active ? (
                    <View
                      style={{
                        position: "absolute",
                        top: -7,
                        alignSelf: "center",
                        zIndex: 1,
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 5,
                        backgroundColor: active ? "#1D1D1F" : "rgba(0,0,0,0.12)",
                      }}
                    >
                      <Text style={{ fontSize: 10, fontFamily: TOKENS.font.semibold, color: active ? "#FFFFFF" : "#1D1D1F" }}>
                        {item.count}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    );
  }, [isLoading, isError, catItems, areaItems, activeArea, activeCategory, filteredSavedData.length]);

  if (!isLoggedIn) {
    return (
      <GuestGate
        icon="bookmark-border"
        title="Đăng nhập để lưu địa điểm"
        description="Danh sách yêu thích sẽ được đồng bộ với tài khoản của bạn trên mọi thiết bị."
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
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ 
          paddingHorizontal: 6,
          paddingBottom: TAB_BAR_HEIGHT + 24 
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
