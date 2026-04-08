import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useCreateTrip } from "../../src/modules/trips/hooks/useTrips";
import { AIEntryButton } from "../../src/components/composed/AIEntryButton";
import { CustomDatePicker } from "../../src/components/ui/CustomDatePicker";
import { TOKENS } from "../../src/constants/design-tokens";
import { TAB_THEME } from "../(tabs)/tabTheme";

// Tính số ngày từ 2 Date object (bao gồm cả ngày đầu và cuối)
function calcTotalDays(start, end) {
  if (!start || !end) return null;
  const ms = end.getTime() - start.getTime();
  const days = Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
  return days > 0 ? days : null;
}

function FormSection({ title, icon, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <MaterialIcons name={icon} size={16} color={TAB_THEME.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function LabeledInput({
  label,
  placeholder,
  value,
  onChangeText,
  multiline = false,
  keyboardType,
}) {
  return (
    <View style={styles.inputBlock}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={TOKENS.color.neutral[400]}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[styles.textInput, multiline && styles.textInputMulti]}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

export default function CreateTripScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const createMutation = useCreateTrip();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [totalDays, setTotalDays] = useState(null);

  // Tự động tính totalDays khi user chọn date range
  useEffect(() => {
    const computed = calcTotalDays(startDate, endDate);
    if (computed !== null) {
      setTotalDays(computed);
    }
  }, [startDate, endDate]);

  // Đảm bảo endDate >= startDate
  const handleStartDate = (date) => {
    setStartDate(date);
    if (date && endDate && endDate < date) {
      setEndDate(null);
    }
  };

  const canSubmit = title.trim().length > 0 && !createMutation.isPending;

  const handleCreate = async () => {
    if (!canSubmit) return;
    try {
      const result = await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
        totalDays: totalDays ?? 1,
      });
      const newId = result?.data?.id;
      if (newId) {
        router.replace(`/trip/${newId}`);
      } else {
        router.back();
      }
    } catch {
      // lỗi được xử lý bởi createMutation.isError
    }
  };

  // Hiển thị số ngày dự tính
  const daysLabel =
    totalDays !== null
      ? `${totalDays} ngày`
      : startDate && !endDate
        ? "Chọn ngày kết thúc"
        : null;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <MaterialIcons name="arrow-back" size={20} color={TAB_THEME.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Tạo chuyến đi</Text>
          <Text style={styles.headerSubtitle}>Lên kế hoạch hành trình mới</Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Info section ── */}
        <FormSection title="Thông tin chuyến đi" icon="luggage">
          <LabeledInput
            label="Tên chuyến đi *"
            placeholder="VD: Khám phá Cần Thơ 3 ngày"
            value={title}
            onChangeText={setTitle}
          />
          <LabeledInput
            label="Mô tả"
            placeholder="Mục đích, phong cách, điểm đặc biệt..."
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </FormSection>

        {/* ── Date section ── */}
        <FormSection title="Thời gian" icon="calendar-month">
          <CustomDatePicker
            label="Ngày bắt đầu"
            value={startDate}
            onChange={handleStartDate}
            placeholder="Chọn ngày bắt đầu"
          />
          <CustomDatePicker
            label="Ngày kết thúc"
            value={endDate}
            onChange={setEndDate}
            minimumDate={startDate ?? undefined}
            placeholder="Chọn ngày kết thúc"
          />

          {/* Duration badge */}
          {daysLabel ? (
            <View style={styles.durationBadge}>
              <MaterialIcons
                name="timelapse"
                size={14}
                color={TAB_THEME.primary}
              />
              <Text style={styles.durationText}>{daysLabel}</Text>
            </View>
          ) : null}

          {/* Validation: endDate < startDate */}
          {startDate && endDate && endDate < startDate ? (
            <View style={styles.warningRow}>
              <MaterialIcons
                name="warning"
                size={14}
                color={TOKENS.color.warning}
              />
              <Text style={styles.warningText}>
                Ngày kết thúc phải sau ngày bắt đầu
              </Text>
            </View>
          ) : null}
        </FormSection>

        {/* ── Error ── */}
        {createMutation.isError ? (
          <View style={styles.errorCard}>
            <MaterialIcons
              name="error-outline"
              size={18}
              color={TOKENS.color.error}
            />
            <Text style={styles.errorText}>
              {createMutation.error?.message ||
                "Có lỗi xảy ra, vui lòng thử lại"}
            </Text>
          </View>
        ) : null}

        {/* ── Actions ── */}
        <Pressable
          onPress={handleCreate}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.primaryBtn,
            !canSubmit && styles.primaryBtnDisabled,
            pressed && canSubmit && styles.primaryBtnPressed,
          ]}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialIcons
              name="luggage"
              size={18}
              color={canSubmit ? "#FFFFFF" : TOKENS.color.neutral[400]}
            />
          )}
          <Text
            style={[
              styles.primaryBtnText,
              !canSubmit && styles.primaryBtnTextDisabled,
            ]}
          >
            Tạo chuyến đi
          </Text>
        </Pressable>

        <AIEntryButton
          onPress={() => router.replace("/(tabs)/ai")}
          badge="em Nhi"
          style={styles.aiButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6FAFF",
  },
  /* ── Header ── */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.16)",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: TOKENS.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  headerCenter: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: TOKENS.font.heading,
    color: TAB_THEME.text,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    color: TAB_THEME.textMuted,
  },
  headerRight: {
    width: 40,
  },
  /* ── Scroll ── */
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  /* ── Section ── */
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: TOKENS.radius["2xl"],
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.14)",
    padding: 20,
    gap: 4,
    ...TOKENS.shadow.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: TOKENS.radius.md,
    backgroundColor: "rgba(0,102,230,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    color: TAB_THEME.text,
  },
  /* ── Inputs ── */
  inputBlock: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    color: TOKENS.color.neutral[500],
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#F8FBFF",
    borderRadius: TOKENS.radius.lg,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.22)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    color: TAB_THEME.text,
    minHeight: 52,
  },
  textInputMulti: {
    minHeight: 90,
    paddingTop: 14,
  },
  /* ── Duration badge ── */
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: TOKENS.radius.full,
    backgroundColor: "rgba(0,102,230,0.08)",
    marginTop: 4,
  },
  durationText: {
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    color: TAB_THEME.primary,
  },
  /* ── Warning ── */
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
    color: TOKENS.color.warning,
  },
  /* ── Error ── */
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: TOKENS.color.error + "10",
    borderRadius: TOKENS.radius.lg,
    borderWidth: 1,
    borderColor: TOKENS.color.error + "28",
    padding: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
    color: TOKENS.color.error,
  },
  /* ── Buttons ── */
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: TAB_THEME.primary,
    borderRadius: TOKENS.radius.xl,
    paddingVertical: 16,
    ...TOKENS.shadow.accent,
  },
  primaryBtnDisabled: {
    backgroundColor: TOKENS.color.neutral[100],
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    color: "#FFFFFF",
  },
  primaryBtnTextDisabled: {
    color: TOKENS.color.neutral[400],
  },
  aiButton: {
    marginTop: 2,
  },
});
