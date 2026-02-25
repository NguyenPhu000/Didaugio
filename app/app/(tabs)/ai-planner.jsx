/**
 * AIPlannerScreen — "The Concierge" AI trip planner
 * Design: Chat interface matching Stitch "AI Planner The Concierge" screen
 * Data: POST /app/me/trips/generate → trip.destinations[]
 */
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAIPlanner } from "../../src/modules/ai/hooks/useAIPlanner";
import { cn } from "../../src/lib/cn";
import { useAuthStore } from "../../src/stores/authStore";
import { GuestGate } from "../../src/components/ui/GuestGate";

const QUICK_SUGGESTIONS = [
  "🍜 Gợi ý quán ăn ngon ở Ninh Kiều",
  "📸 Top 5 địa điểm chụp ảnh đẹp",
  "🌙 Kế hoạch buổi tối ở Cần Thơ",
  "👨‍👩‍👧 Đi chơi gia đình 1 ngày",
  "☕ Cà phê view đẹp gần trung tâm",
];

// ─── Destination timeline item ─────────────────────────────────────────────
const DestinationItem = ({ dest, index }) => (
  <View className="flex-row gap-3 mb-3">
    {/* Step dot */}
    <View className="items-center">
      <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
        <Text className="text-[11px] font-bold text-white">{index + 1}</Text>
      </View>
      {/* Connector line — rendered by parent */}
    </View>
    <View className="flex-1 pb-1">
      {dest.startTime ? (
        <Text className="text-[11px] font-semibold text-ink-secondary mb-0.5">
          {dest.startTime}
          {dest.endTime ? ` – ${dest.endTime}` : ""}
        </Text>
      ) : null}
      <Text className="text-[14px] font-bold text-ink">
        {dest.place?.name || `Điểm dừng ${index + 1}`}
      </Text>
      {dest.place?.address ? (
        <Text
          className="text-[12px] text-ink-secondary mt-0.5"
          numberOfLines={1}
        >
          {dest.place.address}
        </Text>
      ) : null}
      {dest.note ? (
        <Text className="text-[12px] text-ink-secondary mt-1 leading-4">
          {dest.note}
        </Text>
      ) : null}
      {dest.transportToNext ? (
        <View className="flex-row items-center gap-1 mt-1">
          <MaterialIcons name="directions" size={12} color="#9ca3af" />
          <Text className="text-[11px] text-ink-muted">
            {dest.transportToNext}
          </Text>
        </View>
      ) : null}
    </View>
  </View>
);

