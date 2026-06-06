import * as categoryService from "../../services/category/category.service.js";
import { ERROR_CODES } from "../../config/messages.js";
import { setPublicListCache } from "../../utils/httpCacheHeaders.js";
import {
  get as cacheGet,
  set as cacheSet,
  flushPattern,
  TTL,
} from "../../services/cache/cache.service.js";

/**
 * CATEGORY CONTROLLER
 * REST API cho quản lý danh mục
 */

// GET /api/categories - Lấy danh sách categories
export const getCategories = async (req, res, next) => {
  try {
    const { parentId, level, isActive, search, format, includeInactive } = req.query;
    const isIncludeInactive = includeInactive === "true" || includeInactive === true;

    // Format: tree hoặc flat
    if (format === "tree") {
      const cacheKey = `categories:tree:${isIncludeInactive}`;
      const cached = cacheGet(cacheKey);
      if (cached) {
        setPublicListCache(res, req);
        return res.json(cached);
      }

      const tree = await categoryService.getCategoryTree(
        parentId || null,
        undefined,
        isIncludeInactive
      );
      const body = {
        success: true,
        data: tree,
        message: "Lấy cây danh mục thành công",
      };
      cacheSet(cacheKey, body, TTL.STATIC);
      setPublicListCache(res, req);
      return res.json(body);
    }

    // Flat list
    const cacheKey = "categories:list";
    const cached = cacheGet(cacheKey);
    if (cached) {
      setPublicListCache(res, req);
      return res.json(cached);
    }

    const categories = await categoryService.getAllCategories({
      parentId,
      level,
      isActive,
      search,
    });

    const body = {
      success: true,
      data: categories,
      total: categories.length,
      message: "Lấy danh sách danh mục thành công",
    };
    cacheSet(cacheKey, body, TTL.STATIC);
    setPublicListCache(res, req);
    res.json(body);
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/tree - Lấy category tree
export const getCategoryTree = async (req, res, next) => {
  try {
    const { parentId, maxLevel, includeInactive } = req.query;
    const isIncludeInactive = includeInactive === "true" || includeInactive === true;

    const cacheKey = `categories:tree:${isIncludeInactive}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      setPublicListCache(res, req);
      return res.json(cached);
    }

    const tree = await categoryService.getCategoryTree(
      parentId || null,
      maxLevel ? parseInt(maxLevel) : undefined,
      isIncludeInactive,
    );

    const body = {
      success: true,
      data: tree,
      message: "Lấy cây danh mục thành công",
    };
    cacheSet(cacheKey, body, TTL.STATIC);
    setPublicListCache(res, req);
    res.json(body);
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/:id - Lấy category theo ID
export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await categoryService.getCategoryById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Category not found",
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    res.json({
      success: true,
      data: category,
      message: "Lấy chi tiết danh mục thành công",
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/slug/:slug - Lấy category theo slug
export const getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const category = await categoryService.getCategoryBySlug(slug);

    if (!category) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Category not found",
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    res.json({
      success: true,
      data: category,
      message: "Lấy danh mục theo slug thành công",
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/:id/path - Lấy breadcrumb path
export const getCategoryPath = async (req, res, next) => {
  try {
    const { id } = req.params;

    const path = await categoryService.getCategoryPath(id);

    if (!path) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Category not found",
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    res.json({
      success: true,
      data: path,
      message: "Lấy đường dẫn danh mục thành công",
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/categories - Tạo category mới
export const createCategory = async (req, res, next) => {
  try {
    const { name, slug, icon, color, description, thumbnail, parentId, order } =
      req.body;

    const category = await categoryService.createCategory({
      name,
      slug,
      icon,
      color,
      description,
      thumbnail,
      parentId: parentId || null,
      order: order || 0,
    });

    flushPattern("categories:");

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/categories/:id - Update category
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      icon,
      color,
      description,
      thumbnail,
      parentId,
      order,
      isActive,
    } = req.body;

    const category = await categoryService.updateCategory(id, {
      name,
      slug,
      icon,
      color,
      description,
      thumbnail,
      parentId,
      order,
      isActive,
    });

    flushPattern("categories:");

    res.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/categories/:id - Xóa category
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await categoryService.deleteCategory(id);

    flushPattern("categories:");

    res.json({
      success: true,
      data: null,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/:id/suggested-tags - Lấy suggested tags
export const getSuggestedTags = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tags = await categoryService.getSuggestedTags(id);

    res.json({
      success: true,
      data: tags,
      message: "Lấy danh sách tag gợi ý thành công",
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/categories/:id/tags - Gán tags cho category
export const assignTags = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tagIds, defaultTagIds } = req.body;

    const tags = await categoryService.assignTagsToCategory(
      id,
      tagIds,
      defaultTagIds || [],
    );

    res.json({
      success: true,
      message: "Tags assigned successfully",
      data: tags,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getCategories,
  getCategoryTree,
  getCategoryById,
  getCategoryBySlug,
  getCategoryPath,
  createCategory,
  updateCategory,
  deleteCategory,
  getSuggestedTags,
  assignTags,
};
