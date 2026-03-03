import api from "@/constants/api";

/**
 * PLACE SERVICE
 * API client cho quản lý địa điểm
 */

const BASE_URL = "/places";

// Get all places with filters
export const getAllPlaces = async (params = {}) => {
  // Sanitize params - remove empty strings and falsy values
  const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
    // Only include if value is truthy and not an empty string
    if (value !== "" && value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

  const response = await api.get(BASE_URL, { params: cleanParams });
  return response;
};

// Get place by ID
export const getPlaceById = async (id, incrementView = false) => {
  const response = await api.get(`${BASE_URL}/${id}`, {
    params: { view: incrementView },
  });
  return response.data;
};

// Get place by slug
export const getPlaceBySlug = async (slug, incrementView = false) => {
  const response = await api.get(`${BASE_URL}/slug/${slug}`, {
    params: { view: incrementView },
  });
  return response.data;
};

// Check if slug exists
export const checkSlugExists = async (slug, excludeId = null) => {
  const response = await api.get(`${BASE_URL}/check-slug/${slug}`, {
    params: { excludeId },
  });
  return response.data;
};

// Create new place
export const createPlace = async (data) => {
  const response = await api.post(BASE_URL, data);
  return response.data;
};

// Update place
export const updatePlace = async (id, data) => {
  const response = await api.put(`${BASE_URL}/${id}`, data);
  return response.data;
};

// Delete place
export const deletePlace = async (id) => {
  const response = await api.delete(`${BASE_URL}/${id}`);
  return response.data;
};

// Update place status
export const updatePlaceStatus = async (id, status) => {
  const response = await api.put(`${BASE_URL}/${id}/status`, { status });
  return response;
};

// Approve place (moderation)
export const approvePlace = async (id) => {
  const response = await api.put(`${BASE_URL}/${id}/approve`);
  return response;
};

// Reject place (moderation)
export const rejectPlace = async (id, reason) => {
  const response = await api.put(`${BASE_URL}/${id}/reject`, { reason });
  return response;
};

// Feature/Unfeature place (Admin)
export const toggleFeature = async (id) => {
  const response = await api.put(`${BASE_URL}/${id}/feature`);
  return response;
};

// Verify/Unverify place (Admin)
export const toggleVerify = async (id) => {
  const response = await api.put(`${BASE_URL}/${id}/verify`);
  return response;
};

// Get nearby places
export const getNearbyPlaces = async (
  latitude,
  longitude,
  radius = 5,
  limit = 10,
) => {
  const response = await api.get(`${BASE_URL}/nearby`, {
    params: { latitude, longitude, radius, limit },
  });
  return response.data;
};

// Get featured places
export const getFeaturedPlaces = async (limit = 10, categoryId = null) => {
  const response = await api.get(`${BASE_URL}/featured`, {
    params: { limit, categoryId },
  });
  return response.data;
};

// Get place statistics
export const getPlaceStats = async (id) => {
  const response = await api.get(`${BASE_URL}/${id}/stats`);
  return response.data;
};

// Manage place tags
export const assignTagsToPlace = async (id, tagIds) => {
  const response = await api.post(`${BASE_URL}/${id}/tags`, { tagIds });
  return response.data;
};

export const removeTagFromPlace = async (id, tagId) => {
  const response = await api.delete(`${BASE_URL}/${id}/tags/${tagId}`);
  return response.data;
};

// Manage place images
export const addPlaceImages = async (id, images) => {
  const response = await api.post(`${BASE_URL}/${id}/images`, { images });
  return response.data;
};

export const updatePlaceImage = async (placeId, imageId, data) => {
  const response = await api.put(
    `${BASE_URL}/${placeId}/images/${imageId}`,
    data,
  );
  return response.data;
};

export const deletePlaceImage = async (placeId, imageId) => {
  const response = await api.delete(`${BASE_URL}/${placeId}/images/${imageId}`);
  return response.data;
};

// Update opening hours
export const updateOpeningHours = async (id, openingHours) => {
  const response = await api.put(`${BASE_URL}/${id}/opening-hours`, {
    openingHours,
  });
  return response.data;
};

// Update amenities
export const updateAmenities = async (id, amenities) => {
  const response = await api.put(`${BASE_URL}/${id}/amenities`, { amenities });
  return response.data;
};

export default {
  getAllPlaces,
  getPlaceById,
  getPlaceBySlug,
  checkSlugExists,
  createPlace,
  updatePlace,
  deletePlace,
  updatePlaceStatus,
  approvePlace,
  rejectPlace,
  toggleFeature,
  toggleVerify,
  getNearbyPlaces,
  getFeaturedPlaces,
  getPlaceStats,
  assignTagsToPlace,
  removeTagFromPlace,
  addPlaceImages,
  updatePlaceImage,
  deletePlaceImage,
  updateOpeningHours,
  updateAmenities,
};
