import { create } from "zustand";
import { devtools } from "zustand/middleware";

/**
 * CATEGORY STORE
 * Client-side state only. Data fetching moved to useCategoryQueries hooks.
 */
const useCategoryStore = create(
  devtools(
    (set) => ({
      // Client-side state
      selectedCategory: null,

      // Actions
      setSelectedCategory: (category) => {
        set({ selectedCategory: category });
      },

      clearSelectedCategory: () => {
        set({ selectedCategory: null });
      },
    }),
    { name: "CategoryStore" }
  )
);

export default useCategoryStore;
