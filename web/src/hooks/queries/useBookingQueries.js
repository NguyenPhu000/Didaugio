import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { useApiQuery } from "./useApiQuery";
import { useApiMutation, invalidateQueries } from "./useApiMutation";
import bookingService from "@/apis/bookingService";

/**
 * Fetch all bookings with filters.
 */
export function useBookings(params = {}) {
  return useApiQuery(
    queryKeys.bookings.list(params),
    () => bookingService.getAll(params),
    { placeholderData: (prev) => prev }
  );
}

/**
 * Fetch booking statistics.
 */
export function useBookingStats() {
  return useApiQuery(queryKeys.bookings.stats(), () =>
    bookingService.getStats()
  );
}

/**
 * Fetch booking by ID.
 */
export function useBookingDetail(id) {
  return useApiQuery(
    queryKeys.bookings.detail(id),
    () => bookingService.getById(id),
    { enabled: !!id }
  );
}

/**
 * Fetch booking schedule.
 */
export function useBookingSchedule(params = {}) {
  return useApiQuery(
    queryKeys.bookings.list({ ...params, view: "schedule" }),
    () => bookingService.getSchedule(params)
  );
}

/**
 * Quick approve booking mutation.
 */
export function useQuickApproveBooking() {
  const queryClient = useQueryClient();
  return useApiMutation((id) => bookingService.quickApprove(id), {
    onSuccess: () => {
      invalidateQueries(queryClient, [queryKeys.bookings.all()]);
    },
  });
}

/**
 * Quick reject booking mutation.
 */
export function useQuickRejectBooking() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ id, cancelReason }) => bookingService.quickReject(id, cancelReason),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [queryKeys.bookings.all()]);
      },
    }
  );
}

/**
 * Confirm booking mutation.
 */
export function useConfirmBooking() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ id, data }) => bookingService.confirm(id, data),
    {
      onSuccess: (_data, variables) => {
        invalidateQueries(queryClient, [
          queryKeys.bookings.all(),
          queryKeys.bookings.detail(variables.id),
        ]);
      },
    }
  );
}

/**
 * Cancel booking mutation.
 */
export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ id, cancelReason }) => bookingService.cancel(id, cancelReason),
    {
      onSuccess: (_data, variables) => {
        invalidateQueries(queryClient, [
          queryKeys.bookings.all(),
          queryKeys.bookings.detail(variables.id),
        ]);
      },
    }
  );
}

/**
 * Complete booking mutation.
 */
export function useCompleteBooking() {
  const queryClient = useQueryClient();
  return useApiMutation((id) => bookingService.complete(id), {
    onSuccess: (_data, id) => {
      invalidateQueries(queryClient, [
        queryKeys.bookings.all(),
        queryKeys.bookings.detail(id),
      ]);
    },
  });
}

/**
 * Mark no-show mutation.
 */
export function useMarkNoShow() {
  const queryClient = useQueryClient();
  return useApiMutation((id) => bookingService.markNoShow(id), {
    onSuccess: (_data, id) => {
      invalidateQueries(queryClient, [
        queryKeys.bookings.all(),
        queryKeys.bookings.detail(id),
      ]);
    },
  });
}

/**
 * Reschedule booking mutation.
 */
export function useRescheduleBooking() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ id, bookingTime, data }) => bookingService.reschedule(id, bookingTime, data),
    {
      onSuccess: (_data, variables) => {
        invalidateQueries(queryClient, [
          queryKeys.bookings.all(),
          queryKeys.bookings.detail(variables.id),
        ]);
      },
    }
  );
}

/**
 * Mark paid mutation.
 */
export function useMarkPaid() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ id, data }) => bookingService.markPaid(id, data),
    {
      onSuccess: (_data, variables) => {
        invalidateQueries(queryClient, [
          queryKeys.bookings.all(),
          queryKeys.bookings.detail(variables.id),
        ]);
      },
    }
  );
}
