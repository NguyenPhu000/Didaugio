import { View, Text, StyleSheet, FlatList } from "react-native";
import { Sparkles } from "lucide-react-native";
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
          <Text style={s.aiLabel}>Nhi (AI)</Text>
        </View>
      )}

      <View style={[s.bubbleBase, isUser ? s.userBubble : s.aiBubble]}>
        <Text style={[s.bubbleText, isUser ? s.textZinc900 : s.textZinc800]} selectable>
          {message.text ?? message.content}
        </Text>
      </View>

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
    color: "rgba(255,255,255,0.4)",
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
    backgroundColor: "#0A84FF",
    borderTopRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: "#2C2C2E",
    borderTopLeftRadius: 4,
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
    color: "#FFFFFF",
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
