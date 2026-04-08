import {
  Alert,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Keyboard,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useState, useRef, useCallback, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { MaterialIcons } from "@expo/vector-icons";
import { AIBubble } from "../../components/ui/AIBubble";
import { useAIAssistant } from "./hooks/useAIAssistant";
import { useAIContextStore } from "../../stores/aiContextStore";
import { TOKENS } from "../../constants/design-tokens";
import { TAB_BAR_HEIGHT } from "../../../app/(tabs)/_layout";

const QUICK_SUGGESTIONS = [
  { text: "Giới thiệu Bến Ninh Kiều", icon: "place" },
  { text: "Quán ăn ngon gần đây", icon: "restaurant" },
  { text: "Lịch trình 1 ngày Cần Thơ", icon: "event-note" },
  { text: "Thời tiết hôm nay", icon: "cloud" },
];

const ACCENT = TOKENS.color.travel.ocean;

export function ChatPanel() {
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const insets = useSafeAreaInsets();

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

    Alert.alert(
      "Xóa lịch sử chat?",
      "Toàn bộ hội thoại với em Nhi sẽ bị xóa trên thiết bị này.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            clearConversation();
            setError(null);
          },
        },
      ],
    );
  }, [clearConversation, hasMessages, isSending]);

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
        {hasMessages ? (
          <View style={styles.historyActionRow}>
            <Pressable
              onPress={handleClearConversation}
              disabled={isSending}
              style={({ pressed }) => [
                styles.historyClearBtn,
                isSending && styles.historyClearBtnDisabled,
                pressed && !isSending && styles.historyClearBtnPressed,
              ]}
            >
              <MaterialIcons
                name="delete-outline"
                size={14}
                color={
                  isSending ? TOKENS.color.neutral[400] : TOKENS.color.error
                }
              />
              <Text
                style={[
                  styles.historyClearText,
                  isSending && styles.historyClearTextDisabled,
                ]}
              >
                Xóa lịch sử
              </Text>
            </Pressable>
          </View>
        ) : null}

        {!hasMessages ? (
          /* ── Empty state — ChatGPT style ── */
          <View style={styles.emptyState}>
            <View style={styles.avatarCircle}>
              <MaterialIcons name="smart-toy" size={36} color={ACCENT} />
            </View>
            <Text style={styles.emptyTitle}>Chào, mình là em Nhi</Text>
            <Text style={styles.emptySubtitle}>
              Mình có thể giúp bạn tìm địa điểm, gợi ý quán ăn, hoặc lên lịch
              trình du lịch Cần Thơ.
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
            {conversationMemory.map((msg, i) => (
              <AIBubble
                key={msg.id || `${msg.role || "assistant"}-${i}`}
                role={msg.role}
                content={msg.content}
                places={msg.suggestedPlaces}
              />
            ))}
          </View>
        )}

        {isSending ? <AIBubble role="assistant" isTyping /> : null}

        {error ? (
          <View style={styles.errorBar}>
            <MaterialIcons
              name="error-outline"
              size={14}
              color={TOKENS.color.error}
            />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => setError(null)}>
              <MaterialIcons
                name="close"
                size={14}
                color={TOKENS.color.error}
              />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {/* ── Input bar — sticks to keyboard via KeyboardStickyView ── */}
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
              placeholder="Hỏi em Nhi điều gì đó..."
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
              {isSending ? (
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
    gap: 4,
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
