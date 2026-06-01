import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { cn } from "../../lib/cn";
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
      className={cn(
        "max-w-[86%] mb-2",
        isUser ? "self-end" : "self-start",
        !isUser && hasSuggestionCards && "w-full max-w-full",
      )}
    >
      <View
        className={cn(
          "rounded-6 px-4 py-3",
          isUser
            ? "rounded-br-sm bg-primary-600"
            : "rounded-bl-sm bg-white/98 border border-slate-200",
        )}
        style={
          !isUser
            ? {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }
            : style
        }
      >
        {isTyping ? (
          <View className="flex-row items-center gap-2 py-1">
            <ActivityIndicator size="small" color={TOKENS.color.primary[600]} />
            <Text className="text-slate-500 text-[13px]">em Nhi đang trả lời...</Text>
          </View>
        ) : (
          <Text
            className="text-sm leading-[22px]"
            style={{ color: isUser ? "#FFFFFF" : TOKENS.color.neutral[900] }}
          >
            {content}
          </Text>
        )}
      </View>

      {hasSuggestionCards ? (
        <View className="mt-2 gap-2.5">
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
