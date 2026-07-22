import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../constants/query-keys";
import { getProvinces } from "./locationApi";
import { useLocationStore } from "./locationStore";

export function useActiveProvince() {
  const queryClient = useQueryClient();
  const provinceCode = useLocationStore((state) => state.provinceCode);
  const datasetReleaseId = useLocationStore((state) => state.datasetReleaseId);
  const persistProvince = useLocationStore((state) => state.setActiveProvince);
  const provincesQuery = useQuery({
    queryKey: QUERY_KEYS.locations.provinces(),
    queryFn: ({ signal }) => getProvinces({ signal }),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const setActiveProvince = async (nextProvinceCode) => {
    const nextReleaseId = provincesQuery.data?.datasetReleaseId ?? datasetReleaseId;
    const previousProvinceCode = provinceCode;
    persistProvince({ provinceCode: nextProvinceCode, datasetReleaseId: nextReleaseId });
    if (previousProvinceCode && previousProvinceCode !== nextProvinceCode) {
      await queryClient.removeQueries({
        predicate: ({ queryKey }) => queryKey.includes(previousProvinceCode),
      });
    }
  };

  return {
    provinceCode,
    datasetReleaseId,
    activeProvince: provincesQuery.data?.data.find((item) => item.code === provinceCode) ?? null,
    provincesQuery,
    setActiveProvince,
  };
}
