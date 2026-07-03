import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { useApiQuery } from "./useApiQuery";
import { useApiMutation, invalidateQueries } from "./useApiMutation";
import * as categoryService from "@/apis/categoryService";

/**
 * Fetch all categories (flat list).
 */
export function useCategories(params = {}) {
  return useApiQuery(queryKeys.categories.list(), () =>
    categoryService.getAllCategories(params),
    { placeholderData: (prev) => prev }
  );
}

/**
 * Fetch category tree.
 */
export function useCategoryTree(parentId = null, maxLevel = 3, includeInactive = false) {
  return useApiQuery(
    [...queryKeys.categories.tree(), { parentId, maxLevel, includeInactive }],
    () => categoryService.getCategoryTree(parentId, maxLevel, includeInactive),
    { staleTime: 10 * 60 * 1000 } // tree changes infrequently
  );
}

/**
 * Fetch single category by ID.
 */
export function useCategoryDetail(id) {
  return useApiQuery(
    queryKeys.categories.detail(id),
    () => categoryService.getCategoryById(id),
    { enabled: !!id }
  );
}

/**
 * Create category mutation.
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useApiMutation((data) => categoryService.createCategory(data), {
    onSuccess: () => {
      invalidateQueries(queryClient, [
        queryKeys.categories.all(),
      ]);
    },
  });
}

/**
 * Update category mutation.
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ id, data }) => categoryService.updateCategory(id, data),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [
          queryKeys.categories.all(),
        ]);
      },
    }
  );
}

/**
 * Delete category mutation.
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useApiMutation((id) => categoryService.deleteCategory(id), {
    onSuccess: () => {
      invalidateQueries(queryClient, [
        queryKeys.categories.all(),
      ]);
    },
  });
}

/**
 * Assign tags to category mutation.
 */
export function useAssignTagsToCategory() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ categoryId, tagIds, defaultTagIds }) =>
      categoryService.assignTagsToCategory(categoryId, tagIds, defaultTagIds),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [queryKeys.categories.all()]);
      },
    }
  );
}
