import { create } from "zustand";
import { devtools } from "zustand/middleware";
import * as placeService from "@/services/placeService";

/**
 * PLACE STORE
 * State management cho places
 */

const usePlaceStore = create(
  devtools(
    (set, get) => ({
      // State
      places: [],
      selectedPlace: null,
      featuredPlaces: [],
      nearbyPlaces: [],
      loading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },

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
        amenities: {},

        // Meta
        status: "draft",
      },

      currentStep: 1,
      totalSteps: 3,

      // Actions
      fetchPlaces: async (params = {}) => {
        set({ loading: true, error: null });
        try {
          const response = await placeService.getAllPlaces(params);
          set({
            places: response.data || [],
            pagination: response.pagination || get().pagination,
            loading: false,
          });
          return response.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchPlaceById: async (id, incrementView = false) => {
        set({ loading: true, error: null });
        try {
          const response = await placeService.getPlaceById(id, incrementView);
          const data = response.data || response;
          set({ selectedPlace: data, loading: false });
          return data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchPlaceBySlug: async (slug, incrementView = false) => {
        set({ loading: true, error: null });
        try {
          const response = await placeService.getPlaceBySlug(
            slug,
            incrementView
          );
          const data = response.data || response;
          set({ selectedPlace: data, loading: false });
          return data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      checkSlugExists: async (slug, excludeId = null) => {
        try {
          const response = await placeService.checkSlugExists(slug, excludeId);
          return response.data?.exists || false;
        } catch (error) {
          return false;
        }
      },

      fetchFeaturedPlaces: async (limit = 10, categoryId = null) => {
        set({ loading: true, error: null });
        try {
          const response = await placeService.getFeaturedPlaces(
            limit,
            categoryId
          );
          const data = response.data || response;
          set({ featuredPlaces: data, loading: false });
          return data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchNearbyPlaces: async (
        latitude,
        longitude,
        radius = 5,
        limit = 10
      ) => {
        set({ loading: true, error: null });
        try {
          const response = await placeService.getNearbyPlaces(
            latitude,
            longitude,
            radius,
            limit
          );
          const data = response.data || response;
          set({ nearbyPlaces: data, loading: false });
          return data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      createPlace: async (data) => {
        set({ loading: true, error: null });
        try {
          const response = await placeService.createPlace(data);
          const newPlace = response.data || response;

          // Refresh places list
          await get().fetchPlaces();

          set({ loading: false });
          return newPlace;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updatePlace: async (id, data) => {
        set({ loading: true, error: null });
        try {
          const response = await placeService.updatePlace(id, data);
          const updatedPlace = response.data || response;

          // Refresh places list
          await get().fetchPlaces();

          set({ loading: false });
          return updatedPlace;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deletePlace: async (id) => {
        set({ loading: true, error: null });
        try {
          await placeService.deletePlace(id);

          // Refresh places list
          await get().fetchPlaces();

          set({ loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updatePlaceStatus: async (id, status) => {
        set({ loading: true, error: null });
        try {
          const response = await placeService.updatePlaceStatus(id, status);
          await get().fetchPlaces();
          set({ loading: false });
          return response.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      toggleFeature: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await placeService.toggleFeature(id);
          await get().fetchPlaces();
          set({ loading: false });
          return response.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      toggleVerify: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await placeService.toggleVerify(id);
          await get().fetchPlaces();
          set({ loading: false });
          return response.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
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
            amenities: {},
            status: "draft",
          },
          currentStep: 1,
        });
      },

      loadPlaceIntoWizard: (place) => {
        set({
          wizardData: {
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
            tagIds: place.tags?.map((t) => t.id) || [],
            priceRange: place.priceRange || null,
            priceFrom: place.priceFrom || null,
            priceTo: place.priceTo || null,
            openingHours: place.openingHours || [],
            amenities: place.amenities || {},
            status: place.status || "draft",
          },
          currentStep: 1,
        });
      },

      setSelectedPlace: (place) => {
        set({ selectedPlace: place });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          places: [],
          selectedPlace: null,
          featuredPlaces: [],
          nearbyPlaces: [],
          loading: false,
          error: null,
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        });
      },
    }),
    { name: "PlaceStore" }
  )
);

export default usePlaceStore;
