import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";

function ExploreSearchBarInner({ onPress }) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      style={TOKENS.shadow.sm}
      className="flex-row items-center gap-3 h-[52px] px-3.5 rounded-[18px] bg-white border border-black/[0.04] active:opacity-90"
    >
      <View
        className="w-[34px] h-[34px] rounded-full items-center justify-center"
        style={{ backgroundColor: APPLE_THEME.surfaceElevated, borderWidth: 1, borderColor: APPLE_THEME.borderSoft }}
      >
        <MaterialIconsRounded name="search" size={20} color={APPLE_THEME.text} />
      </View>
      <Text
        className="flex-1 text-[14px] font-medium"
        style={{ color: APPLE_THEME.textMuted, fontFamily: TOKENS.font.medium }}
      >
        {t("explore.header.searchPlaceholder")}
      </Text>
      <View
        className="w-[34px] h-[34px] rounded-full items-center justify-center"
        style={{ backgroundColor: TOKENS.color.overlay.blue }}
      >
        <MaterialIconsRounded name="filter-list" size={20} color={APPLE_THEME.focusBlue} />
      </View>
    </Pressable>
  );
}

export const ExploreSearchBar = memo(ExploreSearchBarInner);
