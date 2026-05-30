import { memo, useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBadge } from "./StatusBadge";
import { formatBookingDateTime, formatPrice } from "../../utils/tripHelpers";
import s, { T, STYLES } from "../../utils/tripDetailTokens";

const formatVnd = (amount) => {
  const value = Number(amount || 0);
  return `${value.toLocaleString("vi-VN")} VND`;
};

export const BudgetTab = memo(function BudgetTab({
  bookings,
  summary,
  isLoading,
  onOpenBooking,
}) {
  const router = useRouter();

  const upcomingReminders = useMemo(() => {
    const now = new Date();
    const fortyEightHoursMs = 48 * 60 * 60 * 1000;

    return (bookings || [])
      .filter((b) => b?.status === "confirmed" && b?.useDate)
      .map((b) => {
        const useDateStr = String(b.useDate).slice(0, 10);
        const useTimeStr = b.useTime || "00:00";
        const dateTimeObj = new Date(`${useDateStr}T${useTimeStr}:00`);
        if (Number.isNaN(dateTimeObj.getTime())) return null;
        
        const diffMs = dateTimeObj.getTime() - now.getTime();
        return { booking: b, dateTime: dateTimeObj, diffMs };
      })
      .filter((item) => item !== null && item.diffMs > 0 && item.diffMs <= fortyEightHoursMs)
      .sort((a, b) => a.diffMs - b.diffMs);
  }, [bookings]);

  if (isLoading) {
    return (
      <View className={STYLES.centeredState}>
        <View className="w-12 h-12 rounded-full bg-black/[0.04] items-center justify-center">
          <ActivityIndicator size="small" color="#1D1D1F" />
        </View>
        <Text className={STYLES.centeredBody}>Đang tải ngân sách...</Text>
      </View>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <View className={STYLES.centeredState}>
        <View className="w-14 h-14 rounded-[20px] bg-black/[0.04] items-center justify-center mb-2">
          <MaterialIcons
            name="account-balance-wallet"
            size={28}
            color="rgba(0,0,0,0.2)"
          />
        </View>
        <Text className={STYLES.emptyTitle}>Chưa có dữ liệu</Text>
        <Text className={STYLES.emptyBody}>
          Tab ngân sách sẽ tổng hợp chi phí khi có booking liên kết.
        </Text>
        <Pressable
          style={({ pressed }) => [
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => router.push("/(tabs)/explore")}
          className="flex-row items-center gap-1.5 bg-[#1D1D1F] px-4.5 py-2.5 rounded-full mt-3"
        >
          <MaterialIcons name="explore" size={16} color="#FFFFFF" />
          <Text className="text-white text-[13px] font-semibold tracking-tight">Khám phá dịch vụ</Text>
        </Pressable>
      </View>
    );
  }

  const {
    totalAmount = 0,
    totalCount = 0,
    confirmedAmount = 0,
    completedAmount = 0,
    pendingAmount = 0,
  } = summary || {};

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120, gap: 16 }}
    >
      {/* Total card */}
      <View className="bg-[#1D1D1F] rounded-[24px] p-6 gap-2">
        <Text className="text-[13px] font-normal text-white/50 tracking-tight">Tổng dự kiến</Text>
        <Text className="text-[34px] font-semibold text-white tracking-tighter">
          {formatPrice(totalAmount)}
        </Text>
        <View className="flex-row items-center gap-2 mt-1">
          <View className="flex-row items-center gap-1.5">
            <View className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
            <Text className="text-[13px] font-normal text-white/55 tracking-tight">
              {totalCount} booking
            </Text>
          </View>
        </View>
      </View>

      {/* Breakdown */}
      <View className="flex-row gap-2.5">
        <View className="flex-1 bg-white rounded-[20px] py-4.5 px-3 items-center justify-center border border-black/[0.05] relative overflow-hidden min-h-[82px]">
          {/* Icon in chìm ẩn phía sau */}
          <View className="absolute inset-0 items-center justify-center opacity-[0.3]">
            <MaterialIcons
              name="check-circle"
              size={56}
              color="#34C759"
            />
          </View>
          <Text className="text-[15px] font-bold text-[#1D1D1F] tracking-tight text-center z-10" numberOfLines={1}>
            {formatVnd(confirmedAmount + completedAmount)}
          </Text>
          <Text className="text-[12px] font-normal text-black/45 tracking-tight text-center mt-0.5 z-10">
            Đã xác nhận
          </Text>
        </View>
        <View className="flex-1 bg-white rounded-[20px] py-4.5 px-3 items-center justify-center border border-black/[0.05] relative overflow-hidden min-h-[82px]">
          {/* Icon in chìm ẩn phía sau */}
          <View className="absolute inset-0 items-center justify-center opacity-[0.2]">
            <MaterialIcons
              name="schedule"
              size={56}
              color="#FF9F0A"
            />
          </View>
          <Text className="text-[15px] font-bold text-[#1D1D1F] tracking-tight text-center z-10" numberOfLines={1}>
            {formatVnd(pendingAmount)}
          </Text>
          <Text className="text-[12px] font-normal text-black/45 tracking-tight text-center mt-0.5 z-10">
            Chờ xác nhận
          </Text>
        </View>
      </View>

      {/* Reminder Banner */}
      {upcomingReminders.length > 0 && (
        <View className="gap-2.5 mt-1">
          <Text className={STYLES.groupLabel}>Nhắc nhở lịch hẹn sắp tới</Text>
          {upcomingReminders.map(({ booking, diffMs }) => {
            const hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));
            const timeLeftLabel =
              hoursLeft > 24
                ? `còn ${Math.ceil(hoursLeft / 24)} ngày`
                : `còn ${hoursLeft} giờ`;

            return (
              <Pressable
                key={`reminder-${booking.id}`}
                onPress={() => onOpenBooking(booking.id)}
                style={({ pressed }) => [pressed && { opacity: 0.85 }]}
                className="flex-row items-start gap-3 p-4 bg-[#FFF9E6] border border-[#FFE0B2] rounded-[18px]"
              >
                <View className="w-9 h-9 rounded-full bg-[#FF9F0A]/10 items-center justify-center mt-0.5">
                  <MaterialIcons name="notifications-active" size={18} color="#FF9F0A" />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="text-[14px] font-bold text-[#D97706] tracking-tight">
                    Sắp đến giờ hẹn! ({timeLeftLabel})
                  </Text>
                  <Text className="text-[13px] text-black/75 font-medium leading-[18px]">
                    Lịch đặt dịch vụ <Text className="font-bold text-[#1D1D1F]">{booking?.service?.name}</Text> tại <Text className="font-bold text-[#1D1D1F]">{booking?.service?.place?.name || "địa điểm"}</Text> của bạn sẽ diễn ra lúc <Text className="font-semibold text-[#1D1D1F]">{formatBookingDateTime(booking)}</Text>.
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Detail list */}
      <View className="gap-2.5 mt-1">
        <Text className={STYLES.groupLabel}>Chi tiết đặt dịch vụ</Text>

        {bookings.map((booking) => (
          <Pressable
            key={booking.id}
            onPress={() => onOpenBooking(booking.id)}
            style={({ pressed }) => [
              pressed && { opacity: 0.8 },
            ]}
            className="flex-row items-center justify-between gap-2.5 py-3.5 px-4 bg-white rounded-[18px] border border-black/[0.05]"
          >
            <View className={STYLES.bookingRowInfo}>
              <Text className="text-[15px] font-bold text-[#1D1D1F] tracking-tight" numberOfLines={1}>
                {booking?.service?.place?.name || "Địa điểm chưa xác định"}
              </Text>
              <Text className="text-[13px] font-medium text-black/60 mt-0.5" numberOfLines={1}>
                {booking?.service?.name || "Dịch vụ"}
              </Text>
              <Text className={`${STYLES.bookingRowMeta} mt-1`} numberOfLines={1}>
                #{booking.bookingCode || booking.id} ·{" "}
                {formatBookingDateTime(booking)}
              </Text>
            </View>

            <View className={STYLES.bookingRowRight}>
              <StatusBadge status={booking?.status} />
              <Text className="text-[14px] font-semibold text-[#1D1D1F] tracking-tight">
                {formatPrice(booking?.finalPrice)}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
});
