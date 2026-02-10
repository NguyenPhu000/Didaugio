import { create } from "zustand";
import { devtools } from "zustand/middleware";
import * as tagService from "@/apis/tagService";

/**
 * TAG STORE
 * State management cho tags
 */

const useTagStore = create(
  devtools(
    (set, get) => ({
      // State
      tags: [],
      popularTags: [],
      selectedTag: null,
      loading: false,
      error: null,

      // Actions
      fetchTags: async (params = {}) => {
        set({ loading: true, error: null });
        try {
          const response = await tagService.getAllTags(params);
          const data = response.data || response;
          set({ tags: data, loading: false });
          return data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchPopularTags: async (limit = 20, tagType = null) => {
        set({ loading: true, error: null });
        try {
          const response = await tagService.getPopularTags(limit, tagType);
          const data = response.data || response;
          set({ popularTags: data, loading: false });
          return data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchTagById: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await tagService.getTagById(id);
          const data = response.data || response;
          set({ selectedTag: data, loading: false });
          return data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      createTag: async (data) => {
        set({ loading: true, error: null });
        try {
          const response = await tagService.createTag(data);

          // Refresh tags
          await get().fetchTags();

          set({ loading: false });
          const result = response.data || response;
          return result;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      bulkCreateTags: async (tags) => {
        set({ loading: true, error: null });
        try {
          const response = await tagService.bulkCreateTags(tags);

          // Refresh tags
          await get().fetchTags();

          set({ loading: false });
          const result = response.data || response;
          return result;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateTag: async (id, data) => {
        set({ loading: true, error: null });
        try {
          const response = await tagService.updateTag(id, data);

          // Refresh tags
          await get().fetchTags();

          set({ loading: false });
          const result = response.data || response;
          return result;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteTag: async (id) => {
        set({ loading: true, error: null });
        try {
          await tagService.deleteTag(id);

          // Refresh tags
          await get().fetchTags();

          set({ loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      setSelectedTag: (tag) => {
        set({ selectedTag: tag });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          tags: [],
          popularTags: [],
          selectedTag: null,
          loading: false,
          error: null,
        });
      },
    }),
    { name: "TagStore" }
  )
);

export default useTagStore;
