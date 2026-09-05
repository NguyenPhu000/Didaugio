import client from "../../../api/client";

const PUBLIC_URL = "/vouchers";

/**
 * Lấy danh sách voucher đang khả dụng cho 1 service/business.
 * Có thể truyền `amount` để server lọc `minOrderValue` và tính discountAmount.
 */
export const getApplicableVouchersApi = async (params = {}) => {
  return client.get(`${PUBLIC_URL}/public`, { params });
};

/**
 * Validate voucher code do User nhập thủ công.
 * @param {{ code: string, serviceId: number, originalPrice: number }} payload
 */
export const validateVoucherCodeApi = async (payload) => {
  return client.post(`${PUBLIC_URL}/validate`, payload);
};

export default {
  getApplicableVouchersApi,
  validateVoucherCodeApi,
};
