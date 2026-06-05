import React, { useEffect, useRef } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIconsRounded } from "../primitives/MaterialIconsRounded";
import { useUIStore } from "../../stores/uiStore";
import { TOKENS } from "../../constants/design-tokens";

function ToastItem({ toast, onDismiss }) {
  const { id, message, type = "info" } = toast;
  
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.95);
  
  const dismissCalled = useRef(false);

  // Animation biến mất trước khi thực hiện xóa khỏi store
  const handleDismiss = () => {
    if (dismissCalled.current) return;
    dismissCalled.current = true;
    
    opacity.value = withTiming(0, { duration: TOKENS.duration.fast });
    scale.value = withTiming(0.95, { duration: TOKENS.duration.fast });
    translateY.value = withTiming(10, { duration: TOKENS.duration.fast }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)(id);
      }
    });
  };

  // Animation xuất hiện khi mount
  useEffect(() => {
    opacity.value = withTiming(1, { duration: TOKENS.duration.normal });
    scale.value = withTiming(1, { duration: TOKENS.duration.normal });
    translateY.value = withTiming(0, { duration: TOKENS.duration.normal });

    // Tự động đóng sau 3.5 giây
    const timer = setTimeout(() => {
      handleDismiss();
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));

  // Cấu hình UI theme dựa trên loại Toast (success, error, warning, info)
  let config = {
    bgColor: TOKENS.color.neutral[900],
    borderColor: "rgba(255,255,255,0.12)",
    textColor: "#FFFFFF",
    icon: "info",
    iconBg: "rgba(0,123,255,0.16)",
    iconColor: TOKENS.color.info,
  };

  if (type === "success") {
    config = {
      bgColor: "#0F172A",
      borderColor: "rgba(16,185,129,0.2)",
      textColor: "#FFFFFF",
      icon: "check-circle",
      iconBg: "rgba(16,185,129,0.16)",
      iconColor: TOKENS.color.success,
    };
  } else if (type === "error") {
    config = {
      bgColor: "#0F172A",
      borderColor: "rgba(239,68,68,0.2)",
      textColor: "#FFFFFF",
      icon: "error",
      iconBg: "rgba(239,68,68,0.16)",
      iconColor: TOKENS.color.error,
    };
  } else if (type === "warning") {
    config = {
      bgColor: "#0F172A",
      borderColor: "rgba(245,158,11,0.2)",
      textColor: "#FFFFFF",
      icon: "warning",
      iconBg: "rgba(245,158,11,0.16)",
      iconColor: TOKENS.color.warning,
    };
  }

  return (
    <Animated.View style={[animatedStyle, { marginBottom: 8 }]}>
      <Pressable onPress={handleDismiss}>
        <View
          className="flex-row items-center gap-3 rounded-[20px] border px-4 py-3"
          style={{
            backgroundColor: config.bgColor,
            borderColor: config.borderColor,
            ...TOKENS.shadow.md,
          }}
        >
          <View
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: config.iconBg }}
          >
            <MaterialIconsRounded name={config.icon} size={18} color={config.iconColor} />
          </View>
          
          <Text 
            className="text-[13px] font-medium flex-1"
            style={{ color: config.textColor, fontFamily: TOKENS.font.body }}
          >
            {message}
          </Text>

          <MaterialIconsRounded name="close" size={16} color="rgba(255,255,255,0.4)" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function ToastContainer() {
  const toastQueue = useUIStore((s) => s.toastQueue);
  const dismissToast = useUIStore((s) => s.dismissToast);
  const insets = useSafeAreaInsets();

  if (!toastQueue || toastQueue.length === 0) return null;

  return (
    <View
      style={{
        position: "absolute",
        bottom: insets.bottom + 16,
        left: 16,
        right: 16,
        zIndex: 9999,
      }}
      pointerEvents="box-none"
    >
      {toastQueue.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </View>
  );
}
