import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { useApiQuery } from "./useApiQuery";
import { useApiMutation, invalidateQueries } from "./useApiMutation";
import * as tagService from "@/apis/tagService";

/**
 * Fetch all tags.
 */
export function useTags(params = {}) {
  return useApiQuery(queryKeys.tags.list(), () =>
    tagService.getAllTags(params)
  );
}

export function useTagGroups() {
  return useApiQuery(queryKeys.tags.groups(), () => tagService.getAllTagGroups());
}

export function useCreateTagGroup() {
  const queryClient = useQueryClient();
  return useApiMutation((data) => tagService.createTagGroup(data), {
    onSuccess: () => {
      invalidateQueries(queryClient, [queryKeys.tags.groups()]);
    },
  });
}

/**
 * Fetch popular tags.
 */
export function usePopularTags(limit = 20, tagType = null) {
  return useApiQuery(
    queryKeys.tags.popular(),
    () => tagService.getPopularTags(limit, tagType),
    { staleTime: 10 * 60 * 1000 }
  );
}

/**
 * Fetch single tag by ID.
 */
export function useTagDetail(id) {
  return useApiQuery(
    queryKeys.tags.detail(id),
    () => tagService.getTagById(id),
    { enabled: !!id }
  );
}

/**
 * Create tag mutation.
 */
export function useCreateTag() {
  const queryClient = useQueryClient();
  return useApiMutation((data) => tagService.createTag(data), {
    onSuccess: () => {
      invalidateQueries(queryClient, [queryKeys.tags.all()]);
    },
  });
}

/**
 * Bulk create tags mutation.
 */
export function useBulkCreateTags() {
  const queryClient = useQueryClient();
  return useApiMutation((tags) => tagService.bulkCreateTags(tags), {
    onSuccess: () => {
      invalidateQueries(queryClient, [queryKeys.tags.all()]);
    },
  });
}

/**
 * Update tag mutation.
 */
export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ id, data }) => tagService.updateTag(id, data),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [queryKeys.tags.all()]);
      },
    }
  );
}

/**
 * Delete tag mutation.
 */
export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useApiMutation((id) => tagService.deleteTag(id), {
    onSuccess: () => {
      invalidateQueries(queryClient, [queryKeys.tags.all()]);
    },
  });
}
