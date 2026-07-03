import { create } from "zustand";
import { devtools } from "zustand/middleware";

/**
 * TAG STORE
 * Client-side state only. Data fetching moved to useTagQueries hooks.
 */
const useTagStore = create(
  devtools(
    (set) => ({
      // Client-side state
      selectedTag: null,

      // Actions
      setSelectedTag: (tag) => {
        set({ selectedTag: tag });
      },

      clearSelectedTag: () => {
        set({ selectedTag: null });
      },
    }),
    { name: "TagStore" }
  )
);

export default useTagStore;
