import * as tagService from "../services/tagService.js";

/**
 * TAG CONTROLLER
 * REST API cho quản lý tags
 */

// GET /api/tags - Lấy danh sách tags
export const getTags = async (req, res) => {
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
    });
  } catch (error) {
    console.error("Error in getTags:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tags",
      error: error.message,
    });
  }
};

// GET /api/tags/popular - Lấy popular tags
export const getPopularTags = async (req, res) => {
  try {
    const { limit = 20, tagType } = req.query;

    const tags = await tagService.getPopularTags(parseInt(limit), tagType);

    res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error("Error in getPopularTags:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch popular tags",
      error: error.message,
    });
  }
};

// GET /api/tags/suggest/:categoryId - Lấy suggested tags theo category
export const getSuggestedTagsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const tags = await tagService.getSuggestedTagsByCategory(
      parseInt(categoryId)
    );

    res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error("Error in getSuggestedTagsByCategory:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch suggested tags",
      error: error.message,
    });
  }
};

// GET /api/tags/:id - Lấy tag theo ID
export const getTagById = async (req, res) => {
  try {
    const { id } = req.params;

    const tag = await tagService.getTagById(parseInt(id));

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: "Tag not found",
      });
    }

    res.json({
      success: true,
      data: tag,
    });
  } catch (error) {
    console.error("Error in getTagById:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tag",
      error: error.message,
    });
  }
};

// GET /api/tags/slug/:slug - Lấy tag theo slug
export const getTagBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const tag = await tagService.getTagBySlug(slug);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: "Tag not found",
      });
    }

    res.json({
      success: true,
      data: tag,
    });
  } catch (error) {
    console.error("Error in getTagBySlug:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tag",
      error: error.message,
    });
  }
};

// POST /api/tags - Tạo tag mới
export const createTag = async (req, res) => {
  try {
    const { name, slug, tagType, icon, color } = req.body;

    // Validation
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: "Name and slug are required",
      });
    }

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
    console.error("Error in createTag:", error);

    if (
      error.message.includes("already exists") ||
      error.message.includes("Invalid tag type")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create tag",
      error: error.message,
    });
  }
};

// POST /api/tags/bulk - Tạo nhiều tags cùng lúc
export const bulkCreateTags = async (req, res) => {
  try {
    const { tags } = req.body;

    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({
        success: false,
        message: "tags must be a non-empty array",
      });
    }

    const created = await tagService.bulkCreateTags(tags);

    res.status(201).json({
      success: true,
      message: `${created.length} tags created successfully`,
      data: created,
    });
  } catch (error) {
    console.error("Error in bulkCreateTags:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create tags",
      error: error.message,
    });
  }
};

// PUT /api/tags/:id - Update tag
export const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, tagType, icon, color, isActive } = req.body;

    const tag = await tagService.updateTag(parseInt(id), {
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
    console.error("Error in updateTag:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("already exists") ||
      error.message.includes("Invalid tag type")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update tag",
      error: error.message,
    });
  }
};

// DELETE /api/tags/:id - Xóa tag
export const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await tagService.deleteTag(parseInt(id));

    res.json(result);
  } catch (error) {
    console.error("Error in deleteTag:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("Cannot delete")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete tag",
      error: error.message,
    });
  }
};

// POST /api/tags/:id/recalculate - Sync lại usage count
export const recalculateUsageCount = async (req, res) => {
  try {
    const { id } = req.params;

    const tag = await tagService.recalculateUsageCount(parseInt(id));

    res.json({
      success: true,
      message: "Usage count recalculated",
      data: tag,
    });
  } catch (error) {
    console.error("Error in recalculateUsageCount:", error);
    res.status(500).json({
      success: false,
      message: "Failed to recalculate usage count",
      error: error.message,
    });
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
