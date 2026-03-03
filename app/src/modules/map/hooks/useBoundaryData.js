import { useQuery } from "@tanstack/react-query";
import { getDistrictsGeoJSON, getWardsGeoJSON } from "../api/mapApi";

const STALE_TIME = 30 * 60 * 1000;

export function useBoundaryData() {
  const districts = useQuery({
    queryKey: ["boundaries-districts"],
    queryFn: getDistrictsGeoJSON,
    staleTime: STALE_TIME,
    select: (res) => res?.data || res,
  });

  const wards = useQuery({
    queryKey: ["boundaries-wards"],
    queryFn: getWardsGeoJSON,
    staleTime: STALE_TIME,
    select: (res) => res?.data || res,
  });

  return {
    districts: districts.data,
    wards: wards.data,
    isLoading: districts.isLoading || wards.isLoading,
    error: districts.error || wards.error,
    refetch: () => {
      districts.refetch();
      wards.refetch();
    },
  };
}
