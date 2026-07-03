import { View, Text } from "react-native";
import { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOffline } from "../../hooks/useOffline";
import { TOKENS } from "../../constants/design-tokens";

export function OfflineToast() {
  const { isOffline } = useOffline();
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    translateY.value = withTiming(isOffline ? 0 : -80, {
      duration: TOKENS.duration.normal,
    });
    opacity.value = withTiming(isOffline ? 1 : 0, {
      duration: TOKENS.duration.normal,
    });
  }, [isOffline, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: "absolute",
          top: insets.top + 10,
          left: 16,
          right: 16,
          zIndex: 999,
        },
      ]}
    >
      <View
        className="flex-row items-center gap-3 rounded-[22px] border px-4 py-3"
        style={{
          backgroundColor: TOKENS.color.neutral[900],
          borderColor: "rgba(255,255,255,0.12)",
          ...TOKENS.shadow.md,
        }}
      >
        <View
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: "rgba(14,165,233,0.16)" }}
        >
          <MaterialIconsRounded name="wifi-off" size={18} color="#fff" />
        </View>
        <Text className="text-white text-[13px] font-semibold flex-1">
          Không có kết nối mạng
        </Text>
      </View>
    </Animated.View>
  );
}
