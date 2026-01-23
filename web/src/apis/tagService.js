import api from "@/constants/api";

/**
 * TAG SERVICE
 * API client cho quản lý tags
 */

const BASE_URL = "/tags";

// Get all tags
export const getAllTags = async (params = {}) => {
  const response = await api.get(BASE_URL, { params });
  return response.data;
};

// Get popular tags
export const getPopularTags = async (limit = 20, tagType = null) => {
  const response = await api.get(`${BASE_URL}/popular`, {
    params: { limit, tagType },
  });
  return response.data;
};

// Get suggested tags by category
export const getSuggestedTagsByCategory = async (categoryId) => {
  const response = await api.get(`${BASE_URL}/suggest/${categoryId}`);
  return response.data;
};

// Get tag by ID
export const getTagById = async (id) => {
  const response = await api.get(`${BASE_URL}/${id}`);
  return response.data;
};

// Get tag by slug
export const getTagBySlug = async (slug) => {
  const response = await api.get(`${BASE_URL}/slug/${slug}`);
  return response.data;
};

// Create tag (Admin)
export const createTag = async (data) => {
  const response = await api.post(BASE_URL, data);
  return response.data;
};

// Bulk create tags (Admin)
export const bulkCreateTags = async (tags) => {
  const response = await api.post(`${BASE_URL}/bulk`, { tags });
  return response.data;
};

// Update tag (Admin)
export const updateTag = async (id, data) => {
  const response = await api.put(`${BASE_URL}/${id}`, data);
  return response.data;
};

// Delete tag (Admin)
export const deleteTag = async (id) => {
  const response = await api.delete(`${BASE_URL}/${id}`);
  return response.data;
};

// Recalculate usage count (Admin)
export const recalculateUsageCount = async (id) => {
  const response = await api.post(`${BASE_URL}/${id}/recalculate`);
  return response.data;
};

export default {
  getAllTags,
  getPopularTags,
  getSuggestedTagsByCategory,
  getTagById,
  getTagBySlug,
  createTag,
  bulkCreateTags,
  updateTag,
  deleteTag,
  recalculateUsageCount,
};
