import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../src/stores/authStore";
import { TOKENS } from "../../src/constants/design-tokens";
import { TAB_SCREEN_PADDING, TAB_THEME } from "../(tabs)/tabTheme";

function pickDisplayName(user) {
  return (
    user?.profile?.fullName ||
    user?.fullName ||
    user?.email?.split("@")[0] ||
    "Bạn"
  );
}

function pickAvatar(user) {
  return user?.profile?.avatar || user?.avatar || "";
}

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const initialName = useMemo(() => pickDisplayName(user), [user]);
  const initialAvatar = useMemo(() => pickAvatar(user), [user]);
  const initialBio = user?.profile?.bio || "";
  const initialPhone = user?.phone || user?.profile?.phone || "";

  const [fullName, setFullName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [bio, setBio] = useState(initialBio);
  const [phone, setPhone] = useState(initialPhone);

  const isDirty =
    fullName.trim() !== initialName.trim() ||
    avatarUrl.trim() !== initialAvatar.trim() ||
    bio.trim() !== initialBio.trim() ||
    phone.trim() !== initialPhone.trim();

  const handleSave = () => {
    if (!fullName.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên hiển thị.");
      return;
    }

    const cleanName = fullName.trim();
    const cleanAvatar = avatarUrl.trim();
    const cleanBio = bio.trim();
    const cleanPhone = phone.trim();

    setUser({
      ...(user || {}),
      fullName: cleanName,
      avatar: cleanAvatar || null,
      phone: cleanPhone,
      profile: {
        ...(user?.profile || {}),
        fullName: cleanName,
        avatar: cleanAvatar || null,
        bio: cleanBio,
        phone: cleanPhone,
      },
    });

    Alert.alert(
      "Đã lưu hồ sơ",
      "Thông tin đã được cập nhật cục bộ trên thiết bị. Đồng bộ máy chủ sẽ có trong bản tiếp theo.",
    );
    router.back();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons name="arrow-back" size={20} color={TAB_THEME.text} />
        </Pressable>

        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>

        <Pressable
          onPress={handleSave}
          disabled={!isDirty}
          style={({ pressed }) => [
            styles.saveButton,
            !isDirty && styles.saveButtonDisabled,
            pressed && isDirty && styles.pressed,
          ]}
        >
          <Text style={styles.saveButtonText}>Lưu</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 28 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatar}
                  contentFit="cover"
                  transition={180}
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>
                    {fullName.trim().slice(0, 1).toUpperCase() || "B"}
                  </Text>
                </View>
              )}
              <View style={styles.avatarBadge}>
                <MaterialIcons name="photo-camera" size={14} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.cardTitle}>
              {fullName.trim() || "Tên hiển thị"}
            </Text>
            <Text style={styles.cardSubtitle}>
              Điều chỉnh thông tin cá nhân hiển thị trong ứng dụng
            </Text>
          </View>

          <View style={styles.formCard}>
            <FieldLabel text="Tên hiển thị" />
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nhập tên của bạn"
              placeholderTextColor={TAB_THEME.textSoft}
              style={styles.input}
              maxLength={60}
            />

            <FieldLabel text="Ảnh đại diện (URL)" />
            <TextInput
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              placeholder="https://..."
              placeholderTextColor={TAB_THEME.textSoft}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <FieldLabel text="Số điện thoại" />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="090..."
              placeholderTextColor={TAB_THEME.textSoft}
              style={styles.input}
              keyboardType="phone-pad"
            />

            <FieldLabel text="Giới thiệu ngắn" />
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Bạn yêu thích loại hình du lịch nào?"
              placeholderTextColor={TAB_THEME.textSoft}
              style={[styles.input, styles.textarea]}
              multiline={true}
              textAlignVertical="top"
              numberOfLines={4}
              maxLength={180}
            />
          </View>

          <Text style={styles.footnote}>
            Mẹo: Bạn có thể dán URL ảnh để thay avatar ngay. Dữ liệu hiện được
            lưu cục bộ trên thiết bị.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function FieldLabel({ text }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6FAFF",
  },
  flex: {
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: TAB_SCREEN_PADDING,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: TAB_THEME.text,
    fontSize: 20,
    fontFamily: TOKENS.font.heading,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
  },
  saveButton: {
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: TAB_THEME.primary,
  },
  saveButtonDisabled: {
    backgroundColor: "#BFDBFE",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
  },
  pressed: {
    opacity: 0.9,
  },
  scrollContent: {
    paddingHorizontal: TAB_SCREEN_PADDING,
    paddingTop: 10,
    gap: 14,
  },
  profileCard: {
    alignItems: "center",
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)",
    padding: 18,
    gap: 8,
    ...TOKENS.shadow.md,
  },
  avatarWrap: {
    position: "relative",
    marginBottom: 4,
  },
  avatar: {
    width: 94,
    height: 94,
    borderRadius: 34,
  },
  avatarFallback: {
    width: 94,
    height: 94,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF3FF",
  },
  avatarFallbackText: {
    color: TAB_THEME.primary,
    fontSize: 34,
    fontFamily: TOKENS.font.heading,
  },
  avatarBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TAB_THEME.primary,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  cardTitle: {
    color: TAB_THEME.text,
    fontSize: 24,
    lineHeight: 30,
    fontFamily: TOKENS.font.heading,
    textAlign: "center",
  },
  cardSubtitle: {
    color: TAB_THEME.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    fontFamily: TOKENS.font.body,
  },
  formCard: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)",
    padding: 14,
    gap: 8,
    ...TOKENS.shadow.sm,
  },
  fieldLabel: {
    color: TAB_THEME.text,
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    marginTop: 2,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.24)",
    backgroundColor: "#F8FBFF",
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: TAB_THEME.text,
    fontSize: 14,
    fontFamily: TOKENS.font.body,
  },
  textarea: {
    minHeight: 96,
  },
  footnote: {
    color: TAB_THEME.textSoft,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: TOKENS.font.body,
    paddingHorizontal: 2,
  },
});
