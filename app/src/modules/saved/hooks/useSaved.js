import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteSavedCollectionApi,
  getSavedCollectionsApi,
  getSavedPlacesApi,
  renameSavedCollectionApi,
  savePlaceApi,
  unsavePlaceApi,
} from "../api/savedApi";

function setPlaceSavedFlag(qc, placeId, isSaved) {
  const normalizedPlaceId = Number(placeId);
  if (!Number.isFinite(normalizedPlaceId) || normalizedPlaceId <= 0) return;

  qc.setQueriesData({ queryKey: ["place"], exact: false }, (prev) => {
    if (!prev || Number(prev?.id) !== normalizedPlaceId) return prev;
    return { ...prev, isSaved };
  });
}

export function useSavedPlaces(enabled = true) {
  return useQuery({
    queryKey: ["saved-places"],
    queryFn: () => getSavedPlacesApi(),
    enabled,
    select: (data) => data?.data || [],
  });
}

export function useSavedCollections(enabled = true) {
  return useQuery({
    queryKey: ["saved-collections"],
    queryFn: getSavedCollectionsApi,
    enabled,
    select: (data) => data?.data || [],
  });
}

export function useSavePlace() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ placeId, note, collectionName }) =>
      savePlaceApi(placeId, note, collectionName),
    onMutate: async ({ placeId }) => {
      setPlaceSavedFlag(qc, placeId, true);
      return { placeId };
    },
    onError: (_error, _vars, context) => {
      setPlaceSavedFlag(qc, context?.placeId, false);
    },
    onSettled: (_data, _error, vars) => {
      qc.invalidateQueries({ queryKey: ["saved-places"] });
      qc.invalidateQueries({ queryKey: ["saved-collections"] });
      qc.invalidateQueries({ queryKey: ["place"], exact: false });
      setPlaceSavedFlag(qc, vars?.placeId, true);
    },
  });
}

export function useUnsavePlace() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (placeId) => unsavePlaceApi(placeId),
    onMutate: async (placeId) => {
      setPlaceSavedFlag(qc, placeId, false);
      return { placeId };
    },
    onError: (_error, _vars, context) => {
      setPlaceSavedFlag(qc, context?.placeId, true);
    },
    onSettled: (_data, _error, placeId) => {
      qc.invalidateQueries({ queryKey: ["saved-places"] });
      qc.invalidateQueries({ queryKey: ["saved-collections"] });
      qc.invalidateQueries({ queryKey: ["place"], exact: false });
      setPlaceSavedFlag(qc, placeId, false);
    },
  });
}

export function useRenameSavedCollection() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: renameSavedCollectionApi,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["saved-places"] });
      qc.invalidateQueries({ queryKey: ["saved-collections"] });
    },
  });
}

export function useDeleteSavedCollection() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteSavedCollectionApi,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["saved-places"] });
      qc.invalidateQueries({ queryKey: ["saved-collections"] });
    },
  });
}
