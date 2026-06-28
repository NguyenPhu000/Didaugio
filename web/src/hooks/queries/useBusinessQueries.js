import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { useApiQuery } from "./useApiQuery";
import { useApiMutation, invalidateQueries } from "./useApiMutation";
import businessApi from "@/apis/businessApi";

/**
 * Fetch business profile (current user's business).
 */
export function useBusinessProfile() {
  return useApiQuery(
    queryKeys.business.profile(),
    async () => {
      try {
        return await businessApi.getProfile();
      } catch (error) {
        if (
          error?.status === 404 ||
          error?.errorCode === "NO_BUSINESS_PROFILE"
        ) {
          return null;
        }
        throw error;
      }
    },
    {
      retry: (failureCount, error) => {
        if (
          error?.status === 404 ||
          error?.errorCode === "NO_BUSINESS_PROFILE"
        ) {
          return false;
        }
        return failureCount < 2;
      },
    },
  );
}

/**
 * Fetch all businesses (admin).
 */
export function useBusinesses(params = {}) {
  return useApiQuery(
    queryKeys.business.list(params),
    () => businessApi.getAll(params),
    { placeholderData: (prev) => prev }
  );
}

/**
 * Fetch single business by ID (admin).
 */
export function useBusinessDetail(id) {
  return useApiQuery(
    queryKeys.business.detail(id),
    () => businessApi.getById(id),
    { enabled: !!id }
  );
}

/**
 * Fetch business dashboard data.
 */
export function useBusinessDashboard(params = {}) {
  return useApiQuery(queryKeys.business.dashboard(), () =>
    businessApi.getDashboard(params)
  );
}

/**
 * Fetch business's own places (for dropdowns).
 */
export function useMyPlaces() {
  return useApiQuery(queryKeys.places.all(), () => businessApi.getMyPlaces(), {
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Register business mutation.
 */
export function useRegisterBusiness() {
  const queryClient = useQueryClient();
  return useApiMutation((data) => businessApi.register(data), {
    onSuccess: () => {
      invalidateQueries(queryClient, [queryKeys.business.all()]);
    },
  });
}

/**
 * Update business profile mutation.
 */
export function useUpdateBusinessProfile() {
  const queryClient = useQueryClient();
  return useApiMutation((data) => businessApi.updateProfile(data), {
    onSuccess: () => {
      invalidateQueries(queryClient, [
        queryKeys.business.profile(),
        queryKeys.business.dashboard(),
      ]);
    },
  });
}

/**
 * Approve business mutation (admin).
 */
export function useApproveBusiness() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ id, data }) => businessApi.approve(id, data),
    {
      onSuccess: (_data, variables) => {
        invalidateQueries(queryClient, [
          queryKeys.business.all(),
          queryKeys.business.detail(variables.id),
        ]);
      },
    }
  );
}

/**
 * Reject business mutation (admin).
 */
export function useRejectBusiness() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ id, reason }) => businessApi.reject(id, reason),
    {
      onSuccess: (_data, variables) => {
        invalidateQueries(queryClient, [
          queryKeys.business.all(),
          queryKeys.business.detail(variables.id),
        ]);
      },
    }
  );
}

/**
 * Suspend business mutation (admin).
 */
export function useSuspendBusiness() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ id, reason }) => businessApi.suspend(id, reason),
    {
      onSuccess: (_data, variables) => {
        invalidateQueries(queryClient, [
          queryKeys.business.all(),
          queryKeys.business.detail(variables.id),
        ]);
      },
    }
  );
}

/**
 * Reactivate business mutation (admin).
 */
export function useReactivateBusiness() {
  const queryClient = useQueryClient();
  return useApiMutation((id) => businessApi.reactivate(id), {
    onSuccess: (_data, id) => {
      invalidateQueries(queryClient, [
        queryKeys.business.all(),
        queryKeys.business.detail(id),
      ]);
    },
  });
}

/**
 * Terminate business mutation (admin).
 */
export function useTerminateBusiness() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ id, reason }) => businessApi.terminate(id, reason),
    {
      onSuccess: (_data, variables) => {
        invalidateQueries(queryClient, [
          queryKeys.business.all(),
          queryKeys.business.detail(variables.id),
        ]);
      },
    }
  );
}
