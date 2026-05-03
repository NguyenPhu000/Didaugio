import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BOOKING_APPLE_THEME as THEME,
  TOKENS,
} from "../../src/constants/design-tokens";
import { useMyBookings } from "../../src/modules/booking/hooks/useBooking";
import { NotificationBell } from "../../src/components/composed/NotificationBell";

const STATUS_META = {
  pending: {
    label: "Chờ xác nhận",
    color: "#1D1D1F",
    bg: "#EDEDF2",
  },
  confirmed: {
    label: "Đã xác nhận",
    color: "#FFFFFF",
    bg: "#1D1D1F",
  },
  completed: {
    label: "Hoàn thành",
    color: "#1D1D1F",
    bg: "#DFDFE4",
  },
  cancelled: {
    label: "Đã hủy",
    color: "#5A5A5E",
    bg: "#ECECEF",
  },
  rejected: {
    label: "Bị từ chối",
    color: "#5A5A5E",
    bg: "#F2E8DF",
  },
  expired: {
    label: "Hết hạn",
    color: "#5A5A5E",
    bg: "#ECECEF",
  },
  no_show: {
    label: "Không đến",
    color: "#5A5A5E",
    bg: "#ECECEF",
  },
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("vi-VN")}đ`;
};

const formatDate = (value) => {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function MyBookingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useMyBookings();

  const bookings = useMemo(() => data?.data || [], [data?.data]);
  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter(
      (item) => item?.status === "confirmed",
    ).length;
    const pending = bookings.filter(
      (item) => item?.status === "pending",
    ).length;
    return { total, confirmed, pending };
  }, [bookings]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={22} color={THEME.text} />
        </Pressable>

        <View style={styles.headerBody}>
          <Text style={styles.title}>Booking của tôi</Text>
          <Text style={styles.subtitle}>
            Theo dõi xác nhận, QR và liên kết trip
          </Text>
        </View>

        <View style={styles.headerRight}>
          <NotificationBell size={40} />
          <Pressable onPress={refetch} style={styles.iconBtn}>
            <MaterialIcons name="refresh" size={20} color={THEME.textSecondary} />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={THEME.primary}
              colors={[THEME.primary]}
              progressBackgroundColor={THEME.surface}
            />
          }
        >
          <View style={styles.statsRow}>
            <View style={styles.statsCard}>
              <Text style={styles.statsLabel}>Tổng</Text>
              <Text style={styles.statsValue}>{stats.total}</Text>
            </View>
            <View style={styles.statsCard}>
              <Text style={styles.statsLabel}>Đã xác nhận</Text>
              <Text style={styles.statsValue}>{stats.confirmed}</Text>
            </View>
            <View style={styles.statsCard}>
              <Text style={styles.statsLabel}>Đang chờ</Text>
              <Text style={styles.statsValue}>{stats.pending}</Text>
            </View>
          </View>

          {bookings.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons
                name="confirmation-number"
                size={30}
                color={THEME.textMuted}
              />
              <Text style={styles.emptyTitle}>Bạn chưa có booking nào</Text>
              <Text style={styles.emptySubtitle}>
                Sau khi đặt dịch vụ, booking sẽ xuất hiện tại đây để theo dõi
                trạng thái và lấy QR.
              </Text>
              <Pressable
                onPress={() => router.push("/(tabs)/map")}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>Khám phá địa điểm</Text>
              </Pressable>
            </View>
          ) : (
            bookings.map((booking) => {
              const status = STATUS_META[booking?.status] || {
                label: booking?.status || "Không xác định",
                color: THEME.text,
                bg: "#ECECEF",
              };

              return (
                <Pressable
                  key={booking.id}
                  style={({ pressed }) => [
                    styles.card,
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => router.push(`/profile/booking/${booking.id}`)}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.bookingCode}>
                      {booking.bookingCode}
                    </Text>
                    <View
                      style={[styles.badge, { backgroundColor: status.bg }]}
                    >
                      <Text style={[styles.badgeText, { color: status.color }]}>
                        {status.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.serviceName}>
                    {booking?.service?.name || "Dịch vụ"}
                  </Text>
                  <Text style={styles.placeName}>
                    {booking?.service?.place?.name || "Địa điểm"}
                  </Text>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <MaterialIcons
                        name="event"
                        size={14}
                        color={THEME.textMuted}
                      />
                      <Text style={styles.metaText}>
                        {formatDate(booking?.useDate)}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <MaterialIcons
                        name="schedule"
                        size={14}
                        color={THEME.textMuted}
                      />
                      <Text style={styles.metaText}>
                        {booking?.useTime || "--:--"}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <MaterialIcons
                        name="payments"
                        size={14}
                        color={THEME.textMuted}
                      />
                      <Text style={styles.metaText}>
                        {formatCurrency(booking?.finalPrice)}
                      </Text>
                    </View>
                  </View>

                  {booking?.status === "confirmed" ? (
                    <Text style={styles.qrReadyText}>
                      QR đã sẵn sàng, chạm để xem
                    </Text>
                  ) : null}

                  {booking?.linkedTrip?.id ? (
                    <Text style={styles.tripLinkedText}>
                      Đã liên kết trip:{" "}
                      {booking.linkedTrip.title || `#${booking.linkedTrip.id}`}{" "}
                      (ngày {booking.linkedTrip.dayNumber || 1})
                    </Text>
                  ) : null}

                  <View style={styles.cardFooter}>
                    <Text style={styles.cardActionText}>
                      Xem chi tiết booking
                    </Text>
                    <MaterialIcons
                      name="arrow-forward-ios"
                      size={14}
                      color={THEME.textSecondary}
                    />
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerBody: {
    flex: 1,
  },
  title: {
    fontSize: 19,
    color: THEME.text,
    fontFamily: TOKENS.font.semibold,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: THEME.textSecondary,
    fontFamily: TOKENS.font.regular,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 26,
    gap: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statsCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.surface,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 4,
  },
  statsLabel: {
    color: THEME.textMuted,
    fontSize: 11,
    fontFamily: TOKENS.font.medium,
  },
  statsValue: {
    color: THEME.text,
    fontSize: 17,
    fontFamily: TOKENS.font.semibold,
  },
  emptyCard: {
    marginTop: 36,
    backgroundColor: THEME.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 20,
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 17,
    color: THEME.text,
    fontFamily: TOKENS.font.semibold,
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: THEME.textSecondary,
    textAlign: "center",
    fontFamily: TOKENS.font.regular,
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: THEME.primary,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  primaryBtnText: {
    color: THEME.white,
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
  card: {
    backgroundColor: THEME.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 15,
    gap: 6,
  },
  cardPressed: {
    opacity: 0.92,
    backgroundColor: THEME.surfaceElevated,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  bookingCode: {
    color: THEME.textMuted,
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: THEME.borderSoft,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
  },
  serviceName: {
    marginTop: 2,
    fontSize: 16,
    color: THEME.text,
    fontFamily: TOKENS.font.semibold,
  },
  placeName: {
    fontSize: 13,
    color: THEME.textSecondary,
    fontFamily: TOKENS.font.medium,
  },
  metaRow: {
    marginTop: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: THEME.textMuted,
    fontFamily: TOKENS.font.regular,
  },
  qrReadyText: {
    marginTop: 6,
    fontSize: 12,
    color: THEME.success,
    fontFamily: TOKENS.font.medium,
  },
  tripLinkedText: {
    marginTop: 4,
    fontSize: 12,
    color: THEME.focusBlue,
    fontFamily: TOKENS.font.medium,
  },
  cardFooter: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardActionText: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
  },
});
