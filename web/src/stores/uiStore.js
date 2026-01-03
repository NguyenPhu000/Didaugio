import { create } from "zustand";
import { devtools } from "zustand/middleware";

/**
 * UI STATE STORE
 * Quản lý UI state riêng biệt khỏi data state
 */
const useUIStore = create(
  devtools(
    (set, get) => ({
      // Expanded categories (Array of IDs) - using Array for proper reactivity
      expandedCategories: [],

      // Toggle category expansion
      // mode: 'single' = chỉ 1 card expand tại 1 thời điểm
      // mode: 'multiple' = cho phép nhiều cards expand
      toggleCategoryExpansion: (categoryId, mode = "multiple") => {
        set((state) => {
          let newExpanded = [...state.expandedCategories];

          if (newExpanded.includes(categoryId)) {
            // Collapse this category
            newExpanded = newExpanded.filter((id) => id !== categoryId);
            console.log(
              `🔽 Collapsed category ${categoryId}. Total expanded:`,
              newExpanded.length
            );
          } else {
            // Expand this category
            if (mode === "single") {
              // Single mode: collapse all others first
              newExpanded = [];
            }
            newExpanded.push(categoryId);
            console.log(
              `🔼 Expanded category ${categoryId}. Total expanded:`,
              newExpanded.length
            );
          }

          console.log("📋 All expanded IDs:", newExpanded);
          return { expandedCategories: newExpanded };
        });
      },

      // Check if category is expanded
      isCategoryExpanded: (categoryId) => {
        return get().expandedCategories.includes(categoryId);
      },

      // Collapse all
      collapseAll: () => {
        set({ expandedCategories: [] });
      },
    }),
    {
      name: "ui-store",
    }
  )
);

export default useUIStore;
