import { create } from "zustand";
import { DEFAULT_LOCATION } from "../constants/location";

export const useMapStore = create((set) => ({
  camera: {
    center: {
      latitude: DEFAULT_LOCATION.latitude,
      longitude: DEFAULT_LOCATION.longitude,
    },
    zoom: 12,
  },
  selectedMarkerId: null,
  activeRoute: null,
  isNavigating: false,

  setCamera: (cam) => set({ camera: cam }),
  selectMarker: (id) => set({ selectedMarkerId: id }),
  clearMarker: () => set({ selectedMarkerId: null }),
  setRoute: (route) => set({ activeRoute: route }),
  startNavigation: () => set({ isNavigating: true }),
  stopNavigation: () => set({ isNavigating: false, activeRoute: null }),
}));
