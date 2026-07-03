import { useQuery } from "@tanstack/react-query";
import { getCmsExploreLandingApi } from "../../../api/cms";

/**
 * Hook tổng hợp lấy tất cả CMS data cho Explore screen trong 1 request.
 * Dùng aggregate endpoint để tránh 4x HTTP handshake trên mạng di động.
 * Chỉ trả isLoading = false khi toàn bộ data đã sẵn sàng → không bị Layout Shift.
 *
 * @returns {{ data: { banners, featuredPlaces, sampleTrips, announcement }, isLoading, isRefetching, refetch, error }}
 */
export function useExploreCms() {
  return useQuery({
    queryKey: ["cms-explore-landing"],
    queryFn: () =>
      getCmsExploreLandingApi().then((res) => res?.data || res),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    select: (data) => ({
      banners: Array.isArray(data?.banners) ? data.banners : [],
      featuredPlaces: Array.isArray(data?.featuredPlaces) ? data.featuredPlaces : [],
      sampleTrips: Array.isArray(data?.sampleTrips) ? data.sampleTrips : [],
      announcement: data?.announcement || null,
    }),
  });
}
