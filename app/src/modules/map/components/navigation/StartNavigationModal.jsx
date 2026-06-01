import { memo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";
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
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />

        <BlurView
          tint="dark"
          intensity={40}
          style={styles.sheet}
        >
          {/* Header indicator */}
          <View style={styles.indicator} />

          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="navigation" size={28} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.titleText}>{title}</Text>
            <Text style={styles.bodyText}>{body}</Text>
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              onPress={onDismiss}
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={styles.cancelBtnText}>Để sau</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.confirmBtn,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={styles.confirmBtnText}>Bắt đầu ngay</Text>
            </Pressable>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(2, 6, 23, 0.4)",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(20, 24, 33, 0.92)",
    alignItems: "center",
  },
  indicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    marginBottom: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007BFF",
    shadowColor: "#007BFF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  titleText: {
    fontSize: 20,
    fontFamily: TOKENS.font.semibold,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.4,
  },
  bodyText: {
    fontSize: 14,
    fontFamily: TOKENS.font.medium,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    color: "rgba(255, 255, 255, 0.8)",
  },
  confirmBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007BFF",
  },
  confirmBtnText: {
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    color: "#FFFFFF",
  },
});

export default StartNavigationModal;
