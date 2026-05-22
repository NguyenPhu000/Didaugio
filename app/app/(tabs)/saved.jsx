import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { GuestGate } from "../../src/components/ui/GuestGate";
import { OfflineBanner } from "../../src/components/ui/OfflineBanner";
import {
  useSavePlace,
  useSavedCollections,
  useUnsavePlace,
} from "../../src/modules/saved/hooks/useSaved";
import { useSavedPlacesCached } from "../../src/modules/saved/hooks/useSavedOffline";
import { useAuthStore } from "../../src/stores/authStore";
import { BOOKING_APPLE_THEME as APPLE_THEME } from "../../src/constants/design-tokens";
import { SavedCard } from "../../src/modules/saved/components/SavedCard";
import { SavedDashboard } from "../../src/modules/saved/components/SavedDashboard";
import { NoteEditorModal } from "../../src/modules/saved/components/NoteEditorModal";
import {
  LoadingState,
  EmptyState,
  ErrorState,
} from "../../src/modules/saved/components/SavedStates";
import { PlacePickerModal } from "../../src/modules/saved/components/PlacePickerModal";
import {
  ALL_AREAS_KEY,
  ALL_COLLECTIONS_KEY,
  buildAreaOptions,
  buildCollectionOptions,
  filterSavedEntries,
} from "../../src/modules/saved/utils/savedHelpers";
import { TAB_BAR_HEIGHT } from "./_layout";

const SEPARATOR_HEIGHT = 12;

function ItemSeparator() {
  return <View style={styles.separator} />;
}

export default function SavedScreen() {
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
  const { data: savedCollections = [] } = useSavedCollections(isLoggedIn);
  const unsaveMutation = useUnsavePlace();
  const saveMutation = useSavePlace();

  const [activeArea, setActiveArea] = useState(ALL_AREAS_KEY);
  const [activeCollection, setActiveCollection] = useState(ALL_COLLECTIONS_KEY);
  const [noteTarget, setNoteTarget] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [collectionDraft, setCollectionDraft] = useState("");
  const [placePickerVisible, setPlacePickerVisible] = useState(false);

  const collectionOptions = useMemo(
    () => buildCollectionOptions({ savedData, savedCollections }),
    [savedCollections, savedData],
  );

  const areaOptions = useMemo(() => buildAreaOptions(savedData), [savedData]);

  const filteredSavedData = useMemo(
    () =>
      filterSavedEntries({
        savedData,
        activeCollection,
        activeArea,
      }),
    [activeArea, activeCollection, savedData],
  );

  const isFiltered =
    activeCollection !== ALL_COLLECTIONS_KEY || activeArea !== ALL_AREAS_KEY;

  const handleOpenNoteEditor = useCallback((entry) => {
    const place = entry?.place || entry;
    setNoteTarget({
      placeId: place?.id,
      placeName: place?.name,
    });
    setNoteDraft(entry?.note || "");
    setCollectionDraft(entry?.collectionName || "");
  }, []);

  const handleCreateNote = useCallback(() => {
    if (savedData.length === 0) {
      Alert.alert(
        "Chưa có địa điểm đã lưu",
        "Hãy lưu ít nhất một địa điểm trước khi tạo ghi chú.",
      );
      return;
    }
    setPlacePickerVisible(true);
  }, [savedData.length]);

  const handlePlacePicked = useCallback(
    (entry) => {
      setPlacePickerVisible(false);
      handleOpenNoteEditor(entry);
    },
    [handleOpenNoteEditor],
  );

  const handleCloseNoteEditor = useCallback(() => {
    if (saveMutation.isPending) return;
    setNoteTarget(null);
    setNoteDraft("");
    setCollectionDraft("");
  }, [saveMutation.isPending]);

  const handleSaveNote = useCallback(async () => {
    if (!noteTarget?.placeId) return;
    try {
      await saveMutation.mutateAsync({
        placeId: noteTarget.placeId,
        note: noteDraft.trim() || null,
        collectionName: collectionDraft.trim() || null,
      });
      handleCloseNoteEditor();
    } catch {
      Alert.alert("Không lưu được ghi chú", "Vui lòng thử lại sau ít phút.");
    }
  }, [
    collectionDraft,
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
        "Địa điểm này sẽ được gỡ khỏi danh sách đã lưu.",
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
    ({ item }) => {
      const place = item?.place || item;
      return (
        <SavedCard
          entry={item}
          onPress={() => handleOpenPlace(place?.id)}
          onOpenNote={handleOpenNoteEditor}
          onUnsave={handleUnsave}
          unsaveDisabled={unsaveMutation.isPending || !place?.id}
        />
      );
    },
    [handleOpenNoteEditor, handleOpenPlace, handleUnsave, unsaveMutation.isPending],
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  if (!isLoggedIn) {
    return (
      <GuestGate
        icon="bookmark-border"
        title="Đăng nhập để lưu bộ sưu tập"
        description="Danh sách đã lưu sẽ được đồng bộ với tài khoản của bạn trên mọi thiết bị."
      />
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <OfflineBanner />
      <NoteEditorModal
        visible={!!noteTarget}
        placeName={noteTarget?.placeName}
        value={noteDraft}
        collectionName={collectionDraft}
        saving={saveMutation.isPending}
        onChangeText={setNoteDraft}
        onChangeCollectionName={setCollectionDraft}
        onClose={handleCloseNoteEditor}
        onSubmit={handleSaveNote}
      />
      <PlacePickerModal
        visible={placePickerVisible}
        savedData={savedData}
        onClose={() => setPlacePickerVisible(false)}
        onSelect={handlePlacePicked}
      />
      <FlatList
        data={!isLoading && !isError ? filteredSavedData : []}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#1D1D1F"
            colors={["#1D1D1F"]}
          />
        }
        ListHeaderComponent={
          !isLoading && !isError ? (
            <SavedDashboard
              savedData={savedData}
              filteredCount={filteredSavedData.length}
              collectionOptions={collectionOptions}
              areaOptions={areaOptions}
              activeCollection={activeCollection}
              activeArea={activeArea}
              onChangeCollection={setActiveCollection}
              onChangeArea={setActiveArea}
              onPressHero={handleOpenPlace}
            />
          ) : null
        }
        ItemSeparatorComponent={ItemSeparator}
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
        ListFooterComponent={<View style={styles.footerSpace} />}
      />

      {isLoggedIn && !isLoading && !isError && (
        <Pressable
          onPress={handleCreateNote}
          style={({ pressed }) => [
            styles.fab,
            pressed && styles.fabPressed,
          ]}
        >
          <MaterialIcons name="edit-note" size={24} color="#FFFFFF" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APPLE_THEME.background,
  },
  listContent: {
    paddingBottom: TAB_BAR_HEIGHT + 24,
  },
  separator: {
    height: SEPARATOR_HEIGHT,
  },
  footerSpace: {
    height: 16,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: TAB_BAR_HEIGHT + 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1D1D1F",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.85,
  },
});
