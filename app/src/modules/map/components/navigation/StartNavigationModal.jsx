import { memo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../../constants/design-tokens";

/**
 * Modal kính mờ xác nhận bắt đầu hành trình (Start Trip Confirmation).
 * Sử dụng BlurView từ đáy màn hình kéo lên (Bottom Sheet style) sang trọng.
 */
const StartNavigationModal = memo(function StartNavigationModal({
  visible,
  onDismiss,
  onConfirm,
  title = "Bắt đầu hành trình",
  body = "Bạn có muốn bắt đầu dẫn đường và theo dõi vị trí cho chuyến đi ngay bây giờ?",
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(2, 6, 23, 0.4)" }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />

        <BlurView
          tint="dark"
          intensity={40}
          className="items-center border"
          style={{
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 24,
            paddingTop: 10,
            paddingBottom: 36,
            borderColor: "rgba(255, 255, 255, 0.12)",
            backgroundColor: "rgba(20, 24, 33, 0.92)",
          }}
        >
          {/* Header indicator */}
          <View
            className="mb-5"
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: "rgba(255, 255, 255, 0.25)",
            }}
          />

          <View className="mb-4">
            <View
              className="h-[60px] w-[60px] items-center justify-center rounded-full"
              style={{
                backgroundColor: "#007BFF",
                shadowColor: "#007BFF",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <MaterialIconsRounded name="navigation" size={28} color="#FFFFFF" />
            </View>
          </View>

          <View className="items-center mb-6 px-4">
            <Text
              className="text-2xl text-center"
              style={{
                color: "#FFFFFF",
                fontFamily: TOKENS.font.semibold,
                letterSpacing: -0.4,
              }}
            >
              {title}
            </Text>
            <Text
              className="text-base text-center mt-2 leading-5"
              style={{
                color: "rgba(255, 255, 255, 0.7)",
                fontFamily: TOKENS.font.medium,
              }}
            >
              {body}
            </Text>
          </View>

          <View className="flex-row gap-3 w-full">
            <Pressable
              onPress={onDismiss}
              style={({ pressed }) => [
                {
                  flex: 1,
                  height: 50,
                  borderRadius: 25,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.12)",
                },
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text
                className="text-md font-semibold"
                style={{ color: "rgba(255, 255, 255, 0.8)", fontFamily: TOKENS.font.semibold }}
              >
                Để sau
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                {
                  flex: 1,
                  height: 50,
                  borderRadius: 25,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#007BFF",
                },
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text
                className="text-md font-semibold"
                style={{ color: "#FFFFFF", fontFamily: TOKENS.font.semibold }}
              >
                Bắt đầu ngay
              </Text>
            </Pressable>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
});

export default StartNavigationModal;
