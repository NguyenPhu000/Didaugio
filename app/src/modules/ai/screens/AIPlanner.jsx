import {
  View,
  Text,
  FlatList,
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
import { Image } from "expo-image";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIconsRounded } from "../../../components/primitives/MaterialIconsRounded";
import { LinearGradient } from "expo-linear-gradient";
import { useAIPlanner } from "../hooks/useAIPlanner";
import { useGroqChat } from "../hooks/useGroqChat";
import { useGenieVoice } from "../hooks/useGenieVoice";
import {
  GENIE_INTENT_TYPES,
  buildGenieSuggestionGroups,
  detectGenieIntent,
} from "../lib/genieAssistantExperience";
import { TOKENS } from "../../../constants/design-tokens";
import { PlacePreviewCard } from "../../../components/composed/PlacePreviewCard";
import CustomAlertModal from "../../../components/composed/CustomAlertModal";
import { Glow } from "../../../components/reacticx/glow";

const ACCENT = "#3478F6";
const SUGGESTION_COLORS = ["#0EA5E9", "#F97316", "#10B981", "#8B5CF6"];
const VOICE_BAR_FACTORS = [0.35, 0.72, 1, 0.6, 0.42];
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

function GenieAvatar({ size = 40 }) {
  return (
    <Glow
      size={Math.max(2, size * 0.08)}
      radius={size / 2}
      color="#2563EB"
      secondaryColor="#DB2777"
      intensity={0.72}
      style="breathe"
      speed={0.72}
    >
      <View
        className="items-center justify-center rounded-full bg-white"
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          boxShadow: "0 12px 30px rgba(14, 165, 233, 0.22)",
        }}
      >
        <LinearGradient
          colors={["#2563EB", "#7C3AED", "#DB2777"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="items-center justify-center rounded-full"
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            padding: Math.max(2, size * 0.07),
          }}
        >
          <View
            className="items-center justify-center overflow-hidden rounded-full bg-white"
            style={{
              width: size * 0.86,
              height: size * 0.86,
              borderRadius: (size * 0.86) / 2,
            }}
          >
            <Image
              source={require("../../../../assets/technical-support.png")}
              style={{
                width: size * 0.82,
                height: size * 0.82,
                borderRadius: (size * 0.82) / 2,
              }}
              contentFit="contain"
              transition={120}
            />
          </View>
        </LinearGradient>
      </View>
    </Glow>
  );
}

