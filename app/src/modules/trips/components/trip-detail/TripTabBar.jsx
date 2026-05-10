import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import s from "../../utils/tripDetailTokens";

const TABS = [
  { key: "itinerary", label: "Lịch trình", icon: "route" },
  { key: "services", label: "Dịch vụ", icon: "room-service" },
  { key: "budget", label: "Ngân sách", icon: "account-balance-wallet" },
];

export const TripTabBar = memo(function TripTabBar({
  activeTab,
  onTabChange,
}) {
  return (
    <View style={s.tabBar}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            style={[s.tabItem, isActive && s.tabItemActive]}
          >
            <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});
