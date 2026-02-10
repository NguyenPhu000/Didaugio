import { create } from "zustand";
import { MAP_DEFAULTS } from "../../constants/map";

export const useMapStore = create((set) => ({
  region: MAP_DEFAULTS.CAN_THO_REGION,
  selectedCategory: null,
  selectedPlaceId: null,
  searchQuery: "",
  
  setRegion: (region) => set({ region }),
  setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),
  setSelectedPlaceId: (placeId) => set({ selectedPlaceId: placeId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  resetFilters: () => set({ selectedCategory: null, searchQuery: "" }),
}));
