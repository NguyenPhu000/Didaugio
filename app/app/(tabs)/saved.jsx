import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { PlaceCard } from "../../src/components/composed/PlaceCard";
import { PlaceCardSkeleton } from "../../src/components/ui/Skeleton";
import { GuestGate } from "../../src/components/ui/GuestGate";
import {
  useSavePlace,
  useSavedPlaces,
  useUnsavePlace,
} from "../../src/modules/saved/hooks/useSaved";
import { useAuthStore } from "../../src/stores/authStore";
import { TOKENS } from "../../src/constants/design-tokens";
import { TAB_BAR_HEIGHT } from "./_layout";
import { TAB_CARD_RADIUS, TAB_SCREEN_PADDING, TAB_THEME } from "./tabTheme";

const ALL_AREAS_KEY = "__all_areas__";
const ALL_COLLECTIONS_KEY = "__all_collections__";
const NOTES_COLLECTION_KEY = "__notes__";

function getPlaceArea(place) {
  const districtId =
    place?.district?.id ?? place?.ward?.districtId ?? place?.districtId;
  const districtName =
    place?.district?.name ?? place?.ward?.district?.name ?? null;

  if (districtId != null) {
    return {
      key: `id:${districtId}`,
      name: districtName || `Khu vực ${districtId}`,
    };
  }

  if (districtName) {
    return {
      key: `name:${districtName.trim().toLowerCase()}`,
      name: districtName,
    };
  }

  return null;
}

function getPlaceCollection(place) {
  const categoryId = place?.category?.id ?? place?.categoryId;
  const categoryName = place?.category?.name ?? place?.categoryName ?? null;

  if (categoryId != null) {
    return {
      key: `category:${categoryId}`,
      name: categoryName || `Danh mục ${categoryId}`,
    };
  }

  if (categoryName) {
    return {
      key: `category-name:${categoryName.trim().toLowerCase()}`,
      name: categoryName,
    };
  }

  return null;
}

function buildSummary(count) {
  return [
    {
      key: "saved",
      icon: "bookmark",
      value: String(count),
      label: "Đã lưu",
      tone: "blue",
    },
    {
      key: "sync",
      icon: "cloud-done",
      value: "Đã bật",
      label: "Đồng bộ",
      tone: "amber",
    },
    {
      key: "revisit",
      icon: "history",
      value: count > 0 ? "Sẵn sàng" : "Trống",
      label: "Quay lại nhanh",
      tone: "green",
    },
    {
      key: "collection",
      icon: "auto-awesome",
      value: count > 9 ? "Phong phú" : "Gọn gàng",
      label: "Bộ sưu tập",
      tone: "red",
    },
  ];
}

function SummaryTile({ item }) {
  const toneStyles = {
    blue: [styles.summaryIconBlue, styles.summaryGlowBlue],
    amber: [styles.summaryIconAmber, styles.summaryGlowAmber],
    green: [styles.summaryIconGreen, styles.summaryGlowGreen],
    red: [styles.summaryIconRed, styles.summaryGlowRed],
  };
  const [iconStyle, glowStyle] = toneStyles[item.tone] || toneStyles.blue;

  return (
    <View style={styles.summaryTile}>
      <View style={[styles.summaryIcon, iconStyle]}>
        <MaterialIcons name={item.icon} size={18} color="#FFFFFF" />
      </View>
      <Text style={styles.summaryValue}>{item.value}</Text>
      <Text style={styles.summaryLabel}>{item.label}</Text>
      <View style={[styles.summaryGlow, glowStyle]} />
    </View>
  );
}

