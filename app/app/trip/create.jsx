import { useEffect, useMemo, useState } from "react";
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
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useCreateTrip } from "../../src/modules/trips/hooks/useTrips";
import { addDestinationApi } from "../../src/modules/trips/api/tripsApi";
import { useSavedPlaces } from "../../src/modules/saved/hooks/useSaved";
import { AIEntryButton } from "../../src/components/composed/AIEntryButton";
import { CustomDatePicker } from "../../src/components/ui/CustomDatePicker";
import { QUERY_KEYS } from "../../src/constants/query-keys";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../src/constants/design-tokens";

const TRIP_THEME = {
  ...APPLE_THEME,
  background: APPLE_THEME.background,
  surface: APPLE_THEME.surface,
  surfaceElevated: APPLE_THEME.surfaceElevated,
  surfaceMuted: APPLE_THEME.surfaceMuted,
  border: APPLE_THEME.border,
  borderSoft: APPLE_THEME.borderSoft,
  primary: APPLE_THEME.primary,
  primaryTint: APPLE_THEME.primaryTint,
  text: APPLE_THEME.text,
  textSecondary: APPLE_THEME.textSecondary,
  textMuted: APPLE_THEME.textMuted,
};

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
          <MaterialIcons name={icon} size={16} color={TRIP_THEME.primary} />
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

function getSavedPlace(entry) {
  return entry?.place || entry;
}

