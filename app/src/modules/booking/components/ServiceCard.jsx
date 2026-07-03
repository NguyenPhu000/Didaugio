import React from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialIconsRounded } from "../../../components/primitives/MaterialIconsRounded";
import { BOOKING_APPLE_THEME as APPLE_THEME } from "../../../constants/design-tokens";
import { useTranslation } from "react-i18next";
import { formatPriceLocale } from "@/utils/dateFormat";

const BOOKING_THEME = {
  ...APPLE_THEME,
  background: APPLE_THEME.background,
  backgroundElevated: APPLE_THEME.surface,
  glass: APPLE_THEME.surface,
  glassBorder: APPLE_THEME.border,
  glassBorderStrong: APPLE_THEME.borderSoft,
  neon: APPLE_THEME.primary,
  neonAccent: APPLE_THEME.primaryPressed,
  neonGlow: APPLE_THEME.primaryTint,
  text: APPLE_THEME.text,
  textSecondary: APPLE_THEME.textSecondary,
  textMuted: APPLE_THEME.textMuted,
  white: APPLE_THEME.white,
  focusBlue: APPLE_THEME.focusBlue,
};

const formatPrice = (price) => {
  if (!price && price !== 0) return "—";
  return formatPriceLocale(price);
};

export function ServiceCard({ service, isSelected, onSelect }) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={() => onSelect(service)}
      style={{
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        backgroundColor: isSelected
          ? BOOKING_THEME.neonGlow
          : BOOKING_THEME.glass,
        borderWidth: 1.5,
        borderColor: isSelected ? BOOKING_THEME.neon : BOOKING_THEME.glassBorder,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text
            style={{ color: BOOKING_THEME.text, fontSize: 15, fontWeight: "700" }}
          >
            {service.name}
          </Text>
          {service.description ? (
            <Text
              style={{
                color: BOOKING_THEME.textSecondary,
                fontSize: 12,
                marginTop: 4,
                lineHeight: 18,
              }}
              numberOfLines={2}
            >
              {service.description}
            </Text>
          ) : null}
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          {service.salePrice != null && service.salePrice !== service.price ? (
            <Text
              style={{
                color: BOOKING_THEME.textMuted,
                fontSize: 12,
                textDecorationLine: "line-through",
              }}
            >
              {formatPrice(service.price)}
            </Text>
          ) : null}
          <Text
            style={{ color: BOOKING_THEME.neon, fontSize: 15, fontWeight: "800" }}
          >
            {formatPrice(service.salePrice ?? service.price)}
          </Text>
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: isSelected ? BOOKING_THEME.neon : "transparent",
              borderWidth: 2,
              borderColor: isSelected
                ? BOOKING_THEME.neon
                : BOOKING_THEME.glassBorder,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isSelected ? (
              <MaterialIconsRounded name="check" size={13} color={BOOKING_THEME.white} />
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default ServiceCard;
