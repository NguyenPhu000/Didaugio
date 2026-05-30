import { memo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { MAP_TEXT } from "../../constants/mapText.constants";

const ArrivalConfirmModal = memo(function ArrivalConfirmModal({
  visible,
  targetName,
  onDismiss,
  onConfirm,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />

        <View style={styles.card}>
          <Text style={styles.titleText}>
            {MAP_TEXT.arrivalModal.title}
          </Text>
          <Text style={styles.bodyText}>
            {MAP_TEXT.arrivalModal.body(targetName)}
          </Text>

          <View style={styles.buttonRow}>
            <Pressable
              onPress={onDismiss}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>
                {MAP_TEXT.arrivalModal.cancel}
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={styles.confirmBtn}
            >
              <Text style={styles.confirmBtnText}>
                {MAP_TEXT.arrivalModal.confirm}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(2, 6, 23, 0.35)",
  },
  card: {
    width: "100%",
    borderRadius: 16,
    maxWidth: 350,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  titleText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
  },
  bodyText: {
    fontSize: 12,
    marginTop: 6,
    color: "#334155",
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  confirmBtn: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A84FF",
  },
  confirmBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default ArrivalConfirmModal;