function GenieVoicePanel({
  active,
  intensity,
  label,
  sublabel,
  compact = false,
  loading = false,
}) {
  const level = active ? Math.max(0.24, Math.min(1, intensity || 0.48)) : 0.22;
  const size = compact ? 52 : 72;
  const barMax = compact ? 22 : 30;
  const barMin = compact ? 7 : 9;

  return (
    <View
      className={`w-full overflow-hidden rounded-[28px] border border-slate-100 bg-white ${compact ? "p-3" : "p-4"}`}
      style={{ boxShadow: "0 14px 36px rgba(15, 23, 42, 0.08)" }}
    >
      <LinearGradient
        colors={["rgba(37,99,235,0.10)", "rgba(219,39,119,0.08)", "rgba(255,255,255,0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View className="flex-row items-center gap-3">
        <GenieAvatar size={size} />
        <View className="min-w-0 flex-1">
          <Text
            className={`${compact ? "text-[13px]" : "text-[17px]"} text-slate-950`}
            style={{ fontFamily: TOKENS.font.semibold }}
            numberOfLines={1}
          >
            {label}
          </Text>
          {sublabel ? (
            <Text
              className="mt-1 text-[12px] leading-4 text-slate-500"
              style={{ fontFamily: TOKENS.font.body }}
              numberOfLines={compact ? 1 : 2}
            >
              {sublabel}
            </Text>
          ) : null}

          <View className="mt-3 flex-row items-end gap-1.5">
            {VOICE_BAR_FACTORS.map((factor, index) => {
              const height = barMin + barMax * Math.min(1, level * factor);
              return (
                <View
                  key={`voice-bar-${index}`}
                  className="w-1.5 rounded-full"
                  style={{
                    height,
                    backgroundColor: active ? "#2563EB" : "#CBD5E1",
                    opacity: active ? 0.72 + factor * 0.22 : 0.7,
                  }}
                />
              );
            })}
          </View>
        </View>

        <View className={`items-center justify-center rounded-full ${active ? "bg-blue-600" : "bg-slate-100"} ${compact ? "h-10 w-10" : "h-12 w-12"}`}>
          {loading ? (
            <ActivityIndicator size="small" color={active ? "#FFFFFF" : ACCENT} />
          ) : (
            <MaterialIconsRounded
              name={active ? "graphic-eq" : "mic"}
              size={compact ? 19 : 22}
              color={active ? "#FFFFFF" : "#64748B"}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  scrollView: {
    flex: 1,
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
  confirmGradientInner: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
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
  const {
    status: voiceStatus,
    transcript: voiceTranscript,
    transcriptVersion,
    voiceLevel,
    error: voiceError,
    isSpeaking,
    startRecording,
    stopRecordingAndTranscribe,
    speakText,
    stopSpeaking,
  } = useGenieVoice();
  const lastVoiceTranscriptVersionRef = useRef(0);

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

  const getVoiceStatusText = () => {
    if (voiceError === "VOICE_PERMISSION_DENIED") return t("aiPlanner.voicePermissionDenied");
    if (voiceError === "VOICE_EMPTY_RECORDING") return t("aiPlanner.voiceEmptyRecording");
    if (voiceStatus === "listening") return t("aiPlanner.voiceListening");
    if (voiceStatus === "transcribing") return t("aiPlanner.voiceTranscribing");
    if (voiceStatus === "speaking") return t("aiPlanner.voiceSpeaking");
    if (voiceStatus === "error") return t("aiPlanner.voiceError");
    return "";
  };

  const getVoiceWaveLabel = () => {
    if (voiceStatus === "listening") return t("aiPlanner.voiceWave.listening");
    if (voiceStatus === "transcribing") return t("aiPlanner.voiceWave.transcribing");
    if (voiceStatus === "speaking") return t("aiPlanner.voiceWave.speaking");
    if (isLoading) return t("aiPlanner.voiceWave.thinking");
    return t("aiPlanner.voiceWave.idle");
  };

  const getVoiceWaveSublabel = () => {
    if (voiceStatus === "listening") return t("aiPlanner.voiceWave.listeningHint");
    if (voiceStatus === "speaking") return t("aiPlanner.voiceWave.speakingHint");
    return t("aiPlanner.voiceWave.idleHint");
  };

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

  const handleVoicePress = useCallback(async () => {
    if (voiceStatus === "listening") {
      try {
        await stopRecordingAndTranscribe();
      } catch (err) {
        setChatError(err?.message || t("aiPlanner.voiceError"));
      }
      return;
    }
    if (isLoading || voiceStatus === "transcribing") return;
    if (voiceStatus === "speaking") {
      stopSpeaking();
      return;
    }
    try {
      await startRecording();
    } catch (err) {
      setChatError(err?.message || t("aiPlanner.voiceError"));
    }
  }, [isLoading, startRecording, stopRecordingAndTranscribe, stopSpeaking, voiceStatus, t]);

  // Vô hiệu hóa useEffect tự động gửi tin nhắn khi im lặng / thu âm xong
  // Giọng nói sau khi dịch thành chữ sẽ được điền vào khung TextInput để người dùng bấm nút Gửi thủ công.

  useEffect(() => {
    if (!voiceTranscript?.trim()) return;
    if (isLoading) return;
    if (lastVoiceTranscriptVersionRef.current === transcriptVersion) return;

    lastVoiceTranscriptVersionRef.current = transcriptVersion;
    handleSend(voiceTranscript, { inputMode: "voice" });
  }, [handleSend, isLoading, transcriptVersion, voiceTranscript]);

  const renderMessageItem = useCallback(
    ({ item: message, index }) => {
      const isUser = message.role === "user";
      return (
        <View
          key={message.id ?? index}
          className={`gap-1.5 mb-4 ${isUser ? "items-end" : "items-start"}`}
        >
          {!isUser ? (
            <View className="ml-1 flex-row items-center gap-1.5">
              <GenieAvatar size={18} />
              <Text
                className="text-[10px] uppercase tracking-[0.8px] text-zinc-500"
                style={{ fontFamily: TOKENS.font.semibold }}
              >
                {t('aiPlanner.botLabel')}
              </Text>
              <Pressable
                onPress={() =>
                  isSpeaking
                    ? stopSpeaking()
                    : speakText(message.text ?? message.content)
                }
                hitSlop={8}
              >
                <MaterialIconsRounded
                  name={isSpeaking ? "stop-circle" : "volume-up"}
                  size={14}
                  color="#64748B"
                />
              </Pressable>
            </View>
          ) : null}

          {isUser ? (
            <LinearGradient
              colors={["#2563EB", "#1D4ED8", "#4338CA"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 20, borderTopRightRadius: 4 }}
              className="max-w-[85%] px-4 py-3.5"
            >
              <Text
                className="text-[14.5px] leading-[22px] text-white"
                style={{ fontFamily: TOKENS.font.medium }}
              >
                {message.text ?? message.content}
              </Text>
            </LinearGradient>
          ) : (
            <View
              className="max-w-[85%] rounded-[20px] rounded-tl-sm border border-slate-100 bg-white/90 px-4 py-3.5"
              style={{ boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)" }}
            >
              <Text
                className="text-[14.5px] leading-[22px] text-zinc-800"
                style={{ fontFamily: TOKENS.font.body }}
              >
                {message.text ?? message.content}
              </Text>
            </View>
          )}

          {!isUser && message.source === "chat" && (message.suggestedPlaces?.length ?? 0) > 0 ? (
            <View className="mt-2 w-full gap-2">
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

          {!isUser && (message.quickReplies?.length ?? 0) > 0 ? (
            <View className="mt-2 max-w-[92%] flex-row flex-wrap gap-2">
              {message.quickReplies.slice(0, 4).map((reply) => (
                <Pressable
                  key={reply}
                  onPress={() => handleSend(reply)}
                  className="rounded-full border border-slate-200 bg-white px-3.5 py-2"
                  style={{ boxShadow: "0 6px 16px rgba(15, 23, 42, 0.04)" }}
                >
                  <Text
                    className="text-xs text-slate-700"
                    style={{ fontFamily: TOKENS.font.semibold }}
                  >
                    {reply}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {/* Nếu là tin nhắn preview hoạt động và draftPlan tồn tại */}
          {!isUser && message.isDraftPreview && (draftPlan?.suggestedPlaces?.length ?? 0) > 0 ? (
            <View
              className="mt-4 w-full gap-4 rounded-3xl border border-slate-100 bg-white p-4"
              style={{ boxShadow: "0 12px 34px rgba(15, 23, 42, 0.06)" }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text
                    className="text-[14.5px] text-slate-950"
                    style={{ fontFamily: TOKENS.font.semibold }}
                  >
                    {t('aiPlanner.selectPlaces')}
                  </Text>
                  <Text
                    className="mt-0.5 text-xs text-slate-400"
                    style={{ fontFamily: TOKENS.font.body }}
                  >
                    {t('aiPlanner.selectingCount', { selected: selectedPlaceIds.length, total: draftPlan.suggestedPlaces.length })}
                  </Text>
                </View>

                <View className="flex-row items-center gap-1.5">
                  <Pressable
                    onPress={selectAllPlaces}
                    className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5"
                  >
                    <Text
                      className="text-[11px] text-sky-700"
                      style={{ fontFamily: TOKENS.font.semibold }}
                    >
                      {t('aiPlanner.selectAll')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={clearSelectedPlaces}
                    className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5"
                  >
                    <Text
                      className="text-[11px] text-slate-500"
                      style={{ fontFamily: TOKENS.font.semibold }}
                    >
                      {t('aiPlanner.deselect')}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View className="gap-3">
                {draftPlan.suggestedPlaces.map((place, pIdx) => {
                  const placeId = Number(place?.id);
                  const isSelected = selectedPlaceIds.includes(placeId);

                  return (
                    <PlacePreviewCard
                      key={placeId || `${place?.name || "place"}-${pIdx}`}
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

          {/* Hiển thị tĩnh các gợi ý của preview cũ trong lịch sử chat khi draftPlan đã được confirm xong (bằng null) */}
          {!isUser && message.isDraftPreview && !(draftPlan?.suggestedPlaces?.length > 0) && (message.suggestedPlaces?.length ?? 0) > 0 ? (
            <View className="mt-2 w-full gap-2">
              {message.suggestedPlaces.map((place, pIdx) => (
                <PlacePreviewCard
                  key={place.id || `preview-place-${pIdx}`}
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
    },
    [draftPlan, selectedPlaceIds, isCompactCard, isConfirming, canConfirmSelection, selectAllPlaces, clearSelectedPlaces, handleConfirmSelection, handleOpenPlace, handleTogglePlace, handleSend, t, isSpeaking, stopSpeaking, speakText],
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View
        className="border-b border-slate-100 bg-white px-3 pb-2"
        style={{ paddingTop: Math.max(insets.top, 8), boxShadow: "0 8px 26px rgba(15, 23, 42, 0.06)" }}
      >
        <LinearGradient
          colors={["rgba(14, 165, 233, 0.10)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <View className="flex-row items-center gap-2 rounded-[20px] border border-slate-100 bg-white/90 px-2 py-2">
          <Pressable
            onPress={() => setHeaderExpanded(true)}
            accessibilityRole="button"
            accessibilityLabel="Mở thanh bên"
            className="h-9 w-9 items-center justify-center rounded-full bg-slate-50"
          >
            <MaterialIconsRounded name="menu-open" size={20} color="#475569" />
          </Pressable>
          <View className="min-w-0 flex-1">
            <Text
              className="text-[15px] leading-5 text-slate-950"
              style={{ fontFamily: TOKENS.font.semibold }}
              numberOfLines={1}
            >
              Genie
            </Text>
            <View className="mt-0.5 flex-row items-center gap-1.5">
              <View className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
              <Text
                className="text-[10.5px] text-slate-500"
                style={{ fontFamily: TOKENS.font.medium }}
                numberOfLines={1}
              >
                Sẵn sàng lên lịch trình
              </Text>
            </View>
          </View>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-blue-50">
            <MaterialIconsRounded name="auto-awesome" size={18} color="#2563EB" />
          </View>
        </View>
      </View>

      {headerExpanded ? (
        <View
          pointerEvents="box-none"
          style={[StyleSheet.absoluteFillObject, { zIndex: 50 }]}
        >
          <Pressable
            onPress={() => setHeaderExpanded(false)}
            style={StyleSheet.absoluteFillObject}
            className="bg-slate-950/30"
            accessibilityRole="button"
            accessibilityLabel="Đóng thanh bên"
          />
          <View
            className="h-full gap-4 border-r border-slate-100 bg-white px-4 pb-4"
            style={{
              width: sidebarWidth,
              paddingTop: Math.max(insets.top, 8) + 12,
              boxShadow: "10px 0 34px rgba(15, 23, 42, 0.16)",
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <GenieAvatar size={38} />
                <View>
                  <Text
                    className="text-[15px] text-slate-950"
                    style={{ fontFamily: TOKENS.font.semibold }}
                    numberOfLines={1}
                  >
                    Genie
                  </Text>
                  <Text
                    className="text-[11px] text-slate-500"
                    style={{ fontFamily: TOKENS.font.medium }}
                  >
                    {t('aiPlanner.readyToHelp')}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setHeaderExpanded(false)}
                className="h-9 w-9 items-center justify-center rounded-full bg-slate-100"
                accessibilityRole="button"
                accessibilityLabel="Đóng thanh bên"
              >
                <MaterialIconsRounded name="close" size={20} color="#475569" />
              </Pressable>
            </View>

            <View className="rounded-[22px] border border-slate-100 bg-slate-50 p-3">
              <Text
                className="text-[11px] uppercase tracking-[0.7px] text-slate-500"
                style={{ fontFamily: TOKENS.font.semibold }}
              >
                Chủ đề hiện tại
              </Text>
              <Text
                className="mt-1 text-[15px] leading-5 text-slate-950"
                style={{ fontFamily: TOKENS.font.semibold }}
                numberOfLines={2}
              >
                {conversationTopic}
              </Text>
              <View className="mt-3 flex-row items-center gap-2">
                <Pressable
                  onPress={handleGoHome}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-white px-3 py-2.5"
                  accessibilityRole="button"
                  accessibilityLabel="Về trang chủ"
                >
                  <MaterialIconsRounded name="home" size={18} color="#475569" />
                  <Text
                    className="text-[12.5px] text-slate-700"
                    style={{ fontFamily: TOKENS.font.semibold }}
                  >
                    Trang chủ
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className="min-h-0 flex-1 gap-2 rounded-[22px] bg-slate-50 p-3">
              <View className="flex-row items-center justify-between">
                <Text
                  className="text-[12px] uppercase tracking-[0.7px] text-slate-500"
                  style={{ fontFamily: TOKENS.font.semibold }}
                >
                  Lịch sử chat
                </Text>
                {hasPlannerHistory ? (
                  <Pressable
                    onPress={handleClearPlannerHistory}
                    disabled={isLoading}
                    className={`h-8 w-8 items-center justify-center rounded-full bg-white ${isLoading ? "opacity-40" : ""}`}
                    accessibilityRole="button"
                    accessibilityLabel="Xóa lịch sử chat"
                  >
                    <MaterialIconsRounded name="delete-sweep" size={18} color="#EF4444" />
                  </Pressable>
                ) : null}
              </View>

              {historyPreviewItems.length > 0 ? (
                historyPreviewItems.map((message, index) => (
                  <Pressable
                    key={message.id ?? `history-${index}`}
                    onPress={() => {
                      setInputText(message.text ?? message.content ?? "");
                      setHeaderExpanded(false);
                    }}
                    className="flex-row items-center gap-2 rounded-xl bg-white px-3 py-2"
                  >
                    <MaterialIconsRounded name="history" size={16} color="#64748B" />
                    <Text
                      className="min-w-0 flex-1 text-[12.5px] text-slate-700"
                      style={{ fontFamily: TOKENS.font.medium }}
                      numberOfLines={1}
                    >
                      {message.text ?? message.content}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <Text
                  className="rounded-xl bg-white px-3 py-2 text-[12.5px] text-slate-500"
                  style={{ fontFamily: TOKENS.font.body }}
                >
                  Chưa có cuộc trò chuyện nào.
                </Text>
              )}
            </View>
          </View>
        </View>
      ) : null}

      <FlatList
        ref={scrollRef}
        data={hasMessages ? allMessages : []}
        renderItem={renderMessageItem}
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

      <Animated.View
        style={[
          animatedInputBarStyle,
        ]}
        className="w-full bg-transparent px-3"
      >
        <View
          className="mb-1 flex-row items-end gap-2 rounded-[28px] border border-slate-200 bg-white px-3 py-2"
          style={{ boxShadow: "0 10px 30px rgba(15, 23, 42, 0.10)" }}
        >
          <TextInput
            ref={inputRef}
            placeholder={t('aiPlanner.inputPlaceholder')}
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            className="min-h-[38px] max-h-[120px] flex-1 px-2 py-1.5 text-[15px] text-slate-800"
            style={{ fontFamily: TOKENS.font.body, textAlignVertical: "center" }}
          />

          <Pressable
            onPress={handleVoicePress}
            disabled={isLoading}
            className={`h-9 w-9 items-center justify-center rounded-full ${
              voiceStatus === "listening" ? "bg-cyan-500" : "bg-slate-100"
            }`}
          >
            <MaterialIconsRounded
              name={voiceStatus === "listening" ? "graphic-eq" : voiceStatus === "speaking" ? "graphic-eq" : "mic"}
              size={18}
              color={voiceStatus === "listening" ? "#FFFFFF" : voiceStatus === "speaking" ? "#10B981" : "#64748B"}
            />
          </Pressable>

          <Pressable
            onPress={() => handleSend()}
            disabled={!canSend}
            style={{ overflow: "hidden" }}
            className="h-9 w-9 items-center justify-center rounded-full"
          >
            {canSend ? (
              <LinearGradient
                colors={["#2563EB", "#7C3AED"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
                className="items-center justify-center"
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <MaterialIconsRounded name="arrow-upward" size={18} color="#FFFFFF" />
                )}
              </LinearGradient>
            ) : (
              <View className="h-full w-full items-center justify-center bg-slate-100">
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <MaterialIconsRounded name="arrow-upward" size={18} color="#94A3B8" />
                )}
              </View>
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
