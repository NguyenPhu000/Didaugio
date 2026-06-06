import { create } from "zustand";
import { devtools } from "zustand/middleware";

/**
 * BUSINESS STORE
 * Client-side state only. Data fetching moved to useBusinessQueries hooks.
 */
const useBusinessStore = create(
  devtools(
    (set) => ({
      // No client-side state needed — all data comes from TanStack Query hooks.
      // Store kept for backward compatibility; can be removed once all consumers are migrated.
    }),
    { name: "BusinessStore" }
  )
);

export default useBusinessStore;
