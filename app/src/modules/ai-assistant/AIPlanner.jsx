import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Keyboard,
  ActivityIndicator,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { LinearGradient } from "expo-linear-gradient";
import { useAIPlanner } from "../ai/hooks/useAIPlanner";
import { TOKENS } from "../../constants/design-tokens";
import { PlacePreviewCard } from "../../components/composed/PlacePreviewCard";
import { TAB_BAR_HEIGHT } from "../../../app/(tabs)/_layout";
import CustomAlertModal from "../../components/composed/CustomAlertModal";

const QUICK_SUGGESTIONS = [
  { text: "Gợi ý quán ăn ngon ở Ninh Kiều", icon: "restaurant", color: "#F59E0B" },
  { text: "Top 5 điểm chụp ảnh đẹp", icon: "photo-camera", color: "#EC4899" },
  { text: "Kế hoạch buổi tối Cần Thơ", icon: "nightlife", color: "#8B5CF6" },
  { text: "Đi chơi gia đình 1 ngày", icon: "family-restroom", color: "#10B981" },
  { text: "Cà phê view đẹp gần trung tâm", icon: "local-cafe", color: "#3B82F6" },
];

const ACCENT = "#3478F6";

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 0,
  },
  headerTitle: {
    fontSize: 15.5,
    color: "#1E293B",
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 9999,
    backgroundColor: "#10B981",
  },
  statusText: {
    fontSize: 10,
    color: "#94A3B8",
  },
  deleteBtnBase: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnDisabled: {
    opacity: 0.4,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 24,
    lineHeight: 32,
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    color: "#64748B",
    textAlign: "center",
    maxWidth: 280,
    marginBottom: 32,
  },
  suggestionsWrap: {
    width: "100%",
    gap: 10,
  },
  suggestionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  suggestionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionText: {
    flex: 1,
    fontSize: 13.5,
    color: "#334155",
  },
  messagesWrap: {
    gap: 16,
  },
  messageRow: {
    gap: 6,
  },
  messageRowUser: {
    alignItems: "flex-end",
  },
  messageRowBot: {
    alignItems: "flex-start",
  },
  botLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 4,
  },
  botLabelDot: {
    width: 6,
    height: 6,
    borderRadius: 9999,
    backgroundColor: "#3B82F6",
  },
  botLabelText: {
    color: "#94A3B8",
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  bubbleBase: {
    maxWidth: "85%",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: "#3478F6",
    borderTopRightRadius: 0,
  },
  bubbleBot: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderTopLeftRadius: 0,
  },
  bubbleTextBase: {
    fontSize: 14.5,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: "#FFFFFF",
  },
  bubbleTextBot: {
    color: "#1E293B",
  },
  draftCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 30,
    elevation: 4,
    gap: 16,
  },
  draftHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  draftHeaderTextWrap: {
    flex: 1,
  },
  draftTitle: {
    fontSize: 14.5,
    color: "#0F172A",
  },
  draftSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#94A3B8",
  },
  draftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  draftActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    backgroundColor: "#F8FAFC",
  },
  draftSelectAllText: {
    fontSize: 11,
    color: "#2563EB",
  },
  draftDeselectText: {
    fontSize: 11,
    color: "#64748B",
  },
  draftPlacesWrap: {
    gap: 12,
  },
  confirmBtn: {
    marginTop: 4,
    borderRadius: 16,
    overflow: "hidden",
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmTextDisabled: {
    color: "#94A3B8",
  },
  confirmTextEnabled: {
    color: "#FFFFFF",
  },
  confirmTextBase: {
    fontSize: 14.5,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderTopLeftRadius: 0,
  },
  typingText: {
    color: "#475569",
    fontSize: 13.5,
  },
  errorBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "center",
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  errorText: {
    flex: 1,
    color: "#EF4444",
    fontSize: 12,
    marginLeft: 4,
  },
  inputBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: "transparent",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 3,
  },
  textInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14.5,
    color: "#1E293B",
  },
  sendBtnBase: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnActive: {
    backgroundColor: "#3478F6",
  },
  sendBtnInactive: {
    backgroundColor: "#F8FAFC",
  },
});

