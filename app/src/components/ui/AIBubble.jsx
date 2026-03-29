import { View, Text, ActivityIndicator } from "react-native";
import { cn } from "../../lib/cn";
import { TOKENS } from "../../constants/design-tokens";

export function AIBubble({
  role = "assistant",
  content,
  isTyping = false,
  style,
}) {
  const isUser = role === "user";

  return (
    <View
      className={cn(
        "max-w-[82%] rounded-[24px] px-4 py-3 mb-2",
        isUser
          ? "self-end rounded-br-md"
          : "self-start rounded-bl-md border",
      )}
      style={[
        isUser
          ? { backgroundColor: "#0EA5E9" }
          : {
              backgroundColor: "#0B1120",
              borderColor: "rgba(255,255,255,0.08)",
              ...TOKENS.shadow.sm,
            },
        style,
      ]}
    >
      {isTyping ? (
        <View className="flex-row items-center gap-2 py-1">
          <ActivityIndicator size="small" color="#22D3EE" />
          <Text style={{ color: "#94A3B8" }} className="text-sm">
            Chị Mai đang trả lời...
          </Text>
        </View>
      ) : (
        <Text
          className="text-[14px] leading-6"
          style={{ color: isUser ? "#FFFFFF" : "#E2E8F0" }}
        >
          {content}
        </Text>
      )}
    </View>
  );
}
