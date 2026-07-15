import {
  View,
  Text,
  FlatList,
  Pressable,
  Platform,
  Keyboard,
  ActivityIndicator,
  useWindowDimensions,
  StyleSheet,
  KeyboardAvoidingView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useAnimatedStyle, useSharedValue, withTiming, Easing } from "react-native-reanimated";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIconsRounded } from "../../../components/primitives/MaterialIconsRounded";
import { useAIPlanner } from "../hooks/useAIPlanner";
import { useGroqChat } from "../hooks/useGroqChat";
import { useGenieVoiceController } from "../hooks/useGenieVoiceController";
import { AIPlannerComposer } from "../components/genie/AIPlannerComposer";
import { AIPlannerHeader } from "../components/genie/AIPlannerHeader";
import { AIPlannerMessageItem } from "../components/genie/AIPlannerMessageItem";
import { GenieVoicePanel } from "../components/genie/GenieVoicePanel";
import {
  GENIE_INTENT_TYPES,
  buildGenieSuggestionGroups,
  detectGenieIntent,
} from "../lib/genieAssistantExperience";
import { TOKENS } from "../../../constants/design-tokens";
import CustomAlertModal from "../../../components/composed/CustomAlertModal";

const ACCENT = "#3478F6";
const SUGGESTION_COLORS = ["#0EA5E9", "#F97316", "#10B981", "#8B5CF6"];
const HISTORY_PREVIEW_LIMIT = 5;

function createConversationTopic(messages) {
  const userMessage = messages.find((message) => message.role === "user");
  const rawText = (userMessage?.text ?? userMessage?.content ?? "").trim();
  if (!rawText) return "Chủ đề mới";

  const cleaned = rawText
    .replace(/\s+/g, " ")
    .replace(/[?.!,;:]+$/g, "");
  const words = cleaned.split(" ").filter(Boolean).slice(0, 7);
  const title = words.join(" ");

  return title.length > 42 ? `${title.slice(0, 39).trim()}...` : title;
}

