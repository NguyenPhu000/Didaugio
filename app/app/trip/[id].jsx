import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import {
  setActiveTripId,
  resetVisitedDestinations,
  useActiveTrip,
} from "../../src/modules/trips/hooks/useActiveTrip";
import { sendLocalNotification } from "../../src/lib/local-notifications";

import { TripHeader } from "../../src/modules/trips/components/trip-detail/TripHeader";
import { TripTabBar } from "../../src/modules/trips/components/trip-detail/TripTabBar";
import ItineraryTab from "../../src/modules/trips/components/trip-detail/ItineraryTab";
import { ServicesTab } from "../../src/modules/trips/components/trip-detail/ServicesTab";
import { BudgetTab } from "../../src/modules/trips/components/trip-detail/BudgetTab";
import EditTripModal from "../../src/modules/trips/components/trip-detail/EditTripModal";
import { ShareTripModal } from "../../src/modules/trips/components/trip-detail/ShareTripModal";
import { TripCompleteCelebration } from "../../src/modules/trips/components/trip-detail/TripCompleteCelebration";
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
  const [showCelebration, setShowCelebration] = useState(false);

  const activeTripState = useActiveTrip();
  const isCurrentActiveTrip = activeTripState.isActive && String(activeTripState.activeTripId) === String(tripId);

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
  }, [deleteTripMutation, router, trip?.id]);

  const handleSaveTrip = useCallback(
    (payload) => {
      updateTripMutation.mutate(payload, {
        onSuccess: () => setIsEditTripOpen(false),
        onError: (error) => {
          Alert.alert(t("common.error"), error?.message || t("trip.detail.updateError"));
        },
      });
    },
    [updateTripMutation],
  );

  const handleResumeTrip = useCallback(() => {
    if (!trip?.id) return;
    router.push({ pathname: "/(tabs)/map", params: { resumeNav: "true" } });
  }, [trip?.id, router]);

  const handleStartTrip = useCallback(() => {
    if (!trip?.id || updateTripMutation.isPending) return;

    Alert.alert(
      t("trip.detail.startTitle"),
      t("trip.detail.startMessage"),
      [
        { text: t("common.later"), style: "cancel" },
        {
          text: t("common.start"),
          onPress: () => {
            updateTripMutation.mutate(
              { status: "in-progress" },
              {
                onSuccess: async () => {
                  await setActiveTripId(trip.id);
                  await resetVisitedDestinations(trip.id);
                  await sendLocalNotification({
                    title: t("trip.detail.startNotification"),
                    body: t("trip.detail.startNotificationBody", { title: trip.title || t("trip.detail.defaultTitle") }),
                    data: { tripId: trip.id },
                  });
                  router.push({ pathname: "/(tabs)/map", params: { startNav: "true" } });
                },
                onError: (error) => {
                  Alert.alert(t("common.error"), error?.message || t("trip.detail.startError"));
                },
              },
            );
          },
        },
      ],
    );
  }, [trip?.id, trip?.title, updateTripMutation, router]);

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
  }, [trip?.id, trip?.isSaved, saveTripMutation, unsaveTripMutation]);

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
  }, [trip?.id, trip?.title, duplicateMutation, router]);

  const handleMarkComplete = useCallback(() => {
    if (!trip?.id || updateTripMutation.isPending) return;
    Alert.alert(
      t("trip.detail.completeTitle"),
      t("trip.detail.completeMessage", { name: trip.title }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("trip.detail.complete"),
          onPress: () => {
            setIsEditTripOpen(false);
            updateTripMutation.mutate(
              { status: "completed" },
              {
                onSuccess: () => {
                  setShowCelebration(true);
                },
                onError: (error) => {
                  Alert.alert(t("common.error"), error?.message || t("trip.detail.completeError"));
                },
              },
            );
          },
        },
      ],
    );
  }, [trip?.id, trip?.title, updateTripMutation]);

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
        <Text style={s.emptyTitle}>{t("trip.detail.notFound")}</Text>
        <Pressable onPress={() => router.back()} style={s.linkBtn}>
          <Text style={s.linkBtnText}>{t("trip.detail.back")}</Text>
        </Pressable>
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
          isPaused={activeTripState.isPaused}
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
        onComplete={handleMarkComplete}
      />

      <ShareTripModal
        visible={isShareOpen}
        tripId={tripId}
        tripTitle={trip?.title}
        onClose={() => setIsShareOpen(false)}
      />

      <TripCompleteCelebration
        visible={showCelebration}
        tripTitle={trip?.title}
        onDismiss={() => setShowCelebration(false)}
      />
    </View>
  );
}