export function AIPlanner() {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "error",
    confirmText: t('aiPlanner.close'),
    cancelText: t('aiPlanner.cancel'),
    onConfirm: null,
    onCancel: null,
    isDestructive: false,
  });

  const showAlert = useCallback(({ title, message, type = "error", confirmText, cancelText, onConfirm, onCancel, isDestructive = false }) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      onConfirm: () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        onConfirm?.();
      },
      onCancel: onCancel ? () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        onCancel?.();
      } : null,
      isDestructive,
    });
  }, []);

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

    showAlert({
      title: t('aiPlanner.confirmDelete'),
      message: t('aiPlanner.confirmDeleteDesc'),
      type: "confirm",
      confirmText: t('aiPlanner.delete'),
      cancelText: t('aiPlanner.cancel'),
      isDestructive: true,
      onConfirm: () => {
        reset();
        setInputText("");
        setTimeout(
          () => scrollRef.current?.scrollTo({ y: 0, animated: true }),
          60,
        );
      },
      onCancel: () => {},
    });
  }, [hasPlannerHistory, isLoading, reset, showAlert]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <View
        style={[s.header, { paddingTop: Math.max(insets.top, 8) }]}
      >
        <View style={s.headerLeft}>
          <View style={s.headerIconWrap}>
            <MaterialIconsRounded name="assistant" size={22} color="#3478F6" />
          </View>
          <View>
            <Text
              style={[s.headerTitle, { fontFamily: TOKENS.font.semibold }]}
            >
              {t('aiPlanner.travelAssistant')}
            </Text>
            <View style={s.statusRow}>
              <View style={s.statusDot} />
              <Text
                style={[s.statusText, { fontFamily: TOKENS.font.medium }]}
              >
                {t('aiPlanner.readyToHelp')}
              </Text>
            </View>
          </View>
        </View>

        {hasPlannerHistory && (
          <Pressable
            onPress={handleClearPlannerHistory}
            disabled={isLoading}
            style={[s.deleteBtnBase, isLoading && s.deleteBtnDisabled]}
          >
            <MaterialIconsRounded name="delete-sweep" size={22} color="#64748B" />
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        style={s.scrollView}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 24,
          flexGrow: !hasMessages ? 1 : undefined,
          justifyContent: !hasMessages ? "center" : undefined,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: false })
        }
      >
        {!hasMessages ? (
          <View style={s.emptyContainer}>
            <LinearGradient
              colors={["#EFF6FF", "#DBEAFE"]}
              style={{ width: 64, height: 64, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 20, transform: [{ rotate: "3deg" }] }}
            >
              <MaterialIconsRounded name="auto-awesome" size={28} color="#3478F6" />
            </LinearGradient>
            <Text
              style={[s.emptyTitle, { fontFamily: TOKENS.font.heading }]}
            >
              {t('aiPlanner.planTravel')}
            </Text>
            <Text
              style={[s.emptySubtitle, { fontFamily: TOKENS.font.body }]}
            >
              {t('aiPlanner.intro')}
            </Text>

            <View style={s.suggestionsWrap}>
              {QUICK_SUGGESTIONS.map((item) => (
                <Pressable
                  key={item.text}
                  onPress={() => handleSend(item.text)}
                  style={s.suggestionBtn}
                >
                  <View
                    style={[s.suggestionIconWrap, { backgroundColor: item.color + "15" }]}
                  >
                    <MaterialIconsRounded name={item.icon} size={16} color={item.color} />
                  </View>
                  <Text
                    style={[s.suggestionText, { fontFamily: TOKENS.font.medium }]}
                  >
                    {item.text}
                  </Text>
                  <MaterialIconsRounded name="chevron-right" size={16} color="#CBD5E1" />
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View style={s.messagesWrap}>
            {messages.map((message, index) => {
              const isUser = message.role === "user";
              return (
                <View
                  key={message.id ?? index}
                  style={[s.messageRow, isUser ? s.messageRowUser : s.messageRowBot]}
                >
                  {!isUser ? (
                    <View style={s.botLabelRow}>
                      <View style={s.botLabelDot} />
                      <Text
                        style={[s.botLabelText, { fontFamily: TOKENS.font.semibold }]}
                      >
                        Nhi (AI)
                      </Text>
                    </View>
                  ) : null}

                  <View
                    style={[
                      s.bubbleBase,
                      isUser ? s.bubbleUser : s.bubbleBot,
                    ]}
                  >
                    <Text
                      style={[
                        s.bubbleTextBase,
                        isUser ? s.bubbleTextUser : s.bubbleTextBot,
                        { fontFamily: isUser ? TOKENS.font.medium : TOKENS.font.body },
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
          <View style={s.draftCard}>
            <View style={s.draftHeader}>
              <View style={s.draftHeaderTextWrap}>
                <Text
                  style={[s.draftTitle, { fontFamily: TOKENS.font.semibold }]}
                >
                  {t('aiPlanner.selectPlaces')}
                </Text>
                <Text
                  style={[s.draftSubtitle, { fontFamily: TOKENS.font.body }]}
                >
                  {t('aiPlanner.selectingCount', { selected: selectedPlaceIds.length, total: draftPlan.suggestedPlaces.length })}
                </Text>
              </View>

              <View style={s.draftActions}>
                <Pressable
                  onPress={selectAllPlaces}
                  style={s.draftActionBtn}
                >
                  <Text
                    style={[s.draftSelectAllText, { fontFamily: TOKENS.font.semibold }]}
                  >
                    {t('aiPlanner.selectAll')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={clearSelectedPlaces}
                  style={s.draftActionBtn}
                >
                  <Text
                    style={[s.draftDeselectText, { fontFamily: TOKENS.font.semibold }]}
                  >
                    {t('aiPlanner.deselect')}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={s.draftPlacesWrap}>
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
                    selectedLabel={t('aiPlanner.selected')}
                    unselectedLabel={t('aiPlanner.selectPlace')}
                    addToTripLabel={isSelected ? t('aiPlanner.added') : t('aiPlanner.addTrip')}
                    detailLabel={t('aiPlanner.details')}
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
              style={[s.confirmBtn, (!canConfirmSelection || isConfirming) && s.confirmBtnDisabled]}
            >
              <LinearGradient
                colors={
                  !canConfirmSelection || isConfirming
                    ? ["#E2E8F0", "#E2E8F0"]
                    : ["#3478F6", "#1E3A8A"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16 }}
              >
                {isConfirming ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <MaterialIconsRounded
                    name="auto-awesome-motion"
                    size={18}
                    color={
                      !canConfirmSelection || isConfirming
                        ? "#94A3B8"
                        : "#FFFFFF"
                    }
                  />
                )}
                <Text
                  style={[
                    s.confirmTextBase,
                    (!canConfirmSelection || isConfirming) ? s.confirmTextDisabled : s.confirmTextEnabled,
                    { fontFamily: TOKENS.font.semibold },
                  ]}
                >
                  {t('aiPlanner.createFromSelection')}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : null}

        {isLoading ? (
          <View style={s.typingBubble}>
            <ActivityIndicator size="small" color={ACCENT} />
            <Text
              style={[s.typingText, { fontFamily: TOKENS.font.medium }]}
            >
              {isConfirming
                ? t('aiPlanner.creatingTrip')
                : isPreviewLoading
                  ? t('aiPlanner.suggestingPlaces')
                  : t('aiPlanner.processing')}
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={s.errorBubble}>
            <MaterialIconsRounded name="error-outline" size={14} color="#EF4444" />
            <Text
              style={[s.errorText, { fontFamily: TOKENS.font.medium }]}
            >
              {error}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[
          s.inputBar,
          {
            paddingBottom: keyboardVisible
              ? 8
              : Math.max(insets.bottom, 8) + TAB_BAR_HEIGHT,
          },
        ]}
      >
        <View style={s.inputContainer}>
          <TextInput
            ref={inputRef}
            placeholder={t('aiPlanner.inputPlaceholder')}
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            style={[
              s.textInput,
              {
                fontFamily: TOKENS.font.body,
                textAlignVertical: "center",
              },
            ]}
          />
          <Pressable
            onPress={() => handleSend()}
            disabled={!canSend}
            style={[s.sendBtnBase, canSend ? s.sendBtnActive : s.sendBtnInactive]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialIconsRounded
                name="arrow-upward"
                size={18}
                color={canSend ? "#FFFFFF" : "#CBD5E1"}
              />
            )}
          </Pressable>
        </View>
      </View>

      <CustomAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
        isDestructive={alertConfig.isDestructive}
      />
    </KeyboardAvoidingView>
  );
}
