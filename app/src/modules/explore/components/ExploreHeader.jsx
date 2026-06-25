import { memo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { getUserName } from "../utils/exploreHelpers";
import { NotificationBell } from "../../../components/composed/NotificationBell";

function ExploreHeaderInner({ user }) {
  const { t } = useTranslation();
  const userName = getUserName(user);

  return (
    <View className="flex-row justify-between items-center gap-3.5 px-[15px] py-3 rounded-[24px] bg-white border border-black/[0.04] shadow-sm elevation-1">
      <View className="flex-row items-center gap-2.5 flex-1">
        <View className="w-10 h-10 rounded-full items-center justify-center bg-[#E5F1FF]">
          <MaterialIconsRounded name="person" size={20} color={APPLE_THEME.primary} />
        </View>

        <View className="flex-1 min-w-0">
          <Text className="text-ink-muted text-[11px] leading-[13px] font-semibold tracking-[0.9px] uppercase">
            {t("explore.headerBrand")}
          </Text>
          <Text className="mt-0.5 text-ink text-[17px] leading-[21px] font-bold tracking-[-0.2px]" numberOfLines={1}>
            {t("explore.headerGreeting", { name: userName })}
          </Text>
        </View>
      </View>

      <NotificationBell size={38} />
    </View>
  );
}

export const ExploreHeader = memo(ExploreHeaderInner);
