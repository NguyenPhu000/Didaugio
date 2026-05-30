import { memo } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBadge } from "./StatusBadge";
import { formatBookingDateTime, formatPrice } from "../../utils/tripHelpers";
import s, { STYLES } from "../../utils/tripDetailTokens";

export const ServicesTab = memo(function ServicesTab({
  groupedBookings,
  isLoading,
  onOpenBooking,
}) {
  if (isLoading) {
    return (
      <View className={STYLES.centeredState}>
        <View className="w-12 h-12 rounded-full bg-black/[0.04] items-center justify-center">
          <ActivityIndicator size="small" color="#1D1D1F" />
        </View>
        <Text className={STYLES.centeredBody}>Đang tải dịch vụ...</Text>
      </View>
    );
  }

  if (!groupedBookings || groupedBookings.length === 0) {
    return (
      <View className={STYLES.centeredState}>
        <View className="w-14 h-14 rounded-[20px] bg-black/[0.04] items-center justify-center mb-2">
          <MaterialIcons name="receipt-long" size={28} color="rgba(0,0,0,0.2)" />
        </View>
        <Text className={STYLES.emptyTitle}>Chưa có booking</Text>
        <Text className={STYLES.emptyBody}>
          Các booking liên kết với chuyến đi sẽ hiển thị tại đây.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120, gap: 20 }}
    >
      {groupedBookings.map((group) => (
        <View key={`group-${group.dayNumber}-${group.label}`} className="gap-2.5">
          <View className="flex-row items-center gap-2">
            <Text className="text-[12px] font-semibold text-black/40 tracking-widest uppercase">
              {group.label}
            </Text>
            <View className="min-w-[20px] h-5 rounded-full bg-black/[0.06] items-center justify-center px-1.5">
              <Text className="text-[10px] font-semibold text-black/40">
                {group.items.length}
              </Text>
            </View>
          </View>

          {group.items.map((booking) => (
            <Pressable
              key={booking.id}
              onPress={() => onOpenBooking(booking.id)}
              style={({ pressed }) => [
                pressed && { opacity: 0.8 },
              ]}
              className="flex-row items-center justify-between gap-2.5 py-3.5 px-4 bg-white rounded-[18px] border border-black/[0.05]"
            >
              <View className={STYLES.bookingRowInfo}>
                <Text className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight" numberOfLines={1}>
                  {booking?.service?.name || "Dịch vụ"}
                </Text>
                <Text className={STYLES.bookingRowPlace} numberOfLines={1}>
                  {booking?.service?.place?.name || "Địa điểm"}
                </Text>
                <Text className={STYLES.bookingRowMeta} numberOfLines={1}>
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
      ))}
    </ScrollView>
  );
});
