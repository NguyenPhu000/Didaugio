import { memo, useState, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
import { MaterialIconsRounded } from "../../../../components/primitives/MaterialIconsRounded";
import { useQueryClient } from "@tanstack/react-query";
import { useExplore } from "../../../explore/hooks/useExplore";
import { useSavedPlacesCached } from "../../../saved/hooks/useSavedOffline";
import { addDestinationApi } from "../../api/tripsApi";
import { QUERY_KEYS } from "../../../../constants/query-keys";
import {
  resolvePlaceImageUri,
  getCategoryPlaceholder,
} from "../../../../lib/media-url";
import { Image } from "expo-image";
import { TRANSPORT_OPTIONS } from "../../utils/tripHelpers";
import { STYLES, T, ALPHA } from "../../utils/tripDetailTokens";
import { cn } from "../../../../lib/cn";
import TimeField from "./TimeField";

const isNewArchitectureEnabled = global?.nativeFabricUIManager != null;
if (
  Platform.OS === "android" &&
  !isNewArchitectureEnabled &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function InlineAddPlaceModal({
  visible,
  tripId,
  totalDays,
  defaultDay,
  destinations,
  onClose,
}) {
  const { t } = useTranslation();
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

  const {
    data: exploreData,
    isLoading,
    isFetching,
  } = useExplore({
    search: debouncedQuery,
    enabled: searchEnabled,
  });

  const {
    data: popularData,
    isLoading: isPopularLoading,
    isFetching: isPopularFetching,
  } = useExplore({
    sortBy: "popular",
    enabled: visible,
  });

  const places = useMemo(() => {
    return exploreData?.pages.flatMap((page) => page?.data || []) ?? [];
  }, [exploreData]);

  const popularPlaces = useMemo(() => {
    return popularData?.pages.flatMap((page) => page?.data || []) ?? [];
  }, [popularData]);

  const { data: savedPlaces = [] } = useSavedPlacesCached(visible);

  const normalizedSavedPlaces = useMemo(() => {
    return (savedPlaces || []).map((item) => item?.place || item).filter((p) => p && p.id);
  }, [savedPlaces]);

  const mergedPlaces = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    
    // 1. Lọc địa điểm đã lưu tại client
    let filteredSaved = [];
    if (query) {
      filteredSaved = normalizedSavedPlaces.filter((p) =>
        p.name?.toLowerCase().includes(query) ||
        p.address?.toLowerCase().includes(query)
      );
    } else {
      filteredSaved = normalizedSavedPlaces;
    }

    // Saved places stay first because they reflect explicit user intent.
    const savedIds = new Set(filteredSaved.map((p) => String(p.id)));
    const allSavedIds = new Set(normalizedSavedPlaces.map((p) => String(p.id)));
    const markedSaved = filteredSaved.map((p) => ({
      ...p,
      isSavedLocal: true,
      sourceRank: 0,
    }));

    // Popular places fill the default view and stay above generic search results.
    const popularMatches = popularPlaces
      .filter((p) => {
        if (!p?.id || savedIds.has(String(p.id))) return false;
        if (!query) return true;
        return (
          p.name?.toLowerCase().includes(query) ||
          p.address?.toLowerCase().includes(query)
        );
      })
      .map((p) => ({
        ...p,
        isSavedLocal: allSavedIds.has(String(p.id)),
        isSuggestedLocal: true,
        sourceRank: 1,
      }));
    const usedIds = new Set([
      ...markedSaved.map((p) => String(p.id)),
      ...popularMatches.map((p) => String(p.id)),
    ]);
    const filteredServer = query
      ? places
          .filter((p) => p?.id && !usedIds.has(String(p.id)))
          .map((p) => ({
            ...p,
            isSavedLocal: allSavedIds.has(String(p.id)),
            sourceRank: 2,
          }))
      : [];

    return [...markedSaved, ...popularMatches, ...filteredServer];
  }, [searchQuery, normalizedSavedPlaces, popularPlaces, places]);

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
      const serverMessage = err?.response?.data?.message;
      setErrorMsg(serverMessage || err?.message || t('inlineAddPlace.addError'));
      setIsSubmitting(false); // Reset submitting state on error
    }
  }, [
    selectedPlace,
    dayNumber,
    startTime,
    endTime,
    note,
    transportToNext,
    tripId,
    queryClient,
    onClose,
    isSubmitting,
    t,
  ]);

  const isSearchLoading =
    isLoading ||
    isFetching ||
    isPopularLoading ||
    isPopularFetching ||
    searchQuery !== debouncedQuery;

  const getItemLayout = useCallback(
    (data, index) => ({
      length: 68,
      offset: 68 * index,
      index,
    }),
    [],
  );

  const renderItemSeparator = useCallback(
    () => <View className="h-[0.5px] bg-black/[0.06]" />,
    [],
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable style={StyleSheet.absoluteFillObject} className="bg-black/45" onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
          className="flex-1 justify-end w-full"
          pointerEvents="box-none"
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View
            className="bg-white rounded-t-[24px] max-h-[85%] w-full flex-col flex-shrink relative"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            {/* View nền trắng mở rộng xuống đáy để che phủ khoảng trống khi đẩy modal lên */}
            <View style={{ position: "absolute", bottom: -500, left: 0, right: 0, height: 500, backgroundColor: "#FFFFFF" }} />

            <View className="w-9 h-1 rounded-full bg-black/12 self-center mt-2.5 mb-1" />

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-3 border-b border-black/[0.07]">
              <View className="flex-row items-center gap-2 flex-1 marginRight-2">
                {step === 2 && (
                  <Pressable
                    onPress={handleBackToSearch}
                    hitSlop={8}
                    className="pr-1.5"
                    accessibilityLabel={t('inlineAddPlace.backToSearch')}
                  >
                    <MaterialIconsRounded name="arrow-back" size={20} color={T.ink} />
                  </Pressable>
                )}
                <MaterialIconsRounded
                  name={step === 1 ? "search" : "edit-calendar"}
                  size={18}
                  color={T.ink}
                />
                <Text className="text-[16px] font-semibold text-ink tracking-tight">
                  {step === 1
                    ? t('inlineAddPlace.addPlaceToTrip')
                    : t('inlineAddPlace.addToItinerary')}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                className="w-8 h-8 rounded-full items-center justify-center"
                accessibilityLabel={t('inlineAddPlace.closeModal')}
              >
                <MaterialIconsRounded name="close" size={18} color={ALPHA.iconStrong} />
              </Pressable>
            </View>

            {/* STEP 1: SEARCH PLACE */}
            {step === 1 && (
              <View className="px-5 pt-4 gap-3 flex-shrink">
                {/* Search Bar */}
                <View className="flex-row items-center bg-[#F5F5F7] rounded-xl px-3 h-11 gap-2 border border-black/[0.06]">
                  <MaterialIconsRounded name="search" size={20} color={ALPHA.iconStrong} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={t('inlineAddPlace.searchPlaceholder')}
                    placeholderTextColor="rgba(0,0,0,0.4)"
                    className="flex-1 text-[15px] font-normal text-ink"
                    returnKeyType="search"
                    autoFocus
                  />
                  {searchQuery.length > 0 && (
                    <Pressable
                      onPress={() => setSearchQuery("")}
                      hitSlop={8}
                      accessibilityLabel={t('inlineAddPlace.clearSearch')}
                    >
                      <MaterialIconsRounded
                        name="cancel"
                        size={16}
                        color={ALPHA.iconStrong}
                      />
                    </Pressable>
                  )}
                </View>

                {/* Results list */}
                {mergedPlaces.length === 0 && !isSearchLoading ? (
                  <View className="py-14 items-center gap-2">
                    <MaterialIconsRounded
                      name={searchQuery.trim().length === 0 ? "travel-explore" : "search-off"}
                      size={32}
                      color={ALPHA.iconStrong}
                    />
                    <Text className="text-[15px] font-semibold text-ink">
                      {searchQuery.trim().length === 0
                        ? t('inlineAddPlace.noSuggestions')
                        : t('inlineAddPlace.noResults')}
                    </Text>
                    <Text className="text-[13px] font-normal text-black/50">
                      {searchQuery.trim().length === 0
                        ? t('inlineAddPlace.searchDesc')
                        : t('inlineAddPlace.tryDifferentKeyword')}
                    </Text>
                  </View>
                ) : (
                  <View className="flex-shrink max-h-[340px]">
                    {isSearchLoading && (
                      <View className="flex-row items-center justify-center py-2 gap-2 bg-[#F5F5F7]/85 rounded-xl mb-2 border border-black/[0.04]">
                        <ActivityIndicator size="small" color={T.ink} />
                        <Text className="text-[12px] text-black/50 font-normal">{t('inlineAddPlace.searchingSystem')}</Text>
                      </View>
                    )}
                    <FlatList
                      data={mergedPlaces}
                      keyExtractor={(item) => String(item.id)}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                      initialNumToRender={10}
                      maxToRenderPerBatch={10}
                      getItemLayout={getItemLayout}
                      ItemSeparatorComponent={renderItemSeparator}
                      ListHeaderComponent={
                        searchQuery.trim() === "" ? (
                          <View className="pb-2 pt-1">
                            <Text className="text-[11px] font-bold text-black/35 uppercase tracking-wider">
                              {normalizedSavedPlaces.length > 0
                                ? t('inlineAddPlace.savedAndSuggested')
                                : t('inlineAddPlace.suggestedPlaces')}
                            </Text>
                          </View>
                        ) : null
                      }
                      renderItem={({ item }) => {
                        const imageUri =
                          resolvePlaceImageUri(item) ||
                          getCategoryPlaceholder(
                            item.category?.name || item.category,
                          );
                        return (
                          <Pressable
                            className="flex-row items-center py-3 gap-3"
                            onPress={() => handleSelectPlace(item)}
                            accessibilityLabel={`Chọn địa điểm ${item.name}`}
                          >
                            {imageUri ? (
                              <Image
                                source={{ uri: imageUri }}
                                style={{ width: 44, height: 44, borderRadius: 10 }}
                                contentFit="cover"
                              />
                            ) : (
                              <View className="w-11 h-11 rounded-lg bg-[#F5F5F7] items-center justify-center">
                                <MaterialIconsRounded
                                  name="place"
                                  size={18}
                                  color={ALPHA.iconStrong}
                                />
                              </View>
                            )}
                            <View className="flex-1 gap-0.5">
                              <View className="flex-row items-center gap-1.5 flex-1">
                                <Text className="text-[14px] font-semibold text-ink flex-shrink" numberOfLines={1}>
                                  {item.name}
                                </Text>
                                {item.isSavedLocal && (
                                  <MaterialIconsRounded name="bookmark" size={14} color={T.warning} />
                                )}
                                {!item.isSavedLocal && item.isSuggestedLocal && (
                                  <MaterialIconsRounded name="local-fire-department" size={14} color={T.warning} />
                                )}
                              </View>
                              <Text className="text-[12px] font-normal text-black/50" numberOfLines={1}>
                                {item.address || t('inlineAddPlace.canTho')}
                              </Text>
                            </View>
                            <MaterialIconsRounded
                              name="chevron-right"
                              size={20}
                              color={ALPHA.iconStrong}
                            />
                          </Pressable>
                        );
                      }}
                    />
                  </View>
                )}
              </View>
            )}

            {/* STEP 2: CONFIGURE FORM */}
            {step === 2 && selectedPlace && (
              <>
                <ScrollView
                  style={{ maxHeight: screenHeight * 0.45 }}
                  className="flex-shrink"
                  contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, gap: 16 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {/* Place Summary */}
                  <View className="gap-1 bg-[#F5F5F7] p-3.5 rounded-2xl border border-black/[0.06]">
                    <Text className="text-[16px] font-semibold text-ink" numberOfLines={1}>
                      {selectedPlace.name}
                    </Text>
                    <Text className="text-[12px] font-normal text-black/50" numberOfLines={1}>
                      {selectedPlace.address || t('inlineAddPlace.canTho')}
                    </Text>
                  </View>

                  {/* Day selector */}
                  <View className="gap-1.5">
                    <Text className={STYLES.fieldLabel}>{t('inlineAddPlace.selectDay')}</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ flexDirection: "row", gap: 8, paddingVertical: 4 }}
                    >
                      {Array.from({ length: totalDays || 1 }).map((_, idx) => {
                        const dayVal = idx + 1;
                        const isActive = dayNumber === dayVal;
                        return (
                          <Pressable
                            key={dayVal}
                            className={cn(
                              "px-4 py-2.5 rounded-xl border-[1.5px] border-transparent",
                              isActive ? "bg-ink" : "bg-[#F5F5F7]",
                            )}
                            onPress={() => setDayNumber(dayVal)}
                            accessibilityLabel={t('inlineAddPlace.selectDay') + ` ${dayVal}`}
                          >
                            <Text
                              className={cn(
                                "text-[13px] font-semibold",
                                isActive ? "text-white" : "text-ink",
                              )}
                            >
                              {t('inlineAddPlace.dayLabel', { number: dayVal })}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Time range */}
                  <View className="flex-row gap-3">
                    <TimeField
                      label={t('inlineAddPlace.startTime')}
                      value={startTime}
                      onChange={setStartTime}
                      placeholder="--:--"
                      icon="play-circle-outline"
                    />
                    <TimeField
                      label={t('inlineAddPlace.endTime')}
                      value={endTime}
                      onChange={setEndTime}
                      placeholder="--:--"
                      icon="stop-circle"
                    />
                  </View>

                  {/* Di chuyển đến điểm tiếp theo */}
                  {hasExistingDestinations ? (
                    <View className="pt-4 mt-1 border-t border-black/[0.08]">
                      <Text className={STYLES.sectionLabel}>
                        {t('inlineAddPlace.moveToPlace')}
                      </Text>

                      <View className="gap-1.5">
                        <Text className={STYLES.fieldLabel}>{t('inlineAddPlace.transport')}</Text>
                        <View className="flex-row gap-2 flex-wrap mt-1">
                          {TRANSPORT_OPTIONS.map((opt) => {
                            const isSelected = transportToNext === opt.value;
                            return (
                              <Pressable
                                key={opt.label || "other"}
                                onPress={() => setTransportToNext(opt.value)}
                                className={`${STYLES.chip} ${isSelected ? STYLES.chipActive : ""}`}
                              >
                                <MaterialIconsRounded
                                  name={opt.icon}
                                  size={16}
                                  color={isSelected ? T.ink : ALPHA.iconStrong}
                                />
                                <Text
                                  className={cn(
                                    "text-[13px] font-semibold text-ink",
                                    isSelected ? "opacity-100" : "opacity-60",
                                  )}
                                >
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
                  <View className="gap-1.5">
                    <Text className={STYLES.fieldLabel}>{t('inlineAddPlace.tripNotes')}</Text>
                    <TextInput
                      className={`${STYLES.field} min-h-[80px]`}
                      value={note}
                      onChangeText={setNote}
                      placeholder={t('inlineAddPlace.notesPlaceholder')}
                      placeholderTextColor={ALPHA.iconStrong}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Error message */}
                  {errorMsg ? (
                    <View className="flex-row items-center gap-1.5 px-1">
                      <MaterialIconsRounded name="error-outline" size={16} color={T.danger} />
                      <Text className="text-[13px] font-normal" style={{ color: T.danger }}>{errorMsg}</Text>
                    </View>
                  ) : null}
                </ScrollView>

                {/* Action Buttons */}
                <View className={STYLES.sheetFooter}>
                  <TouchableOpacity
                    onPress={handleAdd}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                    className={`${STYLES.submitBtn} ${isSubmitting ? "opacity-50" : ""}`}
                    accessibilityLabel={t('inlineAddPlace.addToItineraryAccessibility')}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={T.onPrimary} />
                    ) : (
                      <Text className={STYLES.submitBtnText}>{t('inlineAddPlace.create')}</Text>
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

export default memo(InlineAddPlaceModal);
