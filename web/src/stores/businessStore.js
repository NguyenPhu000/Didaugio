import { create } from "zustand";
import { devtools } from "zustand/middleware";
import * as businessService from "@/apis/businessService";

const useBusinessStore = create(
  devtools(
    (set, get) => ({
      business: null,
      businesses: [],
      loading: false,
      error: null,
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      dashboardStats: null,

      fetchProfile: async () => {
        set({ loading: true, error: null });
        try {
          const response = await businessService.getProfile();
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
          const response = await businessService.register(data);
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
          const response = await businessService.updateProfile(data);
          set({ business: response.data, loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchDashboard: async () => {
        try {
          const response = await businessService.getDashboard();
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
          const response = await businessService.getAll(params);
          set({
            businesses: response.data || [],
            pagination: response.pagination || get().pagination,
            loading: false,
          });
          return response.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      approveBusiness: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await businessService.approve(id);
          await get().fetchAll();
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
          const response = await businessService.reject(id, reason);
          await get().fetchAll();
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
        }),
    }),
    { name: "BusinessStore" },
  ),
);

export default useBusinessStore;
