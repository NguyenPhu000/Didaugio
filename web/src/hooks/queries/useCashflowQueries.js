import { queryKeys } from "@/constants/query-keys";
import { useApiQuery } from "./useApiQuery";
import paymentService from "@/apis/paymentService";
import revenueService from "@/apis/revenueService";

const STALE_TIME = 60 * 1000;

export function useAdminCashflow(params = {}) {
  return useApiQuery(
    queryKeys.cashflow.admin(params),
    () => paymentService.getAdminCashflow(params),
    { placeholderData: (prev) => prev },
  );
}

export function useAdminCashflowSummary(params = {}) {
  return useApiQuery(
    queryKeys.cashflow.adminSummary(params),
    () => paymentService.getAdminCashflowSummary(params),
    { staleTime: STALE_TIME, placeholderData: (prev) => prev },
  );
}

export function useBusinessCashflow(params = {}) {
  return useApiQuery(
    queryKeys.cashflow.business(params),
    () => revenueService.getCashflow(params),
    { placeholderData: (prev) => prev },
  );
}

export function useBusinessCashflowSummary(params = {}) {
  return useApiQuery(
    queryKeys.cashflow.businessSummary(params),
    () => revenueService.getCashflowSummary(params),
    { staleTime: STALE_TIME, placeholderData: (prev) => prev },
  );
}
