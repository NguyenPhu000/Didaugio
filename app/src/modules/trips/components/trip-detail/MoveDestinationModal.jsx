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
import DateTimePicker from "@react-native-community/datetimepicker";
import { TOKENS } from "../../../../constants/design-tokens";
import { formatDate, calcDayCount } from "../../utils/tripHelpers";

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
      if (Platform.OS === "android") setShow(false);
      if (selectedDate) onChange(formatHHMM(selectedDate));
    },
    [onChange],
  );

  return (
    <View style={s.timeField}>
      <Text style={s.timeLabel}>{label}</Text>
      <Pressable
        style={({ pressed }) => [
          s.timeInput,
          pressed && { backgroundColor: "#E8E8EC" },
        ]}
        onPress={() => setShow(true)}
      >
        <MaterialIcons
          name={icon || "schedule"}
          size={14}
          color="rgba(0,0,0,0.35)"
        />
        <Text style={[s.timeText, !value && s.timePlaceholder]}>
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

  const days = useMemo(() => {
    if (!trip) return [];
    const total = calcDayCount(trip);
    const result = [];
    for (let i = 1; i <= total; i++) {
      const date = trip.startDate
        ? new Date(new Date(trip.startDate).getTime() + (i - 1) * 86400000)
        : null;
      result.push({ dayNumber: i, date });
    }
    return result;
  }, [trip]);

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
            <View style={s.header}>
              <View style={s.titleRow}>
                <MaterialIcons name="edit-location-alt" size={20} color="#1D1D1F" />
                <Text style={s.title}>Chỉnh sửa lịch trình</Text>
              </View>
              <Pressable
                onPress={onCancel}
                hitSlop={12}
                style={({ pressed }) => [
                  s.closeBtn,
                  pressed && { backgroundColor: "rgba(0,0,0,0.06)" },
                ]}
              >
                <MaterialIcons name="close" size={20} color="rgba(0,0,0,0.45)" />
              </Pressable>
            </View>

          {dest?.place?.name ? (
            <Text style={s.subtitle} numberOfLines={1}>
              {dest.place.name}
            </Text>
          ) : null}

          <ScrollView
            style={s.content}
            contentContainerStyle={s.contentInner}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.section}>
              <Text style={s.sectionLabel}>Chọn ngày</Text>
              <View style={s.dayGrid}>
                {days.map((day) => {
                  const isSelected = selectedDay === day.dayNumber;
                  return (
                    <Pressable
                      key={day.dayNumber}
                      style={[s.dayChip, isSelected && s.dayChipSelected]}
                      onPress={() => setSelectedDay(day.dayNumber)}
                    >
                      <Text
                        style={[s.dayChipText, isSelected && s.dayChipTextSelected]}
                      >
                        Ngày {day.dayNumber}
                      </Text>
                      {day.date ? (
                        <Text
                          style={[
                            s.dayChipDate,
                            isSelected && s.dayChipDateSelected,
                          ]}
                        >
                          {formatDate(day.date)}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={s.section}>
              <Text style={s.sectionLabel}>Chỉnh giờ</Text>
              <View style={s.timeRow}>
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

            <View style={s.section}>
              <Text style={s.sectionLabel}>Ghi chú</Text>
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

          <View style={s.footer}>
            <Pressable
              onPress={handleSave}
              disabled={isLoading}
              style={({ pressed }) => [
                s.savePill,
                isLoading && s.savePillDisabled,
                pressed && !isLoading && s.savePillPressed,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
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
              <Text style={s.cancelLink}>Hủy</Text>
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
    maxHeight: "85%",
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.07)",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontFamily: TOKENS.font.semibold,
    color: "#1D1D1F",
    letterSpacing: -0.3,
  },
  headerSaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#1D1D1F",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 64,
  },
  headerSaveBtnDisabled: {
    opacity: 0.5,
  },
  headerSaveText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: TOKENS.font.semibold,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(0,0,0,0.45)",
    fontFamily: TOKENS.font.body,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    maxHeight: 280,
    flexShrink: 1,
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
  contentInner: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    color: "rgba(0,0,0,0.4)",
    fontFamily: TOKENS.font.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F5F5F7",
    borderWidth: 1.5,
    borderColor: "transparent",
    alignItems: "center",
    minWidth: 80,
  },
  dayChipSelected: {
    backgroundColor: "#1D1D1F",
    borderColor: "#1D1D1F",
  },
  dayChipText: {
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    color: "#1D1D1F",
  },
  dayChipTextSelected: {
    color: "#FFFFFF",
  },
  dayChipDate: {
    fontSize: 11,
    fontFamily: TOKENS.font.body,
    color: "rgba(0,0,0,0.4)",
    marginTop: 2,
  },
  dayChipDateSelected: {
    color: "rgba(255,255,255,0.7)",
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeField: {
    flex: 1,
    gap: 6,
  },
  timeLabel: {
    fontSize: 11,
    color: "rgba(0,0,0,0.4)",
    fontFamily: TOKENS.font.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  timeInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F5F5F7",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  timeText: {
    fontSize: 15,
    color: "#1D1D1F",
    fontFamily: TOKENS.font.body,
  },
  timePlaceholder: {
    color: "rgba(0,0,0,0.25)",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.07)",
    backgroundColor: "#FFFFFF",
    flexShrink: 0,
  },
  savePill: {
    alignSelf: "stretch",
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1D1D1F",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  savePillPressed: {
    backgroundColor: "#000000",
  },
  savePillDisabled: {
    opacity: 0.5,
    backgroundColor: "#1D1D1F",
  },
  savePillText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.2,
  },
  cancelLink: {
    fontSize: 14,
    color: "rgba(0,0,0,0.45)",
    fontFamily: TOKENS.font.body,
    textAlign: "center",
    paddingVertical: 4,
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

export default memo(MoveDestinationModal);
