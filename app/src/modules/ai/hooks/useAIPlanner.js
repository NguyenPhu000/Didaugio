import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmGeneratedTripApi,
  generateTripPreviewApi,
  getMyTripsApi,
} from "../api/aiApi";
import { mapAIError } from "../../ai-assistant/lib/mapAIError";
import { useAIPlannerStore } from "../../../stores/aiPlannerStore";

function normalizePlaceIds(ids, fallbackPlaces = []) {
  const fallbackIds = Array.isArray(fallbackPlaces)
    ? fallbackPlaces.map((place) => Number(place?.id)).filter(Boolean)
    : [];

  if (!Array.isArray(ids) || ids.length === 0) {
    return fallbackIds;
  }

  return ids.map((id) => Number(id)).filter(Boolean);
}

function buildTripSummaryMessage(trip) {
  const destCount = trip.destinations?.length || 0;
  return (
    `Lịch trình **${trip.title}** đã sẵn sàng!\n` +
    `${trip.description || ""}\n\n` +
    `• ${trip.totalDays} ngày | ${destCount} địa điểm` +
    (trip.estimatedCost
      ? ` | Chi phí ~${trip.estimatedCost.toLocaleString("vi-VN")} đ`
      : "")
  );
}

function buildPreviewMessage(payload, selectedCount) {
  const totalDays = payload?.itinerary?.totalDays || 1;
  const suggestedCount = payload?.suggestedPlaces?.length || 0;
  const estimatedCost = payload?.itinerary?.estimatedCost;

  return (
    `Em Nhi đã lên khung lịch trình ${totalDays} ngày và gợi ý ${suggestedCount} địa điểm.\n` +
    `Bạn chọn địa điểm phía dưới rồi bấm **Chốt & tạo chuyến đi**.` +
    (selectedCount > 0 ? `\n\nĐang chọn: ${selectedCount} địa điểm.` : "") +
    (estimatedCost
      ? `\nChi phí ước tính: ~${Number(estimatedCost).toLocaleString("vi-VN")} đ.`
      : "")
  );
}

function inferPlannerPreferences(text = "") {
  const dayMatch = text.match(/(\d{1,2})\s*(ngày|day)/i);
  const groupMatch = text.match(/(\d{1,2})\s*(người|person|people)/i);

  const totalDays = Number(dayMatch?.[1]);
  const groupSize = Number(groupMatch?.[1]);

  return {
    totalDays:
      Number.isFinite(totalDays) && totalDays > 0 ? Math.min(totalDays, 14) : undefined,
    groupSize:
      Number.isFinite(groupSize) && groupSize > 0 ? Math.min(groupSize, 12) : undefined,
  };
}

