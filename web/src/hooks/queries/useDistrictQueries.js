import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { useApiQuery } from "./useApiQuery";
import { useApiMutation, invalidateQueries } from "./useApiMutation";
import districtService from "@/apis/districtService";
import wardService from "@/apis/wardService";

/**
 * Fetch all districts.
 */
export function useDistricts() {
  return useApiQuery(queryKeys.districts.list(), () =>
    districtService.getAll()
  );
}

/**
 * Fetch district by ID.
 */
export function useDistrictDetail(id) {
  return useApiQuery(
    queryKeys.districts.detail(id),
    () => districtService.getById(id),
    { enabled: !!id }
  );
}

/**
 * Create district mutation.
 */
export function useCreateDistrict() {
  const queryClient = useQueryClient();
  return useApiMutation((data) => districtService.create(data), {
    onSuccess: () => {
      invalidateQueries(queryClient, [queryKeys.districts.all()]);
    },
  });
}

/**
 * Update district mutation.
 */
export function useUpdateDistrict() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ id, data }) => districtService.update(id, data),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [queryKeys.districts.all()]);
      },
    }
  );
}

/**
 * Delete district mutation.
 */
export function useDeleteDistrict() {
  const queryClient = useQueryClient();
  return useApiMutation((id) => districtService.delete(id), {
    onSuccess: () => {
      invalidateQueries(queryClient, [queryKeys.districts.all()]);
    },
  });
}

/**
 * Fetch all wards.
 */
export function useWards(districtId) {
  return useApiQuery(
    queryKeys.wards.list(districtId),
    () => wardService.getAll(districtId),
    { enabled: !!districtId }
  );
}

/**
 * Fetch ward by ID.
 */
export function useWardDetail(id) {
  return useApiQuery(
    queryKeys.wards.list(id),
    () => wardService.getById(id),
    { enabled: !!id }
  );
}
