import {
  View,
  Text,
  Pressable,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useState, useRef, useCallback, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { ArrowLeft, ArrowDown, Home, MessageCircle, Trash2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import avaGenie from "../../assets/ai/ava_Genie.png";

import { useGroqChat } from "../../src/modules/ai/hooks/useGroqChat";
import { useGenieVoice } from "../../src/modules/ai/hooks/useGenieVoice";
import { useAIContextStore } from "../../src/stores/aiContextStore";
import { TOKENS } from "../../src/constants/design-tokens";
import { VOICE_ERROR_CODES } from "../../src/constants/voice-error-codes";

// Split components
import { MessageBubble } from "../../src/modules/ai/components/chat/MessageBubble";
import { QuickSuggestions } from "../../src/modules/ai/components/chat/TypingIndicator";
import { ChatInputBar } from "../../src/modules/ai/components/chat/ChatInputBar";

// Reacticx
import { Glow } from "../../src/components/reacticx/glow";
import { StreamingText } from "../../src/components/reacticx/streaming-text";

// Utils
import { getTimeBasedSuggestions } from "../../src/modules/ai/lib/chatUtils";

export default function GroqChatScreen() {
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const lastConsumedVoiceErrorRef = useRef(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const HEADER_HEIGHT = Math.max(insets.top, 8) + 56;
  const inputBottomPadding = Math.max(insets.bottom, 12) + 8;

  const updateLocation = useAIContextStore((s) => s.updateLocation);
  const setCurrentCity = useAIContextStore((s) => s.setCurrentCity);
  const { sendMessage, clearConversation, conversationMemory } = useGroqChat();

  const {
    status: voiceStatus,
    error: voiceError,
    startRecording,
    stopRecordingAndTranscribe,
  } = useGenieVoice();

  const isRecording = voiceStatus === "listening";
  const isTranscribing = voiceStatus === "transcribing";

  // Surface pre-upload voice failures (permission denied, empty recording,
  // session errors) in the chat error banner instead of failing silently.
  // Transcription HTTP errors are handled by handleToggleRecord's catch.
  // Use a ref to avoid re-triggering after user closes the banner.
  useEffect(() => {
    if (voiceStatus !== "error" || !voiceError) return;
    if (voiceError === lastConsumedVoiceErrorRef.current) return;
    lastConsumedVoiceErrorRef.current = voiceError;
    if (voiceError === VOICE_ERROR_CODES.PERMISSION_DENIED) {
      setError("Genie cần quyền micro để nghe bạn nói. Hãy cấp quyền trong Cài đặt nghen!");
    } else if (voiceError === VOICE_ERROR_CODES.EMPTY_RECORDING) {
      setError("Genie chưa nghe được gì, bạn thử nói lại nghen!");
    } else if (voiceError === VOICE_ERROR_CODES.SESSION_FAILED) {
      setError("Không thể mở phiên ghi âm, thử lại nghen!");
    }
  }, [voiceStatus, voiceError]);

  // Scroll to bottom on initial load with existing history AND when new messages arrive
  const prevMsgCountRef = useRef(0);
  const initialScrollDoneRef = useRef(false);

  useEffect(() => {
    const currentLength = conversationMemory.length;
    if (currentLength > 0) {
      const isInitial = !initialScrollDoneRef.current;
      if (isInitial || currentLength > prevMsgCountRef.current) {
        initialScrollDoneRef.current = true;
        const timer = setTimeout(
          () => scrollRef.current?.scrollToEnd({ animated: !isInitial }),
          isInitial ? 60 : 100,
        );
        prevMsgCountRef.current = currentLength;
        return () => clearTimeout(timer);
      }
    }
    prevMsgCountRef.current = currentLength;
  }, [conversationMemory.length]);

  const handleContentSizeChange = useCallback(() => {
    if (!initialScrollDoneRef.current && conversationMemory.length > 0) {
      initialScrollDoneRef.current = true;
      scrollRef.current?.scrollToEnd({ animated: false });
    }
  }, [conversationMemory.length]);

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

  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isSendingRef = useRef(false);

  const handleSend = useCallback(
    async (textOverride) => {
      const msg = (typeof textOverride === "string" ? textOverride : inputText).trim();
      if (!msg || isSendingRef.current) return;
      isSendingRef.current = true;
      setInputText("");
      setError(null);
      setIsSending(true);

      try {
        await sendMessage(msg);
      } catch (err) {
        setError(err.message || "Đã có lỗi xảy ra");
      } finally {
        isSendingRef.current = false;
        setIsSending(false);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    },
    [inputText, sendMessage],
  );

  const handleScroll = useCallback((event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
    const isFarFromBottom = contentHeight - offsetY - layoutHeight > 250;
    setShowScrollBottom(isFarFromBottom);
  }, []);

  const handleToggleRecord = useCallback(async () => {
    if (isRecording) {
      try {
        const text = await stopRecordingAndTranscribe();
        if (text) {
          setInputText((prev) => (prev ? `${prev} ${text}` : text));
        }
      } catch (err) {
        setError(err?.message || "Không thể nhận dạng giọng nói, thử lại nghen!");
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
  }, [isSending, clearConversation]);

  const hasMessages = conversationMemory.length > 0;
  const isLoadingOrSending = isSending || isTranscribing;
  const canSend = inputText.trim().length > 0 && !isLoadingOrSending;

  const renderChatItem = useCallback(
    ({ item }) => (
      <MessageBubble
        message={item}
        onViewPlace={handleViewPlace}
      />
    ),
    [handleViewPlace]
  );

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
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
              <Image source={avaGenie} style={s.avatarImage} resizeMode="cover" />
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

      <FlashList
        ref={scrollRef}
        data={hasMessages ? conversationMemory : []}
        keyExtractor={(item, index) => item.id ?? `${item.role}-${index}`}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={16}
        estimatedItemSize={140}
        getItemType={(item) => (item?.plan || item?.suggestedPlaces?.length > 0 ? "complex" : "simple")}
        overrideItemLayout={(layout, item) => {
          layout.size = item?.plan || item?.suggestedPlaces?.length > 0 ? 340 : 110;
        }}
        renderItem={renderChatItem}
        style={s.flex1}
        contentContainerStyle={hasMessages ? s.scrollContentMessages : s.scrollContentEmpty}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Glow style="breathe" speed={0.72} intensity={0.62} colors={["#2563EB", "#7C3AED", "#DB2777"]}>
              <LinearGradient
                colors={["#2563EB", "#7C3AED", "#DB2777"]}
                style={s.heroAvatarRing}
              >
                <Image source={avaGenie} style={s.heroAvatarImage} resizeMode="cover" />
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
        }
        ListFooterComponent={
          <>
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
          </>
        }
      />

      {showScrollBottom && (
        <Pressable
          onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
          style={s.scrollBottomBtn}
          accessibilityRole="button"
          accessibilityLabel="Cuộn xuống tin nhắn mới nhất"
        >
          <ArrowDown size={18} color="#2563EB" />
        </Pressable>
      )}

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
    width: 42,
    height: 42,
    borderRadius: 21,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  heroAvatarImage: {
    width: 82,
    height: 82,
    borderRadius: 41,
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
  scrollBottomBtn: {
    position: "absolute",
    right: 20,
    bottom: 90,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.16)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    zIndex: 20,
  },
});