function SavedPlacePicker({ savedPlaces, selectedIds, onToggle }) {
  if (!savedPlaces.length) {
    return (
      <View style={styles.savedEmptyCard}>
        <MaterialIcons
          name="bookmark-border"
          size={18}
          color={TRIP_THEME.textMuted}
        />
        <Text style={styles.savedEmptyText}>
          Chưa có địa điểm đã lưu. Bạn vẫn có thể tạo chuyến đi trống rồi thêm
          địa điểm sau.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.savedPickerRow}
    >
      {savedPlaces.map((entry) => {
        const place = getSavedPlace(entry);
        const placeId = Number(place?.id);
        if (!Number.isInteger(placeId) || placeId <= 0) return null;

        const selected = selectedIds.includes(placeId);
        return (
          <Pressable
            key={`${entry?.id || placeId}:${placeId}`}
            onPress={() => onToggle(placeId)}
            style={[styles.savedPlaceChip, selected && styles.savedPlaceActive]}
          >
            <View
              style={[
                styles.savedPlaceIcon,
                selected && styles.savedPlaceIconActive,
              ]}
            >
              <MaterialIcons
                name={selected ? "check" : "place"}
                size={16}
                color={selected ? TRIP_THEME.white : TRIP_THEME.primary}
              />
            </View>
            <Text
              style={[
                styles.savedPlaceName,
                selected && styles.savedPlaceNameActive,
              ]}
              numberOfLines={2}
            >
              {place?.name || "Địa điểm"}
            </Text>
            {entry?.note ? (
              <Text
                style={[
                  styles.savedPlaceNote,
                  selected && styles.savedPlaceNoteActive,
                ]}
                numberOfLines={2}
              >
                {entry.note}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export default function CreateTripScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const createMutation = useCreateTrip();
  const { data: savedPlaces = [], isLoading: isSavedLoading } =
    useSavedPlaces(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [totalDays, setTotalDays] = useState(null);
  const [selectedSavedPlaceIds, setSelectedSavedPlaceIds] = useState([]);
  const [isAddingDestinations, setIsAddingDestinations] = useState(false);
  const [destinationError, setDestinationError] = useState(null);

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

  const selectedSavedCount = selectedSavedPlaceIds.length;
  const canSubmit =
    title.trim().length > 0 &&
    !createMutation.isPending &&
    !isAddingDestinations;

  const savedPlacesPreview = useMemo(() => savedPlaces.slice(0, 12), [savedPlaces]);

  const toggleSavedPlace = (placeId) => {
    setSelectedSavedPlaceIds((prev) =>
      prev.includes(placeId)
        ? prev.filter((id) => id !== placeId)
        : [...prev, placeId],
    );
    setDestinationError(null);
  };

  const handleCreate = async () => {
    if (!canSubmit) return;
    try {
      setDestinationError(null);
      const result = await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
        totalDays: totalDays ?? 1,
      });
      const newId = result?.data?.id;
      if (newId) {
        if (selectedSavedPlaceIds.length > 0) {
          setIsAddingDestinations(true);
          await Promise.all(
            selectedSavedPlaceIds.map((placeId, index) =>
              addDestinationApi(newId, {
                placeId,
                dayNumber: 1,
                order: index,
                note: "Thêm từ địa điểm đã lưu",
              }),
            ),
          );
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.all() }),
            queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.trips.detail(newId),
            }),
          ]);
        }
        router.replace(`/trip/${newId}`);
      } else {
        router.back();
      }
    } catch (error) {
      setDestinationError(
        error?.message ||
          "Không thể thêm địa điểm đã lưu vào chuyến đi. Vui lòng thử lại.",
      );
    } finally {
      setIsAddingDestinations(false);
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
          <MaterialIcons name="arrow-back" size={20} color={TRIP_THEME.text} />
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
                color={TRIP_THEME.primary}
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

        {/* ── Saved places section ── */}
        <FormSection title="Thêm địa điểm đã lưu" icon="collections-bookmark">
          <Text style={styles.helperText}>
            Chọn các địa điểm muốn đưa vào ngày 1. Bạn có thể sắp xếp lại trong
            chi tiết chuyến đi sau khi tạo.
          </Text>
          {isSavedLoading ? (
            <View style={styles.savedLoadingRow}>
              <ActivityIndicator size="small" color={TRIP_THEME.primary} />
              <Text style={styles.savedLoadingText}>
                Đang tải địa điểm đã lưu...
              </Text>
            </View>
          ) : (
            <SavedPlacePicker
              savedPlaces={savedPlacesPreview}
              selectedIds={selectedSavedPlaceIds}
              onToggle={toggleSavedPlace}
            />
          )}
          {selectedSavedCount > 0 ? (
            <View style={styles.selectedSummary}>
              <MaterialIcons
                name="check-circle"
                size={15}
                color={TRIP_THEME.primary}
              />
              <Text style={styles.selectedSummaryText}>
                Sẽ thêm {selectedSavedCount} địa điểm vào lịch trình
              </Text>
            </View>
          ) : null}
        </FormSection>

        {/* ── Error ── */}
        {createMutation.isError || destinationError ? (
          <View style={styles.errorCard}>
            <MaterialIcons
              name="error-outline"
              size={18}
              color={TOKENS.color.error}
            />
            <Text style={styles.errorText}>
              {destinationError ||
                createMutation.error?.message ||
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
          {createMutation.isPending || isAddingDestinations ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialIcons
              name="luggage"
              size={18}
              color={canSubmit ? TRIP_THEME.white : TRIP_THEME.textMuted}
            />
          )}
          <Text
            style={[
              styles.primaryBtnText,
              !canSubmit && styles.primaryBtnTextDisabled,
            ]}
          >
            {isAddingDestinations ? "Đang thêm địa điểm..." : "Tạo chuyến đi"}
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
    backgroundColor: TRIP_THEME.background,
  },
  /* ── Header ── */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: TRIP_THEME.surface,
    borderBottomWidth: 1,
    borderBottomColor: TRIP_THEME.borderSoft,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: TOKENS.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TRIP_THEME.surfaceElevated,
    borderWidth: 1,
    borderColor: TRIP_THEME.border,
  },
  headerCenter: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: TOKENS.font.heading,
    color: TRIP_THEME.text,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    color: TRIP_THEME.textMuted,
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
    backgroundColor: TRIP_THEME.surface,
    borderRadius: TOKENS.radius["2xl"],
    borderWidth: 1,
    borderColor: TRIP_THEME.borderSoft,
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
    backgroundColor: TRIP_THEME.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    color: TRIP_THEME.text,
  },
  /* ── Inputs ── */
  inputBlock: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    color: TRIP_THEME.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: TRIP_THEME.surfaceElevated,
    borderRadius: TOKENS.radius.lg,
    borderWidth: 1,
    borderColor: TRIP_THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    color: TRIP_THEME.text,
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
    backgroundColor: TRIP_THEME.primaryTint,
    marginTop: 4,
  },
  durationText: {
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    color: TRIP_THEME.primary,
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
    color: TRIP_THEME.warning,
  },
  /* ── Saved places ── */
  helperText: {
    marginTop: -6,
    marginBottom: 12,
    color: TRIP_THEME.textMuted,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: TOKENS.font.body,
  },
  savedLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: TOKENS.radius.lg,
    padding: 14,
    backgroundColor: TRIP_THEME.surfaceElevated,
  },
  savedLoadingText: {
    color: TRIP_THEME.textMuted,
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
  },
  savedEmptyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: TOKENS.radius.lg,
    padding: 14,
    backgroundColor: TRIP_THEME.surfaceElevated,
    borderWidth: 1,
    borderColor: TRIP_THEME.borderSoft,
  },
  savedEmptyText: {
    flex: 1,
    color: TRIP_THEME.textMuted,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: TOKENS.font.body,
  },
  savedPickerRow: {
    gap: 10,
    paddingRight: 6,
  },
  savedPlaceChip: {
    width: 172,
    minHeight: 118,
    borderRadius: 22,
    padding: 14,
    gap: 8,
    backgroundColor: TRIP_THEME.surfaceElevated,
    borderWidth: 1,
    borderColor: TRIP_THEME.borderSoft,
  },
  savedPlaceActive: {
    backgroundColor: TRIP_THEME.primary,
    borderColor: TRIP_THEME.primary,
  },
  savedPlaceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TRIP_THEME.primaryTint,
  },
  savedPlaceIconActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  savedPlaceName: {
    color: TRIP_THEME.text,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: TOKENS.font.semibold,
  },
  savedPlaceNameActive: {
    color: TRIP_THEME.white,
  },
  savedPlaceNote: {
    color: TRIP_THEME.textMuted,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: TOKENS.font.body,
  },
  savedPlaceNoteActive: {
    color: "rgba(255,255,255,0.78)",
  },
  selectedSummary: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: TRIP_THEME.primaryTint,
  },
  selectedSummaryText: {
    color: TRIP_THEME.primary,
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
  },
  /* ── Error ── */
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,59,48,0.1)",
    borderRadius: TOKENS.radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.22)",
    padding: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
    color: TRIP_THEME.danger,
  },
  /* ── Buttons ── */
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: TRIP_THEME.primary,
    borderRadius: TOKENS.radius.xl,
    paddingVertical: 16,
    ...TOKENS.shadow.sm,
  },
  primaryBtnDisabled: {
    backgroundColor: TRIP_THEME.surfaceMuted,
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
    color: TRIP_THEME.white,
  },
  primaryBtnTextDisabled: {
    color: TRIP_THEME.textMuted,
  },
  aiButton: {
    marginTop: 2,
  },
});
