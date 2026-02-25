/**
 * useSavedPlaces — queries for authenticated user's saved places
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSavedPlacesApi,
  savePlaceApi,
  unsavePlaceApi,
} from "../api/savedApi";

export function useSavedPlaces() {
  return useQuery({
    queryKey: ["saved-places"],
    queryFn: () => getSavedPlacesApi(),
    select: (data) => data?.data || [],
  });
}

export function useSavePlace() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ placeId, note }) => savePlaceApi(placeId, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-places"] }),
  });
}

export function useUnsavePlace() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (placeId) => unsavePlaceApi(placeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-places"] }),
  });
}
