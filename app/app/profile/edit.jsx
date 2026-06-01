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
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-3 bg-white">
        <View className="w-12 items-start justify-center">
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => pressed && { opacity: 0.7 }}
            className="py-2"
          >
            <Text className="text-base text-[#6B7280] font-medium">Hủy</Text>
          </Pressable>
        </View>

        <Text
          style={{ fontFamily: TOKENS.font.heading }}
          className="text-xl text-[#111111]"
        >
          Chỉnh sửa hồ sơ
        </Text>

        <View className="w-12" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: insets.bottom + 100,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View className="items-center bg-white border border-[#F3F4F6] rounded-3xl py-6 shadow-sm">
            <Pressable
              onPress={handlePickAvatar}
              style={({ pressed }) => pressed && { opacity: 0.8 }}
              className="w-[120px] h-[120px] rounded-full items-center justify-center bg-white border border-[#E5E7EB] relative"
            >
              {displayAvatar ? (
                <Image
                  source={{ uri: displayAvatar }}
                  style={{ width: 116, height: 116, borderRadius: 58 }}
                  contentFit="cover"
                  transition={150}
                />
              ) : (
                <View className="w-[116px] h-[116px] rounded-full items-center justify-center bg-[#F3F4F6]">
                  <Text
                    style={{ fontFamily: TOKENS.font.heading }}
                    className="text-[#111111] text-[40px]"
                  >
                    {displayInitial}
                  </Text>
                </View>
              )}

              <View className="absolute right-0.5 bottom-0.5 w-[32px] h-[32px] rounded-full items-center justify-center bg-[#111111] border-2 border-white">
                {isProcessingAvatar ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <MaterialIconsRounded name="photo-camera" size={16} color="#FFFFFF" />
                )}
              </View>
            </Pressable>

            <Text
              style={{ fontFamily: TOKENS.font.medium }}
              className="mt-3 text-xs text-[#6B7280]"
            >
              Chạm để đổi ảnh đại diện
            </Text>
          </View>

          {/* Form Fields */}
          <View className="bg-white p-5 rounded-3xl border border-[#F3F4F6] gap-4 mt-4 shadow-sm mb-6">
            <View>
              <FieldLabel text="Tên hiển thị" required={true} />
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ví dụ: Nguyễn Văn A"
                placeholderTextColor={APPLE_COLORS.placeholder}
                style={{ fontFamily: TOKENS.font.body }}
                className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl px-4 py-3 text-base text-[#111111] min-h-[52px]"
                maxLength={100}
              />
            </View>

            <View>
              <FieldLabel text="Username" required={true} />
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="username_3_30_ky_tu"
                placeholderTextColor={APPLE_COLORS.placeholder}
                style={{ fontFamily: TOKENS.font.body }}
                className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl px-4 py-3 text-base text-[#111111] min-h-[52px]"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
              />
            </View>

            <View>
              <FieldLabel text="Nickname" />
              <TextInput
                value={nickname}
                onChangeText={setNickname}
                placeholder="Tên hiển thị trên bản đồ"
                placeholderTextColor={APPLE_COLORS.placeholder}
                style={{ fontFamily: TOKENS.font.body }}
                className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl px-4 py-3 text-base text-[#111111] min-h-[52px]"
                maxLength={50}
              />
            </View>

            <View>
              <FieldLabel text="Số điện thoại" />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="090..."
                placeholderTextColor={APPLE_COLORS.placeholder}
                style={{ fontFamily: TOKENS.font.body }}
                className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl px-4 py-3 text-base text-[#111111] min-h-[52px]"
                keyboardType="phone-pad"
                maxLength={20}
              />
            </View>

            <View>
              <FieldLabel text="Giới tính" />
              <View className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl overflow-hidden">
                <Pressable
                  className="flex-row items-center min-h-[52px] px-4 active:bg-[#F8FAFC]"
                  onPress={() => genderSheetRef.current?.present()}
                >
                  <MaterialIconsRounded
                    name={
                      gender === "male"
                        ? "male"
                        : gender === "female"
                          ? "female"
                          : gender === "other"
                            ? "transgender"
                            : "wc"
                    }
                    size={18}
                    color={gender ? "#64748B" : "#94A3B8"}
                    style={{ marginRight: 10 }}
                  />
                  <Text
                    style={{ fontFamily: TOKENS.font.body }}
                    className={`text-[14.5px] flex-1 ${gender ? "text-[#1E293B]" : "text-[#94A3B8]"}`}
                  >
                    {gender
                      ? GENDER_OPTIONS.find((o) => o.value === gender)?.label
                      : "Chọn giới tính"}
                  </Text>
                  <MaterialIconsRounded
                    name="chevron-right"
                    size={20}
                    color={gender ? "#94A3B8" : "#E2E8F0"}
                  />
                </Pressable>
              </View>
            </View>


            <View>
              <FieldLabel text="Khu vực" />
              <ProvinceDistrictSelect
                provinceCode={provinceCode}
                districtCode={districtCode}
                onProvinceChange={setProvinceCode}
                onDistrictChange={setDistrictCode}
              />
            </View>

            <View>
              <FieldLabel text="Chi tiết địa chỉ" />
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Số nhà, tên đường..."
                placeholderTextColor={APPLE_COLORS.placeholder}
                style={{ fontFamily: TOKENS.font.body }}
                className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl px-4 py-3 text-base text-[#111111] min-h-[52px]"
                maxLength={500}
              />
            </View>

            <View>
              <FieldLabel text="Giới thiệu" />
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Giới thiệu ngắn về bạn"
                placeholderTextColor={APPLE_COLORS.placeholder}
                style={{ fontFamily: TOKENS.font.body }}
                className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl px-4 py-3 text-base text-[#111111] min-h-[120px] pt-3"
                multiline={true}
                textAlignVertical="top"
                numberOfLines={4}
                maxLength={1000}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheetPicker
        ref={genderSheetRef}
        title="Chọn Giới Tính"
        data={GENDER_OPTIONS}
        selectedValue={gender}
        snapPoints={["35%"]}
        showSearch={false}
        onSelect={setGender}
      />

      <BlurView
        intensity={80}
        tint="light"
        className="absolute bottom-0 left-0 right-0 px-6 pt-4 border-t border-[#F3F4F6] bg-white/80"
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        <Pressable
          onPress={handleSave}
          disabled={!isDirty || isSaving}
          style={({ pressed }) => pressed && isDirty && !isSaving && { opacity: 0.8 }}
          className={`rounded-full h-[56px] flex-row items-center justify-center ${
            !isDirty || isSaving ? "bg-[#D1D5DB]" : "bg-[#111111]"
          }`}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              style={{ fontFamily: TOKENS.font.semibold }}
              className={`text-lg ${!isDirty || isSaving ? "text-[#A1A1AA]" : "text-white"}`}
            >
              Lưu Thay Đổi
            </Text>
          )}
        </Pressable>
      </BlurView>
    </View>
  );
}

function FieldLabel({ text, required = false }) {
  return (
    <Text
      style={{ fontFamily: TOKENS.font.semibold }}
      className="text-sm text-[#111111] mb-1.5"
    >
      {text}
      {required ? <Text className="text-[#EF4444]"> *</Text> : null}
    </Text>
  );
}

