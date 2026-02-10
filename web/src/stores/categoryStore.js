import { create } from "zustand";
import { devtools } from "zustand/middleware";
import * as categoryService from "@/apis/categoryService";

/**
 * CATEGORY STORE
 * State management cho categories
 */

const useCategoryStore = create(
  devtools(
    (set, get) => ({
      // State
      categories: [],
      categoryTree: [],
      selectedCategory: null,
      loading: false,
      error: null,

      // Actions
      fetchCategories: async (params = {}) => {
        set({ loading: true, error: null });
        try {
          const response = await categoryService.getAllCategories(params);
          const data = response.data || response; // Support both formats
          set({ categories: data, loading: false });
          return data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchCategoryTree: async (parentId = null, maxLevel = 3) => {
        set({ loading: true, error: null });
        try {
          const response = await categoryService.getCategoryTree(
            parentId,
            maxLevel
          );
          const data = response.data || response; // Support both formats
          set({ categoryTree: data, loading: false });
          return data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchCategoryById: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await categoryService.getCategoryById(id);
          const data = response.data || response;
          set({ selectedCategory: data, loading: false });
          return data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      createCategory: async (data) => {
        set({ loading: true, error: null });
        try {
          const response = await categoryService.createCategory(data);

          // Refresh categories
          await get().fetchCategories();
          await get().fetchCategoryTree();

          set({ loading: false });
          const result = response.data || response;
          return result;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateCategory: async (id, data) => {
        set({ loading: true, error: null });
        try {
          const response = await categoryService.updateCategory(id, data);

          // Refresh categories
          await get().fetchCategories();
          await get().fetchCategoryTree();

          set({ loading: false });
          const result = response.data || response;
          return result;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteCategory: async (id) => {
        set({ loading: true, error: null });
        try {
          await categoryService.deleteCategory(id);

          // Refresh categories
          await get().fetchCategories();
          await get().fetchCategoryTree();

          set({ loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      assignTags: async (categoryId, tagIds, defaultTagIds = []) => {
        set({ loading: true, error: null });
        try {
          const response = await categoryService.assignTagsToCategory(
            categoryId,
            tagIds,
            defaultTagIds
          );
          set({ loading: false });
          return response.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      setSelectedCategory: (category) => {
        set({ selectedCategory: category });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          categories: [],
          categoryTree: [],
          selectedCategory: null,
          loading: false,
          error: null,
        });
      },
    }),
    { name: "CategoryStore" }
  )
);

export default useCategoryStore;
