import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useCreateTrip } from "../../src/modules/trips/hooks/useTrips";
import { GLASS_THEME } from "../../src/constants/design-tokens";

const GlassInput = ({ label, placeholder, value, onChangeText, multiline = false, icon }) => (
  <View style={{ marginBottom: 18 }}>
    <Text
      style={{
        color: GLASS_THEME.textSecondary,
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.6,
        textTransform: "uppercase",
        marginBottom: 8,
      }}
    >
      {label}
    </Text>
    <View
      style={{
        flexDirection: "row",
        alignItems: multiline ? "flex-start" : "center",
        gap: 10,
        backgroundColor: GLASS_THEME.glass,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: GLASS_THEME.glassBorder,
        paddingHorizontal: 16,
        paddingVertical: 14,
        minHeight: multiline ? 90 : 54,
      }}
    >
      {icon ? (
        <MaterialIcons
          name={icon}
          size={18}
          color={GLASS_THEME.textSecondary}
          style={multiline ? { marginTop: 2 } : {}}
        />
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={GLASS_THEME.textSecondary}
        multiline={multiline}
        style={{
          flex: 1,
          color: "#fff",
          fontSize: 14,
          lineHeight: multiline ? 22 : undefined,
        }}
      />
    </View>
  </View>
);

export default function CreateTripScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const createMutation = useCreateTrip();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalDays, setTotalDays] = useState("1");

  const canSubmit = title.trim().length > 0 && !createMutation.isPending;

  const handleCreate = async () => {
    if (!canSubmit) return;
    try {
      const result = await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        totalDays: parseInt(totalDays) || 1,
      });
      const newId = result?.data?.id;
      if (newId) {
        router.replace(`/trip/${newId}`);
      } else {
        router.back();
      }
    } catch {
      // Error handled by mutation state
    }
  };

  const handleAIGenerate = () => {
    router.replace("/(tabs)/ai");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: GLASS_THEME.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: insets.top + 12,
          paddingBottom: 12,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            backgroundColor: GLASS_THEME.glass,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: GLASS_THEME.glassBorder,
          }}
        >
          <MaterialIcons name="close" size={20} color="#fff" />
        </Pressable>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>
          Tạo chuyến đi
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            backgroundColor: GLASS_THEME.glass,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: GLASS_THEME.glassBorder,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <GlassInput
            label="Tên chuyến đi *"
            placeholder="VD: Khám phá Cần Thơ 3 ngày"
            value={title}
            onChangeText={setTitle}
            icon="edit"
          />
          <GlassInput
            label="Mô tả"
            placeholder="Mô tả ngắn về chuyến đi..."
            value={description}
            onChangeText={setDescription}
            multiline
            icon="notes"
          />
          <GlassInput
            label="Ngày bắt đầu"
            placeholder="DD/MM/YYYY"
            value={startDate}
            onChangeText={setStartDate}
            icon="calendar-today"
          />
          <GlassInput
            label="Ngày kết thúc"
            placeholder="DD/MM/YYYY"
            value={endDate}
            onChangeText={setEndDate}
            icon="event"
          />
          <GlassInput
            label="Số ngày"
            placeholder="1"
            value={totalDays}
            onChangeText={setTotalDays}
            icon="today"
          />
        </View>

        {createMutation.isError ? (
          <View
            style={{
              backgroundColor: "rgba(239,68,68,0.12)",
              borderRadius: 16,
              padding: 14,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "rgba(239,68,68,0.3)",
            }}
          >
            <Text style={{ color: "#EF4444", fontSize: 13 }}>
              {createMutation.error?.message || "Có lỗi xảy ra, vui lòng thử lại"}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={handleCreate}
          disabled={!canSubmit}
          style={{
            backgroundColor: canSubmit ? GLASS_THEME.neon : "rgba(255,255,255,0.12)",
            borderRadius: 22,
            paddingVertical: 16,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
            flexDirection: "row",
            gap: 8,
            shadowColor: canSubmit ? GLASS_THEME.neon : "transparent",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 20,
            elevation: canSubmit ? 10 : 0,
          }}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color="#03131A" />
          ) : (
            <MaterialIcons
              name="luggage"
              size={18}
              color={canSubmit ? "#03131A" : GLASS_THEME.textSecondary}
            />
          )}
          <Text
            style={{
              color: canSubmit ? "#03131A" : GLASS_THEME.textSecondary,
              fontSize: 15,
              fontWeight: "800",
              letterSpacing: 0.4,
            }}
          >
            Tạo chuyến đi
          </Text>
        </Pressable>

        <Pressable
          onPress={handleAIGenerate}
          style={{
            backgroundColor: GLASS_THEME.glass,
            borderRadius: 22,
            paddingVertical: 16,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            borderWidth: 1,
            borderColor: GLASS_THEME.glassBorderStrong,
          }}
        >
          <MaterialIcons name="auto-awesome" size={18} color={GLASS_THEME.neonAccent} />
          <Text style={{ color: GLASS_THEME.neonAccent, fontSize: 15, fontWeight: "700" }}>
            Để AI "Chị Mai" lên kế hoạch cho tôi
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
