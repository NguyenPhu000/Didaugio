import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";

export function NoteEditorModal({
  visible,
  placeName,
  value,
  saving,
  onChangeText,
  onClose,
  onSubmit,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center px-5 bg-black/50"
      >
        <View className="rounded-[28px] p-6 gap-3 bg-white shadow-lg elevation-8">
          <Text className="text-[#1D1D1F] text-[22px] font-bold tracking-[-0.4px]">Ghi chú cá nhân</Text>
          <Text className="text-[#54647A] text-[14px] leading-5 tracking-[-0.1px]" numberOfLines={2}>
            {placeName || "Địa điểm đã lưu"}
          </Text>

          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder="VD: Đi buổi chiều, thử món đặc trưng, phù hợp đi nhóm..."
            placeholderTextColor="rgba(29, 29, 31, 0.42)"
            multiline
            maxLength={500}
            className="min-h-[120px] rounded-[18px] px-3.5 py-3 text-[#1D1D1F] text-sm leading-5 bg-[#F5F5F7] border border-black/[0.06]"
            textAlignVertical="top"
          />

          <View className="flex-row gap-2.5 mt-1">
            <Pressable
              onPress={onClose}
              disabled={saving}
              className="flex-1 items-center justify-center rounded-full py-3 bg-[#F2F2F7] active:scale-[0.97]"
            >
              <Text className="text-[#1D1D1F] text-[15px] font-semibold tracking-[-0.2px]">Hủy</Text>
            </Pressable>
            <Pressable
              onPress={onSubmit}
              disabled={saving}
              className={`flex-1 items-center justify-center rounded-full py-3 bg-[#1D1D1F] active:scale-[0.97] ${
                saving ? "opacity-60" : ""
              }`}
            >
              <Text className="text-white text-[15px] font-semibold tracking-[-0.2px]">
                {saving ? "Đang lưu..." : "Lưu ghi chú"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
