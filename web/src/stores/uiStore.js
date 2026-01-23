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
      // mode: 'single' = chỉ 1 card expand tại 1 thời điểm (only at root level)
      // mode: 'multiple' = cho phép nhiều cards expand (for nested children)
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
            // Note: 'single' mode is ONLY applied at root level cards
            // It does NOT affect nested children expansion
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
