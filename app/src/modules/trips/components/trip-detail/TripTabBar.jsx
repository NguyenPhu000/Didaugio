import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { STYLES, T, ALPHA } from "../../utils/tripDetailTokens";

const TABS = [
  { key: "itinerary", icon: "route" },
  { key: "services", icon: "room-service" },
  { key: "budget", icon: "account-balance-wallet" },
];

export const TripTabBar = memo(function TripTabBar({
  activeTab,
  onTabChange,
  serviceCount = 0,
}) {
  const { t } = useTranslation();
  return (
    <View className={STYLES.tabBar}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const showBadge = tab.key === "services" && serviceCount > 0;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            className={`${STYLES.tabItem} flex-row justify-center gap-1.5 ${isActive ? STYLES.tabItemActive : ""}`}
          >
            <MaterialIconsRounded
              name={tab.icon}
              size={16}
              color={isActive ? T.ink : ALPHA.iconStrong}
            />
            <Text className={`${STYLES.tabLabel} ${isActive ? STYLES.tabLabelActive : ""}`}>
              {t(`tripTabBar.${tab.key}`)}
            </Text>
            {showBadge ? (
              <View className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#1D1D1F] items-center justify-center">
                <Text className="text-[10px] font-semibold text-white">
                  {serviceCount > 99 ? "99+" : serviceCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
});
