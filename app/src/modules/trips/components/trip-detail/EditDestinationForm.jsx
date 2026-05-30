import { memo, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import {
  formatDistance,
  calcDurationMinutes,
  formatDuration,
  TRANSPORT_OPTIONS,
  isTransportSelected,
} from "../../utils/tripHelpers";
import { STYLES, T, ALPHA } from "../../utils/tripDetailTokens";
import TimeField from "./TimeField";

function EditDestinationForm({ dest, onSave, onCancel, isLoading, visible, isLast }) {
  const insets = useSafeAreaInsets();
  const [startTime, setStartTime] = useState(dest?.startTime || "");
  const [endTime, setEndTime] = useState(dest?.endTime || "");
  const [note, setNote] = useState(dest?.note || "");
  const [transportToNext, setTransportToNext] = useState(dest?.transportToNext || null);

  useEffect(() => {
    if (visible) {
      setStartTime(dest?.startTime || "");
      setEndTime(dest?.endTime || "");
      setNote(dest?.note || "");
      setTransportToNext(dest?.transportToNext || null);
    }
  }, [visible, dest?.id]);

  const calculatedDuration = calcDurationMinutes(startTime, endTime);
  const durationLabel = formatDuration(calculatedDuration);

  const handleSave = useCallback(() => {
    if (isLoading || !dest?.id) return;

    onSave({
      destId: dest.id,
      data: {
        startTime: startTime || null,
        endTime: endTime || null,
        durationMinutes: calculatedDuration,
        note: note || null,
        transportToNext: isLast ? null : transportToNext,
      },
    });
  }, [dest?.id, startTime, endTime, calculatedDuration, note, transportToNext, onSave, isLoading, isLast]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable style={StyleSheet.absoluteFillObject} className="bg-black/45" onPress={onCancel} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end w-full"
          pointerEvents="box-none"
        >
          <View
            className="bg-white rounded-t-[24px] max-h-[90%] w-full flex-col flex-shrink"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <View className="w-9 h-1 rounded-full bg-black/12 self-center mt-2.5 mb-1" />

            {/* Header: tiêu đề + đóng */}
            <View className="flex-row items-center justify-between px-5 py-3 border-b border-black/[0.07]">
              <View className="flex-row items-center gap-2 flex-1 mr-2">
                <MaterialIcons name="edit-location" size={18} color="#1D1D1F" />
                <Text className="text-[16px] font-semibold text-[#1D1D1F] tracking-tight">Chỉnh sửa địa điểm</Text>
              </View>
              <Pressable
                onPress={onCancel}
                hitSlop={12}
                style={({ pressed }) => [
                  pressed && { backgroundColor: "rgba(0,0,0,0.06)" },
                ]}
                className="w-8 h-8 rounded-full items-center justify-center"
              >
                <MaterialIcons name="close" size={18} color="rgba(0,0,0,0.45)" />
              </Pressable>
            </View>

            {dest?.place?.name ? (
              <Text className="text-[13px] text-black/[0.45] font-normal px-5 pt-2 tracking-tight" numberOfLines={1}>
                {dest.place.name}
              </Text>
            ) : null}

            <ScrollView
              className="max-h-[280px] flex-shrink"
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12, gap: 14 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* THỜI GIAN CHI TIẾT */}
              <Text className={STYLES.sectionLabel}>Thời gian chi tiết</Text>
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

              {durationLabel ? (
                <View className="flex-row items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#F5F5F7]">
                  <MaterialIcons name="schedule" size={16} color="#1D1D1F" />
                  <Text className="text-[13px] font-medium text-[#1D1D1F] tracking-tight">
                    Lưu trú {durationLabel}
                  </Text>
                </View>
              ) : null}

              {!isLast ? (
                <View className="pt-4 mt-1 border-t border-black/[0.08]">
                  <Text className={STYLES.sectionLabel}>Di chuyển đến điểm tiếp theo</Text>

                  <View className="gap-1.5">
                    <Text className={STYLES.fieldLabel}>Phương tiện</Text>
                    <View className="flex-row gap-2 flex-wrap mt-1">
                      {TRANSPORT_OPTIONS.map((opt) => {
                        const isSelected = isTransportSelected(transportToNext, opt.value);
                        return (
                          <Pressable
                            key={opt.label || "other"}
                            onPress={() => setTransportToNext(opt.value)}
                            className={`${STYLES.chip} ${isSelected ? STYLES.chipActive : ""}`}
                          >
                            <MaterialIcons
                              name={opt.icon}
                              size={16}
                              color={isSelected ? T.onPrimary : "rgba(0,0,0,0.6)"}
                            />
                            <Text className={`text-[13px] font-semibold ${
                              isSelected ? "text-white" : "text-black/60"
                            }`}>
                              {opt.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {dest?.distanceToNext ? (
                    <View className="gap-1.5 mt-2.5">
                      <Text className={STYLES.fieldLabel}>Khoảng cách đến điểm tiếp theo</Text>
                      <View className="flex-row items-center gap-1.5 bg-[#F5F5F7] rounded-xl px-3 py-3 border border-black/[0.06]">
                        <MaterialIcons name="navigation" size={14} color={ALPHA.iconStrong} style={{ transform: [{ rotate: "45deg" }] }} />
                        <Text className="text-[14px] text-black/50 font-normal">
                          {formatDistance(dest.distanceToNext)} (Hệ thống tự động tính toán)
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* GHI CHÚ HÀNH TRÌNH */}
              <View className="pt-4 mt-1 border-t border-black/[0.08]">
                <Text className={STYLES.sectionLabel}>Ghi chú hành trình</Text>
                <View className="gap-1.5">
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
              </View>
            </ScrollView>

            {/* Nút Lưu pill — luôn cố định dưới cùng */}
            <View className={STYLES.sheetFooter}>
              <Pressable
                onPress={handleSave}
                disabled={isLoading}
                style={({ pressed }) => [pressed && !isLoading && { opacity: 0.8 }]}
                className={`${STYLES.submitBtn} ${isLoading ? "opacity-50" : ""}`}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={T.onPrimary} />
                ) : (
                  <Text className={STYLES.submitBtnText}>Lưu</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default memo(EditDestinationForm);
