import { View, Text, ActivityIndicator, StyleSheet, Pressable } from "react-native";
import { Sparkles, CornerDownLeft } from "lucide-react-native";
import { TOKENS } from "../../../../constants/design-tokens";

export function TypingIndicator() {
  return (
    <View style={s.itemsStartGap1_5}>
      <View style={s.rowCenterGap1_5}>
        <Sparkles size={12} color="#10B981" />
        <Text style={s.aiLabel}>Genie (AI)</Text>
      </View>
      <View style={s.typingBubble}>
        <ActivityIndicator size="small" color="#10B981" />
        <Text style={s.typingText}>Đang suy nghĩ...</Text>
      </View>
    </View>
  );
}

export function QuickSuggestions({ suggestions, onSelect }) {
  return (
    <View style={s.suggestionsContainer}>
      {suggestions.map((item) => (
        <Pressable
          key={item.text}
          onPress={() => onSelect(item.text)}
          style={({ pressed }) => [s.suggestionCard, pressed && s.suggestionPressed]}
        >
          <Text style={s.suggestionText}>{item.text}</Text>
          <CornerDownLeft size={14} color="rgba(255,255,255,0.3)" />
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  itemsStartGap1_5: {
    alignItems: "flex-start",
    gap: 6,
  },
  rowCenterGap1_5: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 4,
  },
  aiLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontFamily: TOKENS.font.semibold,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "#2C2C2E",
    borderTopLeftRadius: 4,
  },
  typingText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
  },
  suggestionsContainer: {
    width: "100%",
    gap: 10,
  },
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  suggestionPressed: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  suggestionText: {
    fontSize: 13.5,
    color: "#FFFFFF",
    fontFamily: TOKENS.font.medium,
    flex: 1,
  },
});
