import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateTripApi, getMyTripsApi } from "../api/aiApi";

export function useAIPlanner() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState([]);

  const mutation = useMutation({
    mutationFn: (preferences) => generateTripApi(preferences),
    onSuccess: (response) => {
      const trip = response?.data;
      if (trip) {
        const destCount = trip.destinations?.length || 0;
        const assistantMsg = {
          id: Date.now().toString(),
          role: "assistant",
          text:
            `✨ Lịch trình **${trip.title}** đã sẵn sàng!\n` +
            `${trip.description || ""}\n\n` +
            `• ${trip.totalDays} ngày | ${destCount} địa điểm` +
            (trip.estimatedCost
              ? ` | Chi phí ~${trip.estimatedCost.toLocaleString("vi-VN")} đ`
              : ""),
          plan: trip,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      }
    },
    onError: (err) => {
      const errorMsg = {
        id: Date.now().toString(),
        role: "assistant",
        text: `❌ ${err?.message || "AI không phản hồi. Vui lòng thử lại."}`,
        createdAt: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
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
      setMessages((prev) => [...prev, userMsg]);

      await mutation.mutateAsync({
        totalDays: preferences.totalDays || 1,
        travelStyle: preferences.travelStyle,
        groupSize: preferences.groupSize || 1,
        budget: preferences.budget,
        notes: userText,
      });
    },
    [mutation],
  );

  const reset = useCallback(() => {
    setMessages([]);
    mutation.reset();
  }, [mutation]);

  return {
    messages,
    isLoading: mutation.isPending,
    error: mutation.error?.message || null,
    sendMessage,
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
