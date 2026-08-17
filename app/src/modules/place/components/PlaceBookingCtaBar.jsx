import React, { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";

const BOOKING_CTA_SHADOW = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 8,
};

export const PlaceBookingCtaBar = memo(
  ({
    insets,
    palette,
    place,
    minPrice,
    handleOpenBooking,
    isOwnerOrStaff,
    formatCurrency,
    t,
  }) => {
    return (
      <View
        className="absolute left-0 right-0 bottom-0 bg-white border-t border-slate-100 px-5 pt-3.5"
        style={[
          BOOKING_CTA_SHADOW,
          { paddingBottom: Math.max(insets.bottom, 18) },
        ]}
      >
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <Text
              className="text-[11px] uppercase tracking-[0.5px]"
              style={{
                color: palette.textMuted,
                fontFamily: TOKENS.font.semibold,
              }}
            >
              {t("place.detail.serviceStartsFrom")}
            </Text>
            <Text
              className="text-[18px] leading-[22px] tracking-[-0.3px]"
              style={{
                color: palette.text,
                fontFamily: TOKENS.font.heading,
              }}
            >
              {minPrice ? `${formatCurrency(minPrice)}` : t("place.detail.contactPrice")}
            </Text>
          </View>

          <Pressable
            onPress={handleOpenBooking}
            className="h-12 px-6 flex-row items-center justify-center gap-2 rounded-[16px] active:opacity-85"
            style={{
              backgroundColor: palette.accent,
              borderCurve: "continuous",
            }}
          >
            <MaterialIconsRounded
              name="event-available"
              size={18}
              color={TOKENS.color.surface.dark}
            />
            <Text
              className="text-[14px]"
              style={{
                color: TOKENS.color.surface.dark,
                fontFamily: TOKENS.font.heading,
              }}
            >
              {isOwnerOrStaff
                ? t("place.detail.viewBookingFlow")
                : t("place.detail.bookNow")}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }
);

PlaceBookingCtaBar.displayName = "PlaceBookingCtaBar";
export default PlaceBookingCtaBar;
