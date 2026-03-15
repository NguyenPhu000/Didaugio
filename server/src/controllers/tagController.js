import * as tagService from "../services/tagService.js";
import { ERROR_CODES } from "../config/messages.js";

/**
 * TAG CONTROLLER
 * REST API cho quản lý tags
 */

// GET /api/tags - Lấy danh sách tags
export const getTags = async (req, res, next) => {
  try {
    const { tagType, isActive, search, sortBy } = req.query;

    const tags = await tagService.getAllTags({
      tagType,
      isActive,
      search,
      sortBy,
    });

    res.json({
      success: true,
      data: tags,
      total: tags.length,
      message: "Lấy danh sách tag thành công",
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tags/popular - Lấy popular tags
export const getPopularTags = async (req, res, next) => {
  try {
    const { limit = 20, tagType } = req.query;

    const tags = await tagService.getPopularTags(limit, tagType);

    res.json({
      success: true,
      data: tags,
      message: "Lấy danh sách tag phổ biến thành công",
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tags/suggest/:categoryId - Lấy suggested tags theo category
export const getSuggestedTagsByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    const tags = await tagService.getSuggestedTagsByCategory(categoryId);

    res.json({
      success: true,
      data: tags,
      message: "Lấy tag gợi ý theo danh mục thành công",
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tags/:id - Lấy tag theo ID
export const getTagById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tag = await tagService.getTagById(id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Tag not found",
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    res.json({
      success: true,
      data: tag,
      message: "Lấy chi tiết tag thành công",
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tags/slug/:slug - Lấy tag theo slug
export const getTagBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const tag = await tagService.getTagBySlug(slug);

    if (!tag) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Tag not found",
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    res.json({
      success: true,
      data: tag,
      message: "Lấy tag theo slug thành công",
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/tags - Tạo tag mới
export const createTag = async (req, res, next) => {
  try {
    const { name, slug, tagType, icon, color } = req.body;

    const tag = await tagService.createTag({
      name,
      slug,
      tagType,
      icon,
      color,
    });

    res.status(201).json({
      success: true,
      message: "Tag created successfully",
      data: tag,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/tags/bulk - Tạo nhiều tags cùng lúc
export const bulkCreateTags = async (req, res, next) => {
  try {
    const { tags } = req.body;

    const created = await tagService.bulkCreateTags(tags);

    res.status(201).json({
      success: true,
      message: `${created.length} tags created successfully`,
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/tags/:id - Update tag
export const updateTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, tagType, icon, color, isActive } = req.body;

    const tag = await tagService.updateTag(id, {
      name,
      slug,
      tagType,
      icon,
      color,
      isActive,
    });

    res.json({
      success: true,
      message: "Tag updated successfully",
      data: tag,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tags/:id - Xóa tag
export const deleteTag = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await tagService.deleteTag(id);

    res.json({
      success: true,
      data: null,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/tags/:id/recalculate - Sync lại usage count
export const recalculateUsageCount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tag = await tagService.recalculateUsageCount(id);

    res.json({
      success: true,
      message: "Usage count recalculated",
      data: tag,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getTags,
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
