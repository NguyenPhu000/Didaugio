import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getApplicableVouchersApi,
  validateVoucherCodeApi,
} from "../api/voucherApi";

/**
 * Hook lấy danh sách voucher khả dụng cho service/business hiện tại.
 * @param {{ serviceId?: number, businessId?: number, amount?: number }} params
 */
export function useApplicableVouchers(params = {}) {
  const { serviceId, businessId, amount } = params;

  return useQuery({
    queryKey: ["vouchers", "applicable", { serviceId, businessId, amount }],
    queryFn: () =>
      getApplicableVouchersApi({
        serviceId: Number(serviceId),
        businessId: businessId ? Number(businessId) : undefined,
        amount: amount != null ? Number(amount) : undefined,
      }),
    enabled: Number.isFinite(Number(serviceId)) && Number(serviceId) > 0,
    select: (res) => {
      const list = res?.data || res?.data?.data || [];
      return Array.isArray(list) ? list : [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook validate mã voucher do User nhập tay.
 */
export function useValidateVoucherCode() {
  return useMutation({
    mutationFn: (payload) => validateVoucherCodeApi(payload),
  });
}
