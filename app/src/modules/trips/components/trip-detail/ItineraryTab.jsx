import { memo, useState, useCallback, useMemo } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { MaterialIcons } from "@expo/vector-icons";
import { TOKENS } from "../../../../constants/design-tokens";
import { buildDestinationBookings } from "../../utils/tripHelpers";
import { useReorderDestinations, useUpdateDestination, useMoveDestination, useRemoveDestination } from "../../hooks/useTripDetail";
import TimelineCard from "./TimelineCard";
import TimelineConnector from "./TimelineConnector";
import MoveDestinationModal from "./MoveDestinationModal";
import EditDestinationForm from "./EditDestinationForm";
import InlineAddPlaceModal from "./InlineAddPlaceModal";

function ItineraryTab({
  trip,
  bookings,
  onOpenBooking,
  isAddPlaceOpen,
  onAddPlaceOpen,
  onAddPlaceClose,
}) {
  const tripId = trip?.id;
  const destinations = trip?.destinations || [];
  const totalDays = trip?.totalDays || 1;

  const [selectedDay, setSelectedDay] = useState(1);
  const [movingDest, setMovingDest] = useState(null);
  const [editingDest, setEditingDest] = useState(null);

  const formatChipDate = useCallback((date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  }, []);

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
      reorderMutation.mutate(
        { dayNumber: selectedDay, orderedIds },
        {
          onError: (error) => {
            Alert.alert("Lỗi", error?.message || "Không thể sắp xếp lại các điểm đến. Vui lòng thử lại.");
          },
        }
      );
    },
    [selectedDay, reorderMutation],
  );

  // Remove handler
  const handleRemove = useCallback(
    (dest) => {
      Alert.alert(
        "Bỏ địa điểm",
        `Bỏ "${dest.place?.name}" khỏi lịch trình?`,
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Bỏ",
            style: "destructive",
            onPress: () => removeMutation.mutate(dest.id, {
              onError: (error) => {
                Alert.alert("Lỗi", error?.message || "Không thể bỏ địa điểm này. Vui lòng thử lại.");
              },
            }),
          },
        ],
      );
    },
    [removeMutation],
  );

  const handleMoveRequest = useCallback((dest) => {
    setMovingDest(dest);
  }, []);

  const handleMoveCancel = useCallback(() => {
    setMovingDest(null);
  }, []);

  const handleMove = useCallback(
    ({ destId, newDayNumber, newOrder, startTime, endTime, note }) => {
      moveMutation.mutate(
        { destId, newDayNumber, newOrder },
        {
          onSuccess: () => {
            if (startTime !== undefined || endTime !== undefined || note !== undefined) {
              updateMutation.mutate({
                destId,
                data: { startTime, endTime, note },
              }, {
                onError: (error) => {
                  Alert.alert("Lỗi", error?.message || "Không thể cập nhật thông tin chặng đi. Vui lòng thử lại.");
                },
              });
            }
            setMovingDest(null);
            setSelectedDay(newDayNumber);
          },
          onError: (error) => {
            Alert.alert("Lỗi", error?.message || "Không thể dời địa điểm này. Vui lòng thử lại.");
          },
        },
      );
    },
    [moveMutation, updateMutation],
  );

  const handleMoveModalSave = useCallback(
    ({ destId, data }) => {
      updateMutation.mutate(
        { destId, data },
        { 
          onSuccess: () => setMovingDest(null),
          onError: (error) => {
            Alert.alert("Lỗi", error?.message || "Không thể cập nhật địa điểm. Vui lòng thử lại.");
          },
        },
      );
    },
    [updateMutation],
  );

  const handleEditRequest = useCallback((dest) => {
    setEditingDest(dest);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditingDest(null);
  }, []);

  const handleSave = useCallback(
    ({ destId, data }) => {
      updateMutation.mutate(
        { destId, data },
        { 
          onSuccess: () => setEditingDest(null),
          onError: (error) => {
            Alert.alert("Lỗi", error?.message || "Không thể lưu thay đổi. Vui lòng thử lại.");
          },
        },
      );
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
          onMoveRequest={handleMoveRequest}
          onEditRequest={handleEditRequest}
          drag={drag}
          isActive={isActive}
          tripStatus={trip?.status}
        />
      );
    },
    [destBookings, onOpenBooking, handleRemove, handleMoveRequest, handleEditRequest, trip?.status],
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
        style={styles.dayChipsScroll}
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
                numberOfLines={1}
              >
                Ngày {dayNumber}
              </Text>
              {date ? (
                <Text
                  style={[
                    styles.dayChipDate,
                    isActive && styles.dayChipDateActive,
                  ]}
                  numberOfLines={1}
                >
                  {formatChipDate(date)}
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

      {/* Action Header */}
      <View style={styles.actionHeader}>
        <Text style={styles.destCountText}>
          {dayDestinations.length} địa điểm
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.addInlineBtn,
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => onAddPlaceOpen?.()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          
          <Text style={styles.addInlineBtnText}> <MaterialIcons name="add" size={16} color="#000000" /> Thêm địa điểm</Text>
        </Pressable>
      </View>

      {/* Draggable destination list */}
      <DraggableFlatList
        data={dayDestinations}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={renderSeparator}
        onDragEnd={handleDragEnd}
        style={{ flex: 1 }}
        containerStyle={{ flex: 1 }}
        activationDistance={15}
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
            <Text style={styles.emptyTitle}>Chưa có địa điểm</Text>
            <Text style={styles.emptyText}>
              Thêm địa điểm yêu thích vào ngày này
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.addInlineEmptyBtn,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => onAddPlaceOpen?.()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              
              <Text style={styles.addInlineEmptyBtnText}> <MaterialIcons name="add" size={16} color="#000000" /> Thêm địa điểm</Text>
            </Pressable>
          </View>
        }
      />

      <MoveDestinationModal
        visible={!!movingDest}
        dest={movingDest}
        trip={trip}
        onMove={handleMove}
        onSave={handleMoveModalSave}
        onCancel={handleMoveCancel}
        isLoading={moveMutation.isPending || updateMutation.isPending}
      />

      <EditDestinationForm
        visible={!!editingDest}
        dest={editingDest}
        onSave={handleSave}
        onCancel={handleEditCancel}
        isLoading={updateMutation.isPending}
      />

      <InlineAddPlaceModal
        visible={isAddPlaceOpen}
        tripId={tripId}
        totalDays={totalDays}
        defaultDay={selectedDay}
        onClose={() => onAddPlaceClose?.()}
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
    paddingVertical: 10,
    gap: 8,
    alignItems: "center",
  },
  dayChipsScroll: {
    flexGrow: 0,
    height: 76,
    maxHeight: 76,
  },
  dayChip: {
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    height: 56,
    minWidth: 64,
    maxWidth: 88,
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
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
  },
  destCountText: {
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    color: "rgba(0,0,0,0.45)",
    letterSpacing: -0.1,
  },
  addInlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1D1D1F",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  addInlineBtnText: {
    color: "#000000",
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.1,
  },
  addInlineEmptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1D1D1F",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    marginTop: 12,
  },
  addInlineEmptyBtnText: {
    color: "#000000",
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.15,
  },
});

export default memo(ItineraryTab);
