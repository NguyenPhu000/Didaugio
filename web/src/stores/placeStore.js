import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { API_BASE_URL } from "@/constants/constants";

/**
 * PLACE STORE
 * Wizard state only. Data fetching moved to usePlaceQueries hooks.
 */
const usePlaceStore = create(
  devtools(
    (set) => ({
      // Wizard state for creating/editing place
      wizardData: {
        // Step 1: Basic Info
        name: "",
        slug: "",
        categoryId: null,
        districtId: null,
        wardId: null,
        address: "",
        shortDescription: "",

        // Step 2: Details
        description: "",
        latitude: null,
        longitude: null,
        phone: "",
        email: "",
        website: "",
        facebook: "",
        images: [],

        // Step 3: Tags & Pricing
        tagIds: [],
        priceRange: null,
        priceFrom: null,
        priceTo: null,
        openingHours: [],
        amenities: [],
      },

      currentStep: 1,
      totalSteps: 3,

      // Lookup location for wizard
      lookupLocation: async (latitude, longitude) => {
        try {
          const response = await fetch(`${API_BASE_URL}/districts/lookup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude, longitude }),
          });
          const data = await response.json();

          if (data.success && data.data) {
            set((state) => ({
              wizardData: {
                ...state.wizardData,
                districtId: data.data.id,
                wardId: null,
              },
            }));
            return data.data;
          }
          return null;
        } catch (error) {
          console.error("Lookup failed", error);
          return null;
        }
      },

      // Wizard actions
      updateWizardData: (data) => {
        set((state) => ({
          wizardData: { ...state.wizardData, ...data },
        }));
      },

      setCurrentStep: (step) => {
        set({ currentStep: step });
      },

      nextStep: () => {
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, state.totalSteps),
        }));
      },

      prevStep: () => {
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 1),
        }));
      },

      resetWizard: () => {
        set({
          wizardData: {
            name: "",
            slug: "",
            categoryId: null,
            districtId: null,
            wardId: null,
            address: "",
            shortDescription: "",
            description: "",
            latitude: null,
            longitude: null,
            phone: "",
            email: "",
            website: "",
            facebook: "",
            images: [],
            tagIds: [],
            priceRange: null,
            priceFrom: null,
            priceTo: null,
            openingHours: [],
            amenities: [],
          },
          currentStep: 1,
        });
      },

      loadPlaceIntoWizard: (place) => {
        set({
          wizardData: {
            id: place.id,
            name: place.name || "",
            slug: place.slug || "",
            categoryId: place.categoryId || null,
            districtId: place.districtId || null,
            wardId: place.wardId || null,
            address: place.address || "",
            shortDescription: place.shortDescription || "",
            description: place.description || "",
            latitude: place.latitude || null,
            longitude: place.longitude || null,
            phone: place.phone || "",
            email: place.email || "",
            website: place.website || "",
            facebook: place.facebook || "",
            images: place.images || [],
            ...(() => {
              let resolvedTagIds = [];
              if (place.tags) {
                resolvedTagIds = place.tags.map((t) => t.id);
              } else if (place.tagLinks) {
                resolvedTagIds = place.tagLinks
                  .map((l) => l.tagId || l.tag?.id)
                  .filter(Boolean);
              }
              return { tagIds: resolvedTagIds };
            })(),
            priceRange: place.priceRange || null,
            priceFrom: place.priceFrom || null,
            priceTo: place.priceTo || null,
            openingHours: place.openingHours || [],
            amenities: place.amenities || [],
          },
          currentStep: 1,
        });
      },
    }),
    { name: "PlaceStore" }
  )
);

export default usePlaceStore;
