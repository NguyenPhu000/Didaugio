import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useState, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { AIBubble } from "../../components/ui/AIBubble";
import { useAIAssistant } from "./hooks/useAIAssistant";
import { useAIContextStore } from "../../stores/aiContextStore";
import { TOKENS } from "../../constants/design-tokens";

const QUICK_SUGGESTIONS = [
  "Gioi thieu ve Ben Ninh Kieu",
  "Quan an ngon gan day",
  "Lich trinh 1 ngay o Can Tho",
  "Thoi tiet hom nay the nao",
];

const CHAT_THEME = {
  panel: "#0B1120",
  panelSoft: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.1)",
  text: "#FFFFFF",
  textSecondary: "#A3A3A3",
  accent: "#22D3EE",
};

export function ChatPanel() {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const insets = useSafeAreaInsets();

  const conversationMemory = useAIContextStore((s) => s.conversationMemory);
  const { sendChatMessage } = useAIAssistant();

  const handleSend = async (text) => {
    const msg = (text ?? inputText).trim();
    if (!msg || isLoading) return;
    setInputText("");
    setError(null);
    setIsLoading(true);

    try {
      await sendChatMessage(msg);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={insets.bottom + 92}
    >
      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4 pt-1"
        contentContainerStyle={{ paddingBottom: 14 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {conversationMemory.length === 0 ? (
          <View
            className="rounded-[28px] px-5 py-6 mt-2"
            style={[
              TOKENS.shadow.sm,
              {
                backgroundColor: CHAT_THEME.panel,
                borderWidth: 1,
                borderColor: CHAT_THEME.border,
              },
            ]}
          >
            <View
              className="w-16 h-16 rounded-[22px] items-center justify-center"
              style={{ backgroundColor: "rgba(34,211,238,0.14)" }}
            >
              <MaterialIcons name="auto-awesome" size={30} color={CHAT_THEME.accent} />
            </View>
            <Text className="text-[22px] font-bold mt-5" style={{ color: CHAT_THEME.text }}>
              Chao, minh la Chi Mai
            </Text>
            <Text className="text-sm leading-6 mt-2" style={{ color: CHAT_THEME.textSecondary }}>
              Hoi ve dia diem, mon an hay lich trinh. Minh se tra loi ngan gon, de dung va uu tien du lieu cua he thong.
            </Text>

            <View className="mt-5 gap-2">
              {QUICK_SUGGESTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => handleSend(suggestion)}
                  className="rounded-[20px] px-4 py-3"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderWidth: 1,
                    borderColor: CHAT_THEME.border,
                  }}
                >
                  <Text className="text-[13px] font-semibold" style={{ color: "#E2E8F0" }}>
                    {suggestion}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          conversationMemory.map((msg, i) => (
            <AIBubble key={i} role={msg.role} content={msg.content} />
          ))
        )}

        {isLoading ? <AIBubble role="assistant" isTyping /> : null}

        {error ? (
          <View className="self-center bg-rose-50 rounded-[18px] px-4 py-2.5 mb-2 border border-rose-200">
            <Text className="text-sm text-rose-600">{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View
        className="mx-4 mb-4 rounded-[28px] px-3 py-3"
        style={[
          TOKENS.shadow.md,
          {
            paddingBottom: Math.max(insets.bottom, 8) + 4,
            backgroundColor: CHAT_THEME.panel,
            borderWidth: 1,
            borderColor: CHAT_THEME.border,
          },
        ]}
      >
        <View className="flex-row items-end gap-2">
          <TextInput
            className="flex-1 rounded-[22px] px-4 py-3 text-sm"
            placeholder="Hoi Chi Mai..."
            placeholderTextColor={CHAT_THEME.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              color: CHAT_THEME.text,
            }}
          />
          <Pressable
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{
              backgroundColor: inputText.trim()
                ? "#0EA5E9"
                : "rgba(255,255,255,0.12)",
            }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons
                name="north-east"
                size={20}
                color={inputText.trim() ? "#fff" : CHAT_THEME.textSecondary}
              />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
