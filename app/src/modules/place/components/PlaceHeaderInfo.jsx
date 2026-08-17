import React, { memo } from "react";
import { View, Text, Pressable } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";

export const PlaceHeaderInfo = memo(
  ({
    categoryIcon,
    categoryName,
    placeName,
    rating,
    reviewCount,
    location,
    openState,
    handleOpenAllReviews,
    handleNavigate,
    handleSaveToggle,
    isSavedLocal,
    placePhone,
    handleOpenUrl,
    palette,
    formatReviewCount,
    t,
  }) => {
    return (
      <View
        className="relative z-10 -mt-7 rounded-t-[32px] bg-white px-5 pt-6 pb-3"
        style={{ borderCurve: "continuous" }}
      >
        {/* Category label */}
        <View className="flex-row items-center gap-1 mb-1">
          <MaterialCommunityIcons
            name={categoryIcon}
            size={14}
            color={palette.accent}
          />
          <Text
            className="text-[11px] tracking-[0.8px] uppercase"
            style={{
              color: palette.accent,
              fontFamily: TOKENS.font.semibold,
            }}
          >
            {categoryName}
          </Text>
        </View>

        {/* Place name */}
        <Text
          className="text-[30px] leading-[35px] tracking-[-0.6px]"
          style={{
            color: palette.text,
            fontFamily: TOKENS.font.heading,
          }}
        >
          {placeName}
        </Text>

        {/* Rating · Location · Open State */}
        <View className="flex-row items-center flex-wrap gap-x-2.5 gap-y-1 mt-2">
          {rating > 0 ? (
            <Pressable
              onPress={handleOpenAllReviews}
              className="flex-row items-center gap-0.5"
            >
              <MaterialIconsRounded
                name="star"
                size={14}
                color={TOKENS.color.semantic.star}
              />
              <Text
                className="text-[13px]"
                style={{
                  color: palette.text,
                  fontFamily: TOKENS.font.semibold,
                }}
              >
                {rating.toFixed(1)}
              </Text>
              <Text
                className="text-[13px]"
                style={{
                  color: palette.textMuted,
                  fontFamily: TOKENS.font.medium,
                }}
              >
                ({formatReviewCount(reviewCount, t)})
              </Text>
            </Pressable>
          ) : (
            <Text
              className="text-[13px]"
              style={{
                color: palette.textMuted,
                fontFamily: TOKENS.font.medium,
              }}
            >
              {t("place.detail.new")}
            </Text>
          )}

          <Text className="text-[10px]" style={{ color: palette.textSoft }}>
            ·
          </Text>

          <Text
            className="text-[13px]"
            style={{
              color: palette.textMuted,
              fontFamily: TOKENS.font.medium,
            }}
          >
            {location || t("place.defaultLocation")}
          </Text>

          <Text className="text-[10px]" style={{ color: palette.textSoft }}>
            ·
          </Text>

          <Text
            className="text-[13px]"
            style={{
              color: openState.color,
              fontFamily: TOKENS.font.semibold,
            }}
          >
            {openState.label}
          </Text>
        </View>

        {/* Action Buttons: Navigate | Save | Call */}
        <View className="flex-row items-center gap-2.5 mt-5">
          <Pressable
            onPress={handleNavigate}
            className="flex-1 h-12 flex-row items-center justify-center gap-2 rounded-[16px] active:opacity-75"
            style={{
              backgroundColor: palette.primary,
              borderCurve: "continuous",
            }}
          >
            <MaterialIconsRounded
              name="near-me"
              size={17}
              color={TOKENS.color.surface.light}
            />
            <Text
              className="text-[13px]"
              style={{
                color: TOKENS.color.surface.light,
                fontFamily: TOKENS.font.semibold,
              }}
            >
              {t("place.directions")}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSaveToggle}
            className="h-12 w-12 items-center justify-center rounded-[16px] active:opacity-75"
            style={{
              borderCurve: "continuous",
              backgroundColor: TOKENS.color.semantic.apple.surface,
            }}
            accessibilityRole="button"
            accessibilityLabel={
              isSavedLocal ? t("place.saved") : t("place.save")
            }
          >
            <MaterialIconsRounded
              name={isSavedLocal ? "bookmark" : "bookmark-border"}
              size={16}
              color={
                isSavedLocal ? TOKENS.color.semantic.star : palette.text
              }
            />
          </Pressable>

          {placePhone ? (
            <Pressable
              onPress={() => handleOpenUrl(`tel:${placePhone}`)}
              className="h-12 w-12 items-center justify-center rounded-[16px] active:opacity-75"
              style={{
                borderCurve: "continuous",
                backgroundColor: TOKENS.color.semantic.apple.surface,
              }}
              accessibilityRole="button"
              accessibilityLabel={t("place.detail.quickCall")}
            >
              <MaterialIconsRounded
                name="call"
                size={16}
                color={palette.text}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }
);

PlaceHeaderInfo.displayName = "PlaceHeaderInfo";
export default PlaceHeaderInfo;
