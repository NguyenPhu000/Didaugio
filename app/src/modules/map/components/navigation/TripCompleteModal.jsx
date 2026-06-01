import { memo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";
import { TOKENS } from "../../../../constants/design-tokens";

/**
 * Modal chúc mừng hoàn thành chặng cuối trong ngày hoặc kết thúc toàn bộ chuyến đi.
 * Thiết kế mờ kính với tone màu xanh lá / lục tươi (green) mang lại cảm giác tích cực và hoàn thành.
 */
const TripCompleteModal = memo(function TripCompleteModal({
  visible,
  isTripEnd = false,
  dayNumber = 1,
  onDismiss,
  onPrimaryAction,
  primaryActionText,
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
              <MaterialIcons
                name={isTripEnd ? "workspace-premium" : "celebration"}
                size={32}
                color="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.titleText}>
              {isTripEnd
                ? "Chúc mừng hoàn thành hành trình!"
                : `Hoàn thành Ngày ${dayNumber}!`}
            </Text>
            <Text style={styles.bodyText}>
              {isTripEnd
                ? "Bạn đã xuất sắc hoàn thành toàn bộ các điểm đến trong chuyến đi này. Chúc bạn có nhiều kỷ niệm đẹp tại Cần Thơ!"
                : `Tất cả các điểm đến của Ngày ${dayNumber} đã được khám phá. Bạn có muốn tạm dừng chỉ đường để nghỉ ngơi không?`}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              onPress={onDismiss}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={styles.secondaryBtnText}>Đóng</Text>
            </Pressable>

            {onPrimaryAction ? (
              <Pressable
                onPress={onPrimaryAction}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  {primaryActionText || (isTripEnd ? "Hoàn tất" : "Tạm nghỉ")}
                </Text>
              </Pressable>
            ) : null}
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
    backgroundColor: "rgba(20, 28, 24, 0.95)",
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
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#34C759",
    shadowColor: "#34C759",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 26,
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
  secondaryBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  secondaryBtnText: {
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    color: "rgba(255, 255, 255, 0.8)",
  },
  primaryBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#34C759",
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    color: "#FFFFFF",
  },
});

export default TripCompleteModal;
