import { useQuery } from "@tanstack/react-query";
import { getMyProfileApi } from "../api/profileApi";

export function useProfile(enabled = true) {
  return useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfileApi,
    enabled,
    select: (data) => data?.data || data,
  });
}
