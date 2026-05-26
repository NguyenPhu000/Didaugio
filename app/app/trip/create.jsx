import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import { useCreateTrip } from "../../src/modules/trips/hooks/useTrips";
import { addDestinationApi } from "../../src/modules/trips/api/tripsApi";
import { useSavedPlacesCached } from "../../src/modules/saved/hooks/useSavedOffline";
import { CustomDatePicker } from "../../src/components/ui/CustomDatePicker";
import { toYmdString } from "../../src/modules/trips/utils/tripHelpers";
import { QUERY_KEYS } from "../../src/constants/query-keys";
import { BOOKING_APPLE_THEME as APPLE_THEME, TOKENS } from "../../src/constants/design-tokens";
import { HeroSection } from "../../src/modules/trips/components/create-trip/HeroSection";
import { SavedPlacesGrid } from "../../src/modules/trips/components/create-trip/SavedPlacesGrid";
import s, { T } from "../../src/modules/trips/utils/tripDetailTokens";

function calcTotalDays(start, end) {
  if (!start || !end) return null;
  const ms = end.getTime() - start.getTime();
  const days = Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
  return days > 0 ? days : null;
}

/* ── Section wrapper ── */
function Section({ icon, label, delay = 0, children }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(500)}
      style={styles.section}
    >
      <View style={styles.sectionHeader}>
        <MaterialIcons name={icon} size={16} color={T.muted48} />
        <Text style={styles.sectionLabel}>{label}</Text>
      </View>
      {children}
    </Animated.View>
  );
}

/* ── Duration badge ── */
function DurationBadge({ days }) {
  if (!days) return null;
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.durationBadge}>
      <MaterialIcons name="schedule" size={14} color={T.ink} />
      <Text style={styles.durationText}>{days}</Text>
    </Animated.View>
  );
}

