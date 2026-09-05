import * as tagService from "../../services/tag/tag.service.js";
import { ERROR_CODES } from "../../config/messages.js";
import { setPublicListCache } from "../../utils/httpCacheHeaders.js";
import {
  get as cacheGet,
  set as cacheSet,
  flushPattern,
  TTL,
} from "../../services/cache/cache.service.js";

/**
 * TAG CONTROLLER
 * REST API cho quản lý tags
 */

// GET /api/tags - Lấy danh sách tags
export const getTags = async (req, res, next) => {
  try {
    const cacheKey = "tags:list";
    const cached = await cacheGet(cacheKey);
    if (cached) {
      setPublicListCache(res, req);
      return res.json(cached);
    }

    const { tagType, isActive, search, sortBy } = req.query;

    const tags = await tagService.getAllTags({
      tagType,
      isActive,
      search,
      sortBy,
    });

    const body = {
      success: true,
      data: tags,
      total: tags.length,
      message: "Lấy danh sách tag thành công",
    };
    await cacheSet(cacheKey, body, TTL.STATIC);
    setPublicListCache(res, req);
    res.json(body);
  } catch (error) {
    next(error);
  }
};

// GET /api/tags/popular - Lấy popular tags
export const getPopularTags = async (req, res, next) => {
  try {
    const cacheKey = "tags:popular";
    const cached = await cacheGet(cacheKey);
    if (cached) {
      setPublicListCache(res, req);
      return res.json(cached);
    }

    const { limit = 20, tagType } = req.query;

    const tags = await tagService.getPopularTags(limit, tagType);

    const body = {
      success: true,
      data: tags,
      message: "Lấy danh sách tag phổ biến thành công",
    };
    await cacheSet(cacheKey, body, TTL.STATIC);
    setPublicListCache(res, req);
    res.json(body);
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
    const { name, slug, tagGroupId, icon, color } = req.body;

    const tag = await tagService.createTag({
      name,
      slug,
      tagGroupId,
      icon,
      color,
    });

    await flushPattern("tags:");

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

    await flushPattern("tags:");

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
    const { name, slug, tagGroupId, icon, color, isActive } = req.body;

    const tag = await tagService.updateTag(id, {
      name,
      slug,
      tagGroupId,
      icon,
      color,
      isActive,
    });

    await flushPattern("tags:");

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

    await flushPattern("tags:");

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
