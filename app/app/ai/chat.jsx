import {
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
import { useRouter } from "expo-router";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useGroqChat } from "../../src/modules/ai-assistant/hooks/useGroqChat";
import { PlacePreviewCard } from "../../src/components/composed/PlacePreviewCard";
import { TOKENS } from "../../src/constants/design-tokens";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { TAB_BAR_HEIGHT } from "../(tabs)/_layout";

const QUICK_SUGGESTIONS = [
  { text: "Gợi ý quán ăn ngon ở Ninh Kiều", icon: "restaurant", color: "#F59E0B" },
  { text: "Top 5 điểm chụp ảnh đẹp Cần Thơ", icon: "photo-camera", color: "#EC4899" },
  { text: "Lịch trình 1 ngày Cần Thơ", icon: "event-note", color: "#8B5CF6" },
  { text: "Cà phê view đẹp gần trung tâm", icon: "local-cafe", color: "#3B82F6" },
];

const ACCENT = "#3478F6";

function MessageBubble({ message, onViewPlace }) {
  const isUser = message.role === "user";

  return (
    <View style={[s.gap1_5, isUser ? s.itemsEnd : s.itemsStart]}>
      {!isUser && (
        <View style={s.rowCenterGap1_5}>
          <View style={s.statusDot} />
          <Text
            style={[{ fontFamily: TOKENS.font.semibold }, s.aiLabel]}
          >
            Nhi (Groq AI)
          </Text>
        </View>
      )}

      <View
        style={[
          s.bubbleBase,
          isUser ? s.userBubble : s.aiBubble,
          isUser
            ? { shadowColor: "#3478F6", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 }
            : { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
        ]}
      >
        <Text
          style={[
            { fontFamily: isUser ? TOKENS.font.medium : TOKENS.font.body },
            s.bubbleText,
            isUser ? s.textWhite : s.textSlate800,
          ]}
        >
          {message.content}
        </Text>
      </View>

      {!isUser && message.suggestedPlaces?.length > 0 && (
        <View style={s.placesContainer}>
          {message.suggestedPlaces.map((place) => (
            <PlacePreviewCard
              key={place.id}
              place={place}
              compact
              showCloseButton={false}
              onViewDetail={() => onViewPlace(place)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={s.itemsStartGap1_5}>
      <View style={s.rowCenterGap1_5}>
        <View style={s.statusDot} />
        <Text
          style={[{ fontFamily: TOKENS.font.semibold }, s.aiLabel]}
        >
          Nhi (Groq AI)
        </Text>
      </View>
      <View style={s.typingBubble}>
        <ActivityIndicator size="small" color={ACCENT} />
        <Text
          style={[{ fontFamily: TOKENS.font.medium }, s.typingText]}
        >
          Đang suy nghĩ...
        </Text>
      </View>
    </View>
  );
}

export default function GroqChatScreen() {
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { sendMessage, clearConversation, conversationMemory } = useGroqChat();

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSend = useCallback(
    async (text) => {
      const msg = (text ?? inputText).trim();
      if (!msg || isSending) return;
      setInputText("");
      setError(null);
      setIsSending(true);

      try {
        await sendMessage(msg);
      } catch (err) {
        setError(err.message || "Đã có lỗi xảy ra");
      } finally {
        setIsSending(false);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
      }
    },
    [inputText, isSending, sendMessage],
  );

  const handleViewPlace = useCallback(
    (place) => {
      const id = Number(place?.id);
      if (id) router.push(`/place/${id}`);
    },
    [router],
  );

  const handleClear = useCallback(() => {
    if (isSending) return;
    clearConversation();
    setError(null);
  }, [isSending, clearConversation]);

  const hasMessages = conversationMemory.length > 0;
  const canSend = inputText.trim().length > 0 && !isSending;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <View
        style={[
          s.header,
          {
            paddingTop: Math.max(insets.top, 8),
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 2,
          },
        ]}
      >
        <View style={s.rowCenterGap3}>
          <Pressable
            onPress={() => router.back()}
            style={s.iconCircle36}
          >
            <MaterialIconsRounded name="arrow-back" size={22} color="#1E293B" />
          </Pressable>
          <View style={s.avatarCircle}>
            <MaterialIconsRounded name="auto-awesome" size={20} color="#10B981" />
          </View>
          <View>
            <Text
              style={[{ fontFamily: TOKENS.font.semibold }, s.headerTitle]}
            >
              em Nhi — Groq AI
            </Text>
            <View style={s.rowCenterGap1Mt1}>
              <View style={s.statusDot} />
              <Text
                style={[{ fontFamily: TOKENS.font.medium }, s.statusText]}
              >
                Llama 4 Scout • GroqCloud
              </Text>
            </View>
          </View>
        </View>

        {hasMessages && (
          <Pressable
            onPress={handleClear}
            disabled={isSending}
            style={[s.iconCircle36, isSending && s.opacity40]}
          >
            <MaterialIconsRounded name="delete-sweep" size={22} color="#64748B" />
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        style={s.flex1}
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
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {!hasMessages ? (
          <View style={s.emptyContainer}>
            <View
              style={[s.heroIcon, { shadowColor: "#10B981", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 }]}
            >
              <MaterialIconsRounded name="auto-awesome" size={28} color="#10B981" />
            </View>
            <Text
              style={[{ fontFamily: TOKENS.font.heading }, s.heroTitle]}
            >
              Trợ lý du lịch AI
            </Text>
            <Text
              style={[{ fontFamily: TOKENS.font.body }, s.heroSubtitle]}
            >
              Được hỗ trợ bởi Groq Cloud — tốc độ phản hồi siêu nhanh. Hỏi mình bất cứ điều gì về du lịch Cần Thơ nhé!
            </Text>

            <View style={s.suggestionsContainer}>
              {QUICK_SUGGESTIONS.map((item) => (
                <Pressable
                  key={item.text}
                  onPress={() => handleSend(item.text)}
                  style={[s.suggestionCard, { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 }]}
                >
                  <View
                    style={[s.suggestionIcon, { backgroundColor: item.color + "15" }]}
                  >
                    <MaterialIconsRounded name={item.icon} size={16} color={item.color} />
                  </View>
                  <Text
                    style={[{ fontFamily: TOKENS.font.medium }, s.suggestionText]}
                  >
                    {item.text}
                  </Text>
                  <MaterialIconsRounded name="chevron-right" size={16} color="#CBD5E1" />
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View style={s.gap4}>
            {conversationMemory.map((msg, index) => (
              <MessageBubble
                key={msg.id ?? `${msg.role}-${index}`}
                message={msg}
                onViewPlace={handleViewPlace}
              />
            ))}
          </View>
        )}

        {isSending && <TypingIndicator />}

        {error && (
          <View style={s.errorBanner}>
            <MaterialIconsRounded name="error-outline" size={14} color="#EF4444" />
            <Text
              style={[{ fontFamily: TOKENS.font.medium }, s.errorText]}
            >
              {error}
            </Text>
            <Pressable onPress={() => setError(null)}>
              <MaterialIconsRounded name="close" size={14} color="#EF4444" />
            </Pressable>
          </View>
        )}
      </ScrollView>

      <View
        style={[s.inputBar, { paddingBottom: keyboardVisible ? 8 : Math.max(insets.bottom, 8) + 16 }]}
      >
        <View
          style={[s.inputContainer, { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 }]}
        >
          <TextInput
            ref={inputRef}
            placeholder="Hỏi em Nhi điều gì đó..."
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
            style={[s.sendButton, canSend ? s.sendActive : s.sendInactive]}
          >
            {isSending ? (
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
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  gap1_5: { gap: 6 },
  gap4: { gap: 16 },
  itemsStart: { alignItems: "flex-start" },
  itemsEnd: { alignItems: "flex-end" },
  rowCenterGap1_5: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 4 },
  rowCenterGap3: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowCenterGap1Mt1: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" },
  aiLabel: { color: "#94A3B8", fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase" },
  bubbleBase: { maxWidth: "85%", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16 },
  userBubble: { backgroundColor: "#3478F6", borderTopRightRadius: 2 },
  aiBubble: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#F1F5F9", borderTopLeftRadius: 2 },
  bubbleText: { fontSize: 14.5, lineHeight: 22 },
  textWhite: { color: "#FFFFFF" },
  textSlate800: { color: "#1E293B" },
  placesContainer: { width: "100%", gap: 8, marginTop: 6, marginLeft: 4 },
  itemsStartGap1_5: { alignItems: "flex-start", gap: 6 },
  typingBubble: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#F1F5F9", borderTopLeftRadius: 2 },
  typingText: { color: "#64748B", fontSize: 13 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderColor: "#F1F5F9" },
  iconCircle36: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#D1FAE5" },
  headerTitle: { fontSize: 15.5, color: "#1E293B", lineHeight: 20 },
  statusText: { fontSize: 10, color: "#94A3B8" },
  opacity40: { opacity: 0.4 },
  flex1: { flex: 1 },
  emptyContainer: { alignItems: "center", paddingHorizontal: 24, paddingVertical: 32 },
  heroIcon: { width: 64, height: 64, borderRadius: 24, backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#D1FAE5", marginBottom: 20 },
  heroTitle: { fontSize: 24, color: "#0F172A", textAlign: "center", marginBottom: 8 },
  heroSubtitle: { fontSize: 13.5, lineHeight: 20, color: "#64748B", textAlign: "center", maxWidth: 280, marginBottom: 32 },
  suggestionsContainer: { width: "100%", gap: 10 },
  suggestionCard: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#F1F5F9" },
  suggestionIcon: { width: 32, height: 32, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  suggestionText: { flex: 1, fontSize: 13.5, color: "#334155" },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "center", marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" },
  errorText: { flex: 1, color: "#EF4444", fontSize: 12, marginLeft: 4 },
  inputBar: { paddingHorizontal: 16, paddingTop: 8, backgroundColor: "transparent" },
  inputContainer: { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 26, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#F1F5F9" },
  textInput: { flex: 1, minHeight: 38, maxHeight: 100, paddingHorizontal: 8, paddingVertical: 4, fontSize: 14.5, color: "#1E293B" },
  sendButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  sendActive: { backgroundColor: "#10B981" },
  sendInactive: { backgroundColor: "#F1F5F9" },
});
