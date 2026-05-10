import { memo } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TOKENS } from "../../../../constants/design-tokens";
import { StatusBadge } from "./StatusBadge";
import { formatBookingDateTime, formatPrice } from "../../utils/tripHelpers";
import s, { T } from "../../utils/tripDetailTokens";

export const ServicesTab = memo(function ServicesTab({
  groupedBookings,
  isLoading,
  onOpenBooking,
}) {
  if (isLoading) {
    return (
      <View style={s.centeredState}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color="#1D1D1F" />
        </View>
        <Text style={s.centeredBody}>Dang tai dich vu...</Text>
      </View>
    );
  }

  if (groupedBookings.length === 0) {
    return (
      <View style={s.centeredState}>
        <View style={styles.emptyIcon}>
          <MaterialIcons name="receipt-long" size={28} color="rgba(0,0,0,0.2)" />
        </View>
        <Text style={s.emptyTitle}>Chua co booking</Text>
        <Text style={s.emptyBody}>
          Cac booking lien ket voi chuyen di se hien thi tai day.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={s.servicesList}
    >
      {groupedBookings.map((group) => (
        <View key={`group-${group.dayNumber}-${group.label}`} style={styles.group}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupLabel}>{group.label}</Text>
            <View style={styles.groupCount}>
              <Text style={styles.groupCountText}>{group.items.length}</Text>
            </View>
          </View>

          {group.items.map((booking) => (
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
                  {booking?.service?.name || "Dich vu"}
                </Text>
                <Text style={s.bookingRowPlace} numberOfLines={1}>
                  {booking?.service?.place?.name || "Dia diem"}
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
      ))}
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
  group: {
    gap: 10,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  groupLabel: {
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    color: "rgba(0,0,0,0.4)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  groupCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  groupCountText: {
    fontSize: 10,
    fontFamily: TOKENS.font.semibold,
    color: "rgba(0,0,0,0.4)",
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
});
