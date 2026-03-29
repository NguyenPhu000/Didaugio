import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useAIPlanner } from "../ai/hooks/useAIPlanner";
import { cn } from "../../lib/cn";
import { TOKENS } from "../../constants/design-tokens";

const AI_THEME = {
  background: "#05070B",
  panel: "#111111",
  panelSoft: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.1)",
  text: "#FFFFFF",
  textSecondary: "#A3A3A3",
  neon: "#00F0FF",
  userBubble: "#00F0FF",
};

const QUICK_SUGGESTIONS = [
  "Gợi ý quán ăn ngon ở Ninh Kiều",
  "Top 5 địa điểm chụp ảnh đẹp",
  "Kế hoạch buổi tối ở Cần Thơ",
  "Đi chơi gia đình 1 ngày",
  "Cà phê view đẹp gần trung tâm",
];

export function AIPlanner() {
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef(null);
  const insets = useSafeAreaInsets();

  const { messages, isLoading, error, sendMessage } = useAIPlanner();

  const handleSend = async (text) => {
    const msg = (text ?? inputText).trim();
    if (!msg || isLoading) return;
    setInputText("");
    await sendMessage(msg);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: AI_THEME.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={insets.bottom + 92}
    >
      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4 pt-1"
        contentContainerStyle={{ paddingBottom: 14 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.length === 0 ? (
          <BlurView
            tint="dark"
            intensity={60}
            className="rounded-[28px] px-5 py-6 mt-2 overflow-hidden"
            style={[
              TOKENS.shadow.sm,
              {
                backgroundColor: AI_THEME.panelSoft,
                borderWidth: 1,
                borderColor: AI_THEME.border,
              },
            ]}
          >
            <View
              className="w-16 h-16 rounded-[22px] items-center justify-center"
              style={{ backgroundColor: "rgba(0,240,255,0.12)" }}
            >
              <MaterialIcons name="map" size={30} color={AI_THEME.neon} />
            </View>
            <Text className="text-[22px] font-bold mt-5" style={{ color: AI_THEME.text }}>
              AI Planner
            </Text>
            <Text className="text-sm leading-6 mt-2" style={{ color: AI_THEME.textSecondary }}>
              Mô tả mong muốn của bạn, AI sẽ sắp xếp thành một hành trình rõ ràng và dễ theo dõi.
            </Text>

            <View className="mt-5 gap-2">
              {QUICK_SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => handleSend(s)}
                  className="rounded-[20px] px-4 py-3"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderWidth: 1,
                    borderColor: AI_THEME.border,
                  }}
                >
                  <Text className="text-[13px] font-semibold" style={{ color: AI_THEME.text }}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </BlurView>
        ) : (
          messages.map((msg, i) => (
            <View
              key={msg.id ?? i}
              className={cn(
                "max-w-[85%] rounded-[24px] px-4 py-3 mb-2",
                msg.role === "user"
                  ? "self-end rounded-br-md"
                  : "self-start rounded-bl-md",
              )}
              style={
                msg.role === "user"
                  ? { backgroundColor: AI_THEME.userBubble }
                  : [
                      TOKENS.shadow.sm,
                      {
                        backgroundColor: AI_THEME.panel,
                        borderWidth: 1,
                        borderColor: AI_THEME.border,
                      },
                    ]
              }
            >
              <Text
                className={cn(
                  "text-[14px] leading-6",
                  msg.role === "user" ? "text-[#03131A]" : "",
                )}
                style={msg.role === "user" ? undefined : { color: AI_THEME.text }}
              >
                {msg.text ?? msg.content}
              </Text>
            </View>
          ))
        )}

        {isLoading ? (
          <View
            className="self-start rounded-[24px] rounded-bl-md px-4 py-3 mb-2 flex-row items-center gap-2"
            style={[
              TOKENS.shadow.sm,
              {
                backgroundColor: AI_THEME.panel,
                borderWidth: 1,
                borderColor: AI_THEME.border,
              },
            ]}
          >
            <ActivityIndicator size="small" color={AI_THEME.neon} />
            <Text className="text-sm" style={{ color: AI_THEME.textSecondary }}>
              Đang lên kế hoạch...
            </Text>
          </View>
        ) : null}

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
            backgroundColor: AI_THEME.panel,
            borderWidth: 1,
            borderColor: AI_THEME.border,
          },
        ]}
      >
        <View className="flex-row items-end gap-2">
          <TextInput
            className="flex-1 rounded-[22px] px-4 py-3 text-sm"
            placeholder="Mô tả kế hoạch bạn muốn..."
            placeholderTextColor={AI_THEME.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              color: AI_THEME.text,
            }}
          />
          <Pressable
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{
              backgroundColor: inputText.trim()
                ? AI_THEME.neon
                : "rgba(255,255,255,0.12)",
            }}
          >
            <MaterialIcons
              name="north-east"
              size={20}
              color={inputText.trim() ? "#03131A" : AI_THEME.textSecondary}
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
