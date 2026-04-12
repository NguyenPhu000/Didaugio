import { useCallback, useMemo, useState } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTrips } from "../../src/modules/trips/hooks/useTrips";
import { useAuthStore } from "../../src/stores/authStore";
import { GuestGate } from "../../src/components/ui/GuestGate";
import { TAB_BAR_HEIGHT } from "./_layout";
import { TripsDashboard } from "../../src/modules/trips/components/TripsDashboard";
import { TripCard } from "../../src/modules/trips/components/TripCard";
import {
  LoadingState,
  EmptyTrips,
  ErrorState,
} from "../../src/modules/trips/components/TripsStates";
import { BOOKING_APPLE_THEME as APPLE_THEME } from "../../src/constants/design-tokens";

export default function TripsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isGuest = useAuthStore((s) => s.isGuest);
  const isLoggedIn = !!accessToken && !isGuest;
  const [activeFilter, setActiveFilter] = useState("all");

  const {
    data: trips = [],
    isLoading,
    isError,
    refetch,
  } = useTrips(isLoggedIn);

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
      <FlatList
        data={!isLoading && !isError ? filteredTrips : []}
        renderItem={({ item }) => (
          <TripCard trip={item} onPress={() => handlePressTrip(item.id)} />
        )}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {!isLoading && !isError && (
              <TripsDashboard
                trips={trips}
                filteredCount={filteredTrips.length}
                activeFilter={activeFilter}
                onSelectFilter={setActiveFilter}
                onCreate={handleCreate}
                onOpenHero={handlePressTrip}
              />
            )}
          </>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    height: 18,
  },
  footerSpace: {
    height: 16,
  },
});
