import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../src/stores/authStore";
import { TOKENS } from "../../src/constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../(tabs)/tabTheme";
import {
  useProfile,
  useUpdateAvatar,
  useUpdateProfile,
} from "../../src/modules/profile/hooks/useProfile";
import { resolveMediaUrl } from "../../src/lib/media-url";
import { BottomSheetPicker } from "../../src/components/ui/BottomSheetPicker";
import { ProvinceDistrictSelect } from "../../src/modules/profile/components/ProvinceDistrictSelect";

const MAX_AVATAR_BYTES = 200 * 1024;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const APPLE_COLORS = {
  background: "#FFFFFF",
  surface: "#FFFFFF",
  text: "#111111",
  mutedText: "#6B7280",
  border: "#E5E7EB",
  borderSoft: "#F3F4F6",
  placeholder: "#9CA3AF",
  accent: "#111111",
  disabled: "#D1D5DB",
};

const GENDER_OPTIONS = [
  { value: "", label: "Không chọn" },
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" },
];

const normalizeText = (value) => String(value || "").trim();

const toOptional = (value) => {
  const normalized = normalizeText(value);
  return normalized || undefined;
};

const toNullable = (value) => {
  const normalized = normalizeText(value);
  return normalized || null;
};

const estimateBase64Bytes = (base64 = "") => Math.ceil((base64.length * 3) / 4);

const buildProfileSource = (profileSummary, storedUser) => {
  const profile = profileSummary?.profile || {};

  return {
    username:
      profileSummary?.username || storedUser?.username || storedUser?.profile?.username || "",
    fullName:
      profileSummary?.fullName ||
      profile?.fullName ||
      storedUser?.profile?.fullName ||
      storedUser?.fullName ||
      "",
    nickname:
      profileSummary?.nickname || profile?.nickname || storedUser?.profile?.nickname || "",
    phone: profileSummary?.phone || profile?.phone || storedUser?.profile?.phone || "",
    gender: profileSummary?.gender || profile?.gender || storedUser?.profile?.gender || "",
    address:
      profileSummary?.address ||
      profile?.address ||
      storedUser?.profile?.address ||
      storedUser?.address ||
      "",
    provinceCode: profileSummary?.provinceCode || profile?.provinceCode || storedUser?.profile?.provinceCode || "",
    districtCode: profileSummary?.districtCode || profile?.districtCode || storedUser?.profile?.districtCode || "",
    bio: profileSummary?.bio || profile?.bio || storedUser?.profile?.bio || "",
    avatar: resolveMediaUrl(
      profileSummary?.avatar ||
        profile?.avatar ||
        storedUser?.profile?.avatar ||
        storedUser?.avatar ||
        null,
    ),
  };
};

