import { View, Text, StyleSheet, FlatList } from "react-native";
import { Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { HorizontalPlaceCard } from "../../../../components/composed/HorizontalPlaceCard";
import { InteractiveTimeline } from "./InteractiveTimeline";
import { TOKENS } from "../../../../constants/design-tokens";

export function MessageBubble({ message, onViewPlace, interactivePlan, onRemovePlace, onSwapPlace }) {
  const isUser = message.role === "user";

  return (
    <View style={[s.gap1_5, isUser ? s.itemsEnd : s.itemsStart]}>
      {!isUser && (
        <View style={s.rowCenterGap1_5}>
          <Sparkles size={12} color="#10B981" />
          <Text style={s.aiLabel}>Genie (AI)</Text>
        </View>
      )}

      {isUser ? (
        <LinearGradient
          colors={["#2563EB", "#1D4ED8", "#4338CA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.bubbleBase, s.userBubble]}
        >
          <Text style={[s.bubbleText, s.textZinc900]} selectable>
            {message.text ?? message.content}
          </Text>
        </LinearGradient>
      ) : (
        <View style={[s.bubbleBase, s.aiBubble]}>
          <Text style={[s.bubbleText, s.textZinc800]} selectable>
            {message.text ?? message.content}
          </Text>
        </View>
      )}

      {/* Render Carousel địa điểm nếu có gợi ý địa điểm thông thường */}
      {!isUser && message.suggestedPlaces?.length > 0 && (
        <View style={s.carouselWrapper}>
          <FlatList
            data={message.suggestedPlaces}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <HorizontalPlaceCard
                place={item}
                onPressDetail={() => onViewPlace(item)}
              />
            )}
            contentContainerStyle={s.carouselContent}
          />
        </View>
      )}

      {/* Render Interactive Timeline nếu tin nhắn có lịch trình hybridPlan */}
      {!isUser && interactivePlan && (
        <InteractiveTimeline
          plan={interactivePlan}
          onRemove={(idx) => onRemovePlace(message.id, idx)}
          onSwap={(idx) => onSwapPlace(message.id, idx)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  gap1_5: {
    gap: 6,
  },
  itemsStart: {
    alignItems: "flex-start",
  },
  itemsEnd: {
    alignItems: "flex-end",
  },
  rowCenterGap1_5: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 4,
  },
  aiLabel: {
    color: "#64748B",
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontFamily: TOKENS.font.semibold,
  },
  bubbleBase: {
    maxWidth: "85%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    borderTopRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderTopLeftRadius: 4,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
  },
  bubbleText: {
    fontSize: 14.5,
    lineHeight: 22,
    fontFamily: TOKENS.font.body,
  },
  textZinc900: {
    color: "#FFFFFF",
  },
  textZinc800: {
    color: "#1F2937",
  },
  carouselWrapper: {
    width: "100%",
    marginTop: 8,
  },
  carouselContent: {
    paddingLeft: 4,
    paddingRight: 16,
  },
});