// ─── Trip summary card ─────────────────────────────────────────────────────
const TripCard = ({ trip }) => {
  const destinations = trip?.destinations || [];

  return (
    <View
      className="mt-3 rounded-2xl overflow-hidden border border-gray-100"
      style={{ backgroundColor: "#f8faff" }}
    >
      {/* Trip header */}
      <View className="bg-primary px-4 py-3">
        <Text className="text-[15px] font-bold text-white">{trip.title}</Text>
        <View className="flex-row items-center gap-3 mt-1">
          <View className="flex-row items-center gap-1">
            <MaterialIcons
              name="calendar-today"
              size={12}
              color="rgba(255,255,255,0.8)"
            />
            <Text className="text-[11px] text-white opacity-80">
              {trip.totalDays} ngày
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <MaterialIcons
              name="place"
              size={12}
              color="rgba(255,255,255,0.8)"
            />
            <Text className="text-[11px] text-white opacity-80">
              {destinations.length} địa điểm
            </Text>
          </View>
          {trip.estimatedCost ? (
            <View className="flex-row items-center gap-1">
              <MaterialIcons
                name="attach-money"
                size={12}
                color="rgba(255,255,255,0.8)"
              />
              <Text className="text-[11px] text-white opacity-80">
                ~{Number(trip.estimatedCost).toLocaleString("vi-VN")}đ
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Destinations */}
      {destinations.length > 0 && (
        <View className="p-4">
          {destinations.map((dest, idx) => (
            <DestinationItem key={dest.id || idx} dest={dest} index={idx} />
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Chat bubble ────────────────────────────────────────────────────────────
const ChatBubble = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <View
      className={cn(
        "flex-row gap-2 mb-1",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <View className="w-8 h-8 rounded-full bg-primary items-center justify-center self-end mb-0.5 flex-shrink-0">
          <MaterialIcons name="auto-awesome" size={15} color="#fff" />
        </View>
      )}

      <View
        className={cn(
          "max-w-[82%] rounded-2xl px-3 py-3",
          isUser
            ? "bg-primary rounded-br-sm"
            : "bg-white border border-gray-100 rounded-bl-sm",
        )}
        style={
          isUser
            ? {}
            : {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }
        }
      >
        <Text
          className={cn(
            "text-[14px] leading-5",
            isUser ? "text-white" : "text-ink",
            message.isError && "text-danger",
          )}
        >
          {message.text}
        </Text>

        {/* Trip timeline */}
        {message.plan?.destinations?.length > 0 && (
          <TripCard trip={message.plan} />
        )}
      </View>
    </View>
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function AIPlannerScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const [inputText, setInputText] = useState("");
  const accessToken = useAuthStore((s) => s.accessToken);
  const isGuest = useAuthStore((s) => s.isGuest);

  const { messages, isLoading, error, sendMessage, reset } = useAIPlanner();

  // Guard: chỉ user đăng nhập mới dùng được AI Planner
  if (!accessToken || isGuest) {
    return (
      <GuestGate
        icon="auto-awesome"
        title="Đăng nhập để dùng AI Planner"
        description="Tính năng lên kế hoạch chuyến đi bằng AI chỉ dành cho tài khoản đã đăng nhập."
      />
    );
  }

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;
    setInputText("");
    await sendMessage(text);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  };

  const handleQuickSuggestion = (text) => {
    setInputText(text);
  };

  const isFirstVisit = messages.length === 0;

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.bottom}
    >
      <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
        {/* ── Header ── */}
        <View
          className="flex-row items-center gap-3 px-5 py-3.5 bg-white border-b border-gray-100"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          {/* Gradient-style concierge avatar */}
          <View
            className="w-11 h-11 rounded-2xl items-center justify-center"
            style={{ backgroundColor: "#0077b8" }}
          >
            <MaterialIcons name="auto-awesome" size={22} color="#fff" />
          </View>
          <View className="flex-1">
            <Text
              className="text-[17px] font-bold text-ink"
              style={{ letterSpacing: -0.2 }}
            >
              The Concierge
            </Text>
            <Text className="text-[11px] text-ink-secondary">
              AI Planner • Cần Thơ
            </Text>
          </View>
          {messages.length > 0 && (
            <Pressable
              onPress={reset}
              hitSlop={12}
              className="w-9 h-9 rounded-full bg-surface items-center justify-center"
            >
              <MaterialIcons name="refresh" size={20} color="#737373" />
            </Pressable>
          )}
        </View>

        {/* ── Chat area ── */}
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            messages.length > 0 &&
            scrollRef.current?.scrollToEnd({ animated: false })
          }
        >
          {isFirstVisit ? (
            <View className="items-center pt-6 gap-3">
              {/* Large welcome icon */}
              <View
                className="w-20 h-20 rounded-3xl items-center justify-center mb-1"
                style={{ backgroundColor: "#e6f3fb" }}
              >
                <MaterialIcons name="auto-awesome" size={44} color="#0077b8" />
              </View>
              <Text className="text-[19px] font-bold text-ink text-center">
                Xin chào! Tôi là The Concierge 👋
              </Text>
              <Text className="text-[14px] text-ink-secondary text-center leading-5 px-2">
                Tôi sẽ giúp bạn lên kế hoạch chuyến đi hoàn hảo tại Cần Thơ. Hãy
                thử các gợi ý bên dưới hoặc nhập câu hỏi của bạn!
              </Text>

              {/* Quick suggestion chips */}
              <View className="w-full gap-2 mt-1">
                {QUICK_SUGGESTIONS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => handleQuickSuggestion(s)}
                    className="bg-white rounded-xl px-4 py-3 border border-gray-100 active:bg-primary-light"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 4,
                      elevation: 1,
                    }}
                  >
                    <Text className="text-[14px] text-ink font-medium">
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)
          )}

          {/* Loading indicator */}
          {isLoading && (
            <View className="flex-row gap-2 mb-1 justify-start">
              <View className="w-8 h-8 rounded-full bg-primary items-center justify-center self-end mb-0.5 flex-shrink-0">
                <MaterialIcons name="auto-awesome" size={15} color="#fff" />
              </View>
              <View className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex-row gap-2 items-center">
                <ActivityIndicator size="small" color="#0077b8" />
                <Text className="text-[13px] text-ink-secondary">
                  Đang lên kế hoạch...
                </Text>
              </View>
            </View>
          )}

          {/* Error (non-message) */}
          {error && !messages.find((m) => m.isError) && (
            <View className="flex-row gap-2 items-center bg-danger-bg rounded-xl p-3 border border-red-200">
              <MaterialIcons name="error-outline" size={16} color="#ef4444" />
              <Text className="text-[13px] text-danger flex-1">{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* ── Input bar ── */}
        <View
          className="flex-row gap-2 px-4 pt-3 bg-white border-t border-gray-100 items-end"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Nhập yêu cầu của bạn..."
            placeholderTextColor="#9ca3af"
            className="flex-1 text-[14px] text-ink bg-surface rounded-2xl px-4 py-2.5 border border-gray-200 leading-5"
            style={{ maxHeight: 100 }}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
            className={cn(
              "w-11 h-11 rounded-full items-center justify-center",
              inputText.trim() && !isLoading ? "bg-primary" : "bg-gray-200",
            )}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons
                name="send"
                size={20}
                color={inputText.trim() ? "#fff" : "#9ca3af"}
              />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