async function compressAvatarToDataUrl(uri) {
  let nextWidth = 1024;
  let nextQuality = 0.86;
  let currentUri = uri;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const result = await ImageManipulator.manipulateAsync(
      currentUri,
      [{ resize: { width: nextWidth } }],
      {
        compress: nextQuality,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      },
    );

    const base64 = result?.base64 || "";
    const bytes = estimateBase64Bytes(base64);

    if (base64 && bytes <= MAX_AVATAR_BYTES) {
      return {
        dataUrl: `data:image/jpeg;base64,${base64}`,
        bytes,
      };
    }

    currentUri = result.uri;
    nextWidth = Math.max(320, Math.floor((result.width || nextWidth) * 0.82));
    nextQuality = Math.max(0.4, Number((nextQuality - 0.1).toFixed(2)));
  }

  throw new Error("Không thể nén ảnh dưới 200KB. Vui lòng chọn ảnh khác.");
}

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const storedUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const { data: profileSummary } = useProfile(true);
  const updateProfileMutation = useUpdateProfile();
  const updateAvatarMutation = useUpdateAvatar();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [pendingAvatarDataUrl, setPendingAvatarDataUrl] = useState(null);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState(null);

  const seededRef = useRef(false);
  const seededFromProfileRef = useRef(false);
  const genderSheetRef = useRef(null);

  const seedForm = (source) => {
    if (!source) return;

    setFullName(source.fullName || "");
    setUsername(source.username || "");
    setNickname(source.nickname || "");
    setPhone(source.phone || "");
    setGender(source.gender || "");
    setAddress(source.address || "");
    setProvinceCode(source.provinceCode || "");
    setDistrictCode(source.districtCode || "");
    setBio(source.bio || "");
    setAvatarPreview(source.avatar || null);
    setPendingAvatarDataUrl(null);
    setInitialSnapshot(source);
  };

  useEffect(() => {
    if (profileSummary && !seededFromProfileRef.current) {
      seedForm(buildProfileSource(profileSummary, storedUser));
      seededRef.current = true;
      seededFromProfileRef.current = true;
      return;
    }

    if (!seededRef.current && storedUser) {
      seedForm(buildProfileSource(profileSummary, storedUser));
      seededRef.current = true;
    }
  }, [profileSummary, storedUser]);

  const isSaving =
    updateProfileMutation.isPending ||
    updateAvatarMutation.isPending ||
    isProcessingAvatar;

  const normalizedCurrent = useMemo(
    () => ({
      fullName: normalizeText(fullName),
      username: normalizeText(username),
      nickname: normalizeText(nickname),
      phone: normalizeText(phone),
      gender: gender || "",
      address: normalizeText(address),
      provinceCode: provinceCode || "",
      districtCode: districtCode || "",
      bio: normalizeText(bio),
    }),
    [fullName, username, nickname, phone, gender, address, provinceCode, districtCode, bio],
  );

  const normalizedInitial = useMemo(
    () => ({
      fullName: normalizeText(initialSnapshot?.fullName),
      username: normalizeText(initialSnapshot?.username),
      nickname: normalizeText(initialSnapshot?.nickname),
      phone: normalizeText(initialSnapshot?.phone),
      gender: initialSnapshot?.gender || "",
      address: normalizeText(initialSnapshot?.address),
      provinceCode: initialSnapshot?.provinceCode || "",
      districtCode: initialSnapshot?.districtCode || "",
      bio: normalizeText(initialSnapshot?.bio),
    }),
    [initialSnapshot],
  );

  const hasTextChanges = useMemo(() => {
    return Object.keys(normalizedCurrent).some(
      (key) => normalizedCurrent[key] !== normalizedInitial[key],
    );
  }, [normalizedCurrent, normalizedInitial]);

  const hasAvatarChanges = Boolean(pendingAvatarDataUrl);
  const isDirty = hasTextChanges || hasAvatarChanges;

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Chưa có quyền truy cập ảnh",
          "Vui lòng cấp quyền thư viện ảnh để cập nhật avatar.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        selectionLimit: 1,
      });

      if (result.canceled) return;

      const selectedUri = result.assets?.[0]?.uri;
      if (!selectedUri) {
        Alert.alert("Không tìm thấy ảnh", "Vui lòng thử chọn lại ảnh khác.");
        return;
      }

      setIsProcessingAvatar(true);
      const compressed = await compressAvatarToDataUrl(selectedUri);
      setAvatarPreview(compressed.dataUrl);
      setPendingAvatarDataUrl(compressed.dataUrl);
    } catch (error) {
      Alert.alert(
        "Không thể xử lý ảnh",
        error?.message || "Vui lòng thử lại với ảnh khác.",
      );
    } finally {
      setIsProcessingAvatar(false);
    }
  };

  const handleSave = async () => {
    const cleanFullName = normalizeText(fullName);
    const cleanUsername = normalizeText(username);

    if (cleanFullName.length < 2) {
      Alert.alert("Thiếu thông tin", "Tên hiển thị phải có ít nhất 2 ký tự.");
      return;
    }

    if (!cleanUsername) {
      Alert.alert("Thiếu thông tin", "Username là bắt buộc.");
      return;
    }

    if (!USERNAME_REGEX.test(cleanUsername)) {
      Alert.alert(
        "Username chưa hợp lệ",
        "Username chỉ gồm chữ, số, dấu gạch dưới và dài 3-30 ký tự.",
      );
      return;
    }

    if (!isDirty) {
      router.back();
      return;
    }

    const profilePayload = {
      username: cleanUsername,
      fullName: cleanFullName,
      nickname: toNullable(nickname),
      phone: toOptional(phone),
      gender: gender || null,
      address: toOptional(address),
      provinceCode: provinceCode || null,
      districtCode: districtCode || null,
      bio: toOptional(bio),
    };

    try {
      let updatedUser = null;

      if (hasTextChanges) {
        const profileRes = await updateProfileMutation.mutateAsync(profilePayload);
        updatedUser = profileRes?.data || profileRes || null;
      }

      if (pendingAvatarDataUrl) {
        await updateAvatarMutation.mutateAsync(pendingAvatarDataUrl);
      }

      const mergedProfile = {
        ...(storedUser?.profile || {}),
        ...(updatedUser?.profile || {}),
        fullName: profilePayload.fullName,
        nickname: profilePayload.nickname,
        phone: profilePayload.phone || null,
        gender: profilePayload.gender || null,
        address: profilePayload.address || null,
        provinceCode: profilePayload.provinceCode || null,
        districtCode: profilePayload.districtCode || null,
        bio: profilePayload.bio || null,
        avatar:
          pendingAvatarDataUrl ||
          updatedUser?.profile?.avatar ||
          storedUser?.profile?.avatar ||
          null,
      };

      setUser({
        ...(storedUser || {}),
        ...(updatedUser || {}),
        username: profilePayload.username,
        fullName: mergedProfile.fullName,
        avatar: mergedProfile.avatar,
        profile: mergedProfile,
      });

      Alert.alert("Cập nhật thành công", "Hồ sơ của bạn đã được lưu.");
      router.back();
    } catch (error) {
      Alert.alert(
        "Không thể cập nhật hồ sơ",
        error?.message || "Vui lòng thử lại sau.",
      );
    }
  };

  const displayAvatar = avatarPreview || null;
  const displayInitial =
    normalizeText(fullName).slice(0, 1).toUpperCase() ||
    normalizeText(username).slice(0, 1).toUpperCase() ||
    "U";

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}> 
      <View style={styles.headerRow}>
        <View style={styles.headerSideBtn}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
          >
            <Text style={styles.headerBtnText}>Hủy</Text>
          </Pressable>
        </View>

        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>

        <View style={styles.headerSideBtn} />
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
          <View style={styles.avatarSection}>
            <Pressable
              onPress={handlePickAvatar}
              style={({ pressed }) => [styles.avatarPressable, pressed && styles.pressed]}
            >
              {displayAvatar ? (
                <Image
                  source={{ uri: displayAvatar }}
                  style={styles.avatar}
                  contentFit="cover"
                  transition={150}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>{displayInitial}</Text>
                </View>
              )}

              <View style={styles.avatarCameraBadge}>
                {isProcessingAvatar ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <MaterialIcons name="photo-camera" size={16} color="#FFFFFF" />
                )}
              </View>
            </Pressable>

            <Text style={styles.avatarHint}>Chạm để đổi ảnh đại diện</Text>
          </View>

          <View style={styles.formCard}>
            <FieldLabel text="Tên hiển thị" required={true} />
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ví dụ: Nguyễn Văn A"
              placeholderTextColor={APPLE_COLORS.placeholder}
              style={styles.input}
              maxLength={100}
            />

            <FieldLabel text="Username" required={true} />
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="username_3_30_ky_tu"
              placeholderTextColor={APPLE_COLORS.placeholder}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
            />

            <FieldLabel text="Nickname" />
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="Tên hiển thị trên bản đồ"
              placeholderTextColor={APPLE_COLORS.placeholder}
              style={styles.input}
              maxLength={50}
            />

            <FieldLabel text="Số điện thoại" />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="090..."
              placeholderTextColor={APPLE_COLORS.placeholder}
              style={styles.input}
              keyboardType="phone-pad"
              maxLength={20}
            />

            <FieldLabel text="Giới tính" />
            <Pressable
              style={styles.pickerTrigger}
              onPress={() => genderSheetRef.current?.present()}
            >
              <Text style={[styles.triggerText, !gender && { color: APPLE_COLORS.placeholder }]}>
                {gender ? GENDER_OPTIONS.find((o) => o.value === gender)?.label : "Chọn giới tính"}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={APPLE_COLORS.placeholder} />
            </Pressable>

            <FieldLabel text="Khu vực" />
            <ProvinceDistrictSelect
              provinceCode={provinceCode}
              districtCode={districtCode}
              onProvinceChange={setProvinceCode}
              onDistrictChange={setDistrictCode}
            />

            <FieldLabel text="Chi tiết địa chỉ" />
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Số nhà, tên đường..."
              placeholderTextColor={APPLE_COLORS.placeholder}
              style={styles.input}
              maxLength={500}
            />

            <FieldLabel text="Giới thiệu" />
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Giới thiệu ngắn về bạn"
              placeholderTextColor={APPLE_COLORS.placeholder}
              style={[styles.input, styles.textarea]}
              multiline={true}
              textAlignVertical="top"
              numberOfLines={4}
              maxLength={1000}
            />
          </View>

          
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheetPicker
        ref={genderSheetRef}
        title="Chọn Giới Tính"
        data={GENDER_OPTIONS}
        selectedValue={gender}
        snapPoints={["40%"]}
        onSelect={setGender}
      />

      <BlurView 
        intensity={80} 
        tint="light" 
        style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}
      >
        <Pressable
          onPress={handleSave}
          disabled={!isDirty || isSaving}
          style={({ pressed }) => [
            styles.pillSaveBtn,
            (!isDirty || isSaving) && styles.pillSaveBtnDisabled,
            pressed && isDirty && !isSaving && styles.pressed,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.pillSaveBtnText, !isDirty && styles.pillSaveBtnTextDisabled]}>Lưu Thay Đổi</Text>
          )}
        </Pressable>
      </BlurView>
    </View>
  );
}

