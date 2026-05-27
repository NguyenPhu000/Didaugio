import { memo } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { TOKENS } from "../../../../constants/design-tokens";
import { StatusBadge } from "./StatusBadge";
import { formatBookingDateTime, formatPrice } from "../../utils/tripHelpers";
import s, { T } from "../../utils/tripDetailTokens";

const BUDGET_ITEMS = [
  { key: "confirmed", label: "Đã xác nhận", icon: "check-circle" },
  { key: "pending", label: "Chờ xác nhận", icon: "schedule" },
  { key: "cancelled", label: "Đã hủy", icon: "cancel" },
];

export const BudgetTab = memo(function BudgetTab({
  bookings,
  summary,
  isLoading,
  onOpenBooking,
}) {
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={s.centeredState}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color="#1D1D1F" />
        </View>
        <Text style={s.centeredBody}>Đang tải ngân sách...</Text>
      </View>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <View style={s.centeredState}>
        <View style={styles.emptyIcon}>
          <MaterialIcons
            name="account-balance-wallet"
            size={28}
            color="rgba(0,0,0,0.2)"
          />
        </View>
        <Text style={s.emptyTitle}>Chưa có dữ liệu</Text>
        <Text style={s.emptyBody}>
          Tab ngân sách sẽ tổng hợp chi phí khi có booking liên kết.
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.exploreBtn,
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => router.push("/(tabs)/explore")}
        >
          <MaterialIcons name="explore" size={16} color="#FFFFFF" />
          <Text style={styles.exploreBtnText}>Khám phá dịch vụ</Text>
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
      contentContainerStyle={styles.scrollContent}
    >
      {/* Total card */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Tổng dự kiến</Text>
        <Text style={styles.totalValue}>
          {formatPrice(totalAmount)}
        </Text>
        <View style={styles.totalMeta}>
          <View style={styles.totalMetaItem}>
            <View style={styles.totalMetaDot} />
            <Text style={styles.totalMetaText}>
              {totalCount} booking
            </Text>
          </View>
        </View>
      </View>

      {/* Breakdown */}
      <View style={styles.breakdownRow}>
        <View style={styles.breakdownCard}>
          <MaterialIcons
            name="check-circle"
            size={18}
            color="#34C759"
          />
          <Text style={styles.breakdownValue}>
            {formatPrice(confirmedAmount + completedAmount)}
          </Text>
          <Text style={styles.breakdownLabel}>Đã xác nhận</Text>
        </View>
        <View style={styles.breakdownCard}>
          <MaterialIcons
            name="schedule"
            size={18}
            color="#FF9F0A"
          />
          <Text style={styles.breakdownValue}>
            {formatPrice(pendingAmount)}
          </Text>
          <Text style={styles.breakdownLabel}>Chờ xác nhận</Text>
        </View>
      </View>

      {/* Detail list */}
      <View style={styles.detailSection}>
        <Text style={s.groupLabel}>Chi tiết đặt dịch vụ</Text>

        {bookings.map((booking) => (
          <Pressable
            key={booking.id}
            onPress={() => onOpenBooking(booking.id)}
            style={({ pressed }) => [
              styles.bookingCard,
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={s.bookingRowInfo}>
              <Text style={styles.bookingName} numberOfLines={1}>
                {booking?.service?.name || "Dịch vụ"}
              </Text>
              <Text style={s.bookingRowMeta} numberOfLines={1}>
                #{booking.bookingCode || booking.id} ·{" "}
                {formatBookingDateTime(booking)}
              </Text>
            </View>

            <View style={s.bookingRowRight}>
              <StatusBadge status={booking?.status} />
              <Text style={styles.bookingPrice}>
                {formatPrice(booking?.finalPrice)}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  loadingWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 16,
  },

  /* Total card */
  totalCard: {
    backgroundColor: "#1D1D1F",
    borderRadius: 24,
    padding: 24,
    gap: 8,
  },
  totalLabel: {
    fontSize: 13,
    fontFamily: TOKENS.font.body,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: -0.1,
  },
  totalValue: {
    fontSize: 34,
    fontFamily: TOKENS.font.heading,
    color: "#FFFFFF",
    letterSpacing: -0.8,
  },
  totalMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  totalMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  totalMetaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34C759",
  },
  totalMetaText: {
    fontSize: 13,
    fontFamily: TOKENS.font.body,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: -0.1,
  },

  /* Breakdown */
  breakdownRow: {
    flexDirection: "row",
    gap: 10,
  },
  breakdownCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    gap: 8,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  breakdownValue: {
    fontSize: 20,
    fontFamily: TOKENS.font.heading,
    color: "#1D1D1F",
    letterSpacing: -0.4,
  },
  breakdownLabel: {
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    color: "rgba(0,0,0,0.4)",
    letterSpacing: -0.1,
  },

  /* Detail */
  detailSection: {
    gap: 10,
    marginTop: 4,
  },
  bookingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  bookingName: {
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    color: "#1D1D1F",
    letterSpacing: -0.2,
  },
  bookingPrice: {
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
    color: "#1D1D1F",
    letterSpacing: -0.2,
  },
  exploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1D1D1F",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9999,
    marginTop: 12,
  },
  exploreBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.15,
  },
});
