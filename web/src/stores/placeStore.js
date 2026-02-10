import { create } from "zustand";
import { devtools } from "zustand/middleware";
import * as placeService from "@/apis/placeService";
import { PAGINATION, API_BASE_URL } from "@/constants/constants";

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
        page: PAGINATION.DEFAULT_PAGE,
        limit: PAGINATION.DEFAULT_LIMIT,
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
        amenities: [],

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
            incrementView,
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
            categoryId,
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
        limit = 10,
      ) => {
        set({ loading: true, error: null });
        try {
          const response = await placeService.getNearbyPlaces(
            latitude,
            longitude,
            radius,
            limit,
          );
          const data = response.data || response;
          set({ nearbyPlaces: data, loading: false });
          return data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

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

      createPlace: async (data) => {
        set({ loading: true, error: null });
        try {
          // Sanitize numeric fields to ensure they are numbers (not strings)
          const payload = {
            ...data,
            categoryId: data.categoryId ? parseInt(data.categoryId) : undefined,
            districtId: data.districtId ? parseInt(data.districtId) : undefined,
            wardId: data.wardId ? parseInt(data.wardId) : null,
            latitude: data.latitude ? parseFloat(data.latitude) : undefined,
            longitude: data.longitude ? parseFloat(data.longitude) : undefined,
            priceFrom: data.priceFrom ? parseInt(data.priceFrom) : null,
            priceTo: data.priceTo ? parseInt(data.priceTo) : null,
            // Ensure businessId is number if exists
            businessId: data.businessId ? parseInt(data.businessId) : undefined,
            // Sanitize optional string fields - empty strings should be null/undefined
            website: data.website?.trim() || undefined,
            email: data.email?.trim() || undefined,
            facebook: data.facebook?.trim() || undefined,
            phone: data.phone?.trim() || undefined,
            // Sanitize priceRange - null/empty should be undefined to satisfy optional validation
            priceRange: data.priceRange || undefined,
            // Remove status, handle in backend
          };

          const response = await placeService.createPlace(payload);
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
          // Sanitize numeric fields
          const payload = {
            ...data,
          };

          if (data.categoryId !== undefined)
            payload.categoryId = parseInt(data.categoryId);
          // ... rest same logic

          if (data.districtId !== undefined)
            payload.districtId = parseInt(data.districtId);
          if (data.wardId !== undefined)
            payload.wardId = data.wardId ? parseInt(data.wardId) : null;
          if (data.latitude !== undefined)
            payload.latitude = parseFloat(data.latitude);
          if (data.longitude !== undefined)
            payload.longitude = parseFloat(data.longitude);
          if (data.priceFrom !== undefined)
            payload.priceFrom = data.priceFrom
              ? parseInt(data.priceFrom)
              : null;
          if (data.priceTo !== undefined)
            payload.priceTo = data.priceTo ? parseInt(data.priceTo) : null;

          // Sanitize optional string fields
          if (data.website !== undefined)
            payload.website = data.website?.trim() || undefined;
          if (data.email !== undefined)
            payload.email = data.email?.trim() || undefined;
          if (data.facebook !== undefined)
            payload.facebook = data.facebook?.trim() || undefined;
          if (data.phone !== undefined)
            payload.phone = data.phone?.trim() || undefined;
          if (data.priceRange !== undefined)
            payload.priceRange = data.priceRange || undefined;

          // Status can be updated via specific endpoint or here if allowed, but for create we remove it.
          // Keeping it here for Update if admin wants to changing it? User said "Remove status from Form create".
          // So updatePlace logic can remain for now.

          const response = await placeService.updatePlace(id, payload);
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
            amenities: [],
            // No status default here needed or default to null, backend handles it.
          },
          currentStep: 1,
        });
      },

      loadPlaceIntoWizard: (place) => {
        set({
          wizardData: {
            id: place.id, // Important: ID for updates
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
            tagIds: place.tags
              ? place.tags.map((t) => t.id)
              : place.tagLinks
                ? place.tagLinks
                    .map((l) => l.tagId || l.tag?.id)
                    .filter(Boolean)
                : [],
            priceRange: place.priceRange || null,
            priceFrom: place.priceFrom || null,
            priceTo: place.priceTo || null,
            openingHours: place.openingHours || [],
            amenities: place.amenities || [],
            // status: place.status || "draft", // Remove status from wizard
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
    { name: "PlaceStore" },
  ),
);

export default usePlaceStore;
