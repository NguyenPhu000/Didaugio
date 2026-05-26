import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { TOKENS } from "../../constants/design-tokens";
import { PlacePreviewCard } from "../composed/PlacePreviewCard";

export function AIBubble({
  role = "assistant",
  content,
  isTyping = false,
  style,
  places = [],
  onAddToTrip,
}) {
  const isUser = role === "user";
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [dismissedPlaceIds, setDismissedPlaceIds] = useState([]);

  const suggestedPlaces = !isUser && Array.isArray(places) ? places : [];
  const dismissedPlaceIdSet = useMemo(
    () => new Set(dismissedPlaceIds),
    [dismissedPlaceIds],
  );
  const visibleSuggestedPlaces = useMemo(
    () =>
      suggestedPlaces.filter((place) => {
        const placeId = Number(place?.id);
        return !placeId || !dismissedPlaceIdSet.has(placeId);
      }),
    [suggestedPlaces, dismissedPlaceIdSet],
  );
  const hasSuggestionCards = !isTyping && visibleSuggestedPlaces.length > 0;
  const isCompactCard = width <= 360 || height <= 700;
  const suggestionResetKey = useMemo(
    () =>
      suggestedPlaces
        .map((place) => Number(place?.id) || place?.name || "")
        .join("|"),
    [suggestedPlaces],
  );

  useEffect(() => {
    setDismissedPlaceIds([]);
  }, [suggestionResetKey]);

  const handleOpenPlace = useCallback(
    (place) => {
      const normalizedId = Number(place?.id);
      if (!normalizedId) return;
      router.push(`/place/${normalizedId}`);
    },
    [router],
  );

  const handleDismissPlaceCard = useCallback((placeId) => {
    const normalizedId = Number(placeId);
    if (!normalizedId) return;
    setDismissedPlaceIds((prev) =>
      prev.includes(normalizedId) ? prev : [...prev, normalizedId],
    );
  }, []);

  return (
    <View
      style={[
        styles.wrap,
        isUser ? styles.wrapUser : styles.wrapAssistant,
        !isUser && hasSuggestionCards && styles.wrapAssistantWithCards,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
          style,
        ]}
      >
        {isTyping ? (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color={TOKENS.color.primary[600]} />
            <Text style={styles.typingText}>em Nhi đang trả lời...</Text>
          </View>
        ) : (
          <Text
            style={[
              styles.bubbleText,
              { color: isUser ? "#FFFFFF" : TOKENS.color.neutral[900] },
            ]}
          >
            {content}
          </Text>
        )}
      </View>

      {hasSuggestionCards ? (
        <View style={styles.suggestionList}>
          {visibleSuggestedPlaces.map((place, index) => {
            const placeId = Number(place?.id);

            return (
              <PlacePreviewCard
                key={placeId || `${place?.name || "place"}-${index}`}
                place={place}
                compact={isCompactCard}
                onClose={() => handleDismissPlaceCard(placeId)}
                onViewDetail={handleOpenPlace}
                showAddToTripAction={typeof onAddToTrip === "function"}
                onAddToTrip={onAddToTrip}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    maxWidth: "86%",
    marginBottom: 8,
  },
  wrapUser: {
    alignSelf: "flex-end",
  },
  wrapAssistant: {
    alignSelf: "flex-start",
  },
  wrapAssistantWithCards: {
    width: "100%",
    maxWidth: "100%",
  },
  bubble: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleUser: {
    borderBottomRightRadius: 8,
    backgroundColor: TOKENS.color.primary[600],
  },
  bubbleAssistant: {
    borderBottomLeftRadius: 8,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderWidth: 1,
    borderColor: TOKENS.color.border.light,
    ...TOKENS.shadow.sm,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 22,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  typingText: {
    color: TOKENS.color.neutral[500],
    fontSize: 13,
  },
  suggestionList: {
    marginTop: 8,
    gap: 10,
  },
});
