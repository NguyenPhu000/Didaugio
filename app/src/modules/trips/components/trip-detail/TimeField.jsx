import { memo, useCallback, useMemo, useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import DateTimePicker from "@react-native-community/datetimepicker";
import { parseTimeToDate, formatHHMM } from "../../utils/tripHelpers";
import { STYLES, T, ALPHA } from "../../utils/tripDetailTokens";

/**
 * TimeField — ô chọn giờ (HH:MM) dùng chung cho các form lịch trình.
 * Trên iOS hiển thị picker dạng spinner trong bottom-sheet; Android dùng dialog mặc định.
 */
function TimeField({ label, value, onChange, placeholder = "--:--", icon = "schedule" }) {
  const [show, setShow] = useState(false);
  const dateValue = useMemo(() => parseTimeToDate(value) || new Date(), [value]);

  const handleChange = useCallback(
    (_event, selectedDate) => {
      if (Platform.OS === "android") setShow(false);
      if (selectedDate) onChange(formatHHMM(selectedDate));
    },
    [onChange],
  );

  return (
    <View className="flex-1 gap-1.5">
      <Text className={STYLES.fieldLabel}>{label}</Text>
      <Pressable
        style={({ pressed }) => [pressed && { backgroundColor: "#E8E8EC" }]}
        onPress={() => setShow(true)}
        className="flex-row items-center gap-2 bg-[#F5F5F7] rounded-xl px-3.5 py-3.5 border border-black/[0.06]"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={`Chọn thời gian cho ${label}`}
      >
        <MaterialIconsRounded name={icon} size={15} color={ALPHA.iconStrong} />
        <Text className={`text-[15px] text-[#1D1D1F] font-normal ${!value ? "text-black/30" : ""}`}>
          {value || placeholder}
        </Text>
      </Pressable>

      {Platform.OS === "ios" ? (
        <Modal
          visible={show}
          transparent
          animationType="slide"
          onRequestClose={() => setShow(false)}
        >
          <Pressable className="flex-1 bg-black/35 justify-end" onPress={() => setShow(false)}>
            <View className="bg-white rounded-t-[20px] pb-[34px]" onStartShouldSetResponder={() => true}>
              <View className="flex-row justify-between items-center px-5 py-3.5 border-b border-black/[0.06]">
                <Text className="text-[16px] font-semibold text-[#1D1D1F]">{label}</Text>
                <Pressable onPress={() => setShow(false)} hitSlop={10}>
                  <Text className="text-[16px] color-[#1D1D1F] font-semibold">Xong</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={dateValue}
                mode="time"
                is24Hour
                display="spinner"
                onChange={handleChange}
                locale="vi-VN"
                accentColor={T.ink}
              />
            </View>
          </Pressable>
        </Modal>
      ) : (
        show && (
          <DateTimePicker
            value={dateValue}
            mode="time"
            is24Hour
            display="default"
            onChange={handleChange}
            accentColor={T.ink}
          />
        )
      )}
    </View>
  );
}

export default memo(TimeField);
