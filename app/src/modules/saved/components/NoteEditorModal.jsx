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
import { MaterialIcons } from "@expo/vector-icons";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";

export function NoteEditorModal({
  visible,
  placeName,
  value,
  collectionName,
  saving,
  onChangeText,
  onChangeCollectionName,
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
        style={styles.backdrop}
      >
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="edit-note" size={22} color="#007AFF" />
          </View>
          <Text style={styles.title}>Ghi chú cá nhân</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {placeName || "Địa điểm đã lưu"}
          </Text>

          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder="VD: Đi buổi chiều, thử món đặc trưng, phù hợp đi nhóm..."
            placeholderTextColor="rgba(29, 29, 31, 0.42)"
            multiline
            maxLength={500}
            style={styles.noteInput}
            textAlignVertical="top"
          />

          <TextInput
            value={collectionName}
            onChangeText={onChangeCollectionName}
            placeholder="Tên bộ sưu tập riêng (VD: Đi với gia đình)"
            placeholderTextColor="rgba(29, 29, 31, 0.42)"
            maxLength={80}
            style={styles.collectionInput}
          />

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              disabled={saving}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.cancelBtn,
                pressed && styles.btnPressed,
              ]}
            >
              <Text style={styles.cancelText}>Hủy</Text>
            </Pressable>
            <Pressable
              onPress={onSubmit}
              disabled={saving}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.submitBtn,
                saving && styles.submitDisabled,
                pressed && !saving && styles.btnPressed,
              ]}
            >
              <Text style={styles.submitText}>
                {saving ? "Đang lưu..." : "Lưu ghi chú"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  card: {
    borderRadius: 28,
    padding: 24,
    gap: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 18,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,122,255,0.12)",
  },
  title: {
    color: APPLE_THEME.text,
    fontSize: 22,
    fontFamily: TOKENS.font.heading,
    letterSpacing: -0.4,
  },
  subtitle: {
    color: APPLE_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: TOKENS.font.body,
    letterSpacing: -0.1,
  },
  noteInput: {
    minHeight: 120,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: APPLE_THEME.text,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: TOKENS.font.body,
    backgroundColor: "#F5F5F7",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  collectionInput: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: APPLE_THEME.text,
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    backgroundColor: "#F5F5F7",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: TOKENS.radius.full,
    paddingVertical: 13,
  },
  cancelBtn: {
    backgroundColor: "#F2F2F7",
  },
  submitBtn: {
    backgroundColor: "#1D1D1F",
  },
  submitDisabled: {
    opacity: 0.6,
  },
  btnPressed: {
    transform: [{ scale: 0.97 }],
  },
  cancelText: {
    color: APPLE_THEME.text,
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.2,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.2,
  },
});
