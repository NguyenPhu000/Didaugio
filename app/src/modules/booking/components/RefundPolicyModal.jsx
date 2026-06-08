import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const formatCurrency = (amount) =>
  `${new Intl.NumberFormat("vi-VN").format(Number(amount) || 0)}đ`;

export default function RefundPolicyModal({
  visible,
  onClose,
  onConfirm,
  booking,
  isLoading = false,
}) {
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    if (!visible) {
      setCancelReason("");
    }
  }, [visible]);

  const refundAmount = useMemo(() => {
    const paymentAmount = Number(booking?.payment?.amount || booking?.finalPrice || 0);
    const refundableAmount = Number(booking?.payment?.amount || booking?.finalPrice || 0);
    return refundableAmount || paymentAmount;
  }, [booking]);

  const handleConfirm = () => {
    if (!cancelReason.trim() || cancelReason.trim().length < 5) return;
    onConfirm?.({ cancelReason: cancelReason.trim() });
  };

  const handleClose = () => {
    if (isLoading) return;
    setCancelReason("");
    onClose?.();
  };

  const usageDate = booking?.useDate
    ? new Date(booking.useDate).toLocaleDateString("vi-VN")
    : "-";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            maxHeight: "88%",
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
                gap: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#111827",
                  flex: 1,
                }}
              >
                Xác nhận hủy & yêu cầu hoàn tiền
              </Text>
              <Pressable onPress={handleClose} hitSlop={8}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <View
              style={{
                backgroundColor: "#F9FAFB",
                borderRadius: 18,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
                Booking
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                {booking?.service?.name || booking?.serviceName || "Dịch vụ"} · #{booking?.bookingCode || "-"}
              </Text>
              <Text style={{ fontSize: 12, color: "#6B7280" }}>
                Số tiền đã thanh toán
              </Text>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: "#16A34A",
                  marginTop: 4,
                }}
              >
                {formatCurrency(refundAmount)}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "#EFF6FF",
                borderRadius: 18,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#1D4ED8",
                  marginBottom: 8,
                }}
              >
                Chính sách áp dụng
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "#1E40AF",
                  lineHeight: 20,
                }}
              >
                • Thời gian hiện tại: {new Date().toLocaleDateString("vi-VN")}{"\n"}
                • Ngày sử dụng: {usageDate}{"\n"}
                • Mức hoàn trả: Admin sẽ xem xét và xử lý theo chính sách của dịch vụ
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Lý do hủy chuyến (bắt buộc, tối thiểu 5 ký tự)
              </Text>
              <TextInput
                multiline
                value={cancelReason}
                onChangeText={setCancelReason}
                placeholder="Ví dụ: Tôi bận việc đột xuất nên không thể tham gia đúng lịch."
                textAlignVertical="top"
                editable={!isLoading}
                style={{
                  minHeight: 110,
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 14,
                  color: "#111827",
                  backgroundColor: "#FFFFFF",
                }}
              />
              <Text style={{ marginTop: 6, fontSize: 12, color: "#6B7280" }}>
                Yêu cầu hoàn tiền sẽ được gửi đến admin để duyệt thủ công.
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
              <Pressable
                onPress={handleClose}
                disabled={isLoading}
                style={{
                  flex: 1,
                  borderRadius: 999,
                  paddingVertical: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <Text style={{ color: "#374151", fontSize: 14, fontWeight: "600" }}>
                  Giữ lại đơn
                </Text>
              </Pressable>

              <Pressable
                onPress={handleConfirm}
                disabled={isLoading || cancelReason.trim().length < 5}
                style={{
                  flex: 1,
                  backgroundColor:
                    isLoading || cancelReason.trim().length < 5 ? "#FCA5A5" : "#DC2626",
                  borderRadius: 999,
                  paddingVertical: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="close-circle" size={18} color="#FFFFFF" />
                )}
                <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
                  {isLoading ? "Đang xử lý..." : "Xác nhận Hủy & Đòi tiền"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
