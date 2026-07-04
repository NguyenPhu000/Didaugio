import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react-native";
import { cn } from "../../lib/cn";
import { TOKENS } from "../../constants/design-tokens";
import { HorizontalPlaceCard } from "../composed/HorizontalPlaceCard";

export function AIBubble({
  role = "assistant",
  content,
  isTyping = false,
  style,
  places = [],
}) {
  const isUser = role === "user";
  const { t } = useTranslation();
  const router = useRouter();
  const [dismissedPlaceIds, setDismissedPlaceIds] = useState([]);

  const suggestedPlaces = useMemo(
    () => (!isUser && Array.isArray(places) ? places : []),
    [isUser, places]
  );
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

  return (
    <View
      className={cn(
        "flex-row items-end gap-2.5 mb-3 max-w-[88%]",
        isUser ? "self-end flex-row-reverse" : "self-start",
        !isUser && hasSuggestionCards && "w-full max-w-full",
      )}
    >
      {/* Avatar tròn nhỏ cho Trợ lý AI (Genie) */}
      {!isUser && (
        <View 
          className="w-8 h-8 rounded-full items-center justify-center border border-zinc-100 shadow-sm z-[2] bg-zinc-50"
        >
          <Sparkles size={14} color="#10B981" />
        </View>
      )}

      <View className={cn("flex-1", !isUser && hasSuggestionCards && "w-full")}>
        {!isUser && (
          <View className="flex-row items-center gap-1 mb-1 ml-1">
            <Text className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">
              Genie (AI)
            </Text>
          </View>
        )}

        <View
          className={cn(
            "rounded-[20px] px-4 py-3",
            isUser
              ? "rounded-br-sm bg-zinc-100" // Bong bóng chat user màu xám nhẹ
              : "rounded-bl-sm bg-white border border-zinc-200/80",
          )}
          style={
            !isUser
              ? {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.02,
                  shadowRadius: 3,
                  elevation: 1,
                }
              : style
          }
        >
          {isTyping ? (
            <View className="flex-row items-center gap-2 py-0.5">
              <ActivityIndicator size="small" color="#10B981" />
              <Text className="text-zinc-400 text-[12.5px] font-medium" style={{ fontFamily: TOKENS.font.body }}>
                {t("ai.typing") || "Đang suy nghĩ..."}
              </Text>
            </View>
          ) : (
            <Text
              className="text-[14.5px] leading-[22px]"
              style={{ 
                color: isUser ? "#18181B" : "#27272A", 
                fontFamily: TOKENS.font.body 
              }}
            >
              {content}
            </Text>
          )}
        </View>

        {/* Carousel địa điểm nằm ngoài bong bóng chat để dễ cuộn ngang */}
        {hasSuggestionCards ? (
          <View className="mt-2.5 w-full">
            <FlatList
              data={visibleSuggestedPlaces}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => String(item?.id || index)}
              renderItem={({ item }) => (
                <HorizontalPlaceCard
                  place={item}
                  onPressDetail={() => handleOpenPlace(item)}
                />
              )}
              contentContainerStyle={{ paddingLeft: 4, paddingRight: 16 }}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default AIBubble;
