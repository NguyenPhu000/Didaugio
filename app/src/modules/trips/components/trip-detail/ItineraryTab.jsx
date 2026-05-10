import { memo, useState, useCallback, useRef, useMemo } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import * as Haptics from "expo-haptics";
import { MaterialIcons } from "@expo/vector-icons";
import { TOKENS } from "../../../../constants/design-tokens";
import { formatDate, buildDestinationBookings } from "../../utils/tripHelpers";
import { useReorderDestinations, useUpdateDestination, useMoveDestination, useRemoveDestination } from "../../hooks/useTripDetail";
import TimelineCard from "./TimelineCard";
import TimelineConnector from "./TimelineConnector";
import MoveDestinationMenu from "./MoveDestinationMenu";

function ItineraryTab({ trip, bookings, onOpenBooking }) {
  const tripId = trip?.id;
  const destinations = trip?.destinations || [];
  const totalDays = trip?.totalDays || 1;

  const [selectedDay, setSelectedDay] = useState(1);
  const [movingDest, setMovingDest] = useState(null);
  const moveSheetRef = useRef(null);

  const reorderMutation = useReorderDestinations(tripId);
  const updateMutation = useUpdateDestination(tripId);
  const moveMutation = useMoveDestination(tripId);
  const removeMutation = useRemoveDestination(tripId);

  // Build day list
  const days = useMemo(() => {
    const result = [];
    for (let i = 1; i <= totalDays; i++) {
      const date = trip?.startDate
        ? new Date(new Date(trip.startDate).getTime() + (i - 1) * 86400000)
        : null;
      result.push({ dayNumber: i, date });
    }
    return result;
  }, [trip?.startDate, totalDays]);

  // Filter destinations for selected day
  const dayDestinations = useMemo(
    () => destinations.filter((d) => d.dayNumber === selectedDay).sort((a, b) => a.order - b.order),
    [destinations, selectedDay],
  );

  // Build booking map
  const destBookings = useMemo(
    () => buildDestinationBookings(bookings || [], destinations),
    [destinations, bookings],
  );

  // Drag end handler
  const handleDragEnd = useCallback(
    ({ data }) => {
      const orderedIds = data.map((d) => d.id);
      reorderMutation.mutate({ dayNumber: selectedDay, orderedIds });
    },
    [selectedDay, reorderMutation],
  );

  // Remove handler
  const handleRemove = useCallback(
    (dest) => {
      Alert.alert("Bo dia diem", `Bo "${dest.place?.name}" khoi lich trinh?`, [
        { text: "Huy", style: "cancel" },
        {
          text: "Bo",
          style: "destructive",
          onPress: () => removeMutation.mutate(dest.id),
        },
      ]);
    },
    [removeMutation],
  );

  // Long press handler
  const handleLongPress = useCallback(
    (dest) => {
      Alert.alert(dest.place?.name || "Dia diem", "Chon hanh dong", [
        { text: "Sua thong tin", onPress: () => {} },
        {
          text: "Chuyen ngay",
          onPress: () => {
            setMovingDest(dest);
            moveSheetRef.current?.expand();
          },
        },
        {
          text: "Bo khoi lich trinh",
          style: "destructive",
          onPress: () => handleRemove(dest),
        },
        { text: "Huy", style: "cancel" },
      ]);
    },
    [handleRemove],
  );

  // Move handler
  const handleMove = useCallback(
    ({ destId, newDayNumber, newOrder }) => {
      moveMutation.mutate(
        { destId, newDayNumber, newOrder },
        {
          onSuccess: () => {
            moveSheetRef.current?.close();
            setMovingDest(null);
            setSelectedDay(newDayNumber);
          },
        },
      );
    },
    [moveMutation],
  );

  // Save edit handler
  const handleSave = useCallback(
    ({ destId, data }) => {
      updateMutation.mutate({ destId, data });
    },
    [updateMutation],
  );

  // Render item for DraggableFlatList
  const renderItem = useCallback(
    ({ item, drag, isActive }) => {
      const itemBookings = destBookings.get(item.id) || [];
      return (
        <TimelineCard
          dest={item}
          bookings={itemBookings}
          onOpenBooking={onOpenBooking}
          onRemove={() => handleRemove(item)}
          onLongPress={handleLongPress}
          onSave={handleSave}
          isSaving={updateMutation.isPending}
          drag={drag}
          isActive={isActive}
          tripStatus={trip?.status}
        />
      );
    },
    [destBookings, onOpenBooking, handleRemove, handleLongPress, handleSave, updateMutation.isPending, trip?.status],
  );

  // Render separator between items
  const renderSeparator = useCallback(
    ({ leadingItem }) => (
      <TimelineConnector
        distanceToNext={leadingItem.distanceToNext}
        transportToNext={leadingItem.transportToNext}
      />
    ),
    [],
  );

  const destCount = dayDestinations.length;

  return (
    <View style={styles.container}>
      {/* Day chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayChips}
      >
        {days.map(({ dayNumber, date }) => {
          const isActive = selectedDay === dayNumber;
          const dayDests = destinations.filter(
            (d) => d.dayNumber === dayNumber,
          );
          return (
            <Pressable
              key={dayNumber}
              style={[styles.dayChip, isActive && styles.dayChipActive]}
              onPress={() => setSelectedDay(dayNumber)}
            >
              <Text
                style={[
                  styles.dayChipLabel,
                  isActive && styles.dayChipLabelActive,
                ]}
              >
                Ngay {dayNumber}
              </Text>
              {date ? (
                <Text
                  style={[
                    styles.dayChipDate,
                    isActive && styles.dayChipDateActive,
                  ]}
                >
                  {formatDate(date)}
                </Text>
              ) : null}
              {dayDests.length > 0 ? (
                <View
                  style={[
                    styles.dayChipCount,
                    isActive && styles.dayChipCountActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayChipCountText,
                      isActive && styles.dayChipCountTextActive,
                    ]}
                  >
                    {dayDests.length}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Draggable destination list */}
      <DraggableFlatList
        data={dayDestinations}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={renderSeparator}
        onDragEnd={handleDragEnd}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialIcons
                name="add-location"
                size={28}
                color="rgba(0,0,0,0.2)"
              />
            </View>
            <Text style={styles.emptyTitle}>Chua co dia diem</Text>
            <Text style={styles.emptyText}>
              Them dia diem yeu thich vao ngay nay
            </Text>
          </View>
        }
      />

      {/* Move destination bottom sheet */}
      <MoveDestinationMenu
        ref={moveSheetRef}
        trip={trip}
        currentDayNumber={movingDest?.dayNumber}
        destId={movingDest?.id}
        onMove={handleMove}
        isLoading={moveMutation.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dayChips: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    gap: 2,
    minWidth: 72,
  },
  dayChipActive: {
    backgroundColor: "#1D1D1F",
  },
  dayChipLabel: {
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    color: "#1D1D1F",
    letterSpacing: -0.2,
  },
  dayChipLabelActive: {
    color: "#FFFFFF",
  },
  dayChipDate: {
    fontSize: 10,
    fontFamily: TOKENS.font.body,
    color: "rgba(0,0,0,0.4)",
    letterSpacing: -0.1,
  },
  dayChipDateActive: {
    color: "rgba(255,255,255,0.6)",
  },
  dayChipCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    marginTop: 2,
  },
  dayChipCountActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dayChipCountText: {
    fontSize: 10,
    fontFamily: TOKENS.font.semibold,
    color: "#1D1D1F",
  },
  dayChipCountTextActive: {
    color: "#FFFFFF",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 4,
  },
  empty: {
    paddingVertical: 56,
    alignItems: "center",
    gap: 8,
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
  emptyTitle: {
    fontSize: 16,
    fontFamily: TOKENS.font.semibold,
    color: "#1D1D1F",
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 14,
    color: "rgba(0,0,0,0.4)",
    fontFamily: TOKENS.font.body,
    letterSpacing: -0.1,
  },
});

export default memo(ItineraryTab);
