import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import safeAsyncStorage from "../../../utils/safeAsyncStorage";
import { router } from "expo-router";
import { QUERY_KEYS } from "../../../constants/query-keys";
import {
  checkoutApi,
  getPaymentStatusApi,
  getPaymentByBookingApi,
} from "../api/paymentApi";

export const PENDING_PAYMENT_BOOKING_KEY = "pendingPaymentBookingId";

export const PAYMENT_STATUS = Object.freeze({
  PAID: "paid",
  FAILED: "failed",
  FULLY_REFUNDED: "fully_refunded",
  UNPAID: "unpaid",
});

export const BOOKING_STATUS = Object.freeze({
  EXPIRED: "expired",
  CANCELLED: "cancelled",
});

const DEFAULT_MAX_POLLS = 60;
const POLL_INTERVAL_MS = 2000;

export function useCheckout() {
  return useMutation({
    mutationFn: checkoutApi,
  });
}

export function usePollPaymentStatus() {
  const queryClient = useQueryClient();
  const intervalRef = useRef(null);
  const pollCountRef = useRef(0);
  const isActiveRef = useRef(false);

  const stopPolling = useCallback(() => {
    isActiveRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const clearPendingKeys = useCallback(async () => {
    try {
      await safeAsyncStorage.multiRemove([
        PENDING_PAYMENT_BOOKING_KEY,
      ]);
    } catch {
      // Ignore storage cleanup errors
    }
  }, []);

  const invalidatePaymentState = useCallback(
    (bookingId, paymentId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookings.all() });
      if (bookingId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.bookings.detail(Number(bookingId)),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.payments.byBooking(Number(bookingId)),
        });
      }
      if (paymentId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.payments.detail(Number(paymentId)),
        });
      }
    },
    [queryClient],
  );

  const startPolling = useCallback(
    async (paymentId, bookingId, options = {}) => {
      if (!bookingId) {
        console.warn("[usePayment] startPolling called without bookingId");
        return;
      }

      // Prevent double-start race condition
      if (isActiveRef.current) {
        return;
      }

      // Cho phép tùy biến (vd: QR chuyển khoản cần poll lâu ~15 phút)
      const maxPolls = options.maxPolls ?? DEFAULT_MAX_POLLS;
      const intervalMs = options.intervalMs ?? POLL_INTERVAL_MS;

      pollCountRef.current = 0;
      isActiveRef.current = true;

      // Save booking id for app-resume recovery.
      try {
        await safeAsyncStorage.setItem(PENDING_PAYMENT_BOOKING_KEY, String(bookingId));
      } catch (err) {
        console.warn("[usePayment] safeAsyncStorage write failed:", err);
        // Continue polling even if storage fails
      }

      stopPolling();

      intervalRef.current = setInterval(async () => {
        if (!isActiveRef.current) {
          stopPolling();
          return;
        }

        pollCountRef.current += 1;

        if (pollCountRef.current > maxPolls) {
          stopPolling();
          invalidatePaymentState(bookingId, paymentId);
          await clearPendingKeys();
          router.replace(
            `/payment/result?status=pending_verify&bookingId=${bookingId}`
          );
          return;
        }

        try {
          let payment = null;

          if (paymentId) {
            const res = await getPaymentStatusApi(paymentId);
            // Axios interceptor already unwraps response.data
            payment = res?.data ?? res;
          } else if (bookingId) {
            const res = await getPaymentByBookingApi(bookingId);
            payment = res?.data ?? res;
          }

          const status = payment?.status;

          if (status === PAYMENT_STATUS.PAID) {
            stopPolling();
            invalidatePaymentState(bookingId, paymentId);
            await clearPendingKeys();
            router.replace(
              `/payment/result?status=success&bookingId=${bookingId}`
            );
            return;
          }

          if (
            status === PAYMENT_STATUS.FAILED ||
            status === PAYMENT_STATUS.FULLY_REFUNDED
          ) {
            stopPolling();
            invalidatePaymentState(bookingId, paymentId);
            await clearPendingKeys();
            router.replace(
              `/payment/result?status=failed&bookingId=${bookingId}`
            );
            return;
          }

          if (
            pollCountRef.current >= maxPolls &&
            (status === PAYMENT_STATUS.UNPAID || !status)
          ) {
            // Check if booking was expired/cancelled by scheduler
            let reason = "";
            try {
              const bookingRes = await getPaymentByBookingApi(bookingId);
              const bookingData = bookingRes?.data ?? bookingRes;
              const bookingStatus = bookingData?.booking?.status;
              if (
                bookingStatus === BOOKING_STATUS.EXPIRED ||
                bookingStatus === BOOKING_STATUS.CANCELLED
              ) {
                reason = "&reason=expired";
              }
            } catch {
              // Ignore booking check error
            }
            stopPolling();
            invalidatePaymentState(bookingId, paymentId);
            await clearPendingKeys();
            router.replace(
              `/payment/result?status=pending_verify&bookingId=${bookingId}${reason}`
            );
          }
        } catch (err) {
          console.warn("[usePayment] Poll error:", err);
          if (pollCountRef.current >= maxPolls) {
            stopPolling();
            invalidatePaymentState(bookingId, paymentId);
            await clearPendingKeys();
            router.replace(
              `/payment/result?status=pending_verify&bookingId=${bookingId}`
            );
          }
        }
      }, intervalMs);
    },
    [stopPolling, clearPendingKeys, invalidatePaymentState]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return { startPolling, stopPolling };
}