function SavedHeader({
  count,
  totalCount,
  collectionOptions,
  activeCollection,
  onChangeCollection,
  areaOptions,
  activeArea,
  onChangeArea,
}) {
  const summary = buildSummary(count);

  return (
    <View style={styles.headerWrap}>
      <View style={styles.heroCard}>
        <View style={styles.heroBackdropA} />
        <View style={styles.heroBackdropB} />

        <View style={styles.heroTopRow}>
          <View style={styles.heroBadge}>
            <MaterialIcons
              name="bookmark"
              size={14}
              color={TAB_THEME.primary}
            />
            <Text style={styles.heroBadgeText}>Bộ sưu tập đã lưu</Text>
          </View>
          <View style={styles.counterPill}>
            <Text style={styles.counterText}>{count} địa điểm</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>Những nơi bạn muốn quay lại</Text>
        <Text style={styles.heroSubtitle}>
          Lưu lại quán ăn, điểm tham quan và trải nghiệm yêu thích để mở nhanh
          hơn ở mỗi lần dùng app.
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <MaterialIcons
              name="cloud-done"
              size={14}
              color={TAB_THEME.primary}
            />
            <Text style={styles.metaText}>Đồng bộ theo tài khoản</Text>
          </View>
          <View style={styles.metaPill}>
            <MaterialIcons name="bolt" size={14} color={TAB_THEME.primary} />
            <Text style={styles.metaText}>Mở lại chi tiết nhanh</Text>
          </View>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        {summary.map((item) => (
          <SummaryTile key={item.key} item={item} />
        ))}
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Danh sách địa điểm</Text>
        <Text style={styles.sectionCopy}>
          Mọi địa điểm yêu thích đều được gom lại để bạn xem lại, bỏ lưu hoặc mở
          chi tiết chỉ trong một chạm.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.areaFilterRow}
        >
          <Pressable
            onPress={() => onChangeCollection(ALL_COLLECTIONS_KEY)}
            style={[
              styles.areaChip,
              activeCollection === ALL_COLLECTIONS_KEY && styles.areaChipActive,
            ]}
          >
            <MaterialIcons
              name="collections-bookmark"
              size={14}
              color={
                activeCollection === ALL_COLLECTIONS_KEY ? "#FFFFFF" : "#1D1D1F"
              }
            />
            <Text
              style={[
                styles.areaChipText,
                activeCollection === ALL_COLLECTIONS_KEY &&
                  styles.areaChipTextActive,
              ]}
            >
              Tất cả bộ sưu tập ({totalCount})
            </Text>
          </Pressable>

          {collectionOptions.map((collection) => {
            const active = activeCollection === collection.key;
            return (
              <Pressable
                key={collection.key}
                onPress={() => onChangeCollection(collection.key)}
                style={[styles.areaChip, active && styles.areaChipActive]}
              >
                <MaterialIcons
                  name={collection.icon || "category"}
                  size={14}
                  color={active ? "#FFFFFF" : "#1D1D1F"}
                />
                <Text
                  style={[
                    styles.areaChipText,
                    active && styles.areaChipTextActive,
                  ]}
                >
                  {collection.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.areaFilterRow}
        >
          <Pressable
            onPress={() => onChangeArea(ALL_AREAS_KEY)}
            style={[
              styles.areaChip,
              activeArea === ALL_AREAS_KEY && styles.areaChipActive,
            ]}
          >
            <MaterialIcons
              name="map"
              size={14}
              color={activeArea === ALL_AREAS_KEY ? "#FFFFFF" : "#1D1D1F"}
            />
            <Text
              style={[
                styles.areaChipText,
                activeArea === ALL_AREAS_KEY && styles.areaChipTextActive,
              ]}
            >
              Tất cả khu vực ({totalCount})
            </Text>
          </Pressable>

          {areaOptions.map((area) => {
            const active = activeArea === area.key;
            return (
              <Pressable
                key={area.key}
                onPress={() => onChangeArea(area.key)}
                style={[styles.areaChip, active && styles.areaChipActive]}
              >
                <MaterialIcons
                  name="place"
                  size={14}
                  color={active ? "#FFFFFF" : "#1D1D1F"}
                />
                <Text
                  style={[
                    styles.areaChipText,
                    active && styles.areaChipTextActive,
                  ]}
                >
                  {area.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

function NoteEditorModal({
  visible,
  placeName,
  value,
  saving,
  onChangeText,
  onClose,
  onSubmit,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalBackdrop}
      >
        <View style={styles.noteModalCard}>
          <View style={styles.noteModalIcon}>
            <MaterialIcons name="edit-note" size={22} color={TAB_THEME.primary} />
          </View>
          <Text style={styles.noteModalTitle}>Ghi chú cá nhân</Text>
          <Text style={styles.noteModalSubtitle} numberOfLines={2}>
            {placeName || "Địa điểm đã lưu"}
          </Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder="VD: Đi buổi chiều, thử món đặc trưng, phù hợp đi nhóm..."
            placeholderTextColor="rgba(29, 29, 31, 0.42)"
            multiline
            maxLength={500}
            style={styles.noteInput}
            textAlignVertical="top"
          />
          <View style={styles.noteModalActions}>
            <Pressable
              onPress={onClose}
              disabled={saving}
              style={[styles.noteModalButton, styles.noteModalCancel]}
            >
              <Text style={styles.noteModalCancelText}>Hủy</Text>
            </Pressable>
            <Pressable
              onPress={onSubmit}
              disabled={saving}
              style={[styles.noteModalButton, styles.noteModalSubmit]}
            >
              <Text style={styles.noteModalSubmitText}>
                {saving ? "Đang lưu..." : "Lưu ghi chú"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function EmptyState() {
  return (
    <View style={styles.centerCardWrap}>
      <View style={styles.centerCard}>
        <View style={styles.centerIconBlock}>
          <View style={styles.centerIconPulse} />
          <MaterialIcons
            name="bookmark-border"
            size={38}
            color={TAB_THEME.primary}
          />
        </View>
        <Text style={styles.centerTitle}>Chưa có địa điểm nào</Text>
        <Text style={styles.centerCopy}>
          Khi bạn lưu một địa điểm từ Explore, địa điểm đó sẽ xuất hiện tại đây
          để quay lại bất cứ lúc nào.
        </Text>
      </View>
    </View>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <View style={styles.centerCardWrap}>
      <View style={styles.centerCard}>
        <View style={[styles.centerIconBlock, styles.errorIconBlock]}>
          <MaterialIcons
            name="error-outline"
            size={38}
            color={TOKENS.color.error}
          />
        </View>
        <Text style={styles.centerTitle}>Không tải được danh sách</Text>
        <Text style={styles.centerCopy}>
          {message ||
            "Đã có lỗi khi tải danh sách đã lưu. Thử lại sau ít phút."}
        </Text>
        <Pressable onPress={onRetry} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Thử lại</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.skeletonWrap}>
      <PlaceCardSkeleton />
      <PlaceCardSkeleton />
      <PlaceCardSkeleton />
    </View>
  );
}

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isGuest = useAuthStore((s) => s.isGuest);
  const isLoggedIn = !!accessToken && !isGuest;

  const {
    data: savedData = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useSavedPlaces(isLoggedIn);
  const unsaveMutation = useUnsavePlace();
  const saveMutation = useSavePlace();
  const [activeArea, setActiveArea] = useState(ALL_AREAS_KEY);
  const [activeCollection, setActiveCollection] = useState(ALL_COLLECTIONS_KEY);
  const [noteTarget, setNoteTarget] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");

  const collectionOptions = useMemo(() => {
    const map = new Map();
    let noteCount = 0;

    savedData.forEach((entry) => {
      const place = entry?.place || entry;
      const collection = getPlaceCollection(place);
      if (collection && !map.has(collection.key)) {
        map.set(collection.key, collection);
      }
      if (String(entry?.note || "").trim()) {
        noteCount += 1;
      }
    });

    const collections = Array.from(map.values()).sort((a, b) =>
      String(a.name).localeCompare(String(b.name), "vi"),
    );

    if (noteCount > 0) {
      collections.unshift({
        key: NOTES_COLLECTION_KEY,
        name: `Có ghi chú (${noteCount})`,
        icon: "edit-note",
      });
    }

    return collections;
  }, [savedData]);

  const areaOptions = useMemo(() => {
    const map = new Map();
    savedData.forEach((entry) => {
      const place = entry?.place || entry;
      const area = getPlaceArea(place);
      if (!area || map.has(area.key)) return;
      map.set(area.key, area);
    });
    return Array.from(map.values()).sort((a, b) =>
      String(a.name).localeCompare(String(b.name), "vi"),
    );
  }, [savedData]);

  const filteredSavedData = useMemo(() => {
    return savedData.filter((entry) => {
      const place = entry?.place || entry;
      if (activeCollection === NOTES_COLLECTION_KEY) {
        if (!String(entry?.note || "").trim()) return false;
      } else if (activeCollection !== ALL_COLLECTIONS_KEY) {
        const collection = getPlaceCollection(place);
        if (collection?.key !== activeCollection) return false;
      }

      if (activeArea === ALL_AREAS_KEY) return true;
      const area = getPlaceArea(place);
      return area?.key === activeArea;
    });
  }, [activeArea, activeCollection, savedData]);

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
  }, [handleCloseNoteEditor, noteDraft, noteTarget?.placeId, saveMutation]);

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
      <NoteEditorModal
        visible={!!noteTarget}
        placeName={noteTarget?.placeName}
        value={noteDraft}
        saving={saveMutation.isPending}
        onChangeText={setNoteDraft}
        onClose={handleCloseNoteEditor}
        onSubmit={handleSaveNote}
      />
      <FlatList
        data={!isLoading && !isError ? filteredSavedData : []}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={TAB_THEME.primary}
            colors={[TAB_THEME.primary]}
          />
        }
        ListHeaderComponent={
          <SavedHeader
            count={filteredSavedData.length}
            totalCount={savedData.length}
            collectionOptions={collectionOptions}
            activeCollection={activeCollection}
            onChangeCollection={setActiveCollection}
            areaOptions={areaOptions}
            activeArea={activeArea}
            onChangeArea={setActiveArea}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          isLoading ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState message={error?.message} onRetry={refetch} />
          ) : (
            <EmptyState />
          )
        }
        renderItem={({ item }) => {
          const place = item?.place || item;
          return (
            <View style={styles.cardWrap}>
              <PlaceCard
                place={place}
                onSave={() => handleUnsave(place.id)}
                isSaved
                style={styles.placeCardStyle}
              />
              <Pressable
                onPress={() => handleUnsave(place.id)}
                style={styles.unsaveButton}
              >
                <MaterialIcons
                  name="bookmark-remove"
                  size={16}
                  color="#1D1D1F"
                />
                <Text style={styles.unsaveButtonText}>Bỏ lưu địa điểm</Text>
              </Pressable>
              {item?.note ? (
                <View style={styles.savedNoteCard}>
                  <MaterialIcons
                    name="sticky-note-2"
                    size={15}
                    color={TAB_THEME.primary}
                  />
                  <Text style={styles.savedNoteText} numberOfLines={3}>
                    {item.note}
                  </Text>
                </View>
              ) : null}
              <Pressable
                onPress={() => handleOpenNoteEditor(item)}
                style={styles.noteButton}
              >
                <MaterialIcons name="edit-note" size={16} color="#1D1D1F" />
                <Text style={styles.noteButtonText}>
                  {item?.note ? "Sửa ghi chú" : "Thêm ghi chú"}
                </Text>
              </Pressable>
            </View>
          );
        }}
        ListFooterComponent={<View style={styles.footerSpace} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6FAFF",
  },
  listContent: {
    paddingBottom: TAB_BAR_HEIGHT + 24,
  },
  headerWrap: {
    paddingHorizontal: TAB_SCREEN_PADDING,
    paddingTop: 16,
    paddingBottom: 18,
  },
  heroCard: {
    overflow: "hidden",
    borderRadius: TAB_CARD_RADIUS,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    gap: 12,
    ...TOKENS.shadow.lg,
  },
  heroBackdropA: {
    position: "absolute",
    top: -70,
    right: -36,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(59, 130, 246, 0.12)",
  },
  heroBackdropB: {
    position: "absolute",
    bottom: -88,
    left: -54,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(14, 165, 233, 0.08)",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(59, 130, 246, 0.12)",
  },
  heroBadgeText: {
    color: TAB_THEME.primary,
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
  },
  counterPill: {
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F8FBFF",
  },
  counterText: {
    color: TAB_THEME.text,
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
  },
  heroTitle: {
    color: TAB_THEME.text,
    fontSize: 30,
    lineHeight: 34,
    fontFamily: TOKENS.font.heading,
  },
  heroSubtitle: {
    color: TAB_THEME.textMuted,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: TOKENS.font.body,
    maxWidth: "94%",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F8FBFF",
  },
  metaText: {
    color: TAB_THEME.textMuted,
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  summaryTile: {
    width: "47.5%",
    minHeight: 112,
    borderRadius: 24,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
    overflow: "hidden",
    ...TOKENS.shadow.sm,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  summaryIconBlue: {
    backgroundColor: "#2563EB",
  },
  summaryIconAmber: {
    backgroundColor: "#F59E0B",
  },
  summaryIconGreen: {
    backgroundColor: "#10B981",
  },
  summaryIconRed: {
    backgroundColor: "#EF4444",
  },
  summaryValue: {
    color: TAB_THEME.text,
    fontSize: 22,
    fontFamily: TOKENS.font.heading,
  },
  summaryLabel: {
    marginTop: 4,
    color: TAB_THEME.textMuted,
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
  },
  summaryGlow: {
    position: "absolute",
    right: -18,
    bottom: -24,
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  summaryGlowBlue: {
    backgroundColor: "rgba(37, 99, 235, 0.08)",
  },
  summaryGlowAmber: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  summaryGlowGreen: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  summaryGlowRed: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  sectionHead: {
    marginTop: 18,
    gap: 8,
  },
  sectionTitle: {
    color: TAB_THEME.text,
    fontSize: 20,
    fontFamily: TOKENS.font.heading,
  },
  sectionCopy: {
    color: TAB_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: TOKENS.font.body,
  },
  skeletonWrap: {
    paddingHorizontal: TAB_SCREEN_PADDING,
    gap: 16,
  },
  separator: {
    height: 14,
  },
  cardWrap: {
    paddingHorizontal: TAB_SCREEN_PADDING,
  },
  areaFilterRow: {
    paddingTop: 4,
    paddingRight: 8,
    gap: 8,
  },
  areaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: TOKENS.radius.full,
    borderWidth: 1,
    borderColor: "rgba(29, 29, 31, 0.15)",
    backgroundColor: "#FFFFFF",
  },
  areaChipActive: {
    backgroundColor: "#1D1D1F",
    borderColor: "#1D1D1F",
  },
  areaChipText: {
    color: "#1D1D1F",
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
  },
  areaChipTextActive: {
    color: "#FFFFFF",
  },
  placeCardStyle: {
    marginBottom: 0,
  },
  unsaveButton: {
    marginTop: 10,
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: TOKENS.radius.full,
    borderWidth: 1,
    borderColor: "rgba(29, 29, 31, 0.14)",
    backgroundColor: "#FFFFFF",
  },
  unsaveButtonText: {
    color: "#1D1D1F",
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
  },
  savedNoteCard: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.14)",
  },
  savedNoteText: {
    flex: 1,
    color: TAB_THEME.text,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: TOKENS.font.body,
  },
  noteButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: TOKENS.radius.full,
    borderWidth: 1,
    borderColor: "rgba(29, 29, 31, 0.14)",
    backgroundColor: "#FFFFFF",
  },
  noteButtonText: {
    color: "#1D1D1F",
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  noteModalCard: {
    borderRadius: 28,
    padding: 22,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    ...TOKENS.shadow.lg,
  },
  noteModalIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59, 130, 246, 0.12)",
  },
  noteModalTitle: {
    color: TAB_THEME.text,
    fontSize: 22,
    fontFamily: TOKENS.font.heading,
  },
  noteModalSubtitle: {
    color: TAB_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: TOKENS.font.body,
  },
  noteInput: {
    minHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: TAB_THEME.text,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: TOKENS.font.body,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "rgba(29, 29, 31, 0.1)",
  },
  noteModalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  noteModalButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: TOKENS.radius.full,
    paddingVertical: 12,
  },
  noteModalCancel: {
    backgroundColor: "#F2F4F7",
  },
  noteModalSubmit: {
    backgroundColor: TAB_THEME.primary,
  },
  noteModalCancelText: {
    color: TAB_THEME.text,
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
  noteModalSubmitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
  centerCardWrap: {
    paddingHorizontal: TAB_SCREEN_PADDING,
    paddingTop: 12,
  },
  centerCard: {
    alignItems: "center",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
    ...TOKENS.shadow.md,
  },
  centerIconBlock: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF3FF",
    overflow: "hidden",
  },
  centerIconPulse: {
    position: "absolute",
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "rgba(59, 130, 246, 0.12)",
  },
  errorIconBlock: {
    backgroundColor: "#FEF2F2",
  },
  centerTitle: {
    marginTop: 18,
    color: TAB_THEME.text,
    fontSize: 24,
    lineHeight: 30,
    textAlign: "center",
    fontFamily: TOKENS.font.heading,
  },
  centerCopy: {
    marginTop: 10,
    color: TAB_THEME.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    fontFamily: TOKENS.font.body,
  },
  primaryButton: {
    marginTop: 18,
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: TAB_THEME.primary,
    ...TOKENS.shadow.accent,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
  footerSpace: {
    height: 8,
  },
});
