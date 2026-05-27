import { memo, useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  FlatList,
  LayoutAnimation,
  UIManager,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useQueryClient } from "@tanstack/react-query";
import { TOKENS, BOOKING_APPLE_THEME as APPLE_THEME } from "../../../../constants/design-tokens";
import { useExplore } from "../../../explore/hooks/useExplore";
import { addDestinationApi } from "../../api/tripsApi";
import { QUERY_KEYS } from "../../../../constants/query-keys";
import { resolvePlaceImageUri, getCategoryPlaceholder } from "../../../../lib/media-url";
import { Image } from "expo-image";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const T = {
  ink: APPLE_THEME.text,
  canvas: APPLE_THEME.surface,
  parchment: APPLE_THEME.background,
  muted48: APPLE_THEME.textMuted,
  primary: APPLE_THEME.primary,
  onPrimary: APPLE_THEME.white,
  danger: APPLE_THEME.danger,
};

function parseTimeToDate(str) {
  if (!str) return null;
  const [h, m] = str.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function formatHHMM(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function TimeField({ label, value, onChange, placeholder, icon }) {
  const [show, setShow] = useState(false);
  const dateValue = useMemo(() => parseTimeToDate(value) || new Date(), [value]);

  const handleChange = useCallback(
    (_event, selectedDate) => {
      if (Platform.OS === "android") {
        setShow(false);
      }
      if (selectedDate) {
        onChange(formatHHMM(selectedDate));
      }
    },
    [onChange],
  );

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        style={({ pressed }) => [
          styles.timeInput,
          pressed && { backgroundColor: APPLE_THEME.surfaceMuted },
        ]}
        onPress={() => setShow(true)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel={`Chọn thời gian cho ${label}`}
      >
        <MaterialIcons
          name={icon || "schedule"}
          size={16}
          color={T.muted48}
        />
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
      </Pressable>

      {Platform.OS === "ios" ? (
        <Modal
          visible={show}
          transparent
          animationType="slide"
          onRequestClose={() => setShow(false)}
        >
          <Pressable style={styles.pickerOverlay} onPress={() => setShow(false)}>
            <View style={styles.pickerSheet} onStartShouldSetResponder={() => true}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>{label}</Text>
                <Pressable onPress={() => setShow(false)}>
                  <Text style={styles.pickerDone}>Xong</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={dateValue}
                mode="time"
                is24Hour
                display="spinner"
                onChange={handleChange}
                locale="vi-VN"
              />
            </View>
          </Pressable>
        </Modal>
      ) : (
        show && (
          <DateTimePicker
            value={dateValue}
            mode="time"
            is24Hour
            display="default"
            onChange={handleChange}
          />
        )
      )}
    </View>
  );
}

const TRANSPORT_OPTIONS = [
  { label: "Đi bộ", value: "Đi bộ", icon: "directions-walk" },
  { label: "Xe máy", value: "Xe máy", icon: "motorcycle" },
  { label: "Xe hơi", value: "Xe hơi", icon: "directions-car" },
  { label: "Xe buýt", value: "Xe buýt", icon: "directions-bus" },
  { label: "Khác", value: null, icon: "swap-vert" },
];

function InlineAddPlaceModal({
  visible,
  tripId,
  totalDays,
  defaultDay,
  destinations,
  onClose,
}) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { height: screenHeight } = useWindowDimensions();

  const [step, setStep] = useState(1); // 1: Search, 2: Configure
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Form states
  const [dayNumber, setDayNumber] = useState(defaultDay || 1);
  
  const hasExistingDestinations = useMemo(() => {
    const dests = destinations || [];
    return dests.some((d) => d.dayNumber === dayNumber);
  }, [destinations, dayNumber]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [note, setNote] = useState("");
  const [transportToNext, setTransportToNext] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchEnabled = useMemo(() => {
    return visible && debouncedQuery.trim().length > 0;
  }, [visible, debouncedQuery]);

  const { data: exploreData, isLoading, isFetching } = useExplore({
    search: debouncedQuery,
    enabled: searchEnabled,
  });

  const places = useMemo(() => {
    return exploreData?.pages.flatMap((page) => page?.data || []) ?? [];
  }, [exploreData]);

  // Reset state on open/close
  useEffect(() => {
    if (visible) {
      setStep(1);
      setSearchQuery("");
      setDebouncedQuery("");
      setSelectedPlace(null);
      setDayNumber(defaultDay || 1);
      setStartTime("");
      setEndTime("");
      setNote("");
      setTransportToNext(null);
      setErrorMsg("");
    }
  }, [visible, defaultDay]);

  const handleSelectPlace = useCallback((place) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedPlace(place);
    setStep(2);
  }, []);

  const handleBackToSearch = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStep(1);
  }, []);

  const handleAdd = useCallback(async () => {
    if (!selectedPlace || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await addDestinationApi(tripId, {
        placeId: Number(selectedPlace.id),
        dayNumber: Number(dayNumber),
        startTime: startTime || null,
        endTime: endTime || null,
        note: note || null,
        transportToNext: transportToNext,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.trips.detail(tripId),
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.trips.all(),
        }),
      ]);

      onClose();
    } catch (err) {
      setErrorMsg(err?.message || "Có lỗi xảy ra khi thêm địa điểm.");
      setIsSubmitting(false); // Reset submitting state on error
    }
  }, [selectedPlace, dayNumber, startTime, endTime, note, transportToNext, tripId, queryClient, onClose, isSubmitting]);

  const isSearchLoading = isLoading || isFetching || searchQuery !== debouncedQuery;

  const getItemLayout = useCallback((data, index) => ({
    length: 68,
    offset: 68 * index,
    index,
  }), []);

  const renderItemSeparator = useCallback(() => (
    <View style={styles.placeItemSeparator} />
  ), []);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
          pointerEvents="box-none"
        >
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                {step === 2 && (
                  <Pressable
                    onPress={handleBackToSearch}
                    hitSlop={8}
                    style={styles.backBtn}
                    accessibilityLabel="Quay lại tìm kiếm"
                  >
                    <MaterialIcons name="arrow-back" size={20} color={T.ink} />
                  </Pressable>
                )}
                <MaterialIcons
                  name={step === 1 ? "search" : "edit-calendar"}
                  size={18}
                  color={T.ink}
                />
                <Text style={styles.sheetTitle}>
                  {step === 1 ? "Thêm địa điểm vào chuyến đi" : "Lên lịch trình"}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={styles.closeBtn}
                accessibilityLabel="Đóng modal"
              >
                <MaterialIcons name="close" size={18} color={T.muted48} />
              </Pressable>
            </View>

            {/* STEP 1: SEARCH PLACE */}
            {step === 1 && (
              <View style={styles.stepContainer}>
                {/* Search Bar */}
                <View style={styles.searchBarWrap}>
                  <MaterialIcons name="search" size={20} color={T.muted48} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Tìm theo tên địa điểm..."
                    placeholderTextColor={T.muted48}
                    style={styles.searchInput}
                    returnKeyType="search"
                    autoFocus
                  />
                  {searchQuery.length > 0 && (
                    <Pressable
                      onPress={() => setSearchQuery("")}
                      hitSlop={8}
                      accessibilityLabel="Xóa nội dung tìm kiếm"
                    >
                      <MaterialIcons name="cancel" size={16} color={T.muted48} />
                    </Pressable>
                  )}
                </View>

                {/* Results list */}
                {isSearchLoading ? (
                  <View style={styles.centerLoading}>
                    <ActivityIndicator size="small" color={T.ink} />
                    <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
                  </View>
                ) : searchQuery.trim().length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <MaterialIcons name="search" size={32} color={T.muted48} />
                    <Text style={styles.emptyTitle}>Nhập từ khóa</Text>
                    <Text style={styles.emptyDesc}>Tìm kiếm địa điểm du lịch tại Cần Thơ</Text>
                  </View>
                ) : places.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <MaterialIcons name="search-off" size={32} color={T.muted48} />
                    <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
                    <Text style={styles.emptyDesc}>Vui lòng thử từ khóa khác</Text>
                  </View>
                ) : (
                  <FlatList
                    data={places}
                    keyExtractor={(item) => String(item.id)}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    style={styles.list}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    getItemLayout={getItemLayout}
                    ItemSeparatorComponent={renderItemSeparator}
                    renderItem={({ item }) => {
                      const imageUri = resolvePlaceImageUri(item) || getCategoryPlaceholder(item.category?.name || item.category);
                      return (
                        <Pressable
                          style={styles.placeItem}
                          onPress={() => handleSelectPlace(item)}
                          accessibilityLabel={`Chọn địa điểm ${item.name}`}
                        >
                          {imageUri ? (
                            <Image
                              source={{ uri: imageUri }}
                              style={styles.placeThumb}
                              contentFit="cover"
                            />
                          ) : (
                            <View style={styles.placeThumbFallback}>
                              <MaterialIcons name="place" size={18} color={T.muted48} />
                            </View>
                          )}
                          <View style={styles.placeInfo}>
                            <Text style={styles.placeName} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={styles.placeAddress} numberOfLines={1}>
                              {item.address || "Cần Thơ"}
                            </Text>
                          </View>
                          <MaterialIcons name="chevron-right" size={20} color={T.muted48} />
                        </Pressable>
                      );
                    }}
                  />
                )}
              </View>
            )}

            {/* STEP 2: CONFIGURE FORM */}
            {step === 2 && selectedPlace && (
              <>
                <ScrollView
                  style={[styles.scrollArea, { maxHeight: screenHeight * 0.45 }]}
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {/* Place Summary */}
                  <View style={styles.placeSummary}>
                    <Text style={styles.summaryTitle} numberOfLines={1}>
                      {selectedPlace.name}
                    </Text>
                    <Text style={styles.summaryAddress} numberOfLines={1}>
                      {selectedPlace.address || "Cần Thơ"}
                    </Text>
                  </View>

                  {/* Day selector */}
                  <View style={styles.fieldFull}>
                    <Text style={styles.label}>Chọn ngày</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.dayChips}
                    >
                      {Array.from({ length: totalDays || 1 }).map((_, idx) => {
                        const dayVal = idx + 1;
                        const isActive = dayNumber === dayVal;
                        return (
                          <Pressable
                            key={dayVal}
                            style={[styles.dayChip, isActive && styles.dayChipActive]}
                            onPress={() => setDayNumber(dayVal)}
                            accessibilityLabel={`Chọn ngày ${dayVal}`}
                          >
                            <Text style={[styles.dayChipText, isActive && styles.dayChipTextActive]}>
                              Ngày {dayVal}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Time range */}
                  <View style={styles.row}>
                    <TimeField
                      label="Thời gian bắt đầu"
                      value={startTime}
                      onChange={setStartTime}
                      placeholder="--:--"
                      icon="play-circle-outline"
                    />
                    <TimeField
                      label="Thời gian kết thúc"
                      value={endTime}
                      onChange={setEndTime}
                      placeholder="--:--"
                      icon="stop-circle"
                    />
                  </View>

                  {/* Di chuyển đến điểm tiếp theo */}
                  {hasExistingDestinations ? (
                    <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(0,0,0,0.08)", paddingTop: 14, marginTop: 4 }}>
                      <Text style={styles.sectionHeaderLabel}>Di chuyển đến địa điểm này</Text>
                      
                      <View style={styles.fieldFull}>
                        <Text style={styles.label}>Phương tiện</Text>
                        <View style={styles.transportRow}>
                          {TRANSPORT_OPTIONS.map((opt) => {
                            const isSelected = transportToNext === opt.value;
                            return (
                              <Pressable
                                key={opt.label || "other"}
                                onPress={() => setTransportToNext(opt.value)}
                                style={[
                                  styles.transportOption,
                                  isSelected && styles.transportOptionActive
                                ]}
                              >
                                <MaterialIcons
                                  name={opt.icon}
                                  size={16}
                                  color={isSelected ? "#FFFFFF" : "rgba(0,0,0,0.6)"}
                                />
                                <Text style={[
                                  styles.transportLabel,
                                  isSelected && styles.transportLabelActive
                                ]}>
                                  {opt.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  ) : null}

                  {/* Note */}
                  <View style={styles.fieldFull}>
                    <Text style={styles.label}>Ghi chú hành trình</Text>
                    <TextInput
                      style={[styles.inputEditable, styles.noteInput]}
                      value={note}
                      onChangeText={setNote}
                      placeholder="Nhập lưu ý hoặc kế hoạch ăn uống, chụp ảnh tại đây..."
                      placeholderTextColor={T.muted48}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Error message */}
                  {errorMsg ? (
                    <View style={styles.errorContainer}>
                      <MaterialIcons name="error-outline" size={16} color={T.danger} />
                      <Text style={styles.errorText}>{errorMsg}</Text>
                    </View>
                  ) : null}
                </ScrollView>

                {/* Action Buttons */}
                <View style={styles.footer}>
                  <TouchableOpacity
                    onPress={handleAdd}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                    style={[styles.savePill, isSubmitting && styles.saveBtnDisabled]}
                    accessibilityLabel="Thêm vào lịch trình chuyến đi"
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.savePillText}>Tạo</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "flex-end",
    width: "100%",
  },
  sheet: {
    backgroundColor: T.canvas,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    width: "100%",
    flexDirection: "column",
    flexShrink: 1,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: APPLE_THEME.borderSoft,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: APPLE_THEME.borderSoft,
  },
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: TOKENS.font.semibold,
    color: T.ink,
    letterSpacing: -0.3,
  },
  backBtn: {
    paddingRight: 6,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    flexShrink: 1,
  },
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.parchment,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
    borderWidth: 1,
    borderColor: APPLE_THEME.borderSoft,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: TOKENS.font.body,
    color: T.ink,
  },
  list: {
    maxHeight: 340,
  },
  placeItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  placeItemSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: APPLE_THEME.borderSoft,
  },
  placeThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: T.parchment,
  },
  placeThumbFallback: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: T.parchment,
    alignItems: "center",
    justifyContent: "center",
  },
  placeInfo: {
    flex: 1,
    gap: 2,
  },
  placeName: {
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
    color: T.ink,
  },
  placeAddress: {
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    color: T.muted48,
  },
  centerLoading: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: TOKENS.font.body,
    color: T.muted48,
  },
  emptyWrap: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    color: T.ink,
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: TOKENS.font.body,
    color: T.muted48,
  },
  scrollArea: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 16,
  },
  placeSummary: {
    gap: 4,
    backgroundColor: T.parchment,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: APPLE_THEME.borderSoft,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: TOKENS.font.semibold,
    color: T.ink,
  },
  summaryAddress: {
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    color: T.muted48,
  },
  fieldFull: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    color: T.muted48,
    fontFamily: TOKENS.font.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dayChips: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: T.parchment,
    borderWidth: 1,
    borderColor: APPLE_THEME.borderSoft,
  },
  dayChipActive: {
    backgroundColor: T.ink,
    borderColor: T.ink,
  },
  dayChipText: {
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    color: T.ink,
  },
  dayChipTextActive: {
    color: T.canvas,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  field: {
    flex: 1,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    color: T.muted48,
    fontFamily: TOKENS.font.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timeInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: T.parchment,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: APPLE_THEME.borderSoft,
  },
  inputText: {
    fontSize: 15,
    color: T.ink,
    fontFamily: TOKENS.font.body,
  },
  placeholder: {
    color: T.muted48,
  },
  inputEditable: {
    backgroundColor: T.parchment,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: T.ink,
    fontFamily: TOKENS.font.body,
    borderWidth: 1,
    borderColor: APPLE_THEME.borderSoft,
  },
  noteInput: {
    minHeight: 80,
  },
  transportRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 4,
  },
  transportOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: T.parchment,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: APPLE_THEME.borderSoft,
  },
  transportOptionActive: {
    backgroundColor: T.ink,
    borderColor: T.ink,
  },
  transportLabel: {
    fontSize: 13,
    color: T.ink,
    fontFamily: TOKENS.font.semibold,
    opacity: 0.6,
  },
  transportLabelActive: {
    color: T.canvas,
    opacity: 1,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 13,
    fontFamily: TOKENS.font.body,
    color: T.danger,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.07)",
    backgroundColor: T.canvas,
    flexShrink: 0,
  },
  savePill: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1D1D1F",
    alignItems: "center",
    justifyContent: "center",
  },
  savePillText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  saveBtnDisabled: {
    opacity: 0.5,
    backgroundColor: "#1D1D1F",
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: T.canvas,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: APPLE_THEME.borderSoft,
  },
  pickerTitle: {
    fontSize: 16,
    fontFamily: TOKENS.font.semibold,
    color: T.ink,
  },
  pickerDone: {
    fontSize: 16,
    color: T.ink,
    fontFamily: TOKENS.font.semibold,
  },
});

export default memo(InlineAddPlaceModal);
