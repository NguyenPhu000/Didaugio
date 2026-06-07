import { memo, useState, useCallback, useMemo, useEffect, useRef } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import DraggableFlatList from "react-native-draggable-flatlist";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import {
  buildDestinationBookings,
  buildDayList,
  parseTimeToDate,
  toValidDate,
} from "../../utils/tripHelpers";
import { useReorderDestinations, useUpdateDestination, useMoveDestination, useRemoveDestination } from "../../hooks/useTripDetail";
import { getActiveTripId, getVisitedDestinations } from "../../hooks/useActiveTrip";
import TimelineCard from "./TimelineCard";
import TimelineConnector from "./TimelineConnector";
import MoveDestinationModal from "./MoveDestinationModal";
import EditDestinationForm from "./EditDestinationForm";
import InlineAddPlaceModal from "./InlineAddPlaceModal";
import CustomAlertModal from "../../../../components/composed/CustomAlertModal";

function ItineraryTab({
  trip,
  bookings,
  onOpenBooking,
  isAddPlaceOpen,
  onAddPlaceOpen,
  onAddPlaceClose,
  canStartTrip = false,
  onStartTrip,
  isStartingTrip = false,
  isCurrentActiveTrip = false,
  isPaused = false,
}) {
  const { t } = useTranslation();
  const tripId = trip?.id;
  const destinations = trip?.destinations || [];

  // Custom alert state
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "error",
    confirmText: t("trip.itinerary.close"),
    cancelText: t("common.cancel"),
    onConfirm: null,
    onCancel: null,
    isDestructive: false,
  });

  const showAlert = useCallback(({ title, message, type = "error", confirmText, cancelText, onConfirm, onCancel, isDestructive = false }) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      onConfirm: () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        onConfirm?.();
      },
      onCancel: onCancel ? () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        onCancel?.();
      } : null,
      isDestructive,
    });
  }, []);

  // Trạng thái điểm danh đọc từ AsyncStorage (chỉ khi đây là chuyến đang chạy).
  const [visitedIds, setVisitedIds] = useState([]);

  const loadVisited = useCallback(async () => {
    if (!tripId) return;
    const activeId = await getActiveTripId();
    if (String(activeId) === String(tripId)) {
      setVisitedIds(await getVisitedDestinations(tripId));
    } else {
      setVisitedIds([]);
    }
  }, [tripId]);

  useFocusEffect(
    useCallback(() => {
      void loadVisited();
    }, [loadVisited]),
  );

  // Nguồn duy nhất cho danh sách ngày (dùng chung với modal chuyển ngày / thêm địa điểm)
  const days = useMemo(() => buildDayList(trip), [trip]);
  const totalDays = days.length;

  // Xác định ngày nào là "hôm nay" trong trip
  const currentDayNumber = useMemo(() => {
    if (!trip?.startDate) return null;
    const startDate = toValidDate(trip.startDate);
    if (!startDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const diffMs = today.getTime() - start.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays < 1 || diffDays > totalDays) return null;
    return diffDays;
  }, [trip?.startDate, totalDays]);

  const [selectedDay, setSelectedDay] = useState(1);
  const [movingDest, setMovingDest] = useState(null);
  const [editingDest, setEditingDest] = useState(null);
  const initializedRef = useRef(false);

  // Set initial selected day to current trip day on first render
  useEffect(() => {
    if (!initializedRef.current && currentDayNumber != null) {
      initializedRef.current = true;
      setSelectedDay(currentDayNumber);
    }
  }, [currentDayNumber]);

  // Keep selected day in valid range when totalDays changes
  useEffect(() => {
    if (selectedDay > totalDays) setSelectedDay(totalDays);
  }, [selectedDay, totalDays]);

  const isToday = (dayNumber) => currentDayNumber === dayNumber;

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
            showAlert({
              title: t("trip.itinerary.error"),
              message: error?.message || t("trip.itinerary.reorderError")
            });
          },
        }
      );
    },
    [selectedDay, reorderMutation, showAlert],
  );

  // Remove handler
  const handleRemove = useCallback(
    (dest) => {
      showAlert({
        title: t("trip.itinerary.removeTitle"),
        message: t("trip.itinerary.removeMessage", { name: dest.place?.name }),
        type: "confirm",
        confirmText: t("trip.itinerary.remove"),
        cancelText: t("common.cancel"),
        isDestructive: true,
        onConfirm: () => {
          removeMutation.mutate(dest.id, {
            onError: (error) => {
              showAlert({
                title: t("trip.itinerary.error"),
                message: error?.message || t("trip.itinerary.removeError")
              });
            },
          });
        },
        onCancel: () => {},
      });
    },
    [removeMutation, showAlert],
  );

  const handleMoveRequest = useCallback((dest) => {
    setMovingDest(dest);
  }, []);

  const handleMoveCancel = useCallback(() => {
    setMovingDest(null);
  }, []);

  const handleMove = useCallback(
    async ({ destId, newDayNumber, newOrder, startTime, endTime, note }) => {
      try {
        await moveMutation.mutateAsync({ destId, newDayNumber, newOrder });
        if (startTime !== undefined || endTime !== undefined || note !== undefined) {
          await updateMutation.mutateAsync({
            destId,
            data: { startTime, endTime, note },
          });
        }
        setMovingDest(null);
        setSelectedDay(newDayNumber);
      } catch (error) {
        showAlert({
          title: t("trip.itinerary.error"),
          message: error?.message || t("trip.itinerary.moveError")
        });
      }
    },
    [moveMutation, updateMutation, showAlert],
  );

  const handleMoveModalSave = useCallback(
    ({ destId, data }) => {
      updateMutation.mutate(
        { destId, data },
        { 
          onSuccess: () => setMovingDest(null),
          onError: (error) => {
            showAlert({
              title: t("trip.itinerary.error"),
              message: error?.message || t("trip.itinerary.updateError")
            });
          },
        },
      );
    },
    [updateMutation, showAlert],
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
            showAlert({
              title: t("trip.itinerary.error"),
              message: error?.message || t("trip.itinerary.saveError")
            });
          },
        },
      );
    },
    [updateMutation, destinations, selectedDay, reorderMutation, showAlert],
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
            isVisited={visitedIds.includes(item.id)}
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
    [destBookings, onOpenBooking, handleRemove, handleMoveRequest, handleEditRequest, trip?.status, dayDestinations, visitedIds],
  );

  const isLast = useMemo(() => {
    if (!editingDest) return false;
    const idx = dayDestinations.findIndex((d) => d.id === editingDest.id);
    return idx === dayDestinations.length - 1;
  }, [dayDestinations, editingDest]);

  const startTripTitle = isCurrentActiveTrip
    ? isPaused
      ? t("trip.itinerary.continueTrip")
      : t("trip.itinerary.viewMap")
    : t("trip.itinerary.startTrip");

  const startTripSubtitle = isCurrentActiveTrip
    ? isPaused
      ? t("trip.itinerary.resumeSubtitle")
      : t("trip.itinerary.mapSubtitle")
    : "";

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
                className={`px-3 rounded-2xl items-center justify-center gap-0.5 h-14 min-w-[64px] max-w-[88px] ${isActive ? "bg-[#1D1D1F]" : "bg-black/[0.04]"} ${isToday(dayNumber) && !isActive ? "border-2 border-[#007AFF]" : ""}`}
                onPress={() => setSelectedDay(dayNumber)}
              >
                {isToday(dayNumber) && !isActive ? (
                  <View className="absolute -top-1 right-1 w-2 h-2 rounded-full bg-[#007AFF]" />
                ) : null}
                <Text
                  className={`text-[13px] font-semibold tracking-tight ${isActive ? "text-white" : isToday(dayNumber) ? "text-[#007AFF]" : "text-[#1D1D1F]"}`}
                  numberOfLines={1}
                >
                  {isToday(dayNumber) ? `Hôm nay` : `Ngày ${dayNumber}`}
                </Text>
                {date ? (
                  <Text
                    className={`text-[10px] font-normal tracking-tight ${isActive ? "text-white" : isToday(dayNumber) ? "text-[#007AFF]/70" : "text-[#1D1D1F]/50"}`}
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
                  className={`min-w-[18px] h-[18px] rounded-full items-center justify-center px-1.25 ${isActive ? "bg-white" : isToday(dayNumber) ? "bg-[#007AFF]" : "bg-black/[0.12]"}`}
                >
                  <Text
                    className={`text-[10px] font-semibold ${isActive ? "text-[#1D1D1F]" : "text-white"}`}
                  >
                    {dayDests.length}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {/* Bắt đầu hành trình — chỉ hiển thị khi chuyến đi diễn ra hôm nay */}
      {canStartTrip ? (
        <View className="relative px-5 pt-1.5 pb-3">
          {/* Ambient glow layer */}
          <View className="absolute top-1 left-10 right-10 h-12 rounded-[24px] bg-[#007BFF]/10" />
          <Pressable
            onPress={() => onStartTrip?.()}
            disabled={isStartingTrip}
            style={({ pressed }) => [
              { shadowColor: "#007BFF", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 20, elevation: 8 },
              pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 },
            ]}
            className="h-[68px] rounded-[24px] bg-[#1D1D1F] border border-white/[0.08] overflow-hidden justify-center"
          >
            {isStartingTrip ? (
              <View className="flex-row items-center justify-center gap-2.5">
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text className="text-[14px] font-medium text-white/60 tracking-tight">{t("trip.itinerary.starting")}</Text>
              </View>
            ) : (
              <View className="flex-row items-center justify-center px-6 gap-3.5">
                {/* Icon Container */}
                <View className="relative w-10 h-10 items-center justify-center">
                  <View className="w-10 h-10 rounded-[12px] bg-[#007BFF] items-center justify-center">
                    <MaterialIconsRounded name="navigation" size={18} color="#FFFFFF" />
                  </View>
                  {/* Pulse dot chỉ hiển thị khi chuyến đi đang chạy và hoạt động (không pause) */}
                  {isCurrentActiveTrip && !isPaused && (
                    <View className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#34C759] border-2 border-[#1D1D1F]" />
                  )}
                </View>

                {/* Text Block - Căn lề trái cho text nhưng cả khối được căn giữa của nút */}
                <View className="flex-col justify-center items-start">
                  <Text className="text-[16px] font-semibold text-white tracking-[-0.3px]">
                    {startTripTitle}
                  </Text>
                  {startTripSubtitle ? (
                    <Text className="text-[11px] font-normal text-white/50 tracking-tight mt-0.5">
                      {startTripSubtitle}
                    </Text>
                  ) : null}
                </View>
              </View>
            )}
          </Pressable>
        </View>
      ) : null}

      {/* Action Header */}
      <View className="flex-row items-center justify-between px-5 py-2.5 bg-[#F8FAFC]">
        <Text className="text-[13px] font-semibold text-black/[0.45] tracking-tight">
          {t("trip.itinerary.destinationCount", { count: dayDestinations.length })}
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
            <MaterialIconsRounded name="add" size={16} color="#FFFFFF" /> {t("trip.itinerary.addDestination")}
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
              <MaterialIconsRounded
                name="add-location"
                size={28}
                color="rgba(0,0,0,0.2)"
              />
            </View>
            <Text className="text-[16px] font-semibold text-[#1D1D1F] tracking-tight">{t("trip.itinerary.noDestinations")}</Text>
            <Text className="text-[14px] text-black/40 font-normal tracking-tight">
              {t("trip.itinerary.noDestinationsDesc")}
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
                <MaterialIconsRounded name="add" size={16} color="#FFFFFF" /> {t("trip.itinerary.addDestination")}
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

      <CustomAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
        isDestructive={alertConfig.isDestructive}
      />
    </View>
  );
}

export default memo(ItineraryTab);
