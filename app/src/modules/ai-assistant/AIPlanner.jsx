import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Keyboard,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { LinearGradient } from "expo-linear-gradient";
import { useAIPlanner } from "../ai/hooks/useAIPlanner";
import { TOKENS } from "../../constants/design-tokens";
import { PlacePreviewCard } from "../../components/composed/PlacePreviewCard";
import { TAB_BAR_HEIGHT } from "../../../app/(tabs)/_layout";
import CustomAlertModal from "../../components/composed/CustomAlertModal";

const QUICK_SUGGESTIONS = [
  { text: "Gợi ý quán ăn ngon ở Ninh Kiều", icon: "restaurant", color: "#F59E0B" },
  { text: "Top 5 điểm chụp ảnh đẹp", icon: "photo-camera", color: "#EC4899" },
  { text: "Kế hoạch buổi tối Cần Thơ", icon: "nightlife", color: "#8B5CF6" },
  { text: "Đi chơi gia đình 1 ngày", icon: "family-restroom", color: "#10B981" },
  { text: "Cà phê view đẹp gần trung tâm", icon: "local-cafe", color: "#3B82F6" },
];

const ACCENT = "#3478F6";

export function AIPlanner() {
  const [inputText, setInputText] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "error",
    confirmText: "Đóng",
    cancelText: "Hủy",
    onConfirm: null,
    onCancel: null,
    isDestructive: false,
  });

  const showAlert = useCallback(({ title, message, type = "error", confirmText, cancelText, onConfirm, onCancel, isDestructive = false }) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      onConfirm: () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        onConfirm?.();
      },
      onCancel: onCancel ? () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        onCancel?.();
      } : null,
      isDestructive,
    });
  }, []);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const {
    messages,
    isLoading,
    isPreviewLoading,
    isConfirming,
    error,
    sendMessage,
    draftPlan,
    selectedPlaceIds,
    togglePlaceSelection,
    selectAllPlaces,
    clearSelectedPlaces,
    confirmSelectedPlaces,
    canConfirmSelection,
    reset,
  } = useAIPlanner();

  const isCompactCard = width <= 380 || height <= 720;

  const handleSend = useCallback(
    async (text) => {
      const message = (text ?? inputText).trim();
      if (!message || isLoading) return;
      setInputText("");
      await sendMessage(message);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    },
    [inputText, isLoading, sendMessage],
  );

  const handleConfirmSelection = useCallback(async () => {
    if (!canConfirmSelection || isConfirming) return;
    await confirmSelectedPlaces();
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  }, [canConfirmSelection, confirmSelectedPlaces, isConfirming]);

  const handleOpenPlace = useCallback(
    (place) => {
      const normalizedId = Number(place?.id);
      if (!normalizedId) return;
      router.push(`/place/${normalizedId}`);
    },
    [router],
  );

  const handleTogglePlace = useCallback(
    (place) => {
      togglePlaceSelection(place?.id);
    },
    [togglePlaceSelection],
  );

  const handleAddPlaceToTrip = useCallback(
    (place) => {
      const normalizedId = Number(place?.id);
      if (!normalizedId || selectedPlaceIds.includes(normalizedId)) return;
      togglePlaceSelection(normalizedId);
    },
    [selectedPlaceIds, togglePlaceSelection],
  );

  const hasMessages = messages.length > 0;
  const canSend = inputText.trim().length > 0 && !isLoading;
  const hasPlannerHistory = hasMessages || !!draftPlan;

  const handleClearPlannerHistory = useCallback(() => {
    if (!hasPlannerHistory || isLoading) return;

    showAlert({
      title: "Xóa lịch sử Planner?",
      message: "Toàn bộ hội thoại, kế hoạch lịch trình đề xuất và lựa chọn địa điểm sẽ bị xóa trên thiết bị này.",
      type: "confirm",
      confirmText: "Xóa",
      cancelText: "Hủy",
      isDestructive: true,
      onConfirm: () => {
        reset();
        setInputText("");
        setTimeout(
          () => scrollRef.current?.scrollTo({ y: 0, animated: true }),
          60,
        );
      },
      onCancel: () => {},
    });
  }, [hasPlannerHistory, isLoading, reset, showAlert]);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      {/* Premium Header */}
      <View
        className="flex-row items-center justify-between px-5 pb-3 bg-white border-b border-slate-100 shadow-sm"
        style={{ paddingTop: Math.max(insets.top, 8) }}
      >
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center border border-blue-100 shadow-inner">
            <MaterialIconsRounded name="assistant" size={22} color="#3478F6" />
          </View>
          <View>
            <Text
              style={{ fontFamily: TOKENS.font.semibold }}
              className="text-[15.5px] text-slate-800 leading-tight"
            >
              Trợ lý du lịch Nhi
            </Text>
            <View className="flex-row items-center gap-1 mt-1">
              <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <Text
                style={{ fontFamily: TOKENS.font.medium }}
                className="text-[10px] text-slate-400"
              >
                Sẵn sàng trợ giúp
              </Text>
            </View>
          </View>
        </View>

        {hasPlannerHistory && (
          <Pressable
            onPress={handleClearPlannerHistory}
            disabled={isLoading}
            className={`w-9 h-9 rounded-full items-center justify-center active:bg-slate-100 ${
              isLoading ? "opacity-40" : ""
            }`}
          >
            <MaterialIconsRounded name="delete-sweep" size={22} color="#64748B" />
          </Pressable>
        )}
      </View>

      {/* ── Messages area ── */}
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 24,
          flexGrow: !hasMessages ? 1 : undefined,
          justifyContent: !hasMessages ? "center" : undefined,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: false })
        }
      >
        {!hasMessages ? (
          /* ── Empty state ── */
          <View className="items-center px-6 py-8">
            <LinearGradient
              colors={["#EFF6FF", "#DBEAFE"]}
              className="w-16 h-16 rounded-3xl items-center justify-center shadow-inner mb-5 rotate-3"
            >
              <MaterialIconsRounded name="auto-awesome" size={28} color="#3478F6" />
            </LinearGradient>
            <Text
              style={{ fontFamily: TOKENS.font.heading }}
              className="text-2xl text-slate-900 text-center mb-2"
            >
              Lên kế hoạch du lịch
            </Text>
            <Text
              style={{ fontFamily: TOKENS.font.body }}
              className="text-[13.5px] leading-5 text-slate-505 text-slate-500 text-center max-w-[280px] mb-8"
            >
              Mình có thể giúp bạn tìm địa điểm ăn uống, vui chơi và sắp xếp lịch trình Cần Thơ tự động!
            </Text>

            <View className="w-full gap-2.5">
              {QUICK_SUGGESTIONS.map((item) => (
                <Pressable
                  key={item.text}
                  onPress={() => handleSend(item.text)}
                  className="flex-row items-center gap-3.5 px-4 py-4 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:bg-slate-50"
                >
                  <View
                    className="w-8 h-8 rounded-xl items-center justify-center"
                    style={{ backgroundColor: item.color + "15" }}
                  >
                    <MaterialIconsRounded name={item.icon} size={16} color={item.color} />
                  </View>
                  <Text
                    style={{ fontFamily: TOKENS.font.medium }}
                    className="flex-1 text-[13.5px] text-slate-700"
                  >
                    {item.text}
                  </Text>
                  <MaterialIconsRounded name="chevron-right" size={16} color="#CBD5E1" />
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          /* ── Conversation ── */
          <View className="gap-4">
            {messages.map((message, index) => {
              const isUser = message.role === "user";
              return (
                <View
                  key={message.id ?? index}
                  className={`gap-1.5 ${isUser ? "items-end" : "items-start"}`}
                >
                  {!isUser ? (
                    <View className="flex-row items-center gap-1.5 ml-1">
                      <View className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <Text
                        style={{ fontFamily: TOKENS.font.semibold }}
                        className="text-slate-400 text-[10px] tracking-wider uppercase"
                      >
                        Nhi (AI)
                      </Text>
                    </View>
                  ) : null}

                  <View
                    className={`max-w-[85%] px-4 py-3.5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${
                      isUser
                        ? "bg-[#3478F6] rounded-tr-none"
                        : "bg-white border border-slate-100 rounded-tl-none"
                    }`}
                  >
                    <Text
                      style={{
                        fontFamily: isUser ? TOKENS.font.medium : TOKENS.font.body,
                      }}
                      className={`text-[14.5px] leading-[22px] ${
                        isUser ? "text-white" : "text-slate-800"
                      }`}
                    >
                      {message.text ?? message.content}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {draftPlan?.suggestedPlaces?.length ? (
          <View className="mt-4 p-4 rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] gap-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text
                  style={{ fontFamily: TOKENS.font.semibold }}
                  className="text-[14.5px] text-slate-900"
                >
                  Chọn địa điểm bạn muốn
                </Text>
                <Text
                  style={{ fontFamily: TOKENS.font.body }}
                  className="mt-0.5 text-xs text-slate-400"
                >
                  Đang chọn {selectedPlaceIds.length}/{draftPlan.suggestedPlaces.length} địa điểm
                </Text>
              </View>

              <View className="flex-row items-center gap-1.5">
                <Pressable
                  onPress={selectAllPlaces}
                  className="px-3 py-1.5 rounded-full border border-slate-100 bg-slate-50 active:bg-slate-100"
                >
                  <Text
                    style={{ fontFamily: TOKENS.font.semibold }}
                    className="text-[11px] text-blue-600"
                  >
                    Chọn hết
                  </Text>
                </Pressable>
                <Pressable
                  onPress={clearSelectedPlaces}
                  className="px-3 py-1.5 rounded-full border border-slate-100 bg-slate-50 active:bg-slate-100"
                >
                  <Text
                    style={{ fontFamily: TOKENS.font.semibold }}
                    className="text-[11px] text-slate-500"
                  >
                    Bỏ chọn
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className="gap-3">
              {draftPlan.suggestedPlaces.map((place, index) => {
                const placeId = Number(place?.id);
                const isSelected = selectedPlaceIds.includes(placeId);

                return (
                  <PlacePreviewCard
                    key={placeId || `${place?.name || "place"}-${index}`}
                    place={place}
                    compact={isCompactCard}
                    selected={isSelected}
                    showCloseButton={false}
                    showSelectionAction
                    showAddToTripAction
                    selectedLabel="Đã chọn"
                    unselectedLabel="Chọn địa điểm"
                    addToTripLabel={isSelected ? "Đã thêm" : "Thêm chuyến đi"}
                    detailLabel="Chi tiết"
                    onViewDetail={handleOpenPlace}
                    onToggleSelection={handleTogglePlace}
                    onAddToTrip={handleAddPlaceToTrip}
                  />
                );
              })}
            </View>

            <Pressable
              onPress={handleConfirmSelection}
              disabled={!canConfirmSelection || isConfirming}
              className="mt-1 rounded-2xl overflow-hidden active:opacity-95"
            >
              <LinearGradient
                colors={
                  !canConfirmSelection || isConfirming
                    ? ["#E2E8F0", "#E2E8F0"]
                    : ["#3478F6", "#1E3A8A"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-[52px] flex-row items-center justify-center gap-2 px-4"
              >
                {isConfirming ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <MaterialIconsRounded
                    name="auto-awesome-motion"
                    size={18}
                    color={
                      !canConfirmSelection || isConfirming
                        ? "#94A3B8"
                        : "#FFFFFF"
                    }
                  />
                )}
                <Text
                  style={{ fontFamily: TOKENS.font.semibold }}
                  className={`text-[14.5px] ${
                    !canConfirmSelection || isConfirming
                      ? "text-slate-400"
                      : "text-white"
                  }`}
                >
                  Tạo lịch trình từ lựa chọn
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : null}

        {isLoading ? (
          <View className="flex-row items-center gap-2.5 self-start px-4 py-3 mt-2 rounded-2xl bg-white border border-slate-100 shadow-sm rounded-tl-none">
            <ActivityIndicator size="small" color={ACCENT} />
            <Text
              style={{ fontFamily: TOKENS.font.medium }}
              className="text-slate-600 text-[13.5px]"
            >
              {isConfirming
                ? "Đang tạo chuyến đi..."
                : isPreviewLoading
                  ? "Đang gợi ý địa điểm..."
                  : "Đang xử lý..."}
            </Text>
          </View>
        ) : null}

        {error ? (
          <View className="flex-row items-center gap-2 self-center mt-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-150">
            <MaterialIconsRounded name="error-outline" size={14} color="#EF4444" />
            <Text
              style={{ fontFamily: TOKENS.font.medium }}
              className="flex-1 text-red-500 text-xs ml-1"
            >
              {error}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* ── Input bar ── */}
      <View
        className="px-4 pt-2 bg-transparent"
        style={{
          paddingBottom: keyboardVisible
            ? 8
            : Math.max(insets.bottom, 8) + TAB_BAR_HEIGHT,
        }}
      >
        <View className="flex-row items-end gap-2.5 px-3 py-2.5 rounded-[26px] bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <TextInput
            ref={inputRef}
            placeholder="Mô tả kế hoạch bạn muốn..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            className="flex-1 min-h-[38px] max-h-[100px] px-2 py-1 text-[14.5px] text-slate-800"
            style={{
              fontFamily: TOKENS.font.body,
              textAlignVertical: "center",
            }}
          />
          <Pressable
            onPress={() => handleSend()}
            disabled={!canSend}
            className={`w-[36px] h-[36px] rounded-full items-center justify-center ${
              canSend ? "bg-[#3478F6] active:opacity-80 active:scale-95" : "bg-slate-50"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialIconsRounded
                name="arrow-upward"
                size={18}
                color={canSend ? "#FFFFFF" : "#CBD5E1"}
              />
            )}
          </Pressable>
        </View>
      </View>

      <CustomAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
        isDestructive={alertConfig.isDestructive}
      />
    </KeyboardAvoidingView>
  );
}
