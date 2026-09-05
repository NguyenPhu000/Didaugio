import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useLocationStore = create(
  persist(
    (set) => ({
      provinceCode: null,
      datasetReleaseId: null,
      setActiveProvince: ({ provinceCode, datasetReleaseId }) =>
        set({ provinceCode: provinceCode || null, datasetReleaseId: datasetReleaseId || null }),
      clearActiveProvince: () => set({ provinceCode: null, datasetReleaseId: null }),
    }),
    {
      name: "active-administrative-location-v2",
      partialize: ({ provinceCode, datasetReleaseId }) => ({ provinceCode, datasetReleaseId }),
    },
  ),
);
