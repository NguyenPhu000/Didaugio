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
import { MaterialIconsRounded } from "../primitives/MaterialIconsRounded";

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
        "flex-row items-end gap-2.5 mb-3 max-w-[88%]",
        isUser ? "self-end flex-row-reverse" : "self-start",
        !isUser && hasSuggestionCards && "w-full max-w-full",
      )}
    >
      {/* Avatar tròn nhỏ cho Trợ lý AI (em Nhi) */}
      {!isUser && (
        <View 
          className="w-8 h-8 rounded-full items-center justify-center border border-slate-100 shadow-sm z-[2]"
          style={{ backgroundColor: "#F8FAFC" }}
        >
          <MaterialIconsRounded name="smart-toy" size={16} color="#4F46E5" />
        </View>
      )}

      <View className={cn("flex-1", !isUser && hasSuggestionCards && "w-full")}>
        <View
          className={cn(
            "rounded-[20px] px-4 py-3",
            isUser
              ? "rounded-br-sm bg-[#007AFF]" // Màu xanh Apple mượt mà
              : "rounded-bl-sm bg-white border border-slate-100/80",
          )}
          style={
            !isUser
              ? {
                  shadowColor: "#0F172A",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 6,
                  elevation: 2,
                }
              : style
          }
        >
          {isTyping ? (
            <View className="flex-row items-center gap-2 py-0.5">
              <ActivityIndicator size="small" color="#4F46E5" />
              <Text className="text-slate-400 text-[12.5px] font-medium" style={{ fontFamily: TOKENS.font.body }}>
                em Nhi đang gõ...
              </Text>
            </View>
          ) : (
            <Text
              className="text-[14px] leading-[22px]"
              style={{ 
                color: isUser ? "#FFFFFF" : TOKENS.color.neutral[900], 
                fontFamily: TOKENS.font.body 
              }}
            >
              {content}
            </Text>
          )}
        </View>

        {hasSuggestionCards ? (
          <View className="mt-2.5 gap-2.5">
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
    </View>
  );
}
export default AIBubble;
