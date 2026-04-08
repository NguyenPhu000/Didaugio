import {
  Alert,
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Keyboard,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { MaterialIcons } from "@expo/vector-icons";
import { useAIPlanner } from "../ai/hooks/useAIPlanner";
import { TOKENS } from "../../constants/design-tokens";
import { PlacePreviewCard } from "../../components/composed/PlacePreviewCard";
import { TAB_BAR_HEIGHT } from "../../../app/(tabs)/_layout";

const QUICK_SUGGESTIONS = [
  { text: "Gợi ý quán ăn ngon ở Ninh Kiều", icon: "restaurant" },
  { text: "Top 5 điểm chụp ảnh đẹp", icon: "photo-camera" },
  { text: "Kế hoạch buổi tối Cần Thơ", icon: "nightlife" },
  { text: "Đi chơi gia đình 1 ngày", icon: "family-restroom" },
  { text: "Cà phê view đẹp gần trung tâm", icon: "local-cafe" },
];

const ACCENT = TOKENS.color.travel.ocean;

export function AIPlanner() {
  const [inputText, setInputText] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const {
    messages,
    isLoading,
    isPreviewLoading,
    isConfirming,
    error,
    sendMessage,
    draftPlan,
    selectedPlaceIds,
    togglePlaceSelection,
    selectAllPlaces,
    clearSelectedPlaces,
    confirmSelectedPlaces,
    canConfirmSelection,
    reset,
  } = useAIPlanner();

  const isCompactCard = width <= 380 || height <= 720;

  const handleSend = useCallback(
    async (text) => {
      const message = (text ?? inputText).trim();
      if (!message || isLoading) return;
      setInputText("");
      await sendMessage(message);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    },
    [inputText, isLoading, sendMessage],
  );

  const handleConfirmSelection = useCallback(async () => {
    if (!canConfirmSelection || isConfirming) return;
    await confirmSelectedPlaces();
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  }, [canConfirmSelection, confirmSelectedPlaces, isConfirming]);

  const handleOpenPlace = useCallback(
    (place) => {
      const normalizedId = Number(place?.id);
      if (!normalizedId) return;
      router.push(`/place/${normalizedId}`);
    },
    [router],
  );

  const handleTogglePlace = useCallback(
    (place) => {
      togglePlaceSelection(place?.id);
    },
    [togglePlaceSelection],
  );

  const handleAddPlaceToTrip = useCallback(
    (place) => {
      const normalizedId = Number(place?.id);
      if (!normalizedId || selectedPlaceIds.includes(normalizedId)) return;
      togglePlaceSelection(normalizedId);
    },
    [selectedPlaceIds, togglePlaceSelection],
  );

  const hasMessages = messages.length > 0;
  const canSend = inputText.trim().length > 0 && !isLoading;
  const hasPlannerHistory = hasMessages || !!draftPlan;

  const handleClearPlannerHistory = useCallback(() => {
    if (!hasPlannerHistory || isLoading) return;

    Alert.alert(
      "Xóa lịch sử Planner?",
      "Toàn bộ hội thoại, bản nháp lịch trình và lựa chọn địa điểm sẽ bị xóa trên thiết bị này.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            reset();
            setInputText("");
            setTimeout(
              () => scrollRef.current?.scrollTo({ y: 0, animated: true }),
              60,
            );
          },
        },
      ],
    );
  }, [hasPlannerHistory, isLoading, reset]);

  return (
    <View style={styles.container}>
      {/* ── Messages area ── */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          !hasMessages && styles.scrollContentEmpty,
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: false })
        }
      >
        {hasPlannerHistory ? (
          <View style={styles.historyActionRow}>
            <Pressable
              onPress={handleClearPlannerHistory}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.historyClearBtn,
                isLoading && styles.historyClearBtnDisabled,
                pressed && !isLoading && styles.historyClearBtnPressed,
              ]}
            >
              <MaterialIcons
                name="delete-outline"
                size={14}
                color={
                  isLoading ? TOKENS.color.neutral[400] : TOKENS.color.error
                }
              />
              <Text
                style={[
                  styles.historyClearText,
                  isLoading && styles.historyClearTextDisabled,
                ]}
              >
                Xóa lịch sử Planner
              </Text>
            </Pressable>
          </View>
        ) : null}

        {!hasMessages ? (
          /* ── Empty state ── */
          <View style={styles.emptyState}>
            <View style={styles.avatarCircle}>
              <MaterialIcons name="event-note" size={36} color={ACCENT} />
            </View>
            <Text style={styles.emptyTitle}>Lên kế hoạch cùng AI</Text>
            <Text style={styles.emptySubtitle}>
              Mô tả điều bạn muốn — AI sẽ sắp xếp thành lịch trình hoàn chỉnh,
              phù hợp với phong cách của bạn.
            </Text>

            <View style={styles.suggestionsGrid}>
              {QUICK_SUGGESTIONS.map((item) => (
                <Pressable
                  key={item.text}
                  onPress={() => handleSend(item.text)}
                  style={({ pressed }) => [
                    styles.suggestionChip,
                    pressed && styles.suggestionChipPressed,
                  ]}
                >
                  <MaterialIcons name={item.icon} size={16} color={ACCENT} />
                  <Text style={styles.suggestionText}>{item.text}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          /* ── Conversation ── */
          <View style={styles.messagesWrap}>
            {messages.map((message, index) => {
              const isUser = message.role === "user";
              return (
                <View
                  key={message.id ?? index}
                  style={[
                    styles.messageBlock,
                    isUser
                      ? styles.messageBlockUser
                      : styles.messageBlockAssistant,
                  ]}
                >
                  {!isUser ? (
                    <View style={styles.assistantTag}>
                      <View style={styles.assistantTagDot} />
                      <Text style={styles.assistantTagText}>AI Planner</Text>
                    </View>
                  ) : null}

                  <View
                    style={[
                      styles.bubble,
                      isUser ? styles.bubbleUser : styles.bubbleAssistant,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        isUser
                          ? styles.bubbleTextUser
                          : styles.bubbleTextAssistant,
                      ]}
                    >
                      {message.text ?? message.content}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {draftPlan?.suggestedPlaces?.length ? (
          <View style={styles.selectionPanel}>
            <View style={styles.selectionHeader}>
              <View>
                <Text style={styles.selectionTitle}>
                  Chọn địa điểm trước khi chốt
                </Text>
                <Text style={styles.selectionSubtitle}>
                  {selectedPlaceIds.length}/{draftPlan.suggestedPlaces.length}{" "}
                  địa điểm đã chọn
                </Text>
              </View>

              <View style={styles.selectionActionsRow}>
                <Pressable
                  onPress={selectAllPlaces}
                  style={styles.selectionActionBtn}
                >
                  <Text style={styles.selectionActionText}>Chọn tất cả</Text>
                </Pressable>
                <Pressable
                  onPress={clearSelectedPlaces}
                  style={styles.selectionActionBtn}
                >
                  <Text style={styles.selectionActionText}>Bỏ chọn</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.placeListWrap}>
              {draftPlan.suggestedPlaces.map((place, index) => {
                const placeId = Number(place?.id);
                const isSelected = selectedPlaceIds.includes(placeId);

                return (
                  <PlacePreviewCard
                    key={placeId || `${place?.name || "place"}-${index}`}
                    place={place}
                    compact={isCompactCard}
                    selected={isSelected}
                    showCloseButton={false}
                    showSelectionAction
                    showAddToTripAction
                    selectedLabel="Bỏ chọn"
                    unselectedLabel="Chọn"
                    addToTripLabel={isSelected ? "Đã thêm" : "Add vào trip"}
                    detailLabel="Chi tiết"
                    onViewDetail={handleOpenPlace}
                    onToggleSelection={handleTogglePlace}
                    onAddToTrip={handleAddPlaceToTrip}
                  />
                );
              })}
            </View>

            <Pressable
              onPress={handleConfirmSelection}
              disabled={!canConfirmSelection || isConfirming}
              style={({ pressed }) => [
                styles.confirmBtn,
                (!canConfirmSelection || isConfirming) &&
                  styles.confirmBtnDisabled,
                pressed &&
                  canConfirmSelection &&
                  !isConfirming &&
                  styles.confirmBtnPressed,
              ]}
            >
              {isConfirming ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons name="task-alt" size={18} color="#FFFFFF" />
              )}
              <Text style={styles.confirmBtnText}>Tạo trip từ lựa chọn</Text>
            </Pressable>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={ACCENT} />
            <Text style={styles.loadingText}>
              {isConfirming
                ? "Đang tạo chuyến đi..."
                : isPreviewLoading
                  ? "Đang gợi ý địa điểm..."
                  : "Đang xử lý..."}
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBar}>
            <MaterialIcons
              name="error-outline"
              size={14}
              color={TOKENS.color.error}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* ── Input bar — sticks to keyboard ── */}
      <KeyboardStickyView
        offset={{
          closed: 0,
          opened: Platform.OS === "ios" ? -insets.bottom : 0,
        }}
      >
        <View
          style={[
            styles.composerOuter,
            {
              paddingBottom: keyboardVisible
                ? 4
                : Math.max(insets.bottom, 8) + TAB_BAR_HEIGHT,
            },
          ]}
        >
          <View style={styles.composerCard}>
            <TextInput
              ref={inputRef}
              placeholder="Mô tả kế hoạch bạn muốn..."
              placeholderTextColor={TOKENS.color.neutral[400]}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              style={styles.input}
              textAlignVertical="center"
            />
            <Pressable
              onPress={() => handleSend()}
              disabled={!canSend}
              style={[
                styles.sendBtn,
                canSend ? styles.sendBtnActive : styles.sendBtnIdle,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons
                  name="arrow-upward"
                  size={20}
                  color={canSend ? "#FFFFFF" : TOKENS.color.neutral[400]}
                />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardStickyView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  /* ── Scroll ── */
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  scrollContentEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  /* ── Empty state ── */
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(191,219,254,0.5)",
    ...TOKENS.shadow.md,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: TOKENS.font.heading,
    color: TOKENS.color.neutral[900],
    textAlign: "center",
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.neutral[600],
    textAlign: "center",
    maxWidth: 300,
    marginBottom: 28,
  },
  suggestionsGrid: {
    width: "100%",
    gap: 10,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(191,219,254,0.5)",
    ...TOKENS.shadow.sm,
  },
  suggestionChipPressed: {
    backgroundColor: "rgba(59,130,246,0.06)",
    borderColor: "rgba(59,130,246,0.3)",
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: TOKENS.font.medium,
    color: TOKENS.color.neutral[700],
  },
  /* ── Messages ── */
  messagesWrap: {
    gap: 16,
  },
  historyActionRow: {
    alignItems: "flex-end",
    marginBottom: 8,
  },
  historyClearBtn: {
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TOKENS.color.error + "45",
    backgroundColor: TOKENS.color.error + "10",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  historyClearBtnDisabled: {
    borderColor: TOKENS.color.neutral[300],
    backgroundColor: TOKENS.color.neutral[100],
  },
  historyClearBtnPressed: {
    opacity: 0.94,
  },
  historyClearText: {
    color: TOKENS.color.error,
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 0.2,
  },
  historyClearTextDisabled: {
    color: TOKENS.color.neutral[400],
  },
  messageBlock: {
    gap: 6,
  },
  messageBlockUser: {
    alignItems: "flex-end",
  },
  messageBlockAssistant: {
    alignItems: "flex-start",
  },
  assistantTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 4,
  },
  assistantTagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT,
  },
  assistantTagText: {
    color: TOKENS.color.neutral[500],
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 0.3,
  },
  bubble: {
    maxWidth: "84%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  bubbleUser: {
    backgroundColor: ACCENT,
    borderBottomRightRadius: 6,
  },
  bubbleAssistant: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "rgba(191,219,254,0.45)",
    borderBottomLeftRadius: 6,
    ...TOKENS.shadow.sm,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
  },
  bubbleTextUser: {
    color: "#FFFFFF",
    fontFamily: TOKENS.font.medium,
  },
  bubbleTextAssistant: {
    color: TOKENS.color.neutral[800],
    fontFamily: TOKENS.font.body,
  },
  /* ── Selection panel ── */
  selectionPanel: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderWidth: 1,
    borderColor: "rgba(191,219,254,0.55)",
    ...TOKENS.shadow.sm,
    gap: 10,
  },
  selectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  selectionTitle: {
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
    color: TOKENS.color.neutral[900],
  },
  selectionSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.neutral[500],
  },
  selectionActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectionActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.28)",
    backgroundColor: "rgba(248,250,252,0.92)",
  },
  selectionActionText: {
    fontSize: 11,
    fontFamily: TOKENS.font.medium,
    color: TOKENS.color.neutral[600],
  },
  placeListWrap: {
    gap: 10,
  },
  confirmBtn: {
    marginTop: 2,
    height: 44,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    ...TOKENS.shadow.accent,
  },
  confirmBtnDisabled: {
    backgroundColor: TOKENS.color.neutral[300],
  },
  confirmBtnPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.96,
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
  /* ── Loading ── */
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "rgba(191,219,254,0.45)",
    borderBottomLeftRadius: 6,
    ...TOKENS.shadow.sm,
  },
  loadingText: {
    color: TOKENS.color.neutral[600],
    fontSize: 14,
    fontFamily: TOKENS.font.medium,
  },
  /* ── Error ── */
  errorBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "center",
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: TOKENS.color.error + "10",
    borderWidth: 1,
    borderColor: TOKENS.color.error + "25",
  },
  errorText: {
    flex: 1,
    color: TOKENS.color.error,
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
  },
  /* ── Composer ── */
  composerOuter: {
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: "transparent",
  },
  composerCard: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "rgba(191,219,254,0.5)",
    ...TOKENS.shadow.lg,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 12 : 10,
    paddingBottom: Platform.OS === "ios" ? 12 : 10,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.neutral[900],
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnActive: {
    backgroundColor: ACCENT,
    ...TOKENS.shadow.accent,
  },
  sendBtnIdle: {
    backgroundColor: TOKENS.color.neutral[200],
  },
});
