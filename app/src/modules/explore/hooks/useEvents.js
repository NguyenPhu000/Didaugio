import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEventsApi,
  getEventDetailApi,
  joinEventApi,
  pingEventApi,
  createMomentApi,
  getMomentsApi,
  deleteMomentApi,
} from "../../../api/event";
import { TRIP_QUERY_KEYS } from "../../../constants/query-keys";

export function useEvents(params = {}) {
  return useQuery({
    queryKey: ["events", params],
    queryFn: () => getEventsApi(params).then((res) => res?.data || res || []),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useEventDetail(id, enabled = true) {
  return useQuery({
    queryKey: ["event-detail", id],
    queryFn: () => getEventDetailApi(id).then((res) => res?.data || res),
    enabled: !!id && enabled,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useEventMoments(id, params = {}, enabled = true) {
  return useQuery({
    queryKey: ["event-moments", id, params],
    queryFn: () =>
      getMomentsApi(id, params).then((res) => res?.data || res || []),
    enabled: !!id && enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useJoinEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => joinEventApi(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["event-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: TRIP_QUERY_KEYS.lists() });
    },
  });
}

export function useCreateMoment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => createMomentApi(id, payload),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["event-moments", id] });
      queryClient.invalidateQueries({ queryKey: ["event-detail", id] });
    },
  });
}

export function useDeleteMoment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ momentId }) => deleteMomentApi(momentId),
    onSuccess: (data, { eventId }) => {
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: ["event-moments", eventId] });
        queryClient.invalidateQueries({ queryKey: ["event-detail", eventId] });
      }
    },
  });
}

export function usePingEvent() {
  return useMutation({
    mutationFn: ({ id, payload }) => pingEventApi(id, payload),
  });
}
