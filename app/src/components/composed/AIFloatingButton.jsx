import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TOKENS } from "../../constants/design-tokens";
import { ANIMATIONS } from "../../lib/animations";

const HIDE_PATHS = new Set([
  "/(tabs)/ai",
  "/ai",
  "/(auth)/login",
  "/(auth)/register",
  "/onboarding",
]);

export function AIFloatingButton() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (HIDE_PATHS.has(pathname)) return null;

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: "absolute",
          bottom: insets.bottom + 86,
          right: 18,
        },
      ]}
    >
      <Pressable
        onPress={() => router.push("/(tabs)/ai")}
        onPressIn={() => {
          scale.value = ANIMATIONS.cardPressIn;
        }}
        onPressOut={() => {
          scale.value = ANIMATIONS.cardPressOut;
        }}
        className="rounded-full border border-white/70 px-4 py-3"
        style={{
          backgroundColor: TOKENS.color.primary[600],
          ...TOKENS.shadow.glow,
        }}
      >
        <View className="flex-row items-center gap-2">
          <MaterialIcons name="auto-awesome" size={20} color="#fff" />
          <Text className="text-[12px] font-bold uppercase tracking-[1px] text-white">
            AI
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
