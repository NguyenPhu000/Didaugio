import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyProfileApi,
  updateMyAvatarApi,
  updateMyProfileApi,
} from "../api/profileApi";

const PROFILE_QUERY_KEY = ["my-profile"];

const normalizeProfileSummary = (res) => {
  const payload = res?.data || res;
  if (!payload) return null;

  const nestedProfile = payload?.profile || {};

  return {
    ...payload,
    ...nestedProfile,
    profile: nestedProfile,
    stats: payload?.stats || {},
  };
};

export function useProfile(enabled = true) {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getMyProfileApi,
    enabled,
    select: normalizeProfileSummary,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMyProfileApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMyAvatarApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });
}