function FieldLabel({ text, required = false }) {
  return (
    <Text style={styles.fieldLabel}>
      {text}
      {required ? <Text style={styles.requiredMark}> *</Text> : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APPLE_COLORS.background,
  },
  flex: {
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: TAB_SCREEN_PADDING,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: APPLE_COLORS.text,
    fontSize: 20,
    fontFamily: TOKENS.font.heading,
    letterSpacing: -0.2,
  },
  headerSideBtn: {
    minWidth: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBtn: {
    height: 36,
    justifyContent: "center",
  },
  headerBtnText: {
    color: APPLE_COLORS.mutedText,
    fontSize: 16,
    fontFamily: TOKENS.font.medium,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  scrollContent: {
    paddingHorizontal: TAB_SCREEN_PADDING,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 16,
  },
  avatarSection: {
    alignItems: "center",
    borderRadius: 24,
    paddingVertical: 16,
    backgroundColor: APPLE_COLORS.surface,
    borderWidth: 1,
    borderColor: APPLE_COLORS.border,
    ...TOKENS.shadow.sm,
  },
  avatarPressable: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    backgroundColor: APPLE_COLORS.surface,
    borderWidth: 1,
    borderColor: APPLE_COLORS.border,
  },
  avatar: {
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  avatarFallback: {
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APPLE_COLORS.borderSoft,
  },
  avatarFallbackText: {
    color: APPLE_COLORS.text,
    fontSize: 40,
    fontFamily: TOKENS.font.heading,
  },
  avatarCameraBadge: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APPLE_COLORS.accent,
    borderWidth: 2,
    borderColor: APPLE_COLORS.surface,
  },
  avatarHint: {
    marginTop: 10,
    color: APPLE_COLORS.mutedText,
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
  },
  formCard: {
    backgroundColor: APPLE_COLORS.surface,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: APPLE_COLORS.border,
    gap: 16,
    ...TOKENS.shadow.sm,
  },
  fieldLabel: {
    fontSize: 14,
    color: APPLE_COLORS.text,
    fontFamily: TOKENS.font.semibold,
    marginBottom: 4,
  },
  requiredMark: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: APPLE_COLORS.borderSoft,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: APPLE_COLORS.text,
    fontFamily: TOKENS.font.body,
    minHeight: 52,
  },
  textarea: {
    paddingTop: 14,
    minHeight: 120,
  },
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: APPLE_COLORS.borderSoft,
    borderRadius: 14,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  triggerText: {
    fontFamily: TOKENS.font.body,
    fontSize: 16,
    color: APPLE_COLORS.text,
    flex: 1,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  pillSaveBtn: {
    backgroundColor: APPLE_COLORS.accent,
    borderRadius: 999,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...TOKENS.shadow.md,
  },
  pillSaveBtnDisabled: {
    backgroundColor: APPLE_COLORS.disabled,
  },
  pillSaveBtnText: {
    color: "#FFFFFF",
    fontFamily: TOKENS.font.semibold,
    fontSize: 18,
  },
  pillSaveBtnTextDisabled: {
    color: "#A1A1AA",
  },
  footnote: {
    color: "#71717A",
    fontSize: 12,
    lineHeight: 18,
    fontFamily: TOKENS.font.body,
    paddingHorizontal: 2,
  },
});
