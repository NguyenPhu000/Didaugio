import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ANIMATIONS } from "../../lib/animations";
import { AIEntryButton } from "./AIEntryButton";

const HIDE_PATHS = new Set([
  "/(tabs)/ai",
  "/ai",
  "/(tabs)/map",
  "/map",
  "/(auth)/login",
  "/login",
  "/(auth)/register",
  "/register",
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
      <AIEntryButton
        compact
        onPress={() => router.push("/(tabs)/ai")}
        onPressIn={() => {
          scale.value = ANIMATIONS.cardPressIn;
        }}
        onPressOut={() => {
          scale.value = ANIMATIONS.cardPressOut;
        }}
      />
    </Animated.View>
  );
}
