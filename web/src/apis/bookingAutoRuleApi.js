import api from "@/constants/api";

const BASE_URL = "/business/booking-auto-rules";

export const list = async () => {
  return api.get(BASE_URL);
};

export const create = async (data) => {
  return api.post(BASE_URL, data);
};

export const update = async (id, data) => {
  return api.patch(`${BASE_URL}/${id}`, data);
};

export const remove = async (id) => {
  return api.delete(`${BASE_URL}/${id}`);
};

export default { list, create, update, remove };
