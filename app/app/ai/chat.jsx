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
import { ArrowLeft, Home, MapPinned, MessageCircle, Sparkles, Trash2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useGroqChat } from "../../src/modules/ai/hooks/useGroqChat";
import { useGenieVoice } from "../../src/modules/ai/hooks/useGenieVoice";
import { useAIContextStore } from "../../src/stores/aiContextStore";
import { TOKENS } from "../../src/constants/design-tokens";

// Split components
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

  // Sync local plan state when new messages include a hybrid plan.
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

  const handleGoHome = useCallback(() => {
    router.replace("/(tabs)/map");
  }, [router]);

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
            <ArrowLeft size={20} color="#0F172A" />
          </Pressable>
          
          <Glow style="breathe" speed={0.8} intensity={0.45} colors={["#2563EB", "#7C3AED", "#DB2777"]}>
            <LinearGradient
              colors={["#2563EB", "#7C3AED", "#DB2777"]}
              style={s.avatarContainer}
            >
              <Sparkles size={18} color="#FFFFFF" />
            </LinearGradient>
          </Glow>
          
          <View>
            <Text style={s.headerTitle}>Trợ lý du lịch Genie</Text>
            <View style={s.statusRow}>
              <View style={s.pulseContainer}>
                <Glow style="pulse" speed={1.2} intensity={0.5} colors={["#0EA5E9", "#22C55E"]}>
                  <View style={s.onlineDotCore} />
                </Glow>
              </View>
              <Text style={s.statusText}>Đang sẵn sàng gợi ý Cần Thơ</Text>
            </View>
          </View>
        </View>

        <View style={s.headerActions}>
          <Pressable
            onPress={handleGoHome}
            style={s.iconCircle}
            accessibilityRole="button"
            accessibilityLabel="Về trang chủ"
          >
            <Home size={18} color="#0F172A" />
          </Pressable>

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
            <Glow style="breathe" speed={0.72} intensity={0.62} colors={["#2563EB", "#7C3AED", "#DB2777"]}>
              <LinearGradient
                colors={["#2563EB", "#7C3AED", "#DB2777"]}
                style={s.heroAvatarRing}
              >
                <View style={s.heroAvatarInner}>
                  <MapPinned size={33} color="#2563EB" />
                </View>
              </LinearGradient>
            </Glow>

            <Text style={s.heroTitle}>Chào bạn, mình là Genie</Text>
            <Text style={s.heroSubtitle}>
              Mình giúp bạn tìm điểm ăn chơi, lên lịch trình và gợi ý tuyến đi hợp lý quanh Cần Thơ.
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
          <View style={s.thinkingWrap}>
            <View style={s.thinkingLabelRow}>
              <MessageCircle size={12} color="#2563EB" />
              <Text style={s.thinkingLabel}>Genie</Text>
            </View>
            <View style={s.thinkingBubble}>
              <StreamingText text="Đang suy nghĩ..." style={s.thinkingText} />
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
    backgroundColor: "#F8FAFC",
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
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderColor: "#E2E8F0",
    zIndex: 10,
    boxShadow: "0 8px 26px rgba(15, 23, 42, 0.06)",
  },
  rowCenterGap3: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
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
    color: "#0F172A",
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
    backgroundColor: "#22C55E",
    zIndex: 1,
  },
  statusText: {
    fontSize: 11,
    color: "#64748B",
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
  heroAvatarRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  heroAvatarInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
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
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14.5,
    lineHeight: 22,
    color: "#64748B",
    textAlign: "center",
    maxWidth: 310,
    marginBottom: 32,
    fontFamily: TOKENS.font.body,
  },
  messageGap: {
    gap: 16,
  },
  thinkingWrap: {
    alignItems: "flex-start",
    gap: 6,
  },
  thinkingLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 4,
  },
  thinkingLabel: {
    color: "#64748B",
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontFamily: TOKENS.font.semibold,
  },
  thinkingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
  },
  thinkingText: {
    color: "#1F2937",
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
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
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
