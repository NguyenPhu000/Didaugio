import { useCallback, useMemo, useState } from "react";
import { Alert, View, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useTripsCached } from "../../src/modules/trips/hooks/useTripsOffline";
import { useSaveTrip, useUnsaveTrip } from "../../src/modules/trips/hooks/useTrips";
import { useAuthStore } from "../../src/stores/authStore";
import { GuestGate } from "../../src/components/ui/GuestGate";
import { OfflineBanner } from "../../src/components/ui/OfflineBanner";
import { TAB_BAR_HEIGHT } from "./_layout";
import { TripsDashboard } from "../../src/modules/trips/components/TripsDashboard";
import { TripCard } from "../../src/modules/trips/components/TripCard";
import { getDisplayStatus } from "../../src/modules/trips/utils/tripHelpers";
import {
  LoadingState,
  EmptyTrips,
  ErrorState,
} from "../../src/modules/trips/components/TripsStates";
import { BOOKING_APPLE_THEME as APPLE_THEME } from "../../src/constants/design-tokens";

const SEPARATOR_HEIGHT = 10;

function ItemSeparator() {
  return <View style={styles.separator} />;
}

export default function TripsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isGuest = useAuthStore((s) => s.isGuest);
  const isLoggedIn = !!accessToken && !isGuest;
  const [activeFilter, setActiveFilter] = useState("all");
  const [isOffline, setIsOffline] = useState(false);

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

  const filteredTrips = useMemo(
    () =>
      trips.filter((trip) => {
        if (activeFilter === "all") return true;
        const displayStatus = getDisplayStatus(trip);
        if (activeFilter === "active") {
          return (
            displayStatus === "draft" ||
            displayStatus === "upcoming" ||
            displayStatus === "ongoing"
          );
        }
        if (activeFilter === "done") {
          return displayStatus === "completed" || displayStatus === "cancelled";
        }
        return true;
      }),
    [activeFilter, trips],
  );

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
        title="Đăng nhập để quản lý chuyến đi"
        description="Đồng bộ lịch trình, điểm đến và tiến độ hành trình của bạn trên mọi thiết bị."
      />
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <OfflineBanner onNetworkChange={setIsOffline} />
      <FlatList
        data={!isLoading && !isError ? filteredTrips : []}
        renderItem={renderTripCard}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
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
            <EmptyTrips onCreate={handleCreate} activeFilter={activeFilter} />
          )
        }
        ListFooterComponent={<View style={styles.footerSpace} />}
      />

      {/* Floating Action Button — bottom-right for one-handed reach */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleCreate}
        style={[
          styles.fab,
          { bottom: TAB_BAR_HEIGHT + insets.bottom + 20 },
        ]}
      >
        <MaterialIcons name="add" size={26} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APPLE_THEME.background,
  },
  listContent: {
    paddingBottom: TAB_BAR_HEIGHT + 24,
  },
  separator: {
    height: SEPARATOR_HEIGHT,
  },
  footerSpace: {
    height: 16,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1D1D1F",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  fabPressed: {
    backgroundColor: "#000000",
    transform: [{ scale: 0.92 }],
  },
});
