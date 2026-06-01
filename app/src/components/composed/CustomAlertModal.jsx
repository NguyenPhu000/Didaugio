import { memo, useMemo, useEffect } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { TOKENS } from "../../constants/design-tokens";

// Hệ thống màu sắc và icon cao cấp chuẩn Apple & Airbnb
const ALERT_CONFIGS = {
  error: {
    icon: "x-circle",
    color: TOKENS.color.error,
    bg: "rgba(239, 68, 68, 0.08)",
    border: "rgba(239, 68, 68, 0.15)",
  },
  success: {
    icon: "check-circle",
    color: TOKENS.color.success,
    bg: "rgba(16, 185, 129, 0.08)",
    border: "rgba(16, 185, 129, 0.15)",
  },
  warning: {
    icon: "alert-triangle",
    color: TOKENS.color.warning,
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.15)",
  },
  confirm: {
    icon: "help-circle",
    color: "#6366F1", // Indigo premium
    bg: "rgba(99, 102, 241, 0.08)",
    border: "rgba(99, 102, 241, 0.15)",
  },
  info: {
    icon: "info",
    color: TOKENS.color.info,
    bg: "rgba(0, 123, 255, 0.08)",
    border: "rgba(0, 123, 255, 0.15)",
  },
};

const BUTTON_CONFIGS = {
  destructive: {
    btn: "bg-[#EF4444] active:bg-[#DC2626]",
    text: "text-white",
  },
  cancel: {
    btn: "bg-[#F3F4F6] active:bg-[#E5E7EB]",
    text: "text-[#4C4C50]",
  },
  default: {
    btn: "bg-[#181819] active:bg-zinc-800",
    text: "text-white",
  },
};

const CustomAlertModal = memo(function CustomAlertModal({
  visible,
  title,
  message,
  type = "info",
  buttons,
  onConfirm,
  onCancel,
  confirmText,
  cancelText = "Hủy",
  isDestructive = false,
}) {
  const config = ALERT_CONFIGS[type] || ALERT_CONFIGS.info;

  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withTiming(1, { duration: 150 });
      opacity.value = withTiming(1, { duration: 150 });
    } else {
      scale.value = withTiming(0.95, { duration: 100 });
      opacity.value = withTiming(0, { duration: 100 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const resolvedButtons = useMemo(() => {
    if (Array.isArray(buttons) && buttons.length > 0) return buttons;

    const list = [];
    if (typeof onCancel === "function") {
      list.push({ text: cancelText, onPress: onCancel, style: "cancel" });
    }
    list.push({
      text:
        confirmText || (typeof onCancel === "function" ? "Xác nhận" : "Đóng"),
      onPress: onConfirm,
      style: isDestructive ? "destructive" : "default",
    });
    return list;
  }, [buttons, onConfirm, onCancel, confirmText, cancelText, isDestructive]);

  const isVerticalLayout = resolvedButtons.length > 2;

  const handleDismiss = () => {
    const cancelBtn = resolvedButtons.find((b) => b.style === "cancel");
    (cancelBtn || resolvedButtons[0])?.onPress?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View className="flex-1 items-center justify-center px-6 bg-black/30">
        <BlurView intensity={30} tint="dark" className="absolute inset-0" />
        <Pressable className="absolute inset-0" onPress={handleDismiss} />

        <Animated.View
          style={[
            animatedStyle,
            {
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 10 },
              elevation: 6,
            },
          ]}
          className="w-full max-w-[325px] bg-white rounded-[26px] p-6 items-center border border-gray-100/50"
        >
          {/* Vòng tròn Icon đẹp mắt */}
          <View
            style={{
              backgroundColor: config.bg,
              borderColor: config.border,
            }}
            className="w-16 h-16 rounded-full items-center justify-center border mb-4"
          >
            <Feather name={config.icon} size={28} color={config.color} />
          </View>

          {/* Nội dung thông báo */}
          <View className="items-center mb-6 w-full px-1">
            <Text
              style={{ fontFamily: TOKENS.font.semibold }}
              className="text-[19px] text-[#181819] text-center tracking-tight leading-6"
            >
              {title}
            </Text>
            {message && (
              <Text
                style={{ fontFamily: TOKENS.font.body }}
                className="text-[14.5px] text-[#6B7280] text-center mt-2.5 leading-[21px] tracking-normal"
              >
                {message}
              </Text>
            )}
          </View>

          {/* Các nút bấm */}
          <View
            className={`w-full gap-2.5 ${
              isVerticalLayout ? "flex-col items-stretch" : "flex-row items-center"
            }`}
          >
            {resolvedButtons.map((btn, index) => {
              const btnStyle =
                BUTTON_CONFIGS[btn.style] || BUTTON_CONFIGS.default;

              return (
                <Pressable
                  key={index}
                  onPress={btn.onPress}
                  className={`h-[46px] rounded-[14px] items-center justify-center transition-all active:scale-[0.96] ${
                    btnStyle.btn
                  } ${isVerticalLayout ? "w-full" : "flex-1"}`}
                >
                  <Text
                    style={{ fontFamily: TOKENS.font.semibold }}
                    className={`text-[14.5px] tracking-tight ${btnStyle.text}`}
                  >
                    {btn.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

export default CustomAlertModal;