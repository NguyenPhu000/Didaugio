import { useCallback, useMemo, useState } from "react";
import { View, FlatList, StyleSheet, RefreshControl, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useTripsCached } from "../../src/modules/trips/hooks/useTripsOffline";
import { useAuthStore } from "../../src/stores/authStore";
import { GuestGate } from "../../src/components/ui/GuestGate";
import { OfflineBanner } from "../../src/components/ui/OfflineBanner";
import { TAB_BAR_HEIGHT } from "./_layout";
import { TripsDashboard } from "../../src/modules/trips/components/TripsDashboard";
import { TripCard } from "../../src/modules/trips/components/TripCard";
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
    data: trips = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useTripsCached(isLoggedIn);

  const filteredTrips = useMemo(
    () =>
      trips.filter((trip) => {
        if (activeFilter === "all") return true;
        if (activeFilter === "active") {
          return trip.status === "active" || trip.status === "draft";
        }
        if (activeFilter === "done") {
          return trip.status === "completed" || trip.status === "cancelled";
        }
        return true;
      }),
    [activeFilter, trips],
  );

  const handleCreate = useCallback(() => router.push("/trip/create"), [router]);
  const handlePressTrip = useCallback(
    (id) => router.push(`/trip/${id}`),
    [router],
  );

  const renderTripCard = useCallback(
    ({ item }) => (
      <TripCard trip={item} onPress={() => handlePressTrip(item.id)} />
    ),
    [handlePressTrip],
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
      <Pressable
        onPress={handleCreate}
        style={({ pressed }) => [
          styles.fab,
          { bottom: TAB_BAR_HEIGHT + insets.bottom + 20 },
          pressed && styles.fabPressed,
        ]}
      >
        <MaterialIcons name="add" size={26} color="#FFFFFF" />
      </Pressable>
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
