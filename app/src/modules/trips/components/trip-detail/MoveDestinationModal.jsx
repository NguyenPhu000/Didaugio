import { memo, useCallback, useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { formatDate, buildDayList } from "../../utils/tripHelpers";
import { STYLES, T, ALPHA } from "../../utils/tripDetailTokens";
import TimeField from "./TimeField";

function MoveDestinationModal({
  visible,
  dest,
  trip,
  onMove,
  onSave,
  onCancel,
  isLoading,
}) {
  const insets = useSafeAreaInsets();
  const [selectedDay, setSelectedDay] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (visible && dest) {
      setSelectedDay(dest.dayNumber);
      setStartTime(dest.startTime || "");
      setEndTime(dest.endTime || "");
      setNote(dest.note || "");
    }
  }, [visible, dest?.id]);

  const days = useMemo(() => (trip ? buildDayList(trip) : []), [trip]);

  const handleSave = useCallback(() => {
    if (!dest?.id || isLoading) return;

    const dayChanged = selectedDay !== dest.dayNumber;
    const timeChanged =
      startTime !== (dest.startTime || "") ||
      endTime !== (dest.endTime || "");
    const noteChanged = note !== (dest.note || "");

    if (dayChanged) {
      onMove({
        destId: dest.id,
        newDayNumber: selectedDay,
        newOrder: 0,
        startTime: startTime || null,
        endTime: endTime || null,
        note: note || null,
      });
    } else if (timeChanged || noteChanged) {
      onSave?.({
        destId: dest.id,
        data: {
          startTime: startTime || null,
          endTime: endTime || null,
          note: note || null,
        },
      });
    } else {
      onCancel();
    }
  }, [dest, selectedDay, startTime, endTime, note, isLoading, onMove, onSave, onCancel]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      {visible && (
        <View className="flex-1 justify-end">
          <Pressable style={StyleSheet.absoluteFillObject} className="bg-black/45" onPress={onCancel} />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1 justify-end w-full"
            pointerEvents="box-none"
          >
            <View
              className="bg-white rounded-t-[24px] max-h-[85%] w-full flex-col flex-shrink"
              style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            >
              <View className="w-9 h-1 rounded-full bg-black/12 self-center mt-2.5 mb-1" />
              <View className="flex-row items-center justify-between px-5 py-3 border-b border-black/[0.07]">
                <View className="flex-row items-center gap-2 flex-1">
                  <MaterialIcons name="edit-location-alt" size={20} color="#1D1D1F" />
                  <Text className="text-[17px] font-semibold text-[#1D1D1F] tracking-tight">Chỉnh sửa lịch trình</Text>
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

              {dest?.place?.name ? (
                <Text className="text-[13px] text-black/[0.45] font-normal px-5 pt-2.5" numberOfLines={1}>
                  {dest.place.name}
                </Text>
              ) : null}

              <ScrollView
                className="max-h-[280px] flex-shrink"
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 20 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
                keyboardShouldPersistTaps="handled"
              >
                <View className="gap-2.5">
                  <Text className={STYLES.fieldLabel}>Chọn ngày hoạt động</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {days.map((day) => {
                      const isSelected = selectedDay === day.dayNumber;
                      return (
                        <Pressable
                          key={day.dayNumber}
                          className={`px-3.5 py-2.5 rounded-xl border-[1.5px] border-transparent items-center min-w-[80px] ${
                            isSelected ? "bg-[#1D1D1F]" : "bg-[#F5F5F7]"
                          }`}
                          onPress={() => setSelectedDay(day.dayNumber)}
                        >
                          <Text
                            className={`text-[13px] font-semibold ${
                              isSelected ? "text-white" : "text-[#1D1D1F]"
                            }`}
                          >
                            Ngày {day.dayNumber}
                          </Text>
                          {day.date ? (
                            <Text
                              className={`text-[11px] font-normal mt-0.5 ${
                                isSelected ? "text-white/60" : "text-black/40"
                              }`}
                            >
                              {formatDate(day.date)}
                            </Text>
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View className="gap-2.5 pt-4 border-t border-black/[0.08]">
                  <Text className={STYLES.fieldLabel}>Thời gian chi tiết</Text>
                  <View className="flex-row gap-3">
                    <TimeField
                      label="Bắt đầu"
                      value={startTime}
                      onChange={setStartTime}
                      placeholder="--:--"
                      icon="play-circle-outline"
                    />
                    <TimeField
                      label="Kết thúc"
                      value={endTime}
                      onChange={setEndTime}
                      placeholder="--:--"
                      icon="stop-circle"
                    />
                  </View>
                </View>

                <View className="gap-2.5 pt-4 border-t border-black/[0.08]">
                  <Text className={STYLES.fieldLabel}>Ghi chú hành trình</Text>
                  <TextInput
                    className={`${STYLES.field} min-h-[72px]`}
                    value={note}
                    onChangeText={setNote}
                    placeholder="Nhập lưu ý hoặc kế hoạch ăn uống, chụp ảnh tại đây..."
                    placeholderTextColor={ALPHA.placeholder}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </ScrollView>

              <View className={`${STYLES.sheetFooter} gap-3`}>
                <Pressable
                  onPress={handleSave}
                  disabled={isLoading}
                  style={({ pressed }) => [pressed && { backgroundColor: T.inkPressed }]}
                  className={`${STYLES.submitBtn} ${isLoading ? "opacity-50" : ""}`}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={T.onPrimary} />
                  ) : (
                    <Text className={STYLES.submitBtnText}>Lưu thay đổi</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </Modal>
  );
}

export default memo(MoveDestinationModal);
