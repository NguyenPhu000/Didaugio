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
import DateTimePicker from "@react-native-community/datetimepicker";
import { TOKENS } from "../../../../constants/design-tokens";

function parseTimeToDate(str) {
  if (!str) return null;
  const [h, m] = str.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function formatHHMM(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function TimeField({ label, value, onChange, placeholder, icon }) {
  const [show, setShow] = useState(false);
  const dateValue = parseTimeToDate(value) || new Date();

  const handleChange = useCallback(
    (_event, selectedDate) => {
      if (Platform.OS === "android") {
        setShow(false);
      }
      if (selectedDate) {
        onChange(formatHHMM(selectedDate));
      }
    },
    [onChange],
  );

  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <Pressable
        style={({ pressed }) => [
          s.timeInput,
          pressed && { backgroundColor: "#F0F0F2" },
        ]}
        onPress={() => setShow(true)}
      >
        <MaterialIcons
          name={icon || "schedule"}
          size={14}
          color="rgba(0,0,0,0.3)"
        />
        <Text style={[s.inputText, !value && s.placeholder]}>
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
          <Pressable style={s.pickerOverlay} onPress={() => setShow(false)}>
            <View style={s.pickerSheet} onStartShouldSetResponder={() => true}>
              <View style={s.pickerHeader}>
                <Text style={s.pickerTitle}>{label}</Text>
                <Pressable onPress={() => setShow(false)}>
                  <Text style={s.pickerDone}>Xong</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={dateValue}
                mode="time"
                is24Hour
                display="spinner"
                onChange={handleChange}
                locale="vi-VN"
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
          />
        )
      )}
    </View>
  );
}

function EditDestinationForm({ dest, onSave, onCancel, isLoading, visible }) {
  const insets = useSafeAreaInsets();
  const [startTime, setStartTime] = useState(dest?.startTime || "");
  const [endTime, setEndTime] = useState(dest?.endTime || "");
  const [durationMinutes, setDurationMinutes] = useState(
    dest?.durationMinutes ? String(dest.durationMinutes) : "",
  );
  const [note, setNote] = useState(dest?.note || "");

  useEffect(() => {
    if (visible) {
      setStartTime(dest?.startTime || "");
      setEndTime(dest?.endTime || "");
      setDurationMinutes(
        dest?.durationMinutes ? String(dest.durationMinutes) : "",
      );
      setNote(dest?.note || "");
    }
  }, [visible, dest?.id]);

  const handleSave = useCallback(() => {
    if (isLoading || !dest?.id) return;
    onSave({
      destId: dest.id,
      data: {
        startTime: startTime || null,
        endTime: endTime || null,
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
        note: note || null,
      },
    });
  }, [dest?.id, startTime, endTime, durationMinutes, note, onSave, isLoading]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={s.root}>
        <Pressable style={s.backdrop} onPress={onCancel} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={s.keyboardView}
          pointerEvents="box-none"
        >
          <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={s.handle} />

          {/* Header: tiêu đề + đóng */}
          <View style={s.sheetHeader}>
            <View style={s.sheetTitleRow}>
              <MaterialIcons name="edit-location" size={18} color="#1D1D1F" />
              <Text style={s.sheetTitle}>Chỉnh sửa địa điểm</Text>
            </View>
            <Pressable
              onPress={onCancel}
              hitSlop={12}
              style={({ pressed }) => [
                s.closeBtn,
                pressed && { backgroundColor: "rgba(0,0,0,0.06)" },
              ]}
            >
              <MaterialIcons name="close" size={18} color="rgba(0,0,0,0.45)" />
            </Pressable>
          </View>

          {dest?.place?.name ? (
            <Text style={s.placeName} numberOfLines={1}>
              {dest.place.name}
            </Text>
          ) : null}

          <ScrollView
            style={s.scrollArea}
            contentContainerStyle={s.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={s.row}>
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

            <View style={s.fieldFull}>
              <Text style={s.label}>Thời gian lưu trú (phút)</Text>
              <TextInput
                style={s.inputEditable}
                value={durationMinutes}
                onChangeText={setDurationMinutes}
                placeholder="Ví dụ: 60"
                placeholderTextColor="rgba(0,0,0,0.25)"
                keyboardType="number-pad"
                maxLength={4}
                returnKeyType="done"
              />
            </View>

            <View style={s.fieldFull}>
              <Text style={s.label}>Ghi chú</Text>
              <TextInput
                style={[s.inputEditable, s.noteInput]}
                value={note}
                onChangeText={setNote}
                placeholder="Thêm ghi chú cho địa điểm này..."
                placeholderTextColor="rgba(0,0,0,0.25)"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Nút Lưu pill — luôn cố định dưới cùng */}
          <View style={s.footer}>
            <Pressable
              onPress={handleSave}
              disabled={isLoading}
              style={({ pressed }) => [
                s.savePill,
                isLoading && s.saveBtnDisabled,
                pressed && !isLoading && { backgroundColor: "#000000" },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.savePillText}>Lưu thay đổi</Text>
              )}
            </Pressable>
            <Pressable
              onPress={onCancel}
              disabled={isLoading}
              hitSlop={8}
              style={({ pressed }) => [pressed && { opacity: 0.6 }]}
            >
              <Text style={s.footerCancelLink}>Hủy</Text>
            </Pressable>
          </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "flex-end",
    width: "100%",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    width: "100%",
    flexDirection: "column",
    flexShrink: 1,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.12)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.07)",
  },
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: TOKENS.font.semibold,
    color: "#1D1D1F",
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  placeName: {
    fontSize: 13,
    color: "rgba(0,0,0,0.45)",
    fontFamily: TOKENS.font.body,
    paddingHorizontal: 20,
    paddingTop: 8,
    letterSpacing: -0.1,
  },
  scrollArea: {
    maxHeight: 280,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 14,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  field: {
    flex: 1,
    gap: 6,
  },
  fieldFull: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    color: "rgba(0,0,0,0.4)",
    fontFamily: TOKENS.font.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timeInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F5F5F7",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  inputText: {
    fontSize: 15,
    color: "#1D1D1F",
    fontFamily: TOKENS.font.body,
  },
  placeholder: {
    color: "rgba(0,0,0,0.25)",
  },
  inputEditable: {
    backgroundColor: "#F5F5F7",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1D1D1F",
    fontFamily: TOKENS.font.body,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  noteInput: {
    minHeight: 72,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.07)",
    flexShrink: 0,
  },
  footerCancelLink: {
    fontSize: 14,
    color: "rgba(0,0,0,0.45)",
    fontFamily: TOKENS.font.body,
    textAlign: "center",
  },
  savePill: {
    width: "100%",
    height: 52,
    borderRadius: 999,
    backgroundColor: "#1D1D1F",
    alignItems: "center",
    justifyContent: "center",
  },
  savePillText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.2,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  pickerTitle: {
    fontSize: 16,
    fontFamily: TOKENS.font.semibold,
    color: "#1D1D1F",
  },
  pickerDone: {
    fontSize: 16,
    color: "#1D1D1F",
    fontFamily: TOKENS.font.semibold,
  },
});

export default memo(EditDestinationForm);
