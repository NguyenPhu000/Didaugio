import { memo } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { HorizontalPlaceCard } from "../../../../components/composed/HorizontalPlaceCard";
import { TOKENS } from "../../../../constants/design-tokens";

export const MessageBubble = memo(function MessageBubble({ message, onViewPlace }) {
  const isUser = message.role === "user";

  return (
    <View style={[s.container, isUser ? s.itemsEnd : s.itemsStart]}>
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
    </View>
  );
});

const s = StyleSheet.create({
  container: {
    width: "100%",
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
    alignSelf: "stretch",
    marginTop: 8,
    marginBottom: 4,
  },
  carouselContent: {
    paddingLeft: 2,
    paddingRight: 16,
  },
});
