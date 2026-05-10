import { memo, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { TOKENS } from "../../../../constants/design-tokens";

function parseTimeToHHMM(str) {
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
  const dateValue = parseTimeToHHMM(value) || new Date();

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
          s.input,
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
          <Pressable style={s.modalOverlay} onPress={() => setShow(false)}>
            <View style={s.modalContent}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>{label}</Text>
                <Pressable onPress={() => setShow(false)}>
                  <Text style={s.modalDone}>Xong</Text>
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

function EditDestinationForm({ dest, onSave, onCancel, isLoading }) {
  const [startTime, setStartTime] = useState(dest.startTime || "");
  const [endTime, setEndTime] = useState(dest.endTime || "");
  const [durationMinutes, setDurationMinutes] = useState(
    dest.durationMinutes ? String(dest.durationMinutes) : "",
  );
  const [note, setNote] = useState(dest.note || "");

  const handleSave = useCallback(() => {
    onSave({
      destId: dest.id,
      data: {
        startTime: startTime || null,
        endTime: endTime || null,
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
        note: note || null,
      },
    });
  }, [dest.id, startTime, endTime, durationMinutes, note, onSave]);

  return (
    <View style={s.container}>
      <View style={s.row}>
        <TimeField
          label="Bat dau"
          value={startTime}
          onChange={setStartTime}
          placeholder="--:--"
          icon="play-circle-outline"
        />
        <TimeField
          label="Ket thuc"
          value={endTime}
          onChange={setEndTime}
          placeholder="--:--"
          icon="stop-circle"
        />
        <View style={s.field}>
          <Text style={s.label}>Phut</Text>
          <TextInput
            style={s.inputEditable}
            value={durationMinutes}
            onChangeText={setDurationMinutes}
            placeholder="0"
            placeholderTextColor="rgba(0,0,0,0.25)"
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>
      </View>

      <Text style={s.label}>Ghi chu</Text>
      <TextInput
        style={[s.inputEditable, s.noteInput]}
        value={note}
        onChangeText={setNote}
        placeholder="Them ghi chu..."
        placeholderTextColor="rgba(0,0,0,0.25)"
        multiline
        numberOfLines={2}
        textAlignVertical="top"
      />

      <View style={s.actions}>
        <Pressable
          style={({ pressed }) => [
            s.cancelBtn,
            pressed && { backgroundColor: "#E8E8EC" },
          ]}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={s.cancelText}>Huy</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            s.saveBtn,
            isLoading && s.saveBtnDisabled,
            pressed && !isLoading && { backgroundColor: "#000000" },
          ]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={s.saveText}>Luu</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  field: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: "rgba(0,0,0,0.4)",
    fontFamily: TOKENS.font.semibold,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1D1D1F",
    fontFamily: TOKENS.font.body,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  noteInput: {
    minHeight: 60,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 4,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  cancelText: {
    fontSize: 14,
    color: "#1D1D1F",
    fontFamily: TOKENS.font.semibold,
  },
  saveBtn: {
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#1D1D1F",
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: TOKENS.font.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: TOKENS.font.semibold,
    color: "#1D1D1F",
  },
  modalDone: {
    fontSize: 16,
    color: "#1D1D1F",
    fontFamily: TOKENS.font.semibold,
  },
});

export default memo(EditDestinationForm);
