import {
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
} from "react-native";
import { useState, useRef, useCallback, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { Sparkles, ArrowLeft, Trash2 } from "lucide-react-native";
import {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { useGroqChat } from "../../src/modules/ai/hooks/useGroqChat";
import { useGenieVoice } from "../../src/modules/ai/hooks/useGenieVoice";
import { useAIContextStore } from "../../src/stores/aiContextStore";
import { TOKENS } from "../../src/constants/design-tokens";

// Components đã chia nhỏ
import { MessageBubble } from "../../src/modules/ai/components/chat/MessageBubble";
import { QuickSuggestions } from "../../src/modules/ai/components/chat/TypingIndicator";
import { ChatInputBar } from "../../src/modules/ai/components/chat/ChatInputBar";

// Reacticx
import { Glow } from "../../src/components/reacticx/glow";
import { StreamingText } from "../../src/components/reacticx/streaming-text";

// Utils
import { clientHaversine, getTimeBasedSuggestions } from "../../src/modules/ai/lib/chatUtils";

export default function GroqChatScreen() {
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const HEADER_HEIGHT = Math.max(insets.top, 8) + 56;
  const inputBottomPadding = Math.max(insets.bottom, 12) + 8;

  const updateLocation = useAIContextStore((s) => s.updateLocation);
  const setCurrentCity = useAIContextStore((s) => s.setCurrentCity);
  const { sendMessage, clearConversation, conversationMemory } = useGroqChat();

  const {
    status: voiceStatus,
    startRecording,
    stopRecordingAndTranscribe,
  } = useGenieVoice();

  const isRecording = voiceStatus === "listening";
  const isTranscribing = voiceStatus === "transcribing";

  const [interactivePlans, setInteractivePlans] = useState({});

  // Animation pulsate cho chấm trực tuyến xanh lá
  const onlinePulse = useSharedValue(1);

  useEffect(() => {
    onlinePulse.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: 1100 }),
        withTiming(1.0, { duration: 1100 })
      ),
      -1,
      true
    );
  }, [onlinePulse]);

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

  const handleRemovePlace = useCallback((msgId, index) => {
    setInteractivePlans((prev) => {
      const plan = prev[msgId];
      if (!plan || !plan.timeline) return prev;

      const newTimeline = [...plan.timeline];
      const removedItem = newTimeline[index];
      const place = removedItem.place;

      newTimeline.splice(index, 1);

      if (index > 0 && newTimeline[index - 1]) {
        const prevItem = newTimeline[index - 1];
        const nextItem = newTimeline[index];

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

  const handleSwapPlace = useCallback((msgId, index) => {
    setInteractivePlans((prev) => {
      const plan = prev[msgId];
      if (!plan || !plan.timeline) return prev;

      const newTimeline = [...plan.timeline];
      if (index >= newTimeline.length - 1) return prev;

      const temp = newTimeline[index];
      newTimeline[index] = newTimeline[index + 1];
      newTimeline[index + 1] = temp;

      const tempTime = newTimeline[index].timeSlot;
      newTimeline[index].timeSlot = newTimeline[index + 1].timeSlot;
      newTimeline[index + 1].timeSlot = tempTime;

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
  }, [setCurrentCity, updateLocation]);

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

  const handleToggleRecord = useCallback(async () => {
    if (isRecording) {
      const text = await stopRecordingAndTranscribe();
      if (text) {
        setInputText((prev) => (prev ? `${prev} ${text}` : text));
      }
    } else {
      await startRecording();
    }
  }, [isRecording, stopRecordingAndTranscribe, startRecording]);

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
  const isLoadingOrSending = isSending || isTranscribing;
  const canSend = inputText.trim().length > 0 && !isLoadingOrSending;

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? HEADER_HEIGHT : 0}
    >
      {/* Premium Header */}
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
            <ArrowLeft size={20} color="#FFFFFF" />
          </Pressable>
          
          <Glow style="breathe" speed={0.8} intensity={0.5} colors={["#10B981", "#34D399", "#6EE7B7"]}>
            <LinearGradient
              colors={["#10B981", "#34D399", "#6EE7B7"]}
              style={s.avatarContainer}
            >
              <Sparkles size={18} color="#FFFFFF" />
            </LinearGradient>
          </Glow>
          
          <View>
            <Text style={s.headerTitle}>Genie (AI)</Text>
            <View style={s.statusRow}>
              <View style={s.pulseContainer}>
                <Glow style="pulse" speed={1.2} intensity={0.6} colors={["#10B981", "#34D399"]}>
                  <View style={s.onlineDotCore} />
                </Glow>
              </View>
              <Text style={s.statusText}>Trực tuyến • Trợ lý du lịch</Text>
            </View>
          </View>
        </View>

        {hasMessages && (
          <Pressable
            onPress={handleClear}
            disabled={isLoadingOrSending}
            style={[s.iconCircle, isLoadingOrSending && s.opacity40]}
          >
            <Trash2 size={18} color="#EF4444" />
          </Pressable>
        )}
      </View>

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
            <Glow style="breathe" speed={0.72} intensity={0.72} colors={["#10B981", "#34D399", "#6EE7B7"]}>
              <LinearGradient
                colors={["#10B981", "#34D399", "#6EE7B7"]}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <View style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#F0FDF4",
                }}>
                  <Sparkles size={32} color="#10B981" />
                </View>
              </LinearGradient>
            </Glow>

            <Text style={s.heroTitle}>Chào bạn, mình là Genie!</Text>
            <Text style={s.heroSubtitle}>
              Mình là trợ lý du lịch ảo của bạn. Bạn muốn đi đâu bây giờ? Hãy để iPoint Genie lên lịch trình hoặc gợi ý điểm ăn chơi Cần Thơ nghen.
            </Text>

            <QuickSuggestions
              suggestions={getTimeBasedSuggestions()}
              onSelect={handleSend}
            />
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

        {isLoadingOrSending && (
          <View style={{ alignItems: "flex-start", gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 4 }}>
              <Sparkles size={12} color="#10B981" />
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase", fontFamily: TOKENS.font.semibold }}>Genie (AI)</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, backgroundColor: "#2C2C2E", borderTopLeftRadius: 4 }}>
              <StreamingText text="Đang suy nghĩ..." style={{ color: "#FFFFFF", fontSize: 13, fontFamily: TOKENS.font.medium }} />
            </View>
          </View>
        )}

        {error && (
          <View style={s.errorBanner}>
            <Text style={s.errorText} selectable>{error}</Text>
            <Pressable onPress={() => setError(null)}>
              <Text style={s.closeText}>Đóng</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <ChatInputBar
        inputText={inputText}
        setInputText={setInputText}
        onSend={() => handleSend()}
        isSending={isLoadingOrSending}
        canSend={canSend}
        inputRef={inputRef}
        bottomPadding={inputBottomPadding}
        isRecording={isRecording}
        onToggleRecord={handleToggleRecord}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#000000",
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    zIndex: 10,
  },
  rowCenterGap3: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: TOKENS.font.semibold,
    color: "#FFFFFF",
    marginBottom: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pulseContainer: {
    width: 8,
    height: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    position: "absolute",
  },
  onlineDotCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    zIndex: 1,
  },
  statusText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
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
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14.5,
    lineHeight: 22,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    maxWidth: 280,
    marginBottom: 32,
    fontFamily: TOKENS.font.body,
  },
  messageGap: {
    gap: 16,
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
    backgroundColor: "rgba(239,68,68,0.15)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    width: "100%",
  },
  errorText: {
    color: "#F87171",
    fontSize: 12.5,
    fontFamily: TOKENS.font.medium,
    flex: 1,
  },
  closeText: {
    color: "#F87171",
    fontSize: 12.5,
    fontFamily: TOKENS.font.semibold,
    marginLeft: 10,
  },
});