export default function CreateTripScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const createMutation = useCreateTrip();
  const { savedData: savedPlaces = [], isLoading: isSavedLoading, isError: isSavedError } =
    useSavedPlacesCached(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [totalDays, setTotalDays] = useState(null);
  const [selectedSavedPlaceIds, setSelectedSavedPlaceIds] = useState([]);
  const [isAddingDestinations, setIsAddingDestinations] = useState(false);
  const [destinationError, setDestinationError] = useState(null);

  const ctaScale = useSharedValue(1);
  const hasSavedRef = useRef(false);

  useEffect(() => {
    const computed = calcTotalDays(startDate, endDate);
    if (computed !== null) setTotalDays(computed);
  }, [startDate, endDate]);

  const handleStartDate = useCallback(
    (date) => {
      setStartDate(date);
      if (date && endDate && endDate < date) setEndDate(null);
    },
    [endDate],
  );

  const selectedSavedCount = selectedSavedPlaceIds.length;
  const canSubmit =
    title.trim().length > 0 &&
    !createMutation.isPending &&
    !isAddingDestinations;

  const savedPlacesPreview = useMemo(
    () => savedPlaces.slice(0, 16),
    [savedPlaces],
  );

  const toggleSavedPlace = useCallback((placeId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSavedPlaceIds((prev) =>
      prev.includes(placeId)
        ? prev.filter((id) => id !== placeId)
        : [...prev, placeId],
    );
    setDestinationError(null);
  }, []);

  const isFormDirty =
    title.trim().length > 0 ||
    description.trim().length > 0 ||
    startDate !== null ||
    endDate !== null ||
    selectedSavedPlaceIds.length > 0;

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (hasSavedRef.current || !isFormDirty) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        "Hủy tạo chuyến đi",
        "Bạn có chắc chắn muốn thoát? Các thông tin đã nhập sẽ không được lưu.",
        [
          {
            text: "Tiếp tục chỉnh sửa",
            style: "cancel",
            onPress: () => {},
          },
          {
            text: "Hủy bỏ",
            style: "destructive",
            onPress: () => {
              hasSavedRef.current = true;
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, isFormDirty]);

  const handleCreate = useCallback(async () => {
    if (!canSubmit) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setDestinationError(null);
      hasSavedRef.current = true;
      const result = await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: startDate ? toYmdString(startDate) : undefined,
        endDate: endDate ? toYmdString(endDate) : undefined,
        totalDays: totalDays ?? 1,
        status: "planned",
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
            queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.trips.all(),
            }),
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
      hasSavedRef.current = false;
      setDestinationError(
        error?.message || "Có lỗi xảy ra, vui lòng thử lại.",
      );
    } finally {
      setIsAddingDestinations(false);
    }
  }, [
    canSubmit,
    createMutation,
    title,
    description,
    startDate,
    endDate,
    totalDays,
    selectedSavedPlaceIds,
    queryClient,
    router,
  ]);

  const daysLabel =
    totalDays !== null
      ? `${totalDays} ngày`
      : startDate && !endDate
        ? "Chọn ngày kết thúc"
        : null;

  const ctaAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  const handleCtaPressIn = useCallback(() => {
    ctaScale.value = withSpring(0.96, TOKENS.spring.press);
  }, [ctaScale]);

  const handleCtaPressOut = useCallback(() => {
    ctaScale.value = withSpring(1, TOKENS.spring.press);
  }, [ctaScale]);

  const isSubmitting = createMutation.isPending || isAddingDestinations;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
        >
          <MaterialIcons name="close" size={20} color={T.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chuyến đi mới</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero ── */}
        <HeroSection />

        {/* ── Trip Info ── */}
        <Section icon="description" label="Thông tin chuyến đi" delay={100}>
          <View style={styles.card}>
            <View style={styles.inputRow}>
              <MaterialIcons
                name="flag"
                size={20}
                color={title ? T.ink : T.muted48}
                style={styles.inputIcon}
              />
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Tên chuyến đi"
                placeholderTextColor={T.muted48}
                style={styles.textInput}
                returnKeyType="next"
              />
            </View>
            <View style={styles.divider} />
            <View style={[styles.inputRow, styles.inputRowMulti]}>
              <MaterialIcons
                name="edit"
                size={20}
                color={description ? T.ink : T.muted48}
                style={[styles.inputIcon, { marginTop: 2 }]}
              />
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Mô tả ngắn về chuyến đi (tùy chọn)"
                placeholderTextColor={T.muted48}
                multiline
                textAlignVertical="top"
                style={[styles.textInput, styles.textInputMulti]}
              />
            </View>
          </View>
        </Section>

        {/* ── Dates ── */}
        <Section icon="event" label="Thời gian" delay={200}>
          <View style={styles.card}>
            <CustomDatePicker
              label="Ngày bắt đầu"
              value={startDate}
              onChange={handleStartDate}
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

            <DurationBadge days={daysLabel} />

            {startDate && endDate && endDate < startDate ? (
              <View style={styles.warningRow}>
                <MaterialIcons name="error-outline" size={16} color={T.danger} />
                <Text style={styles.warningText}>
                  Ngày kết thúc phải sau ngày bắt đầu
                </Text>
              </View>
            ) : null}
          </View>
        </Section>

        {/* ── Saved Places ── */}
        <Section icon="bookmark" label="Địa điểm đã lưu" delay={300}>
          <View style={styles.card}>
            <SavedPlacesGrid
              savedPlaces={savedPlacesPreview}
              selectedIds={selectedSavedPlaceIds}
              isLoading={isSavedLoading}
              isError={isSavedError}
              onToggle={toggleSavedPlace}
            />
          </View>
        </Section>

        {/* ── Error ── */}
        {createMutation.isError || destinationError ? (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.errorCard}
          >
            <MaterialIcons name="error-outline" size={18} color={T.danger} />
            <Text style={styles.errorText}>
              {destinationError ||
                createMutation.error?.message ||
                "Có lỗi xảy ra, vui lòng thử lại"}
            </Text>
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* ── Bottom Bar ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <Animated.View style={[ctaAnimatedStyle, { flex: 1 }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCreate}
            onPressIn={handleCtaPressIn}
            onPressOut={handleCtaPressOut}
            disabled={!canSubmit}
            style={[
              styles.createBtn,
              !canSubmit && styles.createBtnDisabled,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <View style={styles.createBtnContent}>
                <MaterialIcons name="add-circle-outline" size={20} color="#FFF" />
                <Text
                  style={[
                    styles.createBtnText,
                    !canSubmit && styles.createBtnTextDisabled,
                  ]}
                >
                  {isAddingDestinations
                    ? "Đang thêm địa điểm..."
                    : "Tạo chuyến đi"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ── Styles ── */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: T.parchment,
  },

  /* ── Header ── */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: T.canvas,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: TOKENS.font.semibold,
    color: T.ink,
    letterSpacing: -0.374,
  },

  /* ── Scroll ── */
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },

  /* ── Section ── */
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    color: T.muted48,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  /* ── Card ── */
  card: {
    backgroundColor: T.canvas,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 2,
  },

  /* ── Inputs ── */
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inputRowMulti: {
    alignItems: "flex-start",
  },
  inputIcon: {
    marginTop: 0,
  },
  textInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: TOKENS.font.body,
    color: T.ink,
    letterSpacing: -0.374,
    minHeight: 48,
  },
  textInputMulti: {
    minHeight: 76,
    paddingTop: 14,
    lineHeight: 24,
  },

  /* ── Duration ── */
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    marginHorizontal: 2,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignSelf: "flex-start",
  },
  durationText: {
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    color: T.ink,
    letterSpacing: -0.224,
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 2,
  },
  warningText: {
    fontSize: 13,
    fontFamily: TOKENS.font.body,
    color: T.danger,
    letterSpacing: -0.12,
  },

  /* ── Error ── */
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,59,48,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.12)",
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: TOKENS.font.body,
    color: T.danger,
    letterSpacing: -0.12,
    lineHeight: 18,
  },

  /* ── Bottom Bar ── */
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: T.parchment,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  createBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.ink,
    paddingVertical: 16,
    borderRadius: 9999,
    height: 54,
  },
  createBtnDisabled: {
    backgroundColor: "#C8C8CC",
    shadowOpacity: 0,
    elevation: 0,
  },
  createBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  createBtnText: {
    fontSize: 17,
    fontFamily: TOKENS.font.semibold,
    color: "#FFFFFF",
    letterSpacing: -0.374,
  },
  createBtnTextDisabled: {
    color: "rgba(255,255,255,0.7)",
  },
});
