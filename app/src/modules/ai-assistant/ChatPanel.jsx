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
  KeyboardAvoidingView,
} from "react-native";
import { useState, useRef, useCallback, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { AIBubble } from "../../components/ui/AIBubble";
import { useAIAssistant } from "./hooks/useAIAssistant";
import { useAIContextStore } from "../../stores/aiContextStore";
import { TOKENS } from "../../constants/design-tokens";
import { TAB_BAR_HEIGHT } from "../../../app/(tabs)/_layout";
import { useMyTrips } from "../ai/hooks/useAIPlanner";
import { addDestinationApi } from "../trips/api/tripsApi";

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
        Alert.alert(
          "Chưa có chuyến đi",
          "Bạn cần tạo một chuyến đi trước để thêm địa điểm này vào lịch trình.",
          [{ text: "Đóng", style: "cancel" }]
        );
        return;
      }

      if (activeTrips.length === 1) {
        const trip = activeTrips[0];
        try {
          await addDestinationApi(trip.id, { placeId, dayNumber: 1 });
          Alert.alert("Thành công", `Đã thêm ${place.name} vào chuyến đi "${trip.title}"`);
        } catch (err) {
          Alert.alert("Thất bại", err.message || "Không thể thêm vào chuyến đi");
        }
        return;
      }

      const buttons = activeTrips.slice(0, 2).map((trip) => ({
        text: trip.title,
        onPress: async () => {
          try {
            await addDestinationApi(trip.id, { placeId, dayNumber: 1 });
            Alert.alert("Thành công", `Đã thêm ${place.name} vào chuyến đi "${trip.title}"`);
          } catch (err) {
            Alert.alert("Thất bại", err.message || "Không thể thêm vào chuyến đi");
          }
        },
      }));

      Alert.alert(
        "Chọn chuyến đi",
        `Bạn muốn thêm "${place.name}" vào chuyến đi nào?`,
        [
          ...buttons,
          { text: "Hủy", style: "cancel" },
        ]
      );
    },
    [myTrips, refetchTrips]
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
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
                onAddToTrip={handleAddToTrip}
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

      {/* ── Input bar ── */}
      <View
        style={[
          styles.composerOuter,
          {
            paddingBottom: keyboardVisible
              ? 8
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
    </KeyboardAvoidingView>
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
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(59, 130, 246, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: TOKENS.font.heading,
    color: TOKENS.color.neutral[900],
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.neutral[600],
    textAlign: "center",
    maxWidth: 290,
    marginBottom: 24,
  },
  suggestionsGrid: {
    width: "100%",
    gap: 8,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionChipPressed: {
    backgroundColor: "rgba(59,130,246,0.06)",
    borderColor: "rgba(59,130,246,0.25)",
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
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
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 8,
    paddingBottom: Platform.OS === "ios" ? 10 : 8,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.neutral[900],
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnActive: {
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  sendBtnIdle: {
    backgroundColor: TOKENS.color.neutral[200],
  },
});
