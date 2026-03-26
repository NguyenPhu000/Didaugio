import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../../src/constants/colors";

const TAB_BAR_HEIGHT = 60;
const TAB_BAR_PADDING_BOTTOM = 6;

const TabIcon = ({ name, color, size }) => (
  <MaterialIcons name={name} size={size ?? 24} color={color} />
);

const TAB_SCREENS = [
  { name: "map", title: "Bản đồ", icon: "map" },
  { name: "explore", title: "Khám phá", icon: "explore" },
  { name: "ai-planner", title: "AI", icon: "auto-awesome" },
  { name: "saved", title: "Đã lưu", icon: "bookmark" },
  { name: "profile", title: "Cá nhân", icon: "person" },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: COLORS.text,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          height: TAB_BAR_HEIGHT,
          paddingBottom: TAB_BAR_PADDING_BOTTOM,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      {TAB_SCREENS.map((screen) => (
        <Tabs.Screen
          key={screen.name}
          name={screen.name}
          options={{
            title: screen.title,
            tabBarIcon: ({ color, size }) => (
              <TabIcon name={screen.icon} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
