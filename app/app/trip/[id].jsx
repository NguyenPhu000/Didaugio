import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIconsRounded } from "../../src/components/primitives/MaterialIconsRounded";
import {
  useTripDetail,
  useUpdateTrip,
} from "../../src/modules/trips/hooks/useTripDetail";
import {
  useDeleteTrip,
  useSaveTrip,
  useUnsaveTrip,
  useDuplicateTrip,
} from "../../src/modules/trips/hooks/useTrips";
import { useMyBookings } from "../../src/modules/booking/hooks/useBooking";
import {
  buildTripDays,
  buildTripDetailBookings,
  groupBookingsByDay,
  computeBudgetSummary,
  canStartTrip,
} from "../../src/modules/trips/utils/tripHelpers";
import { useActiveTrip } from "../../src/modules/trips/hooks/useActiveTrip";

import { TripHeader } from "../../src/modules/trips/components/trip-detail/TripHeader";
import { TripTabBar } from "../../src/modules/trips/components/trip-detail/TripTabBar";
import ItineraryTab from "../../src/modules/trips/components/trip-detail/ItineraryTab";
import { ServicesTab } from "../../src/modules/trips/components/trip-detail/ServicesTab";
import { BudgetTab } from "../../src/modules/trips/components/trip-detail/BudgetTab";
import EditTripModal from "../../src/modules/trips/components/trip-detail/EditTripModal";
import { ShareTripModal } from "../../src/modules/trips/components/trip-detail/ShareTripModal";
import s, { T } from "../../src/modules/trips/utils/tripDetailTokens";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

const BOOKINGS_FILTERS = { limit: 500 };

