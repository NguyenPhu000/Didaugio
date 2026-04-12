import { memo, useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import {
  useTripDetail,
  useRemoveDestination,
} from "../../src/modules/trips/hooks/useTripDetail";
import { useDeleteTrip } from "../../src/modules/trips/hooks/useTrips";
import { useMyBookings } from "../../src/modules/booking/hooks/useBooking";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../src/constants/design-tokens";

const TABS = [
  { key: "itinerary", label: "Lịch trình", icon: "route" },
  { key: "services", label: "Dịch vụ", icon: "room-service" },
  {
    key: "budget",
    label: "Ngân sách",
    icon: "account-balance-wallet",
  },
];

const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const BOOKINGS_FILTERS = { limit: 120 };

const BOOKING_STATUS_META = {
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
  no_show: {
    label: "Không đến",
    color: "#5A5A5E",
    bg: "#ECECEF",
  },
};

const TRIP_THEME = {
  ...APPLE_THEME,
  background: APPLE_THEME.background,
  surface: APPLE_THEME.surface,
  surfaceElevated: APPLE_THEME.surfaceElevated,
  surfaceMuted: APPLE_THEME.surfaceMuted,
  border: APPLE_THEME.border,
  borderSoft: APPLE_THEME.borderSoft,
  primary: APPLE_THEME.primary,
  primaryTint: APPLE_THEME.primaryTint,
  text: APPLE_THEME.text,
  textSecondary: APPLE_THEME.textSecondary,
  textMuted: APPLE_THEME.textMuted,
};

function toValidDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDate(dateStr) {
  const date = toValidDate(dateStr);
  if (!date) return null;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateYmd(dateObj) {
  if (!dateObj) return null;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatPrice(amount) {
  const value = Number(amount || 0);
  return `${value.toLocaleString("vi-VN")}đ`;
}

function formatBookingDateTime(booking) {
  const useDate = String(booking?.useDate || "").slice(0, 10);
  const useTime = booking?.useTime || "--:--";
  if (useDate) {
    const dateObj = new Date(`${useDate}T12:00:00`);
    const dateLabel = Number.isNaN(dateObj.getTime())
      ? useDate
      : dateObj.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        });
    return `${dateLabel} • ${useTime}`;
  }

  if (booking?.bookingAt) {
    const bookingAt = toValidDate(booking.bookingAt);
    if (bookingAt) {
      return bookingAt.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  return useTime;
}

function calcDayCount(trip) {
  if (!trip) return 1;
  if (trip.startDate && trip.endDate) {
    const start = toValidDate(trip.startDate);
    const end = toValidDate(trip.endDate);
    if (start && end) {
      const ms = end.getTime() - start.getTime();
      const days = Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
      return days > 0 ? days : trip.totalDays || 1;
    }
  }
  return trip.totalDays || 1;
}

function buildTripDays(trip) {
  const dayCount = calcDayCount(trip);
  const start = toValidDate(trip?.startDate);
  const normalizedStart = start ? new Date(start) : null;
  if (normalizedStart) normalizedStart.setHours(12, 0, 0, 0);

  return Array.from({ length: dayCount }, (_, index) => {
    const dayNumber = index + 1;
    if (!normalizedStart) {
      return {
        dayNumber,
        hasDate: false,
        weekdayLabel: `Ngày ${dayNumber}`,
        dateLabel: "",
        dateYmd: null,
      };
    }

    const date = new Date(normalizedStart);
    date.setDate(normalizedStart.getDate() + index);

    return {
      dayNumber,
      hasDate: true,
      weekdayLabel: WEEKDAY_SHORT[date.getDay()] || "--",
      dateLabel: date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      }),
      dateYmd: formatDateYmd(date),
    };
  });
}

function getDayNumberFromDate(tripStartYmd, targetYmd, dayCount) {
  if (!tripStartYmd || !targetYmd) return null;
  const start = new Date(`${tripStartYmd}T12:00:00`);
  const target = new Date(`${targetYmd}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(target.getTime())) {
    return null;
  }

  const diffDays =
    Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
    1;

  if (diffDays < 1 || diffDays > dayCount) return null;
  return diffDays;
}

function toTimeSortValue(timeValue) {
  const raw = String(timeValue || "");
  const [hourRaw, minuteRaw] = raw.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return Number.MAX_SAFE_INTEGER;
  }
  return hour * 60 + minute;
}

function sortBookingsByTime(a, b) {
  const dayA = Number(a?._dayNumber) || Number.MAX_SAFE_INTEGER;
  const dayB = Number(b?._dayNumber) || Number.MAX_SAFE_INTEGER;
  if (dayA !== dayB) return dayA - dayB;

  const timeA = toTimeSortValue(a?.useTime);
  const timeB = toTimeSortValue(b?.useTime);
  if (timeA !== timeB) return timeA - timeB;

  const createdA = toValidDate(a?.createdAt)?.getTime() || 0;
  const createdB = toValidDate(b?.createdAt)?.getTime() || 0;
  return createdB - createdA;
}

function getBookingStatusMeta(status) {
  const normalized = String(status || "").toLowerCase();
  return (
    BOOKING_STATUS_META[normalized] || {
      label: normalized || "Không rõ",
      color: TRIP_THEME.text,
      bg: TRIP_THEME.surfaceMuted,
    }
  );
}

const DestinationCard = memo(function DestinationCard({
  dest,
  bookings,
  onOpenBooking,
  onRemove,
}) {
  const place = dest.place;
  const imgUri = place?.thumbnail || null;
  const bookingPreview = (bookings || []).slice(0, 2);

  return (
    <View style={styles.destCard}>
      <View style={styles.destMainRow}>
        <View style={styles.destImageWrap}>
          {imgUri ? (
            <Image
              source={{ uri: imgUri }}
              style={styles.destImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.destImageFallback}>
              <MaterialIcons
                name="place"
                size={20}
                color={TRIP_THEME.primary}
              />
            </View>
          )}
        </View>

        <View style={styles.destBody}>
          <Text style={styles.destName} numberOfLines={1}>
            {place?.name || "Địa điểm"}
          </Text>
          {place?.address ? (
            <Text style={styles.destAddress} numberOfLines={1}>
              {place.address}
            </Text>
          ) : null}
          {dest.note ? (
            <Text style={styles.destNote} numberOfLines={2}>
              {dest.note}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={() => onRemove(dest.id)}
          hitSlop={8}
          style={styles.destRemoveBtn}
        >
          <MaterialIcons
            name="remove-circle-outline"
            size={18}
            color={TRIP_THEME.danger}
          />
        </Pressable>
      </View>

      {bookingPreview.length > 0 ? (
        <View style={styles.destBookingBlock}>
          <Text style={styles.destBookingHeading}>
            Booking tại địa điểm này
          </Text>

          {bookingPreview.map((booking) => {
            const statusMeta = getBookingStatusMeta(booking?.status);
            return (
              <Pressable
                key={booking.id}
                onPress={() => onOpenBooking(booking.id)}
                style={({ pressed }) => [
                  styles.destBookingItem,
                  pressed && styles.destBookingItemPressed,
                ]}
              >
                <View style={styles.destBookingInfo}>
                  <Text style={styles.destBookingCode} numberOfLines={1}>
                    #{booking.bookingCode || booking.id}
                  </Text>
                  <Text style={styles.destBookingMeta} numberOfLines={1}>
                    {booking?.service?.name || "Dịch vụ"} •{" "}
                    {formatBookingDateTime(booking)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.destBookingStatus,
                    { backgroundColor: statusMeta.bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.destBookingStatusText,
                      { color: statusMeta.color },
                    ]}
                  >
                    {statusMeta.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          {bookings.length > 2 ? (
            <Text style={styles.destBookingMore}>
              +{bookings.length - 2} booking khác
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

function ItineraryTab({
  tripDays,
  destinations,
  destinationBookings,
  isBookingsLoading,
  onOpenBooking,
  onRemove,
}) {
  const [activeDayNumber, setActiveDayNumber] = useState(
    tripDays[0]?.dayNumber || 1,
  );

  const safeActiveDayNumber = useMemo(() => {
    if (tripDays.some((day) => day.dayNumber === activeDayNumber)) {
      return activeDayNumber;
    }
    return tripDays[0]?.dayNumber || 1;
  }, [activeDayNumber, tripDays]);

  const dayDestinations = useMemo(
    () =>
      (destinations || []).filter(
        (dest) => Number(dest.dayNumber) === safeActiveDayNumber,
      ),
    [destinations, safeActiveDayNumber],
  );

  return (
    <View style={styles.itineraryWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayChipsRow}
      >
        {tripDays.map((day) => {
          const isActive = safeActiveDayNumber === day.dayNumber;
          return (
            <Pressable
              key={day.dayNumber}
              onPress={() => setActiveDayNumber(day.dayNumber)}
              style={[
                styles.dayChip,
                day.hasDate && styles.dayChipWithDate,
                isActive && styles.dayChipActive,
              ]}
            >
              <Text
                style={[
                  styles.dayChipPrimary,
                  isActive && styles.dayChipPrimaryActive,
                ]}
                numberOfLines={1}
              >
                {day.weekdayLabel}
              </Text>
              {day.hasDate ? (
                <Text
                  style={[
                    styles.dayChipSecondary,
                    isActive && styles.dayChipSecondaryActive,
                  ]}
                >
                  {day.dateLabel}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {isBookingsLoading ? (
        <View style={styles.inlineLoadingRow}>
          <ActivityIndicator size="small" color={TRIP_THEME.primary} />
          <Text style={styles.inlineLoadingText}>
            Đang tải thông tin booking...
          </Text>
        </View>
      ) : null}

      {dayDestinations.length === 0 ? (
        <View style={styles.dayEmptyState}>
          <View style={styles.dayEmptyIcon}>
            <MaterialIcons
              name="add-location-alt"
              size={28}
              color={TRIP_THEME.primary}
            />
          </View>
          <Text style={styles.dayEmptyTitle}>Ngày này chưa có địa điểm</Text>
          <Text style={styles.dayEmptyCopy}>
            Bạn có thể thêm địa điểm từ trang Khám phá để hoàn thiện lịch trình.
          </Text>
        </View>
      ) : (
        <FlatList
          data={dayDestinations}
          renderItem={({ item }) => (
            <DestinationCard
              dest={item}
              bookings={destinationBookings.get(item.id) || []}
              onOpenBooking={onOpenBooking}
              onRemove={onRemove}
            />
          )}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.destList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function ServicesTab({ groupedBookings, isLoading, onOpenBooking }) {
  if (isLoading) {
    return (
      <View style={styles.centeredTabState}>
        <ActivityIndicator size="small" color={TRIP_THEME.primary} />
        <Text style={styles.centeredTabStateText}>
          Đang tải danh sách dịch vụ...
        </Text>
      </View>
    );
  }

  if (groupedBookings.length === 0) {
    return (
      <View style={styles.centeredTabState}>
        <View style={styles.centeredTabIcon}>
          <MaterialIcons
            name="room-service"
            size={28}
            color={TRIP_THEME.primary}
          />
        </View>
        <Text style={styles.centeredTabTitle}>Chưa có booking dịch vụ</Text>
        <Text style={styles.centeredTabStateText}>
          Những booking đã liên kết với trip sẽ hiển thị tại đây để bạn theo dõi
          nhanh.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.servicesWrap}
    >
      {groupedBookings.map((group) => (
        <View
          key={`group-${group.dayNumber}-${group.label}`}
          style={styles.serviceGroupCard}
        >
          <Text style={styles.serviceGroupTitle}>{group.label}</Text>

          {group.items.map((booking) => {
            const statusMeta = getBookingStatusMeta(booking?.status);
            return (
              <Pressable
                key={booking.id}
                onPress={() => onOpenBooking(booking.id)}
                style={({ pressed }) => [
                  styles.serviceItem,
                  pressed && styles.serviceItemPressed,
                ]}
              >
                <View style={styles.serviceItemBody}>
                  <Text style={styles.serviceItemName} numberOfLines={1}>
                    {booking?.service?.name || "Dịch vụ"}
                  </Text>
                  <Text style={styles.serviceItemPlace} numberOfLines={1}>
                    {booking?.service?.place?.name || "Địa điểm"}
                  </Text>
                  <Text style={styles.serviceItemMeta} numberOfLines={1}>
                    #{booking.bookingCode || booking.id} •{" "}
                    {formatBookingDateTime(booking)}
                  </Text>
                </View>

                <View style={styles.serviceItemRight}>
                  <View
                    style={[
                      styles.serviceStatusBadge,
                      { backgroundColor: statusMeta.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.serviceStatusText,
                        { color: statusMeta.color },
                      ]}
                    >
                      {statusMeta.label}
                    </Text>
                  </View>
                  <Text style={styles.serviceItemPrice}>
                    {formatPrice(booking?.finalPrice)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

function BudgetTab({ bookings, summary, isLoading, onOpenBooking }) {
  if (isLoading) {
    return (
      <View style={styles.centeredTabState}>
        <ActivityIndicator size="small" color={TRIP_THEME.primary} />
        <Text style={styles.centeredTabStateText}>Đang tải ngân sách...</Text>
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View style={styles.centeredTabState}>
        <View style={styles.centeredTabIcon}>
          <MaterialIcons
            name="account-balance-wallet"
            size={28}
            color={TRIP_THEME.primary}
          />
        </View>
        <Text style={styles.centeredTabTitle}>Chưa có dữ liệu chi phí</Text>
        <Text style={styles.centeredTabStateText}>
          Khi có booking liên kết, tab ngân sách sẽ tổng hợp tổng tiền và từng
          khoản chi.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.budgetWrap}
    >
      <View style={styles.budgetSummaryGrid}>
        <View style={styles.budgetSummaryCard}>
          <Text style={styles.budgetSummaryLabel}>Tổng booking</Text>
          <Text style={styles.budgetSummaryValue}>{summary.totalCount}</Text>
        </View>

        <View style={styles.budgetSummaryCard}>
          <Text style={styles.budgetSummaryLabel}>Tổng dự kiến</Text>
          <Text style={styles.budgetSummaryValueMoney}>
            {formatPrice(summary.totalAmount)}
          </Text>
        </View>

        <View style={styles.budgetSummaryCard}>
          <Text style={styles.budgetSummaryLabel}>Đã xác nhận</Text>
          <Text style={styles.budgetSummaryValueMoney}>
            {formatPrice(summary.confirmedAmount + summary.completedAmount)}
          </Text>
        </View>

        <View style={styles.budgetSummaryCard}>
          <Text style={styles.budgetSummaryLabel}>Chờ xác nhận</Text>
          <Text style={styles.budgetSummaryValueMoney}>
            {formatPrice(summary.pendingAmount)}
          </Text>
        </View>
      </View>

      <View style={styles.budgetListCard}>
        <Text style={styles.budgetListTitle}>Chi tiết khoản booking</Text>

        {bookings.map((booking) => {
          const statusMeta = getBookingStatusMeta(booking?.status);
          return (
            <Pressable
              key={booking.id}
              onPress={() => onOpenBooking(booking.id)}
              style={({ pressed }) => [
                styles.budgetItem,
                pressed && styles.budgetItemPressed,
              ]}
            >
              <View style={styles.budgetItemBody}>
                <Text style={styles.budgetItemName} numberOfLines={1}>
                  {booking?.service?.name || "Dịch vụ"}
                </Text>
                <Text style={styles.budgetItemMeta} numberOfLines={1}>
                  #{booking.bookingCode || booking.id} •{" "}
                  {formatBookingDateTime(booking)}
                </Text>
              </View>

              <View style={styles.budgetItemRight}>
                <View
                  style={[
                    styles.budgetStatusBadge,
                    { backgroundColor: statusMeta.bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.budgetStatusText,
                      { color: statusMeta.color },
                    ]}
                  >
                    {statusMeta.label}
                  </Text>
                </View>
                <Text style={styles.budgetItemPrice}>
                  {formatPrice(booking?.finalPrice)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams();
  const tripId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("itinerary");

  const { data: trip, isLoading, isError } = useTripDetail(tripId);
  const removeMutation = useRemoveDestination(
    Number.isInteger(Number(tripId)) ? Number(tripId) : null,
  );
  const deleteTripMutation = useDeleteTrip();
  const { data: bookingsPayload, isLoading: isBookingsLoading } =
    useMyBookings(BOOKINGS_FILTERS);

  const bookings = bookingsPayload?.data || [];
  const tripDays = useMemo(() => buildTripDays(trip), [trip]);
  const dayCount = tripDays.length;
  const tripStartYmd = tripDays[0]?.dateYmd || null;
  const normalizedTripId = Number(trip?.id || tripId);

  const destinations = trip?.destinations || [];

  const tripPlaceIds = useMemo(
    () =>
      new Set(
        destinations
          .map((dest) => Number(dest?.place?.id))
          .filter((placeId) => Number.isInteger(placeId) && placeId > 0),
      ),
    [destinations],
  );

  const tripBookings = useMemo(() => {
    if (!trip) return [];

    return bookings
      .map((booking) => {
        const placeId = Number(booking?.service?.place?.id);
        const linkedTripId = Number(booking?.linkedTrip?.id);
        const linkedDayNumber = Number(booking?.linkedTrip?.dayNumber);

        const fallbackDayNumber = getDayNumberFromDate(
          tripStartYmd,
          String(booking?.useDate || "").slice(0, 10),
          dayCount,
        );

        const dayNumber =
          Number.isInteger(linkedDayNumber) && linkedDayNumber > 0
            ? linkedDayNumber
            : fallbackDayNumber;

        const inTripDayRange =
          Number.isInteger(dayNumber) &&
          dayNumber >= 1 &&
          dayNumber <= dayCount;
        const inTripPlace =
          Number.isInteger(placeId) && tripPlaceIds.has(placeId);
        const isLinkedToCurrentTrip =
          Number.isInteger(linkedTripId) && linkedTripId === normalizedTripId;

        if (!isLinkedToCurrentTrip && !(inTripPlace && inTripDayRange)) {
          return null;
        }

        return {
          ...booking,
          _placeId: placeId,
          _dayNumber: inTripDayRange ? dayNumber : null,
        };
      })
      .filter(Boolean)
      .sort(sortBookingsByTime);
  }, [bookings, dayCount, normalizedTripId, trip, tripPlaceIds, tripStartYmd]);

  const destinationBookings = useMemo(() => {
    const byDayPlace = new Map();

    tripBookings.forEach((booking) => {
      const dayNumber = Number(booking?._dayNumber);
      const placeId = Number(booking?._placeId);
      if (!Number.isInteger(dayNumber) || !Number.isInteger(placeId)) return;

      const key = `${dayNumber}-${placeId}`;
      if (!byDayPlace.has(key)) byDayPlace.set(key, []);
      byDayPlace.get(key).push(booking);
    });

    const destinationMap = new Map();
    destinations.forEach((dest) => {
      const dayNumber = Number(dest?.dayNumber);
      const placeId = Number(dest?.place?.id);
      const key = `${dayNumber}-${placeId}`;
      destinationMap.set(
        dest.id,
        (byDayPlace.get(key) || []).slice().sort(sortBookingsByTime),
      );
    });

    return destinationMap;
  }, [destinations, tripBookings]);

  const groupedBookings = useMemo(() => {
    const dayGroups = new Map(
      tripDays.map((day) => [
        day.dayNumber,
        {
          dayNumber: day.dayNumber,
          label: day.hasDate
            ? `${day.weekdayLabel}, ${day.dateLabel}`
            : day.weekdayLabel,
          items: [],
        },
      ]),
    );

    const ungrouped = [];

    tripBookings.forEach((booking) => {
      const dayNumber = Number(booking?._dayNumber);
      const target = dayGroups.get(dayNumber);
      if (target) {
        target.items.push(booking);
      } else {
        ungrouped.push(booking);
      }
    });

    const groups = Array.from(dayGroups.values())
      .map((group) => ({
        ...group,
        items: group.items.slice().sort(sortBookingsByTime),
      }))
      .filter((group) => group.items.length > 0);

    if (ungrouped.length > 0) {
      groups.push({
        dayNumber: 0,
        label: "Booking chưa gắn ngày rõ ràng",
        items: ungrouped.slice().sort(sortBookingsByTime),
      });
    }

    return groups;
  }, [tripBookings, tripDays]);

  const budgetSummary = useMemo(() => {
    const summary = {
      totalCount: tripBookings.length,
      totalAmount: 0,
      pendingAmount: 0,
      confirmedAmount: 0,
      completedAmount: 0,
      cancelledAmount: 0,
    };

    tripBookings.forEach((booking) => {
      const amount = Number(booking?.finalPrice || 0);
      const status = String(booking?.status || "").toLowerCase();

      summary.totalAmount += amount;
      if (status === "pending") summary.pendingAmount += amount;
      if (status === "confirmed") summary.confirmedAmount += amount;
      if (status === "completed") summary.completedAmount += amount;
      if (status === "cancelled" || status === "no_show") {
        summary.cancelledAmount += amount;
      }
    });

    return summary;
  }, [tripBookings]);

  const handleRemoveDestination = useCallback(
    (destId) => removeMutation.mutate(destId),
    [removeMutation],
  );

  const handleOpenBooking = useCallback(
    (bookingId) => {
      const normalizedBookingId = Number(bookingId);
      if (!Number.isInteger(normalizedBookingId) || normalizedBookingId <= 0) {
        return;
      }
      router.push(`/profile/booking/${normalizedBookingId}`);
    },
    [router],
  );

  const handleDeleteTrip = useCallback(() => {
    if (!trip?.id || deleteTripMutation.isPending) return;

    Alert.alert(
      "Xóa lịch trình?",
      "Lịch trình này sẽ bị xóa vĩnh viễn khỏi tài khoản của bạn.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            deleteTripMutation.mutate(Number(trip.id), {
              onSuccess: () => router.replace("/(tabs)/trips"),
            });
          },
        },
      ],
    );
  }, [deleteTripMutation, router, trip?.id]);

  if (isLoading) {
    return (
      <View
        style={[styles.screen, styles.centered, { paddingTop: insets.top }]}
      >
        <ActivityIndicator size="large" color={TRIP_THEME.primary} />
        <Text style={styles.loadingText}>Đang tải chuyến đi...</Text>
      </View>
    );
  }

  if (isError || !trip) {
    return (
      <View
        style={[styles.screen, styles.centered, { paddingTop: insets.top }]}
      >
        <View style={styles.errorIcon}>
          <MaterialIcons
            name="error-outline"
            size={32}
            color={TRIP_THEME.danger}
          />
        </View>
        <Text style={styles.errorTitle}>Không tìm thấy chuyến đi</Text>
        <Pressable onPress={() => router.back()} style={styles.errorBack}>
          <Text style={styles.errorBackText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  const dateRange =
    trip.startDate && trip.endDate
      ? `${formatDate(trip.startDate)} → ${formatDate(trip.endDate)}`
      : trip.startDate
        ? `Từ ${formatDate(trip.startDate)}`
        : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={20} color={TRIP_THEME.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {trip.title}
          </Text>
          {dateRange ? (
            <Text style={styles.headerSubtitle}>{dateRange}</Text>
          ) : null}
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={handleDeleteTrip}
            style={[
              styles.deleteBtn,
              deleteTripMutation.isPending && styles.deleteBtnDisabled,
            ]}
            disabled={deleteTripMutation.isPending}
          >
            <MaterialIcons
              name="delete-outline"
              size={18}
              color={TRIP_THEME.danger}
            />
          </Pressable>

          <Pressable
            onPress={() => router.push("/explore")}
            style={styles.addBtn}
          >
            <MaterialIcons name="add" size={18} color={TRIP_THEME.white} />
            <Text style={styles.addBtnText}>Thêm điểm</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
            >
              <MaterialIcons
                name={tab.icon}
                size={14}
                color={isActive ? TRIP_THEME.white : TRIP_THEME.textMuted}
              />
              <Text
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeTab === "itinerary" ? (
        <ItineraryTab
          tripDays={tripDays}
          destinations={destinations}
          destinationBookings={destinationBookings}
          isBookingsLoading={isBookingsLoading}
          onOpenBooking={handleOpenBooking}
          onRemove={handleRemoveDestination}
        />
      ) : activeTab === "services" ? (
        <ServicesTab
          groupedBookings={groupedBookings}
          isLoading={isBookingsLoading}
          onOpenBooking={handleOpenBooking}
        />
      ) : (
        <BudgetTab
          bookings={tripBookings}
          summary={budgetSummary}
          isLoading={isBookingsLoading}
          onOpenBooking={handleOpenBooking}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: TRIP_THEME.background,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: TRIP_THEME.surface,
    borderBottomWidth: 1,
    borderBottomColor: TRIP_THEME.borderSoft,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: TOKENS.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TRIP_THEME.surfaceElevated,
    borderWidth: 1,
    borderColor: TRIP_THEME.border,
  },
  headerCenter: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: TOKENS.font.heading,
    color: TRIP_THEME.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
    color: TRIP_THEME.textMuted,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: TOKENS.radius.full,
    backgroundColor: TRIP_THEME.primary,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: TOKENS.radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TRIP_THEME.surfaceElevated,
    borderWidth: 1,
    borderColor: TRIP_THEME.border,
  },
  deleteBtnDisabled: {
    opacity: 0.45,
  },
  addBtnText: {
    color: TRIP_THEME.white,
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
  },

  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: TRIP_THEME.surface,
    borderBottomWidth: 1,
    borderBottomColor: TRIP_THEME.borderSoft,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: TOKENS.radius.lg,
    backgroundColor: TRIP_THEME.surfaceElevated,
    borderWidth: 1,
    borderColor: TRIP_THEME.border,
  },
  tabItemActive: {
    backgroundColor: TRIP_THEME.primary,
    borderColor: TRIP_THEME.primary,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    color: TRIP_THEME.textSecondary,
  },
  tabLabelActive: {
    color: TRIP_THEME.white,
  },

  itineraryWrap: {
    flex: 1,
  },
  dayChipsRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  dayChip: {
    minWidth: 86,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: TOKENS.radius.lg,
    backgroundColor: TRIP_THEME.surface,
    borderWidth: 1,
    borderColor: TRIP_THEME.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  dayChipWithDate: {
    minWidth: 90,
  },
  dayChipActive: {
    backgroundColor: TRIP_THEME.primary,
    borderColor: TRIP_THEME.primary,
  },
  dayChipPrimary: {
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    color: TRIP_THEME.text,
  },
  dayChipPrimaryActive: {
    color: TRIP_THEME.white,
  },
  dayChipSecondary: {
    fontSize: 11,
    fontFamily: TOKENS.font.body,
    color: TRIP_THEME.textSecondary,
  },
  dayChipSecondaryActive: {
    color: "rgba(255,255,255,0.86)",
  },

  inlineLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  inlineLoadingText: {
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    color: TRIP_THEME.textMuted,
  },

  dayEmptyState: {
    flex: 1,
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 40,
    gap: 10,
  },
  dayEmptyIcon: {
    width: 72,
    height: 72,
    borderRadius: TOKENS.radius["2xl"],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TRIP_THEME.primaryTint,
    borderWidth: 1,
    borderColor: TRIP_THEME.border,
    marginBottom: 6,
  },
  dayEmptyTitle: {
    fontSize: 18,
    fontFamily: TOKENS.font.heading,
    color: TRIP_THEME.text,
    textAlign: "center",
  },
  dayEmptyCopy: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: TOKENS.font.body,
    color: TRIP_THEME.textSecondary,
    textAlign: "center",
  },

  destList: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    gap: 10,
  },
  destCard: {
    backgroundColor: TRIP_THEME.surface,
    borderRadius: TOKENS.radius.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: TRIP_THEME.border,
    gap: 10,
    ...TOKENS.shadow.sm,
  },
  destMainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  destImageWrap: {
    width: 52,
    height: 52,
    borderRadius: TOKENS.radius.md,
    overflow: "hidden",
    backgroundColor: TRIP_THEME.surfaceMuted,
  },
  destImage: {
    flex: 1,
  },
  destImageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  destBody: {
    flex: 1,
    gap: 3,
  },
  destName: {
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
    color: TRIP_THEME.text,
  },
  destAddress: {
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    color: TRIP_THEME.textSecondary,
  },
  destNote: {
    fontSize: 11,
    fontFamily: TOKENS.font.body,
    color: TRIP_THEME.textMuted,
    fontStyle: "italic",
  },
  destRemoveBtn: {
    width: 34,
    height: 34,
    borderRadius: TOKENS.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,59,48,0.12)",
  },

  destBookingBlock: {
    borderTopWidth: 1,
    borderTopColor: TRIP_THEME.border,
    paddingTop: 10,
    gap: 8,
  },
  destBookingHeading: {
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
    color: TRIP_THEME.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  destBookingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderWidth: 1,
    borderColor: TRIP_THEME.border,
    borderRadius: TOKENS.radius.md,
    backgroundColor: TRIP_THEME.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  destBookingItemPressed: {
    opacity: 0.84,
  },
  destBookingInfo: {
    flex: 1,
    gap: 2,
  },
  destBookingCode: {
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    color: TRIP_THEME.text,
  },
  destBookingMeta: {
    fontSize: 11,
    fontFamily: TOKENS.font.body,
    color: TRIP_THEME.textSecondary,
  },
  destBookingStatus: {
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  destBookingStatusText: {
    fontSize: 10,
    fontFamily: TOKENS.font.semibold,
  },
  destBookingMore: {
    fontSize: 11,
    fontFamily: TOKENS.font.body,
    color: TRIP_THEME.textMuted,
  },

  servicesWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 12,
  },
  serviceGroupCard: {
    borderRadius: TOKENS.radius.xl,
    backgroundColor: TRIP_THEME.surface,
    borderWidth: 1,
    borderColor: TRIP_THEME.border,
    padding: 12,
    gap: 10,
    ...TOKENS.shadow.sm,
  },
  serviceGroupTitle: {
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    color: TRIP_THEME.text,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: TOKENS.radius.lg,
    borderWidth: 1,
    borderColor: TRIP_THEME.border,
    backgroundColor: TRIP_THEME.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  serviceItemPressed: {
    opacity: 0.84,
  },
  serviceItemBody: {
    flex: 1,
    gap: 2,
  },
  serviceItemName: {
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    color: TRIP_THEME.text,
  },
  serviceItemPlace: {
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    color: TRIP_THEME.textSecondary,
  },
  serviceItemMeta: {
    fontSize: 11,
    fontFamily: TOKENS.font.body,
    color: TRIP_THEME.textMuted,
  },
  serviceItemRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  serviceStatusBadge: {
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  serviceStatusText: {
    fontSize: 10,
    fontFamily: TOKENS.font.semibold,
  },
  serviceItemPrice: {
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    color: TRIP_THEME.text,
  },

  budgetWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 12,
  },
  budgetSummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  budgetSummaryCard: {
    width: "48.5%",
    borderRadius: TOKENS.radius.xl,
    backgroundColor: TRIP_THEME.surface,
    borderWidth: 1,
    borderColor: TRIP_THEME.border,
    padding: 12,
    gap: 4,
  },
  budgetSummaryLabel: {
    fontSize: 11,
    fontFamily: TOKENS.font.medium,
    color: TRIP_THEME.textMuted,
  },
  budgetSummaryValue: {
    fontSize: 20,
    fontFamily: TOKENS.font.heading,
    color: TRIP_THEME.text,
  },
  budgetSummaryValueMoney: {
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    color: TRIP_THEME.text,
  },
  budgetListCard: {
    borderRadius: TOKENS.radius.xl,
    backgroundColor: TRIP_THEME.surface,
    borderWidth: 1,
    borderColor: TRIP_THEME.border,
    padding: 12,
    gap: 8,
  },
  budgetListTitle: {
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    color: TRIP_THEME.text,
    marginBottom: 2,
  },
  budgetItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: TOKENS.radius.lg,
    borderWidth: 1,
    borderColor: TRIP_THEME.border,
    backgroundColor: TRIP_THEME.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  budgetItemPressed: {
    opacity: 0.84,
  },
  budgetItemBody: {
    flex: 1,
    gap: 2,
  },
  budgetItemName: {
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    color: TRIP_THEME.text,
  },
  budgetItemMeta: {
    fontSize: 11,
    fontFamily: TOKENS.font.body,
    color: TRIP_THEME.textSecondary,
  },
  budgetItemRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  budgetStatusBadge: {
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  budgetStatusText: {
    fontSize: 10,
    fontFamily: TOKENS.font.semibold,
  },
  budgetItemPrice: {
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    color: TRIP_THEME.text,
  },

  centeredTabState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    gap: 10,
  },
  centeredTabIcon: {
    width: 74,
    height: 74,
    borderRadius: TOKENS.radius["2xl"],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TRIP_THEME.primaryTint,
    borderWidth: 1,
    borderColor: TRIP_THEME.border,
  },
  centeredTabTitle: {
    fontSize: 17,
    fontFamily: TOKENS.font.semibold,
    color: TRIP_THEME.text,
    textAlign: "center",
  },
  centeredTabStateText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: TOKENS.font.body,
    color: TRIP_THEME.textSecondary,
    textAlign: "center",
  },

  loadingText: {
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    color: TRIP_THEME.textSecondary,
  },
  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: TOKENS.radius["2xl"],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,59,48,0.12)",
    marginBottom: 4,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: TOKENS.font.heading,
    color: TRIP_THEME.text,
    textAlign: "center",
  },
  errorBack: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: TOKENS.radius.full,
    backgroundColor: TRIP_THEME.primary,
    marginTop: 4,
  },
  errorBackText: {
    color: TRIP_THEME.white,
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
});
