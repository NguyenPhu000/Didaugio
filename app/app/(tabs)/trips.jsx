import { useCallback, useMemo, useState } from "react";
import { View, RefreshControl } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTripsCached } from "../../src/modules/trips/hooks/useTripsOffline";
import {
  useSaveTrip,
  useUnsaveTrip,
} from "../../src/modules/trips/hooks/useTrips";
import { useAuthStore } from "../../src/stores/authStore";
import { GuestGate } from "../../src/components/ui/GuestGate";
import { OfflineBanner } from "../../src/components/ui/OfflineBanner";
import { TAB_BAR_HEIGHT } from "./_layout";
import { TripsDashboard } from "../../src/modules/trips/components/TripsDashboard";
import { TripCard } from "../../src/modules/trips/components/TripCard";
import {
  getDisplayStatus,
  getSafeDateTime,
} from "../../src/modules/trips/utils/tripHelpers";
import {
  LoadingState,
  EmptyTrips,
  ErrorState,
} from "../../src/modules/trips/components/TripsStates";
import { BOOKING_APPLE_THEME as APPLE_THEME } from "../../src/constants/design-tokens";

function ItemSeparator() {
  return <View className="h-3.5" />;
}

export default function TripsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isGuest = useAuthStore((s) => s.isGuest);
  const isLoggedIn = !!accessToken && !isGuest;
  const [activeFilter, setActiveFilter] = useState("all");

  const {
    data: tripsRaw,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useTripsCached(isLoggedIn);

  const trips = useMemo(
    () => (Array.isArray(tripsRaw) ? tripsRaw : []),
    [tripsRaw],
  );

  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) {
        refetch();
      }
    }, [isLoggedIn, refetch]),
  );

  const filteredTrips = useMemo(() => {
    const list = trips.filter((trip) => {
      if (activeFilter === "all") return true;
      const displayStatus = getDisplayStatus(trip);
      if (activeFilter === "active") {
        return displayStatus === "upcoming" || displayStatus === "ongoing";
      }
      if (activeFilter === "done") {
        return displayStatus === "completed" || displayStatus === "cancelled";
      }
      return true;
    });

    if (activeFilter === "active") {
      return [...list].sort((a, b) => {
        const aDate = getSafeDateTime(a.startDate, Number.MAX_SAFE_INTEGER);
        const bDate = getSafeDateTime(b.startDate, Number.MAX_SAFE_INTEGER);
        return aDate - bDate;
      });
    }

    return list;
  }, [activeFilter, trips]);

  const saveTripMutation = useSaveTrip();
  const unsaveTripMutation = useUnsaveTrip();

  const handleToggleSaveTrip = useCallback(
    (tripId) => {
      const trip = trips.find((t) => String(t.id) === String(tripId));
      if (!trip) return;
      if (trip.isSaved) {
        unsaveTripMutation.mutate(tripId);
      } else {
        saveTripMutation.mutate(tripId);
      }
    },
    [trips, saveTripMutation, unsaveTripMutation],
  );

  const handleCreate = useCallback(() => router.push("/trip/create"), [router]);
  const handlePressTrip = useCallback(
    (id) => router.push(`/trip/${id}`),
    [router],
  );

  const renderTripCard = useCallback(
    ({ item }) => (
      <TripCard
        trip={item}
        onPress={() => handlePressTrip(item.id)}
        onSave={handleToggleSaveTrip}
        isSaved={item.isSaved}
      />
    ),
    [handlePressTrip, handleToggleSaveTrip],
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  if (!isLoggedIn) {
    return (
      <GuestGate
        icon="luggage"
        title={t("trips.guestTitle")}
        description={t("trips.guestDescription")}
      />
    );
  }

  return (
    <View
      className="flex-1"
      style={{
        paddingTop: insets.top,
        backgroundColor: APPLE_THEME.background,
      }}
    >
      <OfflineBanner />
      <FlashList
        data={!isLoading && !isError ? filteredTrips : []}
        renderItem={renderTripCard}
        keyExtractor={keyExtractor}
        extraData={trips}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={252}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#1D1D1F"
            colors={["#1D1D1F"]}
          />
        }
        ListHeaderComponent={
          !isLoading && !isError ? (
            <TripsDashboard
              trips={trips}
              filteredCount={filteredTrips.length}
              activeFilter={activeFilter}
              onSelectFilter={setActiveFilter}
              onOpenHero={handlePressTrip}
              onCreate={handleCreate}
            />
          ) : null
        }
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={
          isLoading ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : (
            <EmptyTrips
              onCreate={handleCreate}
              activeFilter={activeFilter}
              onClearFilter={() => setActiveFilter("all")}
            />
          )
        }
        ListFooterComponent={<View className="h-4" />}
      />
    </View>
  );
}
