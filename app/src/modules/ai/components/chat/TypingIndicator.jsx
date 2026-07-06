import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { Sparkles, CornerDownLeft } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { TOKENS } from "../../../../constants/design-tokens";

const runAnimation = (animatedValue, delay) => {
  return Animated.loop(
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(animatedValue, {
        toValue: -6,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(800 - delay),
    ])
  );
};

function ThreeDotLoader() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a1 = runAnimation(dot1, 0);
    const a2 = runAnimation(dot2, 150);
    const a3 = runAnimation(dot3, 300);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={s.dotsContainer}>
      <Animated.View style={[s.dot, { transform: [{ translateY: dot1 }] }]} />
      <Animated.View style={[s.dot, { transform: [{ translateY: dot2 }] }]} />
      <Animated.View style={[s.dot, { transform: [{ translateY: dot3 }] }]} />
    </View>
  );
}

export function TypingIndicator() {
  return (
    <View style={s.itemsStartGap1_5}>
      <View style={s.rowCenterGap1_5}>
        <Sparkles size={12} color="#10B981" />
        <Text style={s.aiLabel}>Genie (AI)</Text>
      </View>
      <View style={s.typingBubble}>
        <ThreeDotLoader />
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
          <CornerDownLeft size={14} color="rgba(255, 255, 255, 0.35)" />
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
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontFamily: TOKENS.font.semibold,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "rgba(28, 28, 30, 0.76)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderTopLeftRadius: 4,
  },
  typingText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
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
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  suggestionPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  suggestionText: {
    fontSize: 13.5,
    color: "#FFFFFF",
    fontFamily: TOKENS.font.medium,
    flex: 1,
  },
});
