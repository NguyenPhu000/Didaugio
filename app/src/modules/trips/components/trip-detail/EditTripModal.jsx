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
              <Pressable
                onPress={onCancel}
                disabled={isSaving}
                style={({ pressed }) => [
                  styles.btnCancel,
                  pressed && { backgroundColor: "#E5E5EA" },
                ]}
              >
                <MaterialIcons name="close" size={18} color="#FF3B30" />
                <Text style={styles.btnCancelText}>Hủy</Text>
              </Pressable>

              <Pressable
                onPress={handleSave}
                disabled={!canSave}
                style={({ pressed }) => [
                  styles.btnSave,
                  !canSave && styles.btnSaveDisabled,
                  pressed && canSave && { opacity: 0.85 },
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons
                      name="check-circle-outline"
                      size={18}
                      color={canSave ? "#FFFFFF" : "#8E8E93"}
                    />
                    <Text
                      style={[
                        styles.btnSaveText,
                        !canSave && styles.btnSaveTextDisabled,
                      ]}
                    >
                      Lưu
                    </Text>
                  </>
                )}
              </Pressable>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 12 : 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  btnCancel: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  btnCancelText: {
    fontSize: 15,
    color: "#FF3B30",
    fontFamily: TOKENS.font.semibold,
  },
  btnSave: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  btnSaveDisabled: {
    backgroundColor: "#E5E5EA",
    shadowOpacity: 0,
    elevation: 0,
  },
  btnSaveText: {
    fontSize: 15,
    color: "#FFFFFF",
    fontFamily: TOKENS.font.semibold,
  },
  btnSaveTextDisabled: {
    color: "#8E8E93",
  },
});

export default memo(EditTripModal);
