import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useRouter } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useNotifications } from "../../modules/notifications/hooks/useNotifications";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function formatCompactCount(n) {
  if (n >= 100) return "99+";
  if (n >= 10) return String(n);
  return String(n);
}

/**
 * Apple-style notification bell button.
 * Shows unread count badge, animates on mount, navigates to notifications page.
 *
 * @param {object}  props
 * @param {number}  [props.size=46]     — button size in px
 * @param {string}  [props.color]        — icon color override
 * @param {boolean} [props.showBadge=true] — whether to show unread count
 * @param {string}  [props.tintColor]    — badge background color
 */
export function NotificationBell({
  size = 46,
  color,
  showBadge = true,
  tintColor = "#FF3B30",
}) {
  const router = useRouter();
  const { data } = useNotifications({ enabled: true });
  const unreadCount = data?.unreadCount ?? 0;
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    router.push("/profile/notifications");
  }, [router]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.88, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 280 });
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const showCount = unreadCount > 0;
  const badgeSize = size * 0.38;
  const iconSize = size * 0.48;
  const fontSize = Math.max(8, badgeSize * 0.72);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="relative items-center justify-center"
      style={[
        animatedStyle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {/* Background circle */}
      <View
        className="bg-white items-center justify-center"
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        <MaterialIconsRounded
          name={showCount ? "notifications" : "notifications-none"}
          size={iconSize}
          color={color || "#1D1D1F"}
        />
      </View>

      {/* Unread badge */}
      {showBadge && showCount && (
        <View
          className="absolute items-center justify-center px-[3px]"
          style={{
            minWidth: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            top: -(badgeSize * 0.18),
            right: -(badgeSize * 0.18),
            backgroundColor: tintColor,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.18,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <Text
            className="text-white font-semibold"
            style={{ fontSize, lineHeight: undefined, includeFontPadding: false }}
            numberOfLines={1}
          >
            {formatCompactCount(unreadCount)}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

