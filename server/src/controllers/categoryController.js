import * as categoryService from "../services/categoryService.js";

/**
 * CATEGORY CONTROLLER
 * REST API cho quản lý danh mục
 */

// GET /api/categories - Lấy danh sách categories
export const getCategories = async (req, res) => {
  try {
    const { parentId, level, isActive, search, format } = req.query;

    // Format: tree hoặc flat
    if (format === "tree") {
      const tree = await categoryService.getCategoryTree(
        parentId ? parseInt(parentId) : null
      );
      return res.json({
        success: true,
        data: tree,
      });
    }

    // Flat list
    const categories = await categoryService.getAllCategories({
      parentId,
      level,
      isActive,
      search,
    });

    res.json({
      success: true,
      data: categories,
      total: categories.length,
    });
  } catch (error) {
    console.error("Error in getCategories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};

// GET /api/categories/tree - Lấy category tree
export const getCategoryTree = async (req, res) => {
  try {
    const { parentId, maxLevel } = req.query;

    const tree = await categoryService.getCategoryTree(
      parentId ? parseInt(parentId) : null,
      maxLevel ? parseInt(maxLevel) : undefined
    );

    res.json({
      success: true,
      data: tree,
    });
  } catch (error) {
    console.error("Error in getCategoryTree:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category tree",
      error: error.message,
    });
  }
};

// GET /api/categories/:id - Lấy category theo ID
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await categoryService.getCategoryById(parseInt(id));

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error in getCategoryById:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
};

// GET /api/categories/slug/:slug - Lấy category theo slug
export const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await categoryService.getCategoryBySlug(slug);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error in getCategoryBySlug:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
};

// GET /api/categories/:id/path - Lấy breadcrumb path
export const getCategoryPath = async (req, res) => {
  try {
    const { id } = req.params;

    const path = await categoryService.getCategoryPath(parseInt(id));

    if (!path) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      data: path,
    });
  } catch (error) {
    console.error("Error in getCategoryPath:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category path",
      error: error.message,
    });
  }
};

// POST /api/categories - Tạo category mới
export const createCategory = async (req, res) => {
  try {
    const { name, slug, icon, color, description, thumbnail, parentId, order } =
      req.body;

    // Validation
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: "Name and slug are required",
      });
    }

    const category = await categoryService.createCategory({
      name,
      slug,
      icon,
      color,
      description,
      thumbnail,
      parentId: parentId ? parseInt(parentId) : null,
      order: order ? parseInt(order) : 0,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error in createCategory:", error);

    if (
      error.message.includes("already exists") ||
      error.message.includes("not found")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: error.message,
    });
  }
};

// PUT /api/categories/:id - Update category
export const updateCategory = async (req, res) => {
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

    const category = await categoryService.updateCategory(parseInt(id), {
      name,
      slug,
      icon,
      color,
      description,
      thumbnail,
      parentId:
        parentId !== undefined
          ? parentId
            ? parseInt(parentId)
            : null
          : undefined,
      order: order !== undefined ? parseInt(order) : undefined,
      isActive,
    });

    res.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error in updateCategory:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("already exists") ||
      error.message.includes("Circular")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: error.message,
    });
  }
};

// DELETE /api/categories/:id - Xóa category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await categoryService.deleteCategory(parseInt(id));

    res.json(result);
  } catch (error) {
    console.error("Error in deleteCategory:", error);

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
      message: "Failed to delete category",
      error: error.message,
    });
  }
};

// GET /api/categories/:id/suggested-tags - Lấy suggested tags
export const getSuggestedTags = async (req, res) => {
  try {
    const { id } = req.params;

    const tags = await categoryService.getSuggestedTags(parseInt(id));

    res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error("Error in getSuggestedTags:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch suggested tags",
      error: error.message,
    });
  }
};

// POST /api/categories/:id/tags - Gán tags cho category
export const assignTags = async (req, res) => {
  try {
    const { id } = req.params;
    const { tagIds, defaultTagIds } = req.body;

    if (!Array.isArray(tagIds)) {
      return res.status(400).json({
        success: false,
        message: "tagIds must be an array",
      });
    }

    const tags = await categoryService.assignTagsToCategory(
      parseInt(id),
      tagIds.map((tid) => parseInt(tid)),
      defaultTagIds ? defaultTagIds.map((tid) => parseInt(tid)) : []
    );

    res.json({
      success: true,
      message: "Tags assigned successfully",
      data: tags,
    });
  } catch (error) {
    console.error("Error in assignTags:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign tags",
      error: error.message,
    });
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
