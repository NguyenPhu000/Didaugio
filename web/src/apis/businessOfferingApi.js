/**
 * Business Offering API - Dịch vụ/sản phẩm doanh nghiệp cung cấp (CRUD)
 * Base: /api/business/services
 * (Phân biệt với "Service layer" Backend — đây là file gọi HTTP API)
 */
import api from "@/constants/api";

const BASE_URL = "/business/services";

const sanitizeParams = (params = {}) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

export const getAll = async (params = {}) => {
  const response = await api.get(BASE_URL, { params: sanitizeParams(params) });
  return response;
};

export const getById = async (id) => {
  const response = await api.get(`${BASE_URL}/${id}`);
  return response;
};

export const create = async (data) => {
  const response = await api.post(BASE_URL, data);
  return response;
};

export const update = async (id, data) => {
  const response = await api.put(`${BASE_URL}/${id}`, data);
  return response;
};

export const updateDepositConfig = async (id, data) => {
  const response = await api.patch(`${BASE_URL}/${id}/deposit-config`, data);
  return response;
};

export const remove = async (id) => {
  const response = await api.delete(`${BASE_URL}/${id}`);
  return response;
};

export default {
  getAll,
  getById,
  create,
  update,
  updateDepositConfig,
  remove,
};
