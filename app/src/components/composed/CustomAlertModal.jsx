import { memo, useMemo, useEffect } from "react";
import { Modal, Pressable, Text, View, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { BlurView } from "expo-blur";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming 
} from "react-native-reanimated";
import { TOKENS } from "../../constants/design-tokens";
import { cn } from "../../lib/cn";

// Sử dụng bộ Icon Lucide siêu sang trọng chuẩn thiết kế hiện đại
import { CheckCircle2, AlertTriangle, XCircle, Info, HelpCircle } from "lucide-react-native";

const ALERT_CONFIGS = {
  success: { Icon: CheckCircle2, color: TOKENS.color.semantic.success },
  error: { Icon: XCircle, color: TOKENS.color.semantic.danger },
  warning: { Icon: AlertTriangle, color: TOKENS.color.semantic.warning },
  confirm: { Icon: HelpCircle, color: TOKENS.color.semantic.slate[800] },
  info: { Icon: Info, color: TOKENS.color.semantic.info },
};

const BUTTON_CLASS_NAMES = {
  destructive: "bg-danger border-danger",
  cancel: "bg-slate-100 border-slate-200",
  default: "bg-slate-950 border-slate-950",
};

const BUTTON_TEXT_CLASS_NAMES = {
  destructive: "text-white",
  cancel: "text-slate-800",
  default: "text-white",
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
  cancelText,
  isDestructive = false,
  isLoading = false,
}) {
  const { t } = useTranslation();
  const config = ALERT_CONFIGS[type] || ALERT_CONFIGS.info;
  const TargetIcon = config.Icon;

  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 120,
        mass: 0.8,
      });
      opacity.value = withTiming(1, { duration: 180 });
    } else {
      scale.value = 0.9;
      opacity.value = 0;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const resolvedButtons = useMemo(() => {
    if (Array.isArray(buttons) && buttons.length > 0) return buttons;
    
    const list = [];
    if (typeof onCancel === "function") {
      list.push({
        text: cancelText || t("common.cancel"),
        onPress: onCancel,
        style: "cancel",
      });
    }
    list.push({
      text:
        confirmText ||
        (typeof onCancel === "function" ? t("common.confirm") : t("common.close")),
      onPress: onConfirm,
      style: isDestructive ? "destructive" : "default",
    });
    return list;
  }, [buttons, onConfirm, onCancel, confirmText, cancelText, isDestructive, t]);

  const isVertical = resolvedButtons.length > 2;

  const handleDismiss = () => {
    if (isLoading) return;
    const cancelBtn = resolvedButtons.find(b => b.style === "cancel");
    if (cancelBtn) {
      cancelBtn.onPress?.();
      return;
    }
    if (type !== "confirm") resolvedButtons[0]?.onPress?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View
        className="flex-1 items-center justify-center px-6"
        accessible={false}
        accessibilityViewIsModal
        accessibilityRole="alert"
        accessibilityLabel={[title, message].filter(Boolean).join(". ")}
      >
        
        <BlurView intensity={12} tint="dark" className="absolute inset-0" />
        <Pressable
          className="absolute inset-0 bg-black/[0.04]"
          onPress={handleDismiss}
          accessible={false}
          accessibilityElementsHidden
        />

        <Animated.View 
          style={animatedStyle}
          className="w-full max-w-[340px] items-center rounded-[28px] border border-slate-100 bg-white p-6 shadow-xl"
        >
          <View className="mb-4 mt-2">
            {isLoading ? (
              <ActivityIndicator size="large" color={TOKENS.color.accent[500]} />
            ) : (
              <TargetIcon size={48} color={config.color} strokeWidth={1.75} />
            )}
          </View>

          <View className="mb-6 w-full items-center px-2">
            <Text 
              accessibilityRole="header"
              className="text-center font-semibold text-[18px] leading-6 tracking-tight text-slate-900"
            >
              {isLoading ? t("common.loading") : title}
            </Text>
            {message && (
              <Text 
                className="mt-2.5 text-center font-sans text-[13.5px] leading-5 tracking-wide text-slate-500"
              >
                {message}
              </Text>
            )}
          </View>

          <View
            className={cn(
              "w-full gap-2.5",
              isVertical ? "flex-col items-stretch" : "flex-row items-center",
            )}
          >
            {resolvedButtons.map((btn, index) => {
              const buttonClassName = BUTTON_CLASS_NAMES[btn.style] || BUTTON_CLASS_NAMES.default;
              const textClassName = BUTTON_TEXT_CLASS_NAMES[btn.style] || BUTTON_TEXT_CLASS_NAMES.default;
              
              return (
                <Pressable
                  key={`${btn.text || "alert-action"}-${index}`}
                  onPress={isLoading ? null : btn.onPress}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel={btn.text}
                  accessibilityState={{ disabled: isLoading }}
                  className={cn(
                    "h-12 items-center justify-center rounded-xl border px-4 shadow-sm active:opacity-80",
                    isVertical ? "w-full" : "flex-1",
                    buttonClassName,
                    isLoading && "opacity-50",
                  )}
                >
                  <Text 
                    className={cn(
                      "font-semibold text-[14px] tracking-tight",
                      textClassName,
                    )}
                  >
                    {isLoading && btn.style !== "cancel" ? t("common.loading") : btn.text}
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
