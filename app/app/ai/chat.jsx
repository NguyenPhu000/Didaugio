import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
} from "react-native";
import { useState, useRef, useCallback, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { Sparkles, ArrowLeft, Trash2, Send, CornerDownLeft, RefreshCw, Trash, ArrowRight, Plus, Mic, ArrowUp } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";

import { useGroqChat } from "../../src/modules/ai-assistant/hooks/useGroqChat";
import { useAIContextStore } from "../../src/stores/aiContextStore";
import { HorizontalPlaceCard } from "../../src/components/composed/HorizontalPlaceCard";
import { BudgetEstimator } from "../../src/modules/ai-assistant/components/BudgetEstimator";
import { TOKENS } from "../../src/constants/design-tokens";

/** Định dạng giá hiển thị gọn: 120000 → "120k", 1500000 → "1.5 triệu" */
function formatPrice(price) {
  const val = Number(price);
  if (!val || val <= 0) return "Miễn phí";
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)} triệu`;
  if (val >= 1000) return `${Math.round(val / 1000)}k`;
  return `${val}đ`;
}

/** Định dạng khoảng giá: "120k - 250k", "từ 50k", "~100k" */
function formatPriceRange(from, to) {
  const f = Number(from);
  const t = Number(to);
  if (!f && !t) return "Chưa cập nhật";
  if (!f) return `~${formatPrice(t)}`;
  if (!t) return `từ ${formatPrice(f)}`;
  if (f === t) return formatPrice(f);
  return `${formatPrice(f)} - ${formatPrice(t)}`;
}

/** Lấy gợi ý nhanh dựa trên thời điểm trong ngày */
function getTimeBasedSuggestions() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) {
    return [
      { text: "Quán ăn sáng ngon gần đây" },
      { text: "Cà phê sáng view đẹp Cần Thơ" },
      { text: "Lên lịch trình hôm nay từ sáng" },
      { text: "Bánh mì, phở gần trung tâm" },
    ];
  }
  if (hour >= 11 && hour < 14) {
    return [
      { text: "Quán ăn trưa ngon Ninh Kiều" },
      { text: "Cơm tấm, bún bò gần đây" },
      { text: "Nhà hàng hải sản Cần Thơ" },
      { text: "Lên lịch trình buổi chiều" },
    ];
  }
  if (hour >= 14 && hour < 18) {
    return [
      { text: "Quán cà phê view sông Cần Thơ" },
      { text: "Điểm chụp ảnh đẹp gần đây" },
      { text: "Lên lịch trình nửa ngày quanh đây" },
      { text: "Chợ nổi Cái Răng đi bằng gì" },
    ];
  }
  return [
    { text: "Quán ăn tối ngon Cần Thơ" },
    { text: "Điểm vui chơi buổi tối gần đây" },
    { text: "Quán nhậu, beer club Ninh Kiều" },
    { text: "Lịch trình ngày mai cho tôi" },
  ];
}

function clientHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function AIOrb() {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    rotation.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={s.orbContainer}>
      <Animated.View style={[s.orbPulse, pulseStyle]}>
        <LinearGradient
          colors={["#10B981", "#3B82F6", "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.orbPulseGradient}
        />
      </Animated.View>
      <View style={s.orbCore}>
        <LinearGradient
          colors={["#18181B", "#27272A"]}
          style={s.orbCoreGradient}
        />
        <Sparkles size={20} color="#10B981" />
      </View>
    </View>
  );
}

function InteractiveTimeline({ plan, onRemove, onSwap }) {
  if (!plan || !plan.timeline) return null;

  return (
    <View style={s.timelineContainer}>
      {/* Widget ngân sách dự toán */}
      <BudgetEstimator summary={plan.tripSummary} />

      {/* Danh sách các chặng đi */}
      {plan.timeline.map((item, index) => {
        const place = item.place;
        if (!place) return null;

        const isLast = index === plan.timeline.length - 1;

        return (
          <View key={`${place.id}-${index}`} style={s.timelineItem}>
            {/* Cột mốc thời gian bên trái */}
            <View style={s.timelineLeft}>
              <View style={s.timelineDot}>
                <Text style={s.timelineDotText}>
                  {item.timeSlot[0]}
                </Text>
              </View>
              {!isLast && <View style={s.timelineLine} />}
            </View>

            {/* Chi tiết nội dung bên phải */}
            <View style={s.timelineRight}>
              <View style={s.timelineCard}>
                <View style={s.timelineCardHeader}>
                  <View style={s.timelineCardInfo}>
                    <Text style={s.timelineTimeSlot} selectable>
                      {item.timeSlot}
                    </Text>
                    <Text style={s.timelinePlaceName} selectable>
                      {place.name}
                    </Text>
                    {/* Hiển thị khoảng giá */}
                    {(place.priceFrom > 0 || place.priceTo > 0) && (
                      <Text style={s.timelinePrice} selectable>
                        {formatPriceRange(place.priceFrom, place.priceTo)}
                      </Text>
                    )}
                  </View>

                  {/* Nút hành động tương tác Swap / Remove */}
                  <View style={s.timelineActions}>
                    {!isLast && (
                      <Pressable
                        onPress={() => onSwap(index)}
                        style={s.swapButton}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <RefreshCw size={11} color="#71717A" />
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => onRemove(index)}
                      style={s.removeButton}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash size={11} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>

                <Text style={s.timelineReason} selectable>
                  {item.reason}
                </Text>

                {/* Place Card nhỏ gọn */}
                <HorizontalPlaceCard place={place} />
              </View>

              {/* Đường nối di chuyển giữa hai chặng */}
              {!isLast && item.navigationToNext && (
                <View style={s.navigationCard}>
                  <ArrowRight size={12} color="#71717A" />
                  <Text style={s.navigationText} selectable>
                    Di chuyển tiếp theo: {item.navigationToNext.distanceKm} km — ~{item.navigationToNext.durationMin} phút
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function MessageBubble({ message, onViewPlace, interactivePlan, onRemovePlace, onSwapPlace }) {
  const isUser = message.role === "user";

  return (
    <View style={[s.gap1_5, isUser ? s.itemsEnd : s.itemsStart]}>
      {!isUser && (
        <View style={s.rowCenterGap1_5}>
          <Sparkles size={12} color="#10B981" />
          <Text style={s.aiLabel}>Nhi (AI)</Text>
        </View>
      )}

      <View
        style={[
          s.bubbleBase,
          isUser ? s.userBubble : s.aiBubble,
        ]}
      >
        <Text style={[s.bubbleText, isUser ? s.textZinc900 : s.textZinc800]} selectable>
          {message.text ?? message.content}
        </Text>
      </View>

      {/* Render Carousel địa điểm nếu có gợi ý địa điểm thông thường */}
      {!isUser && message.suggestedPlaces?.length > 0 && (
        <View style={s.carouselWrapper}>
          <FlatList
            data={message.suggestedPlaces}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <HorizontalPlaceCard
                place={item}
                onPressDetail={() => onViewPlace(item)}
              />
            )}
            contentContainerStyle={s.carouselContent}
          />
        </View>
      )}

      {/* Render Interactive Timeline nếu tin nhắn có lịch trình hybridPlan */}
      {!isUser && interactivePlan && (
        <InteractiveTimeline
          plan={interactivePlan}
          onRemove={(idx) => onRemovePlace(message.id, idx)}
          onSwap={(idx) => onSwapPlace(message.id, idx)}
        />
      )}
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={s.itemsStartGap1_5}>
      <View style={s.rowCenterGap1_5}>
        <Sparkles size={12} color="#10B981" />
        <Text style={s.aiLabel}>Nhi (AI)</Text>
      </View>
      <View style={s.typingBubble}>
        <ActivityIndicator size="small" color="#10B981" />
        <Text style={s.typingText}>Đang suy nghĩ...</Text>
      </View>
    </View>
  );
}

export default function GroqChatScreen() {
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Header height = paddingTop (safeArea) + nội dung header + borderBottom
  const HEADER_HEIGHT = Math.max(insets.top, 8) + 52;

  // Safe area bottom padding — luôn giữ nguyên, KeyboardAvoidingView sẽ lo phần keyboard
  const inputBottomPadding = Math.max(insets.bottom, 12) + 8;

  const updateLocation = useAIContextStore((s) => s.updateLocation);
  const setCurrentCity = useAIContextStore((s) => s.setCurrentCity);
  const { sendMessage, clearConversation, conversationMemory } = useGroqChat();

  // State quản lý lịch trình tương tác cục bộ tại Client
  const [interactivePlans, setInteractivePlans] = useState({});

  // Cập nhật local state khi tin nhắn mới chứa hybridPlan
  useEffect(() => {
    conversationMemory.forEach((msg) => {
      if (msg.hybridPlan && msg.id) {
        setInteractivePlans((prev) => {
          if (prev[msg.id]) return prev;
          return {
            ...prev,
            [msg.id]: msg.hybridPlan,
          };
        });
      }
    });
  }, [conversationMemory]);

  // Client-Side Recalculation: Xóa chặng đi và tự tính lại ngân sách/di chuyển
  const handleRemovePlace = useCallback((msgId, index) => {
    setInteractivePlans((prev) => {
      const plan = prev[msgId];
      if (!plan || !plan.timeline) return prev;

      const newTimeline = [...plan.timeline];
      const removedItem = newTimeline[index];
      const place = removedItem.place;

      // Xóa khỏi timeline
      newTimeline.splice(index, 1);

      // Tính toán lại chặng di chuyển trước đó
      if (index > 0 && newTimeline[index - 1]) {
        const prevItem = newTimeline[index - 1];
        const nextItem = newTimeline[index]; // Phần tử kế tiếp sau khi xóa

        if (nextItem && prevItem.place && nextItem.place) {
          const dist = clientHaversine(
            parseFloat(prevItem.place.latitude),
            parseFloat(prevItem.place.longitude),
            parseFloat(nextItem.place.latitude),
            parseFloat(nextItem.place.longitude)
          );
          const duration = Math.max(1, Math.round(dist * 2.5));
          prevItem.navigationToNext = {
            distanceKm: parseFloat(dist.toFixed(1)),
            durationMin: duration,
          };
        } else {
          prevItem.navigationToNext = null;
        }
      }

      // Tính toán lại ngân sách
      const priceFrom = place?.priceFrom || 0;
      const priceTo = place?.priceTo || 0;

      const category = (place?.categoryName || "").toLowerCase();
      let costType = "tickets";
      if (category.includes("ăn") || category.includes("uống") || category.includes("restaurant") || category.includes("food") || category.includes("cà phê") || category.includes("cafe")) {
        costType = "food";
      } else if (category.includes("di chuyển") || category.includes("xe") || category.includes("taxi")) {
        costType = "transportEstimated";
      }

      const summary = { ...plan.tripSummary };
      summary.totalEstimatedPriceFrom = Math.max(0, summary.totalEstimatedPriceFrom - priceFrom);
      summary.totalEstimatedPriceTo = Math.max(0, summary.totalEstimatedPriceTo - priceTo);

      if (summary.costBreakdown && summary.costBreakdown[costType]) {
        const breakdown = { ...summary.costBreakdown };
        breakdown[costType] = {
          from: Math.max(0, breakdown[costType].from - priceFrom),
          to: Math.max(0, breakdown[costType].to - priceTo),
        };
        summary.costBreakdown = breakdown;
      }

      return {
        ...prev,
        [msgId]: {
          ...plan,
          tripSummary: summary,
          timeline: newTimeline,
        },
      };
    });
  }, []);

  // Client-Side Recalculation: Đổi vị trí chặng và tính lại khoảng cách di chuyển
  const handleSwapPlace = useCallback((msgId, index) => {
    setInteractivePlans((prev) => {
      const plan = prev[msgId];
      if (!plan || !plan.timeline) return prev;

      const newTimeline = [...plan.timeline];
      if (index >= newTimeline.length - 1) return prev; // Chặng cuối không swap xuống dưới được

      // Hoán đổi vị trí chặng đi
      const temp = newTimeline[index];
      newTimeline[index] = newTimeline[index + 1];
      newTimeline[index + 1] = temp;

      // Swap timeSlot để giữ nguyên trật tự buổi sáng/trưa/chiều/tối
      const tempTime = newTimeline[index].timeSlot;
      newTimeline[index].timeSlot = newTimeline[index + 1].timeSlot;
      newTimeline[index + 1].timeSlot = tempTime;

      // Tính lại khoảng cách di chuyển thực tế cho toàn bộ hành trình sau khi hoán đổi
      for (let i = 0; i < newTimeline.length; i++) {
        const current = newTimeline[i];
        const next = newTimeline[i + 1];

        if (next && current.place && next.place) {
          const dist = clientHaversine(
            parseFloat(current.place.latitude),
            parseFloat(current.place.longitude),
            parseFloat(next.place.latitude),
            parseFloat(next.place.longitude)
          );
          const duration = Math.max(1, Math.round(dist * 2.5));
          current.navigationToNext = {
            distanceKm: parseFloat(dist.toFixed(1)),
            durationMin: duration,
          };
        } else {
          current.navigationToNext = null;
        }
      }

      return {
        ...prev,
        [msgId]: {
          ...plan,
          timeline: newTimeline,
        },
      };
    });
  }, []);

  // Yêu cầu lấy vị trí hiện tại của người dùng khi vào màn hình chat
  useEffect(() => {
    let active = true;
    const requestLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted" || !active) return;

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (location?.coords && active) {
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          updateLocation(coords);

          // Reverse geocode tìm quận/phường
          const reverse = await Location.reverseGeocodeAsync(coords);
          if (reverse && reverse.length > 0 && active) {
            const place = reverse[0];
            const cityLabel = place.subregion || place.district || place.city || "Cần Thơ";
            setCurrentCity(cityLabel);
          }
        }
      } catch (e) {
        console.warn("Location permission or lookup failed", e);
      }
    };

    requestLocation();
    return () => {
      active = false;
    };
  }, []);

  const handleSend = useCallback(
    async (text) => {
      const msg = (text ?? inputText).trim();
      if (!msg || isSending) return;
      setInputText("");
      setError(null);
      setIsSending(true);

      try {
        await sendMessage(msg);
      } catch (err) {
        setError(err.message || "Đã có lỗi xảy ra");
      } finally {
        setIsSending(false);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
      }
    },
    [inputText, isSending, sendMessage],
  );

  const handleViewPlace = useCallback(
    (place) => {
      const id = Number(place?.id);
      if (id) router.push(`/place/${id}`);
    },
    [router],
  );

  const handleClear = useCallback(() => {
    if (isSending) return;
    clearConversation();
    setError(null);
    setInteractivePlans({});
  }, [isSending, clearConversation]);

  const hasMessages = conversationMemory.length > 0;
  const canSend = inputText.trim().length > 0 && !isSending;

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? HEADER_HEIGHT : 0}
    >
      {/* Header */}
      <View
        style={[
          s.header,
          {
            paddingTop: Math.max(insets.top, 8),
          },
        ]}
      >
        <View style={s.rowCenterGap3}>
          <Pressable onPress={() => router.back()} style={s.iconCircle}>
            <ArrowLeft size={20} color="#18181B" />
          </Pressable>
          <View style={s.avatarContainer}>
            <Sparkles size={16} color="#10B981" />
          </View>
          <View>
            <Text style={s.headerTitle}>Nhi (AI)</Text>
            <Text style={s.statusText}>Trực tuyến • Trợ lý du lịch</Text>
          </View>
        </View>

        {hasMessages && (
          <Pressable
            onPress={handleClear}
            disabled={isSending}
            style={[s.iconCircle, isSending && s.opacity40]}
          >
            <Trash2 size={20} color="#71717A" />
          </Pressable>
        )}
      </View>

      {/* Main chat viewport */}
      <ScrollView
        ref={scrollRef}
        style={s.flex1}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={hasMessages ? s.scrollContentMessages : s.scrollContentEmpty}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {!hasMessages ? (
          <View style={s.emptyContainer}>
            {/* Animated AI Orb */}
            <AIOrb />

            <Text style={s.heroTitle}>
              Chào bạn, mình là Nhi!
            </Text>
            <Text style={s.heroSubtitle}>
              Mình là trợ lý du lịch ảo của bạn. Bạn muốn Đi Đâu Giờ? Hãy để mình lên lịch trình hoặc gợi ý điểm ăn chơi Cần Thơ nghen.
            </Text>

            {/* Quick Actions Grid — gợi ý theo thời điểm trong ngày */}
            <View style={s.suggestionsContainer}>
              {getTimeBasedSuggestions().map((item) => (
                <Pressable
                  key={item.text}
                  onPress={() => handleSend(item.text)}
                  style={s.suggestionCard}
                >
                  <Text style={s.suggestionText}>
                    {item.text}
                  </Text>
                  <CornerDownLeft size={14} color="#A1A1AA" />
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View style={s.messageGap}>
            {conversationMemory.map((msg, index) => (
              <MessageBubble
                key={msg.id ?? `${msg.role}-${index}`}
                message={msg}
                onViewPlace={handleViewPlace}
                interactivePlan={interactivePlans[msg.id]}
                onRemovePlace={handleRemovePlace}
                onSwapPlace={handleSwapPlace}
              />
            ))}
          </View>
        )}

        {isSending && <TypingIndicator />}

        {error && (
          <View style={s.errorBanner}>
            <Text style={s.errorText} selectable>{error}</Text>
            <Pressable onPress={() => setError(null)}>
              <Text style={s.closeText}>Đóng</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Input bar — paddingBottom cố định cho safe area, KeyboardAvoidingView đẩy toàn bộ lên khi bàn phím hiện */}
      <View
        style={[
          s.inputBarWrapper,
          { paddingBottom: inputBottomPadding },
        ]}
      >
        <View style={s.inputRow}>
          <Pressable
            style={s.inputIconBtn}
            onPress={() => {}}
          >
            <Plus size={20} color="#71717A" />
          </Pressable>

          <TextInput
            ref={inputRef}
            placeholder="Hỏi Nhi điều gì đó về Cần Thơ..."
            placeholderTextColor="#A1A1AA"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            style={s.textInput}
          />

          <Pressable
            style={s.inputIconBtn}
            onPress={() => {}}
          >
            <Mic size={20} color="#71717A" />
          </Pressable>

          <Pressable
            onPress={() => handleSend()}
            disabled={!canSend}
            style={[s.sendButton, canSend ? s.sendActive : s.sendInactive]}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ArrowUp size={18} color={canSend ? "#FFFFFF" : "#71717A"} />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#F4F4F5",
  },
  rowCenterGap3: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F4F5",
  },
  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    color: "#18181B",
  },
  statusText: {
    fontSize: 11,
    color: "#71717A",
    fontFamily: TOKENS.font.medium,
  },
  opacity40: {
    opacity: 0.4,
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  orbContainer: {
    width: 90,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  orbPulse: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    opacity: 0.35,
  },
  orbCore: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#10B981",
    boxShadow: "0 0 10px rgba(16, 185, 129, 0.5)",
  },
  orbPulseGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  orbCoreGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContentEmpty: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: "center",
  },
  scrollContentMessages: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: TOKENS.font.heading,
    color: "#18181B",
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "700",
  },
  heroSubtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    color: "#71717A",
    textAlign: "center",
    maxWidth: 290,
    marginBottom: 32,
    fontFamily: TOKENS.font.body,
  },
  suggestionsContainer: {
    width: "100%",
    gap: 10,
  },
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  suggestionText: {
    fontSize: 13.5,
    color: "#3F3F46",
    fontFamily: TOKENS.font.medium,
    flex: 1,
  },
  messageGap: {
    gap: 16,
  },
  gap1_5: {
    gap: 6,
  },
  itemsStart: {
    alignItems: "flex-start",
  },
  itemsEnd: {
    alignItems: "flex-end",
  },
  rowCenterGap1_5: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 4,
  },
  aiLabel: {
    color: "#71717A",
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontFamily: TOKENS.font.semibold,
  },
  bubbleBase: {
    maxWidth: "85%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: "#F4F4F5",
    borderTopRightRadius: 2,
  },
  aiBubble: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderTopLeftRadius: 2,
  },
  bubbleText: {
    fontSize: 14.5,
    lineHeight: 22,
    fontFamily: TOKENS.font.body,
  },
  textZinc900: {
    color: "#18181B",
  },
  textZinc800: {
    color: "#27272A",
  },
  carouselWrapper: {
    width: "100%",
    marginTop: 8,
  },
  carouselContent: {
    paddingLeft: 4,
    paddingRight: 16,
  },
  itemsStartGap1_5: {
    alignItems: "flex-start",
    gap: 6,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderTopLeftRadius: 2,
  },
  typingText: {
    color: "#71717A",
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "center",
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    width: "100%",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12.5,
    fontFamily: TOKENS.font.medium,
    flex: 1,
  },
  closeText: {
    color: "#EF4444",
    fontSize: 12.5,
    fontFamily: TOKENS.font.semibold,
    marginLeft: 10,
  },
  inputBarWrapper: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F4F4F5",
    width: "100%",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F4F4F5",
  },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    paddingHorizontal: 4,
    paddingVertical: 6,
    fontSize: 15,
    color: "#18181B",
    fontFamily: TOKENS.font.body,
  },
  inputIconBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    marginBottom: 2,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sendActive: {
    backgroundColor: "#09090B", // Zinc 950 đen
  },
  sendInactive: {
    backgroundColor: "#F4F4F5",
  },
  
  // Styles cho Interactive Timeline
  timelineContainer: {
    width: "100%",
    marginTop: 12,
    paddingHorizontal: 4,
  },
  timelineItem: {
    flexDirection: "row",
    width: "100%",
  },
  timelineLeft: {
    alignItems: "center",
    width: 30,
    marginRight: 10,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    boxShadow: "0 1px 2px rgba(16, 185, 129, 0.2)",
  },
  timelineDotText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: TOKENS.font.semibold,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E4E4E7",
    marginTop: 4,
    marginBottom: 4,
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 20,
  },
  navigationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F4F4F5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 2,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  navigationText: {
    fontSize: 11.5,
    color: "#71717A",
    fontFamily: TOKENS.font.medium,
    flex: 1,
  },
  // Styles cho timeline card content (thay thế className)
  timelineCard: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#F4F4F5",
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  timelineCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  timelineCardInfo: {
    flex: 1,
    marginRight: 8,
  },
  timelineTimeSlot: {
    fontSize: 10,
    color: "#A1A1AA",
    fontFamily: TOKENS.font.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  timelinePlaceName: {
    color: "#18181B",
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
  timelinePrice: {
    fontSize: 11,
    color: "#10B981",
    fontFamily: TOKENS.font.medium,
    marginTop: 2,
  },
  timelineActions: {
    flexDirection: "row",
    gap: 4,
  },
  swapButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: "rgba(228, 228, 231, 0.5)",
  },
  removeButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: "rgba(254, 226, 226, 0.6)",
  },
  timelineReason: {
    color: "#52525B",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
});
