import { memo, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { CustomDatePicker } from "../../../../components/ui/CustomDatePicker";
import { toYmdString, toValidDate } from "../../utils/tripHelpers";

function calcTotalDays(start, end) {
  if (!start || !end) return 1;
  const ms = end.getTime() - start.getTime();
  const days = Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
  return days > 0 ? days : 1;
}

function EditTripModal({ visible, trip, isSaving, onCancel, onSave }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    if (!visible) return;
    setTitle(trip?.title || "");
    setDescription(trip?.description || "");
    setStartDate(toValidDate(trip?.startDate));
    setEndDate(toValidDate(trip?.endDate));
  }, [
    visible,
    trip?.id,
    trip?.title,
    trip?.description,
    trip?.startDate,
    trip?.endDate,
  ]);

  const handleStartDateChange = useCallback(
    (date) => {
      setStartDate(date);
      if (date && endDate && endDate < date) {
        setEndDate(null);
      }
    },
    [endDate],
  );

  const handleSave = useCallback(() => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isSaving) return;

    onSave({
      title: trimmedTitle,
      description: description.trim() || null,
      startDate: startDate ? toYmdString(startDate) : null,
      endDate: endDate ? toYmdString(endDate) : null,
      totalDays: calcTotalDays(startDate, endDate),
    });
  }, [description, endDate, isSaving, onSave, startDate, title]);

  const canSave = title.trim().length > 0 && !isSaving;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable style={StyleSheet.absoluteFillObject} className="bg-black/40" onPress={onCancel} />
        <KeyboardAvoidingView
          className="w-full max-h-[85%]"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            className="bg-white rounded-t-[24px] flex-shrink"
            style={{ paddingBottom: Platform.OS === "ios" ? 24 : 16 }}
          >
            <View className="w-9 h-1 rounded-full bg-black/12 self-center mt-2.5 mb-1.5" />
            <View className="flex-row items-center justify-between px-5 py-3 border-b border-black/[0.07]">
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="edit-calendar" size={18} color="#1D1D1F" />
                <Text className="text-[16px] font-semibold text-[#1D1D1F] tracking-tight">Chỉnh sửa chuyến đi</Text>
              </View>
              <Pressable
                onPress={onCancel}
                hitSlop={12}
                style={({ pressed }) => [
                  pressed && { backgroundColor: "rgba(0,0,0,0.06)" },
                ]}
                className="w-8 h-8 rounded-full items-center justify-center"
              >
                <MaterialIcons name="close" size={20} color="rgba(0,0,0,0.45)" />
              </Pressable>
            </View>

            <ScrollView
              className="flex-shrink"
              contentContainerStyle={{ padding: 20, gap: 14 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
              nestedScrollEnabled
            >
              <View className="gap-1.5">
                <Text className="text-[11px] text-black/40 font-semibold uppercase tracking-widest">Tên chuyến đi</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Nhập tên chuyến đi"
                  placeholderTextColor="rgba(0,0,0,0.3)"
                  className="bg-[#F5F5F7] rounded-xl px-3 py-3 text-[15px] color-[#1D1D1F] font-normal border border-black/[0.06]"
                  returnKeyType="next"
                />
              </View>

              <View className="gap-1.5">
                <Text className="text-[11px] text-black/40 font-semibold uppercase tracking-widest">Mô tả</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Thêm mô tả ngắn..."
                  placeholderTextColor="rgba(0,0,0,0.3)"
                  className="bg-[#F5F5F7] rounded-xl px-3 py-3 text-[15px] color-[#1D1D1F] font-normal border border-black/[0.06] min-h-[84px]"
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View className="rounded-2xl bg-[#F5F5F7] px-3 py-1 border border-black/[0.06]">
                <CustomDatePicker
                  label="Ngày bắt đầu"
                  value={startDate}
                  onChange={handleStartDateChange}
                  placeholder="Chọn ngày"
                />
                <View className="h-[0.5px] bg-black/[0.08]" />
                <CustomDatePicker
                  label="Ngày kết thúc"
                  value={endDate}
                  onChange={setEndDate}
                  minimumDate={startDate ?? undefined}
                  placeholder="Chọn ngày"
                />
              </View>
            </ScrollView>

            <View className="px-5 pt-4 pb-2 border-t border-black/[0.07] bg-white flex-shrink-0">
              <TouchableOpacity
                onPress={handleSave}
                disabled={!canSave}
                activeOpacity={0.8}
                className={`w-full h-[52px] rounded-full bg-[#1D1D1F] items-center justify-center ${
                  !canSave ? "opacity-50" : ""
                }`}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-[16px] font-semibold tracking-tight text-center">Lưu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default memo(EditTripModal);
