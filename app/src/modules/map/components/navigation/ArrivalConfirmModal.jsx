import { memo } from "react";
import { Modal, Pressable, Text, View } from "react-native";
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
        style={{ backgroundColor: "rgba(2,6,23,0.36)" }}
      >
        <Pressable
          style={{ position: "absolute", inset: 0 }}
          onPress={onDismiss}
        />

        <View
          className="w-full rounded-2xl"
          style={{
            maxWidth: 350,
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#E2E8F0",
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <Text
            className="text-[15px] font-semibold"
            style={{ color: "#111111" }}
          >
            {MAP_TEXT.arrivalModal.title}
          </Text>
          <Text className="text-[12px] mt-1.5" style={{ color: "#334155" }}>
            {MAP_TEXT.arrivalModal.body(targetName)}
          </Text>

          <View className="flex-row items-center gap-2 mt-3">
            <Pressable
              onPress={onDismiss}
              className="flex-1 h-[38px] rounded-full items-center justify-center"
              style={{
                backgroundColor: "rgba(255,255,255,0.72)",
                borderWidth: 1,
                borderColor: "#E2E8F0",
              }}
            >
              <Text
                className="text-[12px] font-semibold"
                style={{ color: "#475569" }}
              >
                {MAP_TEXT.arrivalModal.cancel}
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              className="flex-1 h-[38px] rounded-full items-center justify-center"
              style={{ backgroundColor: "#0A84FF" }}
            >
              <Text
                className="text-[12px] font-semibold"
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
