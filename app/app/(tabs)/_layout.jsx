import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { View } from "react-native";

// You can import icons here locally or use a library like @expo/vector-icons
// For now, I'll use simple text or placeholders if icons aren't available.
// In a real app, use: import { MapPin, Compass, Sparkles, Heart, User } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e5e5e5",
          height: Platform.OS === "ios" ? 85 : 60,
          paddingBottom: Platform.OS === "ios" ? 30 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#0077b8",
        tabBarInactiveTintColor: "#a3a3a3",
        tabBarLabelStyle: {
          fontFamily: "BeVietnamPro-Medium", // Will fallback if font not loaded
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Bản đồ",
          // tabBarIcon: ({ color }) => <MapPin color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Khám phá",
          // tabBarIcon: ({ color }) => <Compass color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai-planner"
        options={{
          title: "AI Plan",
          // tabBarIcon: ({ color }) => <Sparkles color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Đã lưu",
          // tabBarIcon: ({ color }) => <Heart color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Cá nhân",
          // tabBarIcon: ({ color }) => <User color={color} />,
        }}
      />
    </Tabs>
  );
}
