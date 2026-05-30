import { memo, useState, useCallback, useMemo, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { MaterialIcons } from "@expo/vector-icons";
import { buildDestinationBookings, buildDayList, parseTimeToDate } from "../../utils/tripHelpers";
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

  // Nguồn duy nhất cho danh sách ngày (dùng chung với modal chuyển ngày / thêm địa điểm)
  const days = useMemo(() => buildDayList(trip), [trip]);
  const totalDays = days.length;

  const [selectedDay, setSelectedDay] = useState(1);
  const [movingDest, setMovingDest] = useState(null);
  const [editingDest, setEditingDest] = useState(null);

  // Giữ ngày đang chọn luôn nằm trong khoảng hợp lệ khi tổng số ngày thay đổi
  useEffect(() => {
    if (selectedDay > totalDays) setSelectedDay(totalDays);
  }, [selectedDay, totalDays]);

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
      const timeChanged = data.startTime !== undefined || data.endTime !== undefined;

      updateMutation.mutate(
        { destId, data },
        {
          onSuccess: () => {
            setEditingDest(null);

            if (timeChanged && data.startTime) {
              const dayDests = destinations.filter((d) => d.dayNumber === selectedDay);
              const sorted = [...dayDests].sort((a, b) => {
                const aTime = a.id === destId ? data.startTime : a.startTime;
                const bTime = b.id === destId ? data.startTime : b.startTime;
                const aDate = parseTimeToDate(aTime);
                const bDate = parseTimeToDate(bTime);
                if (aDate && bDate) return aDate - bDate;
                if (aDate) return -1;
                if (bDate) return 1;
                return a.order - b.order;
              });
              const orderedIds = sorted.map((d) => d.id);
              const orderChanged = orderedIds.some((id, i) => {
                const dest = dayDests.find((d) => d.id === id);
                return dest && dest.order !== i;
              });
              if (orderChanged) {
                reorderMutation.mutate({ dayNumber: selectedDay, orderedIds });
              }
            }
          },
          onError: (error) => {
            Alert.alert("Lỗi", error?.message || "Không thể lưu thay đổi. Vui lòng thử lại.");
          },
        },
      );
    },
    [updateMutation, destinations, selectedDay, reorderMutation],
  );

  // Render item for DraggableFlatList
  const renderItem = useCallback(
    ({ item, drag, isActive }) => {
      const itemBookings = destBookings.get(item.id) || [];
      const isLastItem = item.id === dayDestinations[dayDestinations.length - 1]?.id;
      return (
        <View>
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
          {!isLastItem && (
            <TimelineConnector
              distanceToNext={item.distanceToNext}
              transportToNext={item.transportToNext}
            />
          )}
        </View>
      );
    },
    [destBookings, onOpenBooking, handleRemove, handleMoveRequest, handleEditRequest, trip?.status, dayDestinations],
  );

  const isLast = useMemo(() => {
    if (!editingDest) return false;
    const idx = dayDestinations.findIndex((d) => d.id === editingDest.id);
    return idx === dayDestinations.length - 1;
  }, [dayDestinations, editingDest]);

  return (
    <View className="flex-1">
      {/* Day chips */}
      <ScrollView
        horizontal
        className="flex-grow-0"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8, gap: 8, alignItems: "center" }}
      >
        {days.map(({ dayNumber, date }) => {
          const isActive = selectedDay === dayNumber;
          const dayDests = destinations.filter(
            (d) => d.dayNumber === dayNumber,
          );
          return (
            <View key={dayNumber} style={{ overflow: "visible" }}>
              <Pressable
                style={({ pressed }) => [
                  pressed && { opacity: 0.9 },
                ]}
                className={`px-3 rounded-2xl items-center justify-center gap-0.5 h-14 min-w-[64px] max-w-[88px] ${isActive ? "bg-[#E8E8ED] border-[1.5px] border-[#1D1D1F]" : "bg-black/[0.04]"}`}
                onPress={() => setSelectedDay(dayNumber)}
              >
                <Text
                  className={`text-[13px] font-semibold tracking-tight text-[#1D1D1F]`}
                  numberOfLines={1}
                >
                  Ngày {dayNumber}
                </Text>
                {date ? (
                  <Text
                    className={`text-[10px] font-normal tracking-tight text-black/40`}
                    numberOfLines={1}
                  >
                    {formatChipDate(date)}
                  </Text>
                ) : null}
              </Pressable>
              {dayDests.length > 0 ? (
                <View
                  style={{
                    position: "absolute",
                    top: -7,
                    alignSelf: "center",
                    zIndex: 1,
                  }}
                  className={`min-w-[18px] h-[18px] rounded-full items-center justify-center px-1.25 ${isActive ? "bg-[#1D1D1F]" : "bg-black/[0.12]"}`}
                >
                  <Text
                    className={`text-[10px] font-semibold ${isActive ? "text-white" : "text-[#1D1D1F]"}`}
                  >
                    {dayDests.length}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {/* Action Header */}
      <View className="flex-row items-center justify-between px-5 py-2.5 bg-[#F8FAFC]">
        <Text className="text-[13px] font-semibold text-black/[0.45] tracking-tight">
          {dayDestinations.length} địa điểm
        </Text>
        <Pressable
          style={({ pressed }) => [
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => onAddPlaceOpen?.()}
          className="flex-row items-center gap-1 bg-[#1D1D1F] px-3 py-2 rounded-full"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text className="text-white text-[12px] font-semibold tracking-tight">
            <MaterialIcons name="add" size={16} color="#FFFFFF" /> Thêm địa điểm
          </Text>
        </Pressable>
      </View>

      {/* Draggable destination list */}
      <DraggableFlatList
        data={dayDestinations}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        onDragEnd={handleDragEnd}
        style={{ flex: 1 }}
        containerStyle={{ flex: 1 }}
        activationDistance={15}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 4 }}
        ListEmptyComponent={
          <View className="py-14 items-center gap-2">
            <View className="w-14 h-14 rounded-[20px] bg-black/[0.04] items-center justify-center mb-2">
              <MaterialIcons
                name="add-location"
                size={28}
                color="rgba(0,0,0,0.2)"
              />
            </View>
            <Text className="text-[16px] font-semibold text-[#1D1D1F] tracking-tight">Chưa có địa điểm</Text>
            <Text className="text-[14px] text-black/40 font-normal tracking-tight">
              Thêm địa điểm yêu thích vào ngày này
            </Text>
            <Pressable
              style={({ pressed }) => [
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => onAddPlaceOpen?.()}
              className="flex-row items-center gap-1 bg-[#1D1D1F] px-4 py-2.5 rounded-full mt-3"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="text-white text-[13px] font-semibold tracking-tight">
                <MaterialIcons name="add" size={16} color="#FFFFFF" /> Thêm địa điểm
              </Text>
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
        isLast={isLast}
        onSave={handleSave}
        onCancel={handleEditCancel}
        isLoading={updateMutation.isPending}
      />

      <InlineAddPlaceModal
        visible={isAddPlaceOpen}
        tripId={tripId}
        totalDays={totalDays}
        defaultDay={selectedDay}
        destinations={destinations}
        onClose={() => onAddPlaceClose?.()}
      />
    </View>
  );
}

export default memo(ItineraryTab);
