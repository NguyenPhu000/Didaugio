import { memo, useMemo, useEffect } from "react";
import { Modal, Pressable, Text, View, ActivityIndicator } from "react-native";
import { BlurView } from "expo-blur";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming 
} from "react-native-reanimated";
import { TOKENS } from "../../constants/design-tokens";

// Sử dụng bộ Icon Lucide siêu sang trọng chuẩn thiết kế hiện đại
import { CheckCircle2, AlertTriangle, XCircle, Info, HelpCircle } from "lucide-react-native";

const ALERT_CONFIGS = {
  success: { Icon: CheckCircle2, color: "#10B981" }, // Xanh Emerald thanh lịch
  error: { Icon: XCircle, color: "#EF4444" },       // Đỏ mượt dịu mắt
  warning: { Icon: AlertTriangle, color: "#F59E0B" }, // Vàng hổ phách
  confirm: { Icon: HelpCircle, color: "#1E293B" },   // Đen Slate sâu thẳm
  info: { Icon: Info, color: "#6366F1" },            // Tím Indigo
};

const BUTTON_CONFIGS = {
  destructive: { btn: "bg-red-500 active:bg-red-600 shadow-md shadow-red-500/10", text: "text-white" },
  cancel: { btn: "bg-gray-100 active:bg-gray-200", text: "text-slate-700" },
  default: { btn: "bg-slate-900 active:bg-slate-800 shadow-md shadow-slate-950/10", text: "text-white" },
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
  isLoading = false, // Thêm trạng thái loading như hình mẫu
}) {
  const config = ALERT_CONFIGS[type] || ALERT_CONFIGS.info;
  const TargetIcon = config.Icon;

  // Khởi tạo các giá trị mượt mà cho hiệu ứng Spring nẩy nhẹ của Apple
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Cấu hình vi dịch chuyển đàn hồi (Spring) cao cấp giống iOS Native
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
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const resolvedButtons = useMemo(() => {
    if (Array.isArray(buttons) && buttons.length > 0) return buttons;
    
    const list = [];
    if (typeof onCancel === "function" && !isLoading) {
      list.push({ text: cancelText, onPress: onCancel, style: "cancel" });
    }
    list.push({
      text: confirmText || (typeof onCancel === "function" ? "Xác nhận" : "Đóng"),
      onPress: onConfirm,
      style: isDestructive ? "destructive" : "default",
    });
    return list;
  }, [buttons, onConfirm, onCancel, confirmText, cancelText, isDestructive, isLoading]);

  const isVertical = resolvedButtons.length > 2;

  const handleDismiss = () => {
    if (isLoading) return; // Đang chạy luồng ngầm không cho tự tắt tự do
    const cancelBtn = resolvedButtons.find(b => b.style === "cancel");
    (cancelBtn || resolvedButtons[0])?.onPress?.();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleDismiss}>
      <View className="flex-1 items-center justify-center px-6">
        
        {/* Lớp nền mờ sương mỏng ban ngày (Subtle Daylight Apple Blur) */}
        <BlurView intensity={12} tint="dark" className="absolute inset-0" />
        <Pressable className="absolute inset-0 bg-black/[0.04]" onPress={handleDismiss} />

        {/* Airy Floating Card — Rộng rãi max-w-[310px] chuẩn hình mẫu */}
        <Animated.View 
          style={[
            animatedStyle,
            {
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 16 },
              elevation: 4,
            }
          ]}
          className="w-full max-w-[310px] bg-white rounded-[28px] p-6 items-center border border-gray-100/50"
        >
          
          {/* Naked Icon Box — Tối giản hoàn toàn, không ô màu nền */}
          <View className="mb-4 mt-2">
            {isLoading ? (
              <ActivityIndicator size="large" color="#007AFF" />
            ) : (
              <TargetIcon size={48} color={config.color} strokeWidth={1.75} />
            )}
          </View>

          {/* Typography Content — Căn chỉnh tỷ lệ thông thoáng */}
          <View className="items-center mb-6 w-full px-2">
            <Text 
              style={{ fontFamily: TOKENS.font.semibold }}
              className="text-[18px] text-slate-900 text-center tracking-tight leading-6"
            >
              {isLoading ? "Đang xử lý mạng ngầm..." : title}
            </Text>
            {message && (
              <Text 
                style={{ fontFamily: TOKENS.font.body }}
                className="text-[13.5px] text-slate-400 text-center mt-2.5 leading-5 tracking-wide"
              >
                {message}
              </Text>
            )}
          </View>

          {/* Phím bấm dạng phẳng bo mềm Squircle Công thái học */}
          <View className={`w-full gap-2.5 ${isVertical ? "flex-col items-stretch" : "flex-row items-center"}`}>
            {resolvedButtons.map((btn, index) => {
              const btnStyle = BUTTON_CONFIGS[btn.style] || BUTTON_CONFIGS.default;
              
              return (
                <Pressable
                  key={index}
                  onPress={isLoading ? null : btn.onPress}
                  className={`h-11 rounded-xl items-center justify-center transition-all active:scale-[0.97] active:opacity-95 ${
                    btnStyle.btn
                  } ${isVertical ? "w-full" : "flex-1"}`}
                >
                  <Text 
                    style={{ fontFamily: TOKENS.font.semibold }}
                    className={`text-[14px] tracking-tight ${btnStyle.text}`}
                  >
                    {isLoading && btn.style !== "cancel" ? "Vui lòng đợi..." : btn.text}
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