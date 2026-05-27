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
import { TOKENS } from "../../../../constants/design-tokens";
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
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} />
        <KeyboardAvoidingView
          style={styles.sheetWrap}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <MaterialIcons name="edit-calendar" size={18} color="#1D1D1F" />
                <Text style={styles.title}>Chỉnh sửa chuyến đi</Text>
              </View>
              <Pressable
                onPress={onCancel}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.closeBtn,
                  pressed && { backgroundColor: "rgba(0,0,0,0.06)" },
                ]}
              >
                <MaterialIcons name="close" size={20} color="rgba(0,0,0,0.45)" />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
              nestedScrollEnabled
            >
              <View style={styles.field}>
                <Text style={styles.label}>Tên chuyến đi</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Nhập tên chuyến đi"
                  placeholderTextColor="rgba(0,0,0,0.3)"
                  style={styles.input}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Mô tả</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Thêm mô tả ngắn..."
                  placeholderTextColor="rgba(0,0,0,0.3)"
                  style={[styles.input, styles.textArea]}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.dateCard}>
                <CustomDatePicker
                  label="Ngày bắt đầu"
                  value={startDate}
                  onChange={handleStartDateChange}
                  placeholder="Chọn ngày"
                />
                <View style={styles.divider} />
                <CustomDatePicker
                  label="Ngày kết thúc"
                  value={endDate}
                  onChange={setEndDate}
                  minimumDate={startDate ?? undefined}
                  placeholder="Chọn ngày"
                />
              </View>
            </ScrollView>

            <View style={styles.footerRow}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={!canSave}
                activeOpacity={0.8}
                style={[styles.btnSave, !canSave && styles.btnSaveDisabled]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnSaveText}>Lưu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheetWrap: {
    width: "100%",
    maxHeight: "85%",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
    flexShrink: 1,
  },
  scrollArea: {
    flexGrow: 0,
    flexShrink: 1,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.12)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
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
  },
  title: {
    fontSize: 16,
    fontFamily: TOKENS.font.semibold,
    color: "#1D1D1F",
    letterSpacing: -0.3,
  },
  content: {
    padding: 20,
    gap: 14,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    color: "rgba(0,0,0,0.4)",
    fontFamily: TOKENS.font.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
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
  textArea: {
    minHeight: 84,
  },
  dateCard: {
    borderRadius: 16,
    backgroundColor: "#F5F5F7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  footerRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.07)",
    backgroundColor: "#FFFFFF",
    flexShrink: 0,
  },
  btnSave: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1D1D1F",
    alignItems: "center",
    justifyContent: "center",
  },
  btnSaveDisabled: {
    opacity: 0.5,
    backgroundColor: "#1D1D1F",
  },
  btnSaveText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  btnSaveTextDisabled: {
    color: "rgba(255,255,255,0.5)",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default memo(EditTripModal);
