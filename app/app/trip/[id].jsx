import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTripDetail } from "../../src/modules/trips/hooks/useTripDetail";
import { useDeleteTrip } from "../../src/modules/trips/hooks/useTrips";
import { useMyBookings } from "../../src/modules/booking/hooks/useBooking";
import {
  buildTripDays,
  buildTripDetailBookings,
  groupBookingsByDay,
  computeBudgetSummary,
} from "../../src/modules/trips/utils/tripHelpers";

import { TripHeader } from "../../src/modules/trips/components/trip-detail/TripHeader";
import { TripTabBar } from "../../src/modules/trips/components/trip-detail/TripTabBar";
import ItineraryTab from "../../src/modules/trips/components/trip-detail/ItineraryTab";
import { ServicesTab } from "../../src/modules/trips/components/trip-detail/ServicesTab";
import { BudgetTab } from "../../src/modules/trips/components/trip-detail/BudgetTab";
import s, { T } from "../../src/modules/trips/utils/tripDetailTokens";

const BOOKINGS_FILTERS = { limit: 120 };

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams();
  const tripId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("itinerary");

  const { data: trip, isLoading, isError } = useTripDetail(tripId);
  const deleteTripMutation = useDeleteTrip();
  const { data: bookingsPayload, isLoading: isBookingsLoading } =
    useMyBookings(BOOKINGS_FILTERS);

  const bookings = bookingsPayload?.data || [];
  const tripDays = useMemo(() => buildTripDays(trip), [trip]);
  const dayCount = tripDays.length;

  const tripBookings = useMemo(
    () => buildTripDetailBookings({ bookings, trip, tripDays, dayCount }),
    [bookings, trip, tripDays, dayCount],
  );

  const groupedBookings = useMemo(
    () => groupBookingsByDay(tripBookings, tripDays),
    [tripBookings, tripDays],
  );

  const budgetSummary = useMemo(
    () => computeBudgetSummary(tripBookings),
    [tripBookings],
  );

  const handleOpenBooking = useCallback(
    (bookingOrId) => {
      const id = typeof bookingOrId === "object" ? bookingOrId?.id : bookingOrId;
      const normalizedBookingId = Number(id);
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
      "Lịch trình này sẽ bị xóa vĩnh viễn.",
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

  /* ─── Loading ─── */
  if (isLoading) {
    return (
      <View style={[s.screen, s.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="small" color={T.primary} />
      </View>
    );
  }

  /* ─── Error ─── */
  if (isError || !trip) {
    return (
      <View style={[s.screen, s.centered, { paddingTop: insets.top }]}>
        <Text style={s.emptyTitle}>Không tìm thấy chuyến đi</Text>
        <Pressable onPress={() => router.back()} style={s.linkBtn}>
          <Text style={s.linkBtnText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  /* ─── Main ─── */
  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <TripHeader
        trip={trip}
        onDeleteTrip={handleDeleteTrip}
        isDeleting={deleteTripMutation.isPending}
      />

      <TripTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "itinerary" ? (
        <ItineraryTab
          trip={trip}
          bookings={tripBookings}
          onOpenBooking={handleOpenBooking}
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
