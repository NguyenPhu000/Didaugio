import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Keyboard,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useState, useRef, useCallback, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { AIBubble } from "../../components/ui/AIBubble";
import { useAIAssistant } from "./hooks/useAIAssistant";
import { useAIContextStore } from "../../stores/aiContextStore";
import { TOKENS } from "../../constants/design-tokens";
import { TAB_BAR_HEIGHT } from "../../../app/(tabs)/_layout";
import { useMyTrips } from "../ai/hooks/useAIPlanner";
import { addDestinationApi } from "../trips/api/tripsApi";
import CustomAlertModal from "../../components/composed/CustomAlertModal";

const QUICK_SUGGESTIONS = [
  { text: "Giới thiệu Bến Ninh Kiều", icon: "place" },
  { text: "Quán ăn ngon gần đây", icon: "restaurant" },
  { text: "Lịch trình 1 ngày Cần Thơ", icon: "event-note" },
  { text: "Thời tiết hôm nay", icon: "cloud" },
];

const ACCENT = "#10B981";

export function ChatPanel() {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const insets = useSafeAreaInsets();

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    buttons: null,
  });

  const showAlert = useCallback(
    ({ title, message, type = "info", buttons }) => {
      setAlertConfig({
        visible: true,
        title,
        message,
        type,
        buttons: buttons?.map((btn) => ({
          ...btn,
          onPress: () => {
            setAlertConfig((prev) => ({ ...prev, visible: false }));
            btn.onPress?.();
          },
        })),
      });
    },
    [],
  );

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

  const conversationMemory = useAIContextStore((s) => s.conversationMemory);
  const clearConversation = useAIContextStore((s) => s.clearConversation);
  const { sendChatMessage } = useAIAssistant();

  const { data: myTrips, refetch: refetchTrips } = useMyTrips({ limit: 10 });

  const handleAddToTrip = useCallback(
    async (place) => {
      const placeId = Number(place?.id);
      if (!placeId) return;

      try {
        await refetchTrips();
      } catch (err) {
        // Bỏ qua lỗi refetch
      }

      const activeTrips = myTrips || [];

      if (activeTrips.length === 0) {
        showAlert({
          title: t('chatPanel.noTrips'),
          message: t('chatPanel.noTripsDesc'),
          type: "warning",
          buttons: [{ text: t('chatPanel.close'), style: "cancel" }],
        });
        return;
      }

      if (activeTrips.length === 1) {
        const trip = activeTrips[0];
        try {
          await addDestinationApi(trip.id, { placeId, dayNumber: 1 });
          showAlert({
            title: t('chatPanel.addSuccess'),
            message: t('chatPanel.addSuccessDesc', { name: place.name, trip: trip.title }),
            type: "success",
          });
        } catch (err) {
          showAlert({
            title: t('chatPanel.addFailed'),
            message: err.message || t('chatPanel.addFailedDesc'),
            type: "error",
          });
        }
        return;
      }

      const buttons = activeTrips.slice(0, 2).map((trip) => ({
        text: trip.title,
        onPress: async () => {
          try {
            await addDestinationApi(trip.id, { placeId, dayNumber: 1 });
            showAlert({
              title: t('chatPanel.addSuccess'),
              message: t('chatPanel.addSuccessDesc', { name: place.name, trip: trip.title }),
              type: "success",
            });
          } catch (err) {
            showAlert({
              title: t('chatPanel.addFailed'),
              message: err.message || t('chatPanel.addFailedDesc'),
              type: "error",
            });
          }
        },
      }));

      showAlert({
        title: t('chatPanel.selectTrip'),
        message: t('chatPanel.selectTripPrompt', { name: place.name }),
        type: "confirm",
        buttons: [...buttons, { text: t('chatPanel.cancel'), style: "cancel" }],
      });
    },
    [myTrips, refetchTrips, showAlert],
  );

  const handleSend = useCallback(
    async (text) => {
      const message = (text ?? inputText).trim();
      if (!message || isSending) return;
      setInputText("");
      setError(null);
      setIsSending(true);

      try {
        await sendChatMessage(message);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsSending(false);
        setTimeout(
          () => scrollRef.current?.scrollToEnd({ animated: true }),
          120,
        );
      }
    },
    [inputText, isSending, sendChatMessage],
  );

  const hasMessages = conversationMemory.length > 0;
  const canSend = inputText.trim().length > 0 && !isSending;

  const handleClearConversation = useCallback(() => {
    if (!hasMessages || isSending) return;

    showAlert({
      title: t('chatPanel.confirmDelete'),
      message: t('chatPanel.confirmDeleteDesc'),
      type: "confirm",
      buttons: [
        { text: t('chatPanel.cancel'), style: "cancel" },
        {
          text: t('chatPanel.delete'),
          style: "destructive",
          onPress: () => {
            clearConversation();
            setError(null);
          },
        },
      ],
    });
  }, [clearConversation, hasMessages, isSending, showAlert]);

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* ── Messages area ── */}
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 12,
          ...(!hasMessages ? { flexGrow: 1, justifyContent: "center" } : {}),
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: false })
        }
      >
        {hasMessages ? (
          <View className="items-end mb-2">
            <Pressable
              onPress={handleClearConversation}
              disabled={isSending}
              className={`h-[30px] rounded-full border px-3 flex-row items-center gap-[5px] ${
                isSending
                  ? "border-slate-300 bg-slate-100"
                  : "border-red-500/45 bg-red-500/10"
              }`}
              style={({ pressed }) =>
                pressed && !isSending ? { opacity: 0.94 } : undefined
              }
            >
              <MaterialIconsRounded
                name="delete-outline"
                size={14}
                color={
                  isSending ? TOKENS.color.neutral[400] : TOKENS.color.error
                }
              />
              <Text
                className={`text-[11px] font-semibold tracking-[0.2px] ${
                  isSending ? "text-slate-400" : "text-red-500"
                }`}
              >
                {t('chatPanel.deleteHistory')}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {!hasMessages ? (
          /* ── Empty state — ChatGPT style ── */
          <View className="items-center px-6 pb-8">
            <View
              className="w-[76px] h-[76px] rounded-[38px] bg-white/85 items-center justify-center border-[1.5px] border-emerald-500/15 mb-[18px]"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <MaterialIconsRounded name="auto-awesome" size={36} color="#10B981" />
            </View>
            <Text className="text-6xl leading-[30px] font-heading text-slate-900 text-center mb-2">
              {t('chatPanel.greeting')}
            </Text>
            <Text className="text-sm leading-[21px] font-body text-slate-600 text-center max-w-[290px] mb-6">
              {t('chatPanel.intro')}
            </Text>

            <View className="w-full gap-2">
              {QUICK_SUGGESTIONS.map((item) => (
                <Pressable
                  key={item.text}
                  onPress={() => handleSend(item.text)}
                  className="flex-row items-center gap-2.5 px-4 py-3 rounded-xl bg-white/75 border border-slate-200/80"
                  style={({ pressed }) => [
                    pressed && {
                      backgroundColor: "rgba(59,130,246,0.06)",
                      borderColor: "rgba(59,130,246,0.25)",
                    },
                    {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.02,
                      shadowRadius: 2,
                      elevation: 1,
                    },
                  ]}
                >
                  <MaterialIconsRounded
                    name={item.icon}
                    size={16}
                    color={ACCENT}
                  />
                  <Text className="flex-1 text-[13px] font-medium text-slate-700">
                    {item.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          /* ── Conversation ── */
          <View className="gap-1">
            {conversationMemory.map((msg, i) => (
              <AIBubble
                key={msg.id || `${msg.role || "assistant"}-${i}`}
                role={msg.role}
                content={msg.content}
                places={msg.suggestedPlaces}
                onAddToTrip={handleAddToTrip}
              />
            ))}
          </View>
        )}

        {isSending ? <AIBubble role="assistant" isTyping /> : null}

        {error ? (
          <View className="flex-row items-center gap-2 self-center mt-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25">
            <MaterialIconsRounded
              name="error-outline"
              size={14}
              color={TOKENS.color.error}
            />
            <Text className="flex-1 text-[13px] font-medium text-red-500">
              {error}
            </Text>
            <Pressable onPress={() => setError(null)}>
              <MaterialIconsRounded
                name="close"
                size={14}
                color={TOKENS.color.error}
              />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {/* ── Input bar ── */}
      <View
        className="px-3 pt-2"
        style={{
          paddingBottom: keyboardVisible
            ? 8
            : Math.max(insets.bottom, 8) + TAB_BAR_HEIGHT,
        }}
      >
        <View
          className="flex-row items-end gap-2 px-1.5 py-1.5 rounded-6xl bg-white/96 border border-slate-200/80"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <TextInput
            ref={inputRef}
            placeholder={t('chatPanel.inputPlaceholder')}
            placeholderTextColor={TOKENS.color.neutral[400]}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            className="flex-1 min-h-[40px] max-h-[100px] px-4 text-sm leading-5 font-body text-slate-900"
            style={{
              paddingTop: Platform.OS === "ios" ? 10 : 8,
              paddingBottom: Platform.OS === "ios" ? 10 : 8,
            }}
            textAlignVertical="center"
          />
          <Pressable
            onPress={() => handleSend()}
            disabled={!canSend}
            className={`w-[38px] h-[38px] rounded-[19px] items-center justify-center ${
              canSend ? "bg-zinc-950" : "bg-zinc-100"
            }`}
            style={
              canSend
                ? {
                    shadowColor: TOKENS.color.neutral[950],
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 2,
                  }
                : undefined
            }
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialIconsRounded
                name="arrow-upward"
                size={20}
                color={canSend ? "#FFFFFF" : TOKENS.color.neutral[400]}
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
        buttons={alertConfig.buttons}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        isDestructive={alertConfig.isDestructive}
      />
    </KeyboardAvoidingView>
  );
}