const s = StyleSheet.create({
  scrollView: {
    flex: 1,
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
});

export function AIPlanner() {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState("");
  const [headerExpanded, setHeaderExpanded] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const sidebarWidth = Math.min(width * 0.84, 336);

  const paddingAnim = useSharedValue(Math.max(insets.bottom, 12) + 10);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) => {
      const duration = e.duration || 250;
      paddingAnim.value = withTiming(8, { duration, easing: Easing.out(Easing.ease) });
    });
    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      const duration = e.duration || 250;
      paddingAnim.value = withTiming(Math.max(insets.bottom, 12) + 10, { duration, easing: Easing.out(Easing.ease) });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom, paddingAnim]);

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

  const {
    messages,
    isLoading: isPlannerLoading,
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
  const handleSendRef = useRef(null);
  const {
    status: voiceStatus,
    transcript: voiceTranscript,
    voiceLevel,
    isSpeaking,
    speakText,
    stopSpeaking,
    handleVoicePress,
    getStatusText: getVoiceStatusText,
    getWaveLabel: getVoiceWaveLabel,
    getWaveSublabel: getVoiceWaveSublabel,
  } = useGenieVoiceController({
    isLoading,
    onTranscript: (text) => {
      handleSendRef.current?.(text, { inputMode: "voice" });
    },
    onError: setChatError,
    t,
  });

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
  const conversationTopic = useMemo(() => createConversationTopic(allMessages), [allMessages]);
  const historyPreviewItems = useMemo(() => {
    return allMessages
      .filter((message) => message.role === "user")
      .slice(-HISTORY_PREVIEW_LIMIT)
      .reverse();
  }, [allMessages]);

  const suggestionGroups = useMemo(() => {
    const hour = new Date().getHours();
    const timeOfDay =
      hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    return buildGenieSuggestionGroups({
      hasSavedPlaces: false,
      timeOfDay,
    });
  }, []);

  const getLoadingMessage = () => {
    if (isConfirming) return t('aiPlanner.creatingTrip');
    if (isChatLoading) return t('aiPlanner.chatThinking');

    switch (loadingStep) {
      case 0:
        return t('aiPlanner.loadingStep0');
      case 1:
        return t('aiPlanner.loadingStep1');
      case 2:
        return t('aiPlanner.loadingStep2');
      default:
        return t('aiPlanner.loadingWait');
    }
  };

  const isCompactCard = width <= 380 || height <= 720;

  const handleSend = useCallback(
    async (text, options = {}) => {
      const message = (text ?? inputText).trim();
      if (!message || isLoading) return;
      setInputText("");

      const intent = detectGenieIntent(message);
      const shouldSpeakReply = options.inputMode === "voice";

      if (intent === GENIE_INTENT_TYPES.ITINERARY) {
        await sendMessage(message);
        if (shouldSpeakReply) {
          speakText(t("aiPlanner.voiceItineraryQueued"));
        }
      } else {
        setIsChatLoading(true);
        setChatError(null);
        try {
          const result = await sendChatMessage(message);
          if (shouldSpeakReply && result?.reply) {
            speakText(result.reply);
          }
        } catch (err) {
          setChatError(err?.message || t('aiPlanner.chatErrorFallback'));
        } finally {
          setIsChatLoading(false);
        }
      }

      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    },
    [inputText, isLoading, sendMessage, sendChatMessage, speakText, t],
  );

  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

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

  const handleGoHome = useCallback(() => {
    setHeaderExpanded(false);
    router.replace("/(tabs)/map");
  }, [router]);

  const handleTogglePlace = useCallback(
    (place) => {
      togglePlaceSelection(place?.id);
    },
    [togglePlaceSelection],
  );

  const hasMessages = allMessages.length > 0;
  const canSend = inputText.trim().length > 0 && !isLoading;
  const hasPlannerHistory = hasMessages || !!draftPlan;
  const isVoiceActive =
    voiceStatus === "listening" ||
    voiceStatus === "transcribing" ||
    voiceStatus === "speaking";

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
        setHeaderExpanded(false);
        setTimeout(
          () => scrollRef.current?.scrollToOffset({ offset: 0, animated: true }),
          60,
        );
      },
      onCancel: () => {},
    });
  }, [hasPlannerHistory, isLoading, reset, clearChatConversation, showAlert, t]);

  const renderPlannerMessage = useCallback(
    ({ item: message, index }) => (
      <AIPlannerMessageItem
        canConfirmSelection={canConfirmSelection}
        clearSelectedPlaces={clearSelectedPlaces}
        draftPlan={draftPlan}
        handleConfirmSelection={handleConfirmSelection}
        handleOpenPlace={handleOpenPlace}
        handleSend={handleSend}
        handleTogglePlace={handleTogglePlace}
        index={index}
        isCompactCard={isCompactCard}
        isConfirming={isConfirming}
        isSpeaking={isSpeaking}
        message={message}
        selectAllPlaces={selectAllPlaces}
        selectedPlaceIds={selectedPlaceIds}
        speakText={speakText}
        stopSpeaking={stopSpeaking}
        t={t}
      />
    ),
    [
      canConfirmSelection,
      clearSelectedPlaces,
      draftPlan,
      handleConfirmSelection,
      handleOpenPlace,
      handleSend,
      handleTogglePlace,
      isCompactCard,
      isConfirming,
      isSpeaking,
      selectAllPlaces,
      selectedPlaceIds,
      speakText,
      stopSpeaking,
      t,
    ],
  );
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <AIPlannerHeader
        conversationTopic={conversationTopic}
        handleClearPlannerHistory={handleClearPlannerHistory}
        handleGoHome={handleGoHome}
        hasPlannerHistory={hasPlannerHistory}
        headerExpanded={headerExpanded}
        historyPreviewItems={historyPreviewItems}
        insets={insets}
        isLoading={isLoading}
        setHeaderExpanded={setHeaderExpanded}
        setInputText={setInputText}
        sidebarWidth={sidebarWidth}
        t={t}
      />
      <FlatList
        ref={scrollRef}
        data={hasMessages ? allMessages : []}
        renderItem={renderPlannerMessage}
        keyExtractor={(item, index) => item.id ?? String(index)}
        contentInsetAdjustmentBehavior="automatic"
        style={s.scrollView}
        contentContainerStyle={hasMessages ? s.scrollContentMessages : s.scrollContentEmpty}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        removeClippedSubviews={Platform.OS === "android"}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListEmptyComponent={
          <View className="items-center px-4 py-8">
            <Pressable
              onPress={handleVoicePress}
              disabled={isLoading}
              className="mb-6 w-full"
            >
              <GenieVoicePanel
                active={isVoiceActive || isLoading}
                intensity={voiceLevel}
                label={getVoiceWaveLabel()}
                sublabel={getVoiceWaveSublabel()}
                loading={isLoading}
              />
            </Pressable>
            <Text
              className="text-center text-2xl leading-8 text-slate-950"
              style={{ fontFamily: TOKENS.font.heading }}
            >
              {t('aiPlanner.planTravel')}
            </Text>
            <Text
              className="mb-8 mt-2 max-w-[300px] text-center text-[13.5px] leading-5 text-slate-500"
              style={{ fontFamily: TOKENS.font.body }}
            >
              {t('aiPlanner.intro')}
            </Text>

            <View className="w-full gap-4">
              {suggestionGroups.map((group, groupIndex) => (
                <View key={group.id} className="gap-2">
                  <Text
                    className="px-1 text-[11px] uppercase tracking-[0.6px] text-slate-500"
                    style={{ fontFamily: TOKENS.font.semibold }}
                  >
                    {t(group.titleKey)}
                  </Text>
                  {group.items.map((item, itemIndex) => {
                    const suggestionText = t(item.textKey);
                    const promptText = t(item.promptKey);
                    const color = SUGGESTION_COLORS[(groupIndex + itemIndex) % SUGGESTION_COLORS.length];
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => handleSend(promptText)}
                        className="flex-row items-center gap-3 rounded-[18px] border border-slate-100 bg-white px-4 py-4"
                        style={{ boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)" }}
                      >
                        <View
                          className="h-9 w-9 items-center justify-center rounded-2xl"
                          style={{ backgroundColor: color + "16" }}
                        >
                          <MaterialIconsRounded name={item.icon} size={16} color={color} />
                        </View>
                        <Text
                          className="flex-1 text-[13.5px] leading-5 text-slate-700"
                          style={{ fontFamily: TOKENS.font.medium }}
                        >
                          {suggestionText}
                        </Text>
                        <MaterialIconsRounded name="chevron-right" size={16} color="#CBD5E1" />
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        }
        ListFooterComponent={
          <View className="gap-2 mt-2">
            {isVoiceActive ? (
              <View className="items-center justify-center">
                <Pressable
                  onPress={handleVoicePress}
                  disabled={isLoading}
                  className="w-full"
                >
                  <GenieVoicePanel
                    active
                    intensity={voiceLevel}
                    label={getVoiceWaveLabel()}
                    sublabel={getVoiceWaveSublabel()}
                    compact
                    loading={isLoading}
                  />
                </Pressable>
                <Text
                  className="mt-2 overflow-hidden rounded-full bg-sky-100 px-4 py-2 text-xs text-sky-900"
                  style={{ fontFamily: TOKENS.font.medium }}
                >
                  {getVoiceStatusText()}
                </Text>
              </View>
            ) : null}

            {isLoading ? (
              <View
                className="flex-row items-center self-start rounded-2xl rounded-tl-sm border border-slate-100 bg-white px-4 py-3"
                style={{ boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)" }}
              >
                <ActivityIndicator size="small" color={ACCENT} />
                <Text
                  className="ml-2.5 text-[13.5px] text-slate-600"
                  style={{ fontFamily: TOKENS.font.medium }}
                >
                  {getLoadingMessage()}
                </Text>
              </View>
            ) : null}

            {error ? (
              <View className="flex-row items-center self-center rounded-xl border border-red-100 bg-red-50 px-4 py-2.5">
                <MaterialIconsRounded name="error-outline" size={14} color="#EF4444" />
                <Text
                  className="ml-2 flex-1 text-xs text-red-500"
                  style={{ fontFamily: TOKENS.font.medium }}
                >
                  {error}
                </Text>
              </View>
            ) : null}

            {!isVoiceActive && getVoiceStatusText() ? (
              <View className="flex-row items-center self-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2">
                <MaterialIconsRounded
                  name={voiceStatus === "listening" ? "mic" : voiceStatus === "speaking" ? "graphic-eq" : "mic-off"}
                  size={14}
                  color="#047857"
                />
                <Text
                  className="ml-2 text-xs text-emerald-700"
                  style={{ fontFamily: TOKENS.font.medium }}
                >
                  {getVoiceStatusText()}
                </Text>
              </View>
            ) : null}

            {!isVoiceActive && voiceTranscript?.trim() ? (
              <View className="self-center rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5">
                <Text
                  className="text-[11px] uppercase text-slate-400"
                  style={{ fontFamily: TOKENS.font.semibold }}
                >
                  {t("aiPlanner.voiceTranscriptLabel")}
                </Text>
                <Text
                  className="mt-1 max-w-[300px] text-center text-[13px] leading-5 text-slate-700"
                  style={{ fontFamily: TOKENS.font.medium }}
                  numberOfLines={2}
                >
                  {voiceTranscript}
                </Text>
              </View>
            ) : null}
          </View>
        }
      />

      <AIPlannerComposer
        animatedInputBarStyle={animatedInputBarStyle}
        canSend={canSend}
        handleSend={handleSend}
        handleVoicePress={handleVoicePress}
        inputRef={inputRef}
        inputText={inputText}
        isLoading={isLoading}
        setInputText={setInputText}
        t={t}
        voiceStatus={voiceStatus}
      />
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
