import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const LOCATION_STORAGE_KEY = "active-administrative-location-v2";

export const normalizeActiveLocation = (value = {}) => ({
  provinceCode:
    typeof value.provinceCode === "string" && value.provinceCode.trim()
      ? value.provinceCode.trim()
      : null,
  datasetReleaseId:
    Number.isInteger(Number(value.datasetReleaseId)) && Number(value.datasetReleaseId) > 0
      ? Number(value.datasetReleaseId)
      : null,
});

export const useLocationStore = create(
  persist(
    (set) => ({
      ...normalizeActiveLocation(),
      setActiveProvince: (value) => set(normalizeActiveLocation(value)),
      clearActiveProvince: () => set(normalizeActiveLocation()),
    }),
    {
      name: LOCATION_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ provinceCode, datasetReleaseId }) => ({ provinceCode, datasetReleaseId }),
    },
  ),
);
