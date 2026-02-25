/**
 * useProfile — queries authenticated user profile
 */
import { useQuery } from "@tanstack/react-query";
import { getMyProfileApi } from "../api/profileApi";

export function useProfile() {
  return useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfileApi,
    select: (data) => data?.data || data,
  });
}
