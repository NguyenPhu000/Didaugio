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
  KeyboardAvoidingView,
} from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from "react-native-reanimated";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { LinearGradient } from "expo-linear-gradient";
import { useAIPlanner } from "../ai/hooks/useAIPlanner";
import { useGroqChat } from "./hooks/useGroqChat";
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

const ITINERARY_PATTERN = /(lịch trình|lên lịch|kế hoạch|itinerary|plan|lộ trình|chặng đi|tạo chuyến|tạo tour)/i;

function detectIntent(text) {
  return ITINERARY_PATTERN.test(text) ? "itinerary" : "chat";
}

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
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
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
    boxShadow: "0 -1px 2px rgba(0, 0, 0, 0.05)",
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
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
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
    backgroundColor: "#10B981",
  },
  botLabelText: {
    color: "#71717A",
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  bubbleBase: {
    maxWidth: "85%",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
  },
  bubbleUser: {
    backgroundColor: "#F4F4F5",
    borderTopRightRadius: 2,
  },
  bubbleBot: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderTopLeftRadius: 2,
  },
  bubbleTextBase: {
    fontSize: 14.5,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: "#18181B",
  },
  bubbleTextBot: {
    color: "#27272A",
  },
  draftCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.03)",
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
  gradientIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    transform: [{ rotate: "3deg" }],
  },
  scrollContentEmpty: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: "center",
  },
  scrollContentMessages: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  chatPlacesWrap: {
    gap: 8,
    marginTop: 8,
    width: "100%",
  },
  confirmGradientInner: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
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
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
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
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 28,
    backgroundColor: "#F1F5F9",
  },
  textInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 120,
    paddingHorizontal: 4,
    paddingVertical: 6,
    fontSize: 15,
    color: "#1E293B",
  },
  inputIconBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    marginBottom: 2,
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

  const paddingAnim = useSharedValue(Math.max(insets.bottom, 12) + TAB_BAR_HEIGHT);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) => {
      const duration = e.duration || 250;
      paddingAnim.value = withTiming(8, { duration, easing: Easing.out(Easing.ease) });
    });
    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      const duration = e.duration || 250;
      paddingAnim.value = withTiming(Math.max(insets.bottom, 12) + TAB_BAR_HEIGHT, { duration, easing: Easing.out(Easing.ease) });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom]);

  const animatedInputBarStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: paddingAnim.value,
    };
  });

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
    isLoading: isPlannerLoading,
    isPreviewLoading,
    isConfirming,
    error: plannerError,
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

  const {
    sendMessage: sendChatMessage,
    clearConversation: clearChatConversation,
  } = useGroqChat();

  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  const isLoading = isPlannerLoading || isChatLoading;
  const error = plannerError || chatError;

  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((step) => step + 1);
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  const allMessages = messages;

  const getLoadingMessage = () => {
    if (isConfirming) return t('aiPlanner.creatingTrip') || "Nhi đang khởi tạo chuyến đi...";
    if (isChatLoading) return "Nhi đang suy nghĩ...";
    
    switch (loadingStep) {
      case 0:
        return "Nhi đang quét các địa điểm quanh bạn...";
      case 1:
        return "Nhi đang tính toán tuyến đường tối ưu...";
      case 2:
        return "Nhi đang lập bảng dự toán chi phí...";
      default:
        return "Chờ Nhi một chút xíu nữa nghen...";
    }
  };

  const isCompactCard = width <= 380 || height <= 720;

  const handleSend = useCallback(
    async (text) => {
      const message = (text ?? inputText).trim();
      if (!message || isLoading) return;
      setInputText("");

      const intent = detectIntent(message);

      if (intent === "itinerary") {
        await sendMessage(message);
      } else {
        setIsChatLoading(true);
        setChatError(null);
        try {
          await sendChatMessage(message);
        } catch (err) {
          setChatError(err?.message || "Đã xảy ra lỗi, bạn thử lại nhé.");
        } finally {
          setIsChatLoading(false);
        }
      }

      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    },
    [inputText, isLoading, sendMessage, sendChatMessage],
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

  const hasMessages = allMessages.length > 0;
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
        clearChatConversation();
        setInputText("");
        setTimeout(
          () => scrollRef.current?.scrollTo({ y: 0, animated: true }),
          60,
        );
      },
      onCancel: () => {},
    });
  }, [hasPlannerHistory, isLoading, reset, clearChatConversation, showAlert]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
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
        contentInsetAdjustmentBehavior="automatic"
        style={s.scrollView}
        contentContainerStyle={hasMessages ? s.scrollContentMessages : s.scrollContentEmpty}
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
              style={s.gradientIconWrap}
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
            {allMessages.map((message, index) => {
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

                  {!isUser && message.source === "chat" && (message.suggestedPlaces?.length ?? 0) > 0 ? (
                    <View style={s.chatPlacesWrap}>
                      {message.suggestedPlaces.map((place, i) => (
                        <PlacePreviewCard
                          key={place.id || `chat-place-${i}`}
                          place={place}
                          compact={isCompactCard}
                          showCloseButton={false}
                          onViewDetail={handleOpenPlace}
                        />
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        {(draftPlan?.suggestedPlaces?.length ?? 0) > 0 ? (
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
                    selectedLabel={t('aiPlanner.selected')}
                    unselectedLabel={t('aiPlanner.selectPlace')}
                    detailLabel={t('aiPlanner.details')}
                    onViewDetail={handleOpenPlace}
                    onToggleSelection={handleTogglePlace}
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
                style={s.confirmGradientInner}
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
              {getLoadingMessage()}
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

      <Animated.View
        style={[
          animatedInputBarStyle,
        ]}
        className="bg-transparent px-4 w-full"
      >
        <View className="flex-row items-end gap-2.5 px-4 py-1.5 rounded-full bg-slate-100 shadow-sm mb-2">
          <TextInput
            ref={inputRef}
            placeholder={t('aiPlanner.inputPlaceholder')}
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            className="flex-1 min-h-[38px] max-h-[120px] px-1 py-1.5 text-[15px] text-slate-800"
            style={{ fontFamily: TOKENS.font.body, textAlignVertical: "center" }}
          />

          <Pressable
            onPress={() => handleSend()}
            disabled={!canSend}
            className={`w-9 h-9 items-center justify-center rounded-full ${
              canSend ? "bg-blue-500" : "bg-slate-200"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialIconsRounded
                name="arrow-upward"
                size={18}
                color={canSend ? "#FFFFFF" : "#94A3B8"}
              />
            )}
          </Pressable>
        </View>
      </Animated.View>

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
