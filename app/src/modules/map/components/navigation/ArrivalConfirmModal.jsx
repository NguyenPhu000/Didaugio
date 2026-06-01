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
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: "rgba(2, 6, 23, 0.35)" }}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />

        <View
          className="w-full rounded-2xl border px-4 py-3.5"
          style={{
            maxWidth: 350,
            backgroundColor: "#FFFFFF",
            borderColor: "#E2E8F0",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          <Text
            className="text-[15px] font-semibold"
            style={{ color: "#111111" }}
          >
            {MAP_TEXT.arrivalModal.title}
          </Text>
          <Text
            className="text-xs mt-1.5 leading-[18px]"
            style={{ color: "#334155" }}
          >
            {MAP_TEXT.arrivalModal.body(targetName)}
          </Text>

          <View className="flex-row items-center gap-2 mt-3">
            <Pressable
              onPress={onDismiss}
              className="flex-1 h-[38px] items-center justify-center rounded-[19px] border"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.7)", borderColor: "#E2E8F0" }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: "#475569" }}
              >
                {MAP_TEXT.arrivalModal.cancel}
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              className="flex-1 h-[38px] items-center justify-center rounded-[19px]"
              style={{ backgroundColor: "#0A84FF" }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: "#FFFFFF" }}
              >
                {MAP_TEXT.arrivalModal.confirm}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
});

export default ArrivalConfirmModal;
