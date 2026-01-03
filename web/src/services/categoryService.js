import api from "@/config/api";

/**
 * CATEGORY SERVICE
 * API client cho quản lý danh mục
 */

const BASE_URL = "/categories";

// Get all categories (flat or tree)
export const getAllCategories = async (params = {}) => {
  const response = await api.get(BASE_URL, { params });
  return response.data;
};

// Get category tree
export const getCategoryTree = async (parentId = null, maxLevel = 3) => {
  const response = await api.get(`${BASE_URL}/tree`, {
    params: { parentId, maxLevel },
  });
  return response.data;
};

// Get category by ID
export const getCategoryById = async (id) => {
  const response = await api.get(`${BASE_URL}/${id}`);
  return response.data;
};

// Get category by slug
export const getCategoryBySlug = async (slug) => {
  const response = await api.get(`${BASE_URL}/slug/${slug}`);
  return response.data;
};

// Get category path (breadcrumb)
export const getCategoryPath = async (id) => {
  const response = await api.get(`${BASE_URL}/${id}/path`);
  return response.data;
};

// Get suggested tags for category
export const getSuggestedTags = async (id) => {
  const response = await api.get(`${BASE_URL}/${id}/suggested-tags`);
  return response.data;
};

// Create category (Admin)
export const createCategory = async (data) => {
  const response = await api.post(BASE_URL, data);
  return response.data;
};

// Update category (Admin)
export const updateCategory = async (id, data) => {
  const response = await api.put(`${BASE_URL}/${id}`, data);
  return response.data;
};

// Delete category (Admin)
export const deleteCategory = async (id) => {
  const response = await api.delete(`${BASE_URL}/${id}`);
  return response.data;
};

// Assign tags to category (Admin)
export const assignTagsToCategory = async (id, tagIds, defaultTagIds = []) => {
  const response = await api.post(`${BASE_URL}/${id}/tags`, {
    tagIds,
    defaultTagIds,
  });
  return response.data;
};

export default {
  getAllCategories,
  getCategoryTree,
  getCategoryById,
  getCategoryBySlug,
  getCategoryPath,
  getSuggestedTags,
  createCategory,
  updateCategory,
  deleteCategory,
  assignTagsToCategory,
};
