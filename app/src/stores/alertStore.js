import { create } from "zustand";

export const useAlertStore = create((set) => ({
  visible: false,
  title: "",
  message: "",
  type: "info", // info | success | warning | error | confirm
  buttons: [],
  options: {},

  showAlert: (config) =>
    set({
      visible: true,
      title: config.title || "",
      message: config.message || "",
      type: config.type || "info",
      buttons: config.buttons || [],
      options: config.options || {},
    }),

  hideAlert: () => set({ visible: false }),
}));