export default function TripDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const tripId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("itinerary");
  const [isEditTripOpen, setIsEditTripOpen] = useState(false);
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const {
    activeTripId,
    isActive,
    isPaused,
    resumeActiveTrip,
  } = useActiveTrip();
  const isCurrentActiveTrip = isActive && String(activeTripId) === String(tripId);

  const { data: trip, isLoading, isError, refetch } = useTripDetail(tripId);

  useFocusEffect(
    useCallback(() => {
      if (tripId) refetch();
    }, [tripId, refetch]),
  );

  const updateTripMutation = useUpdateTrip(tripId);
  const deleteTripMutation = useDeleteTrip();
  const saveTripMutation = useSaveTrip();
  const unsaveTripMutation = useUnsaveTrip();
  const duplicateMutation = useDuplicateTrip();
  const { data: bookingsPayload, isLoading: isBookingsLoading } =
    useMyBookings(BOOKINGS_FILTERS);

  const bookings = useMemo(() => bookingsPayload?.data || [], [bookingsPayload?.data]);
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
      t("trip.detail.deleteTitle"),
      t("trip.detail.deleteMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => {
            deleteTripMutation.mutate(trip.id, {
              onSuccess: () => router.replace("/(tabs)/trips"),
              onError: (error) => {
                Alert.alert(t("common.error"), error?.message || t("trip.detail.deleteError"));
              },
            });
          },
        },
      ],
    );
  }, [deleteTripMutation, router, t, trip?.id]);

  const handleSaveTrip = useCallback(
    (payload) => {
      updateTripMutation.mutate(payload, {
        onSuccess: () => setIsEditTripOpen(false),
        onError: (error) => {
          Alert.alert(t("common.error"), error?.message || t("trip.detail.updateError"));
        },
      });
    },
    [t, updateTripMutation],
  );

  const handleResumeTrip = useCallback(async () => {
    if (!trip?.id) return;
    if (isPaused) {
      await resumeActiveTrip();
    }
    router.push({ pathname: "/(tabs)/map", params: { resumeNav: "true" } });
  }, [isPaused, resumeActiveTrip, trip?.id, router]);

  const handleStartTrip = useCallback(() => {
    if (!trip?.id || updateTripMutation.isPending) return;
    if (!Array.isArray(trip.destinations) || trip.destinations.length === 0) {
      Alert.alert(t("trip.detail.startTitle"), t("trip.itinerary.noDestinationsDesc"));
      return;
    }

    router.push({
      pathname: "/(tabs)/map",
      params: { tripPreviewId: String(trip.id) },
    });
  }, [trip, updateTripMutation.isPending, router, t]);

  const handleToggleSave = useCallback(() => {
    if (!trip?.id) return;
    if (trip.isSaved) {
      unsaveTripMutation.mutate(trip.id, {
        onError: (error) => {
          Alert.alert(t("common.error"), error?.message || t("trip.detail.unsaveError"));
        },
      });
    } else {
      saveTripMutation.mutate(trip.id, {
        onError: (error) => {
          Alert.alert(t("common.error"), error?.message || t("trip.detail.saveError"));
        },
      });
    }
  }, [saveTripMutation, t, trip?.id, trip?.isSaved, unsaveTripMutation]);

  const handleDuplicateTrip = useCallback(() => {
    if (!trip?.id || duplicateMutation.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    duplicateMutation.mutate(trip.id, {
      onSuccess: (result) => {
        const newId = result?.data?.id;
        Alert.alert(
          t("trip.detail.duplicateSuccess"),
          t("trip.detail.duplicateSuccessMsg", { name: `${trip.title} (${t("trip.detail.duplicateTrip")})` }),
          [
            { text: t("trip.detail.openNewTrip"), onPress: () => router.replace(`/trip/${newId}`) },
            { text: t("trip.detail.stayHere"), style: "cancel" },
          ],
        );
      },
      onError: (error) => {
        Alert.alert(t("common.error"), error?.message || t("trip.detail.duplicateError"));
      },
    });
  }, [duplicateMutation, router, t, trip?.id, trip?.title]);

  /* ─── Loading ─── */
  if (isLoading) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        {/* Skeleton header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.04)" }} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ width: "60%", height: 16, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.06)" }} />
            <View style={{ width: "40%", height: 10, borderRadius: 5, backgroundColor: "rgba(0,0,0,0.04)" }} />
          </View>
        </View>
        {/* Skeleton tabs */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 16 }}>
          {[80, 70, 60].map((w, i) => (
            <View key={i} style={{ width: w, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.04)" }} />
          ))}
        </View>
        {/* Skeleton content */}
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ height: 80, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.04)" }} />
          ))}
        </View>
      </View>
    );
  }

  /* ─── Error ─── */
  if (isError || !trip) {
    return (
      <View style={[s.screen, s.centered, { paddingTop: insets.top }]}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: "rgba(255,59,48,0.08)", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <MaterialIconsRounded name="error-outline" size={32} color={T.danger} />
        </View>
        <Text style={s.emptyTitle}>{t("trip.detail.notFound")}</Text>
        <Text style={[s.emptyBody, { textAlign: "center", marginHorizontal: 40, marginBottom: 20 }]}>
          {t("trip.detail.notFoundDesc")}
        </Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable onPress={() => refetch()} style={[s.linkBtn, { backgroundColor: T.primary }]}>
            <Text style={[s.linkBtnText, { color: T.onPrimary }]}>{t("common.retry")}</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={s.linkBtn}>
            <Text style={s.linkBtnText}>{t("trip.detail.back")}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  /* ─── Main ─── */
  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <TripHeader
        trip={trip}
        onEditTrip={() => setIsEditTripOpen(true)}
        onDeleteTrip={handleDeleteTrip}
        isDeleting={deleteTripMutation.isPending}
        isSaved={trip.isSaved}
        onToggleSave={handleToggleSave}
        onAddPlace={() => setIsAddPlaceOpen(true)}
        onShareTrip={() => setIsShareOpen(true)}
        onDuplicateTrip={handleDuplicateTrip}
        isDuplicating={duplicateMutation.isPending}
      />

      <TripTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        serviceCount={tripBookings.length}
      />

      {activeTab === "itinerary" ? (
        <ItineraryTab
          trip={trip}
          bookings={tripBookings}
          onOpenBooking={handleOpenBooking}
          isAddPlaceOpen={isAddPlaceOpen}
          onAddPlaceOpen={() => setIsAddPlaceOpen(true)}
          onAddPlaceClose={() => setIsAddPlaceOpen(false)}
          canStartTrip={isCurrentActiveTrip || canStartTrip(trip)}
          onStartTrip={isCurrentActiveTrip ? handleResumeTrip : handleStartTrip}
          isStartingTrip={updateTripMutation.isPending}
          isCurrentActiveTrip={isCurrentActiveTrip}
          isPaused={isPaused}
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

      <EditTripModal
        visible={isEditTripOpen}
        trip={trip}
        isSaving={updateTripMutation.isPending}
        onCancel={() => setIsEditTripOpen(false)}
        onSave={handleSaveTrip}
      />

      <ShareTripModal
        visible={isShareOpen}
        tripId={tripId}
        tripTitle={trip?.title}
        onClose={() => setIsShareOpen(false)}
      />

    </View>
  );
}
