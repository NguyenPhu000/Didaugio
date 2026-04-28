import { create } from "zustand";
import { devtools } from "zustand/middleware";
import * as businessApi from "@/apis/businessApi";

const useBusinessStore = create(
  devtools(
    (set, get) => ({
      business: null,
      businesses: [],
      loading: false,
      error: null,
      /** Thống kê nhanh (theo bộ lọc tìm kiếm, không theo tab trạng thái) */
      summary: null,
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      /** Tham số lần gọi `getAll` gần nhất (để refetch sau duyệt/từ chối/tạm ngưng/kích hoạt) */
      listQueryParams: {},
      /** Cùng nguồn với `fetchDashboard` — dùng chung cho Dashboard + Revenue (tránh gọi getProfile trùng với BusinessGuard) */
      dashboardStats: null,

      fetchProfile: async () => {
        set({ loading: true, error: null });
        try {
          const response = await businessApi.getProfile();
          set({ business: response.data || null, loading: false });
          return response.data;
        } catch (error) {
          if (error.status === 404) {
            set({ business: null, loading: false });
            return null;
          }
          set({ error: error.message, loading: false });
          return null;
        }
      },

      registerBusiness: async (data) => {
        set({ loading: true, error: null });
        try {
          const response = await businessApi.register(data);
          set({ business: response.data, loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateProfile: async (data) => {
        set({ loading: true, error: null });
        try {
          const response = await businessApi.updateProfile(data);
          set({ business: response.data, loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchDashboard: async () => {
        try {
          const response = await businessApi.getDashboard();
          set({ dashboardStats: response.data });
          return response.data;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      fetchAll: async (params = {}) => {
        set({ loading: true, error: null });
        try {
          const response = await businessApi.getAll(params);
          set({
            businesses: response.data || [],
            pagination: response.pagination || get().pagination,
            summary: response.summary ?? null,
            loading: false,
            listQueryParams: { ...params },
          });
          return response.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      refetchBusinessList: async () =>
        get().fetchAll(get().listQueryParams || {}),

      approveBusiness: async (id, payload = {}) => {
        set({ loading: true, error: null });
        try {
          const response = await businessApi.approve(id, payload);
          await get().refetchBusinessList();
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      rejectBusiness: async (id, reason) => {
        set({ loading: true, error: null });
        try {
          const response = await businessApi.reject(id, reason);
          await get().refetchBusinessList();
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      suspendBusiness: async (id, suspensionReason) => {
        set({ loading: true, error: null });
        try {
          const response = await businessApi.suspend(id, suspensionReason);
          await get().refetchBusinessList();
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      reactivateBusiness: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await businessApi.reactivate(id);
          await get().refetchBusinessList();
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      terminateBusiness: async (id, terminationReason) => {
        set({ loading: true, error: null });
        try {
          const response = await businessApi.terminate(id, terminationReason);
          await get().refetchBusinessList();
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
      reset: () =>
        set({
          business: null,
          businesses: [],
          loading: false,
          error: null,
          dashboardStats: null,
          listQueryParams: {},
          summary: null,
        }),
    }),
    { name: "BusinessStore" },
  ),
);

export default useBusinessStore;
