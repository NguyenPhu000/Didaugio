import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useRouter } from "expo-router";
import { useFeedback } from "../src/modules/feedback/hooks/useFeedback";
import { cn } from "../src/lib/cn";

const REPORT_TYPES = [
  { value: "suggestion", label: "Góp ý cải thiện", icon: "lightbulb" },
  { value: "bug_report", label: "Báo lỗi ứng dụng", icon: "bug-report" },
  { value: "place_error", label: "Sai thông tin địa điểm", icon: "place" },
  { value: "other", label: "Khác", icon: "help-outline" },
];

const TypeChip = ({ option, active, onPress }) => (
  <Pressable
    onPress={onPress}
    className={cn(
      "flex-row items-center gap-1.5 px-3.5 py-2 rounded-2xl border mr-2 mb-2",
      active ? "bg-primary border-primary" : "bg-white border-gray-200",
    )}
  >
    <MaterialIconsRounded
      name={option.icon}
      size={15}
      color={active ? "#fff" : "#6b7280"}
    />
    <Text
      className={cn(
        "text-[12px] font-semibold",
        active ? "text-white" : "text-ink-secondary",
      )}
    >
      {option.label}
    </Text>
  </Pressable>
);

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const contentRef = useRef(null);

  const {
    reportType,
    setReportType,
    title,
    setTitle,
    content,
    setContent,
    canSubmit,
    isLoading,
    isSuccess,
    isError,
    error,
    submit,
    reset,
  } = useFeedback();

  useEffect(() => {
    if (isSuccess) {
      Alert.alert(
        "Cảm ơn bạn! 🎉",
        "Góp ý của bạn đã được ghi nhận. Chúng tôi sẽ xem xét sớm nhất có thể.",
        [
          {
            text: "OK",
            onPress: () => {
              reset();
              router.back();
            },
          },
        ],
      );
    }
  }, [isSuccess]);

  useEffect(() => {
    if (isError) {
      Alert.alert("Gửi thất bại", error?.message || "Vui lòng thử lại sau.");
    }
  }, [isError]);

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {/* ── Header ── */}
      <View
        className="flex-row items-center gap-2 px-4 pt-2 pb-3 bg-white border-b border-gray-100"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 1,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 items-center justify-center rounded-xl bg-surface active:bg-gray-100"
        >
          <MaterialIconsRounded name="arrow-back" size={22} color="#111618" />
        </Pressable>
        <View className="flex-1">
          <Text
            className="text-[18px] font-bold text-ink"
            style={{ letterSpacing: -0.3 }}
          >
            Góp ý & Hỗ trợ
          </Text>
          <Text className="text-[12px] text-ink-secondary">
            Ý kiến của bạn giúp chúng tôi cải thiện
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 24) + 80,
          }}
        >
          {/* ── Illustration strip ── */}
          <View
            className="mx-4 mt-4 p-4 rounded-[20px] flex-row items-center gap-4"
            style={{ backgroundColor: "#e6f3fb" }}
          >
            <View
              className="w-12 h-12 rounded-2xl items-center justify-center"
              style={{ backgroundColor: "#0077b8" }}
            >
              <MaterialIconsRounded name="feedback" size={26} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-bold text-ink">
                Chúng tôi lắng nghe bạn
              </Text>
              <Text className="text-[12px] text-ink-secondary mt-0.5 leading-[18px]">
                Góp ý giúp Đi Đâu Giờ? ngày càng tốt hơn cho cộng đồng Cần Thơ
              </Text>
            </View>
          </View>

          {/* ── Category ── */}
          <View className="px-4 mt-5">
            <Text className="text-[13px] font-bold text-ink mb-3">
              Loại góp ý <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row flex-wrap">
              {REPORT_TYPES.map((opt) => (
                <TypeChip
                  key={opt.value}
                  option={opt}
                  active={reportType === opt.value}
                  onPress={() => setReportType(opt.value)}
                />
              ))}
            </View>
          </View>

          {/* ── Title input ── */}
          <View className="px-4 mt-5">
            <Text className="text-[13px] font-bold text-ink mb-2">
              Tiêu đề <Text className="text-red-500">*</Text>
            </Text>
            <View
              className="bg-white rounded-2xl px-4 py-1 border border-gray-200"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Mô tả ngắn gọn vấn đề..."
                placeholderTextColor="#9ca3af"
                className="text-[14px] text-ink py-3"
                returnKeyType="next"
                onSubmitEditing={() => contentRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>
            <Text className="text-[11px] text-ink-secondary mt-1 ml-1">
              {title.length}/120 ký tự
            </Text>
          </View>

          {/* ── Content input ── */}
          <View className="px-4 mt-5">
            <Text className="text-[13px] font-bold text-ink mb-2">
              Nội dung chi tiết <Text className="text-red-500">*</Text>
            </Text>
            <View
              className="bg-white rounded-2xl px-4 border border-gray-200"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <TextInput
                ref={contentRef}
                value={content}
                onChangeText={setContent}
                placeholder="Mô tả chi tiết góp ý, lỗi gặp phải hoặc đề xuất của bạn..."
                placeholderTextColor="#9ca3af"
                className="text-[14px] text-ink py-3"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={{ minHeight: 120 }}
              />
            </View>
            <Text className="text-[11px] text-ink-secondary mt-1 ml-1">
              {content.length} ký tự
            </Text>
          </View>

          {/* ── Help links ── */}
          <View className="px-4 mt-6">
            <Text className="text-[13px] font-bold text-ink mb-3">
              Câu hỏi thường gặp
            </Text>
            <View
              className="bg-white rounded-2xl overflow-hidden"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              {[
                { icon: "map", label: "Cách thêm/chỉnh thông tin địa điểm" },
                { icon: "star", label: "Hướng dẫn đánh giá địa điểm" },
                { icon: "security", label: "Chính sách bảo mật & điều khoản" },
              ].map((item, idx, arr) => (
                <View key={item.label}>
                  <Pressable className="flex-row items-center px-4 py-3.5 gap-3 active:bg-gray-50">
                    <MaterialIconsRounded name={item.icon} size={18} color="#0077b8" />
                    <Text className="flex-1 text-[13px] font-medium text-ink">
                      {item.label}
                    </Text>
                    <MaterialIconsRounded
                      name="chevron-right"
                      size={18}
                      color="#9ca3af"
                    />
                  </Pressable>
                  {idx < arr.length - 1 && (
                    <View className="h-px bg-gray-100 ml-14" />
                  )}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* ── Submit CTA ── */}
        <View
          className="absolute bottom-0 left-0 right-0 px-4 bg-white border-t border-gray-100"
          style={{
            paddingBottom: Math.max(insets.bottom, 16),
            paddingTop: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Pressable
            onPress={() => canSubmit && !isLoading && submit()}
            disabled={!canSubmit || isLoading}
            className={cn(
              "rounded-2xl py-4 items-center flex-row justify-center gap-2",
              canSubmit && !isLoading ? "bg-primary" : "bg-gray-200",
            )}
            style={
              canSubmit && !isLoading
                ? {
                    shadowColor: "#0077b8",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }
                : {}
            }
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <MaterialIconsRounded
                name="send"
                size={18}
                color={canSubmit ? "#fff" : "#9ca3af"}
              />
            )}
            <Text
              className={cn(
                "text-[15px] font-bold",
                canSubmit && !isLoading ? "text-white" : "text-gray-400",
              )}
            >
              {isLoading ? "Đang gửi..." : "Gửi góp ý"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