export function useAIPlanner() {
  const queryClient = useQueryClient();

  const messages = useAIPlannerStore((s) => s.messages);
  const draftPlan = useAIPlannerStore((s) => s.draftPlan);
  const selectedPlaceIds = useAIPlannerStore((s) => s.selectedPlaceIds);
  const lastPreferences = useAIPlannerStore((s) => s.lastPreferences);

  const appendMessage = useAIPlannerStore((s) => s.appendMessage);
  const setDraftPlan = useAIPlannerStore((s) => s.setDraftPlan);
  const setSelectedPlaceIds = useAIPlannerStore((s) => s.setSelectedPlaceIds);
  const setLastPreferences = useAIPlannerStore((s) => s.setLastPreferences);
  const resetPlannerState = useAIPlannerStore((s) => s.resetPlannerState);

  const previewMutation = useMutation({
    mutationFn: (preferences) => generateTripPreviewApi(preferences),
    onSuccess: (response) => {
      const payload = response?.data;

      if (payload?.previewOnly) {
        const suggestedPlaces = Array.isArray(payload?.suggestedPlaces)
          ? payload.suggestedPlaces
          : [];
        const normalizedSelectedIds = normalizePlaceIds(
          payload?.selectedPlaceIds,
          suggestedPlaces,
        );

        setDraftPlan({
          itinerary: payload?.itinerary || null,
          suggestedPlaces,
        });
        setSelectedPlaceIds(normalizedSelectedIds);

        const assistantMsg = {
          id: Date.now().toString(),
          role: "assistant",
          text: buildPreviewMessage(payload, normalizedSelectedIds.length),
          createdAt: new Date(),
          suggestedPlaces,
          selectedPlaceIds: normalizedSelectedIds,
        };
        appendMessage(assistantMsg);
        return;
      }

      const trip = payload;
      if (trip) {
        const assistantMsg = {
          id: Date.now().toString(),
          role: "assistant",
          text: buildTripSummaryMessage(trip),
          plan: trip,
          createdAt: new Date(),
        };
        setDraftPlan(null);
        setSelectedPlaceIds([]);
        appendMessage(assistantMsg);
        queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      }
    },
    onError: (err) => {
      const errorMessage = mapAIError(err);
      const errorMsg = {
        id: Date.now().toString(),
        role: "assistant",
        text: errorMessage,
        createdAt: new Date(),
        isError: true,
      };
      appendMessage(errorMsg);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (payload) => confirmGeneratedTripApi(payload),
    onSuccess: (response) => {
      const trip = response?.data;
      if (!trip) return;

      const assistantMsg = {
        id: Date.now().toString(),
        role: "assistant",
        text: buildTripSummaryMessage(trip),
        plan: trip,
        createdAt: new Date(),
      };

      setDraftPlan(null);
      setSelectedPlaceIds([]);
      setLastPreferences(null);
      appendMessage(assistantMsg);
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
    },
    onError: (err) => {
      const errorMessage = mapAIError(err);
      const errorMsg = {
        id: Date.now().toString(),
        role: "assistant",
        text: errorMessage,
        createdAt: new Date(),
        isError: true,
      };
      appendMessage(errorMsg);
    },
  });

  const sendMessage = useCallback(
    async (userText, preferences = {}) => {
      if (!userText.trim() && !preferences.totalDays) return;

      const userMsg = {
        id: Date.now().toString(),
        role: "user",
        text: userText,
        createdAt: new Date(),
      };
      appendMessage(userMsg);

      const inferred = inferPlannerPreferences(userText);
      const payload = {
        totalDays: preferences.totalDays || inferred.totalDays || 1,
        travelStyle: preferences.travelStyle,
        groupSize: preferences.groupSize || inferred.groupSize || 1,
        budget: preferences.budget,
        notes: userText,
      };

      setLastPreferences(payload);
      setDraftPlan(null);
      setSelectedPlaceIds([]);

      await previewMutation.mutateAsync(payload);
    },
    [
      appendMessage,
      previewMutation,
      setDraftPlan,
      setLastPreferences,
      setSelectedPlaceIds,
    ],
  );

  const togglePlaceSelection = useCallback(
    (placeId) => {
      const normalizedId = Number(placeId);
      if (!normalizedId) return;

      setSelectedPlaceIds((prev) =>
        prev.includes(normalizedId)
          ? prev.filter((id) => id !== normalizedId)
          : [...prev, normalizedId],
      );
    },
    [setSelectedPlaceIds],
  );

  const selectAllPlaces = useCallback(() => {
    const ids = (draftPlan?.suggestedPlaces || [])
      .map((place) => Number(place?.id))
      .filter(Boolean);
    setSelectedPlaceIds(ids);
  }, [draftPlan, setSelectedPlaceIds]);

  const clearSelectedPlaces = useCallback(() => {
    setSelectedPlaceIds([]);
  }, [setSelectedPlaceIds]);

  const confirmSelectedPlaces = useCallback(async () => {
    if (!draftPlan) return null;

    const effectiveIds =
      selectedPlaceIds.length > 0
        ? selectedPlaceIds
        : (draftPlan.suggestedPlaces || [])
            .map((place) => Number(place?.id))
            .filter(Boolean);

    if (effectiveIds.length === 0) return null;

    const payload = {
      ...(lastPreferences || {}),
      selectedPlaceIds: effectiveIds,
      itineraryDraft: draftPlan.itinerary,
    };

    const response = await confirmMutation.mutateAsync(payload);
    return response?.data || null;
  }, [confirmMutation, draftPlan, lastPreferences, selectedPlaceIds]);

  const canConfirmSelection =
    !!draftPlan && selectedPlaceIds.length > 0 && !confirmMutation.isPending;

  const activeError = confirmMutation.error || previewMutation.error;

  const reset = useCallback(() => {
    resetPlannerState();
    previewMutation.reset();
    confirmMutation.reset();
  }, [confirmMutation, previewMutation, resetPlannerState]);

  return {
    messages,
    isLoading: previewMutation.isPending || confirmMutation.isPending,
    isPreviewLoading: previewMutation.isPending,
    isConfirming: confirmMutation.isPending,
    error: activeError ? mapAIError(activeError) : null,
    sendMessage,
    draftPlan,
    selectedPlaceIds,
    togglePlaceSelection,
    selectAllPlaces,
    clearSelectedPlaces,
    confirmSelectedPlaces,
    canConfirmSelection,
    reset,
  };
}

export function useMyTrips(params = {}) {
  return useQuery({
    queryKey: ["my-trips", params],
    queryFn: () => getMyTripsApi(params),
    select: (res) => res?.data,
    staleTime: 2 * 60 * 1000,
  });
}
