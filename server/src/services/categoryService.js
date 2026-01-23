import prisma from "../config/prismaClient.js";
import { CATEGORY_LEVELS, MAX_CATEGORY_LEVEL } from "../config/constants.js";
import { ERROR_MESSAGES, ERROR_CODES, SUCCESS_MESSAGES } from "../config/messages.js";

/**
 * CATEGORY SERVICE
 * Quản lý danh mục phân cấp
 */

class ServiceError extends Error {
  constructor(message, statusCode = 400, errorCode = ERROR_CODES.VALIDATION_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

// Lấy tất cả categories (flat list)
export const getAllCategories = async (filters = {}) => {
  const { parentId, level, isActive, search } = filters;

  const where = {};

  if (parentId !== undefined) {
    where.parentId =
      parentId === "null" || parentId === null ? null : parseInt(parentId);
  }

  if (level) {
    where.level = parseInt(level);
  }

  if (isActive !== undefined) {
    where.isActive = isActive === "true" || isActive === true;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  const categories = await prisma.category.findMany({
    where,
    include: {
      parent: {
        select: { id: true, name: true, slug: true },
      },
      _count: {
        select: { children: true, places: true, categoryTags: true },
      },
    },
    orderBy: [{ level: "asc" }, { order: "asc" }, { name: "asc" }],
  });

  return categories;
};

// Lấy category tree (nested structure)
export const getCategoryTree = async (
  parentId = null,
  maxLevel = MAX_CATEGORY_LEVEL
) => {
  const buildTree = async (parent = null, currentLevel = 1) => {
    if (currentLevel > maxLevel) return [];

    const categories = await prisma.category.findMany({
      where: {
        parentId: parent,
        isActive: true,
      },
      include: {
        _count: {
          select: { children: true, places: true },
        },
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    const tree = await Promise.all(
      categories.map(async (category) => ({
        ...category,
        children: await buildTree(category.id, currentLevel + 1),
      }))
    );

    return tree;
  };

  return buildTree(parentId);
};

// Lấy breadcrumb path từ root đến node
export const getCategoryPath = async (categoryId) => {
  const path = [];
  let current = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, name: true, slug: true, parentId: true, level: true },
  });

  if (!current) return null;

  path.unshift(current);

  while (current.parentId) {
    current = await prisma.category.findUnique({
      where: { id: current.parentId },
      select: { id: true, name: true, slug: true, parentId: true, level: true },
    });

    if (current) {
      path.unshift(current);
    }
  }

  return path;
};

// Lấy category theo ID
export const getCategoryById = async (id) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      parent: {
        select: { id: true, name: true, slug: true },
      },
      children: {
        select: { id: true, name: true, slug: true, level: true },
        where: { isActive: true },
      },
      categoryTags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
              tagType: true,
              color: true,
            },
          },
        },
      },
      _count: {
        select: { places: true },
      },
    },
  });

  if (!category) {
    throw new ServiceError(ERROR_MESSAGES.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }

  return category;
};

// Lấy category theo slug
export const getCategoryBySlug = async (slug) => {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      parent: {
        select: { id: true, name: true, slug: true },
      },
      children: {
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      },
      categoryTags: {
        include: {
          tag: true,
        },
      },
      _count: {
        select: { places: true },
      },
    },
  });

  if (!category) {
    throw new ServiceError(ERROR_MESSAGES.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }

  return category;
};

// Tạo category mới
export const createCategory = async (data) => {
  const { name, slug, icon, color, description, thumbnail, parentId, order } =
    data;

  // Validate level
  let level = CATEGORY_LEVELS.ROOT;
  if (parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: parentId },
      select: { level: true },
    });

    if (!parent) {
      throw new ServiceError(ERROR_MESSAGES.NOT_FOUND + " (Parent)", 404, ERROR_CODES.NOT_FOUND);
    }

    level = parent.level + 1;

    if (level > MAX_CATEGORY_LEVEL) {
      throw new ServiceError(`Maximum category level is ${MAX_CATEGORY_LEVEL}`);
    }
  }

  // Check unique slug
  const existing = await prisma.category.findUnique({
    where: { slug },
  });

  if (existing) {
    throw new ServiceError(ERROR_MESSAGES.EXISTED, 400, ERROR_CODES.EXISTED);
  }

  const category = await prisma.category.create({
    data: {
      name,
      slug,
      icon: icon || null,
      color: color || "#3B82F6",
      description: description || null,
      thumbnail: thumbnail || null,
      parentId: parentId || null,
      level,
      order: order || 0,
      isActive: true,
    },
    include: {
      parent: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  return category;
};

// Update category
export const updateCategory = async (id, data) => {
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
  } = data;

  // Check category exists
  const existing = await prisma.category.findUnique({
    where: { id },
    select: { id: true, level: true, slug: true },
  });

  if (!existing) {
    throw new ServiceError(ERROR_MESSAGES.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }

  // Validate new parent (nếu có)
  let level = existing.level;
  if (parentId !== undefined) {
    if (parentId === null) {
      level = CATEGORY_LEVELS.ROOT;
    } else if (parentId === id) {
      throw new ServiceError("Category cannot be its own parent");
    } else {
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
        select: { level: true },
      });

      if (!parent) {
        throw new ServiceError("Parent category not found", 404, ERROR_CODES.NOT_FOUND);
      }

      level = parent.level + 1;

      if (level > MAX_CATEGORY_LEVEL) {
        throw new ServiceError(`Maximum category level is ${MAX_CATEGORY_LEVEL}`);
      }

      // Check circular reference
      const parentPath = await getCategoryPath(parentId);
      const isCircular = parentPath.some((node) => node.id === id);
      if (isCircular) {
        throw new Error("Circular reference detected");
      }
    }
  }

  // Check unique slug (nếu thay đổi)
  if (slug && slug !== existing.slug) {
    const duplicateSlug = await prisma.category.findUnique({
      where: { slug },
    });

    if (duplicateSlug) {
      throw new ServiceError(ERROR_MESSAGES.EXISTED + " (Slug)", 400, ERROR_CODES.EXISTED);
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (slug !== undefined) updateData.slug = slug;
  if (icon !== undefined) updateData.icon = icon;
  if (color !== undefined) updateData.color = color;
  if (description !== undefined) updateData.description = description;
  if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
  if (parentId !== undefined) {
    updateData.parentId = parentId;
    updateData.level = level;
  }
  if (order !== undefined) updateData.order = order;
  if (isActive !== undefined) updateData.isActive = isActive;

  const category = await prisma.category.update({
    where: { id },
    data: updateData,
    include: {
      parent: {
        select: { id: true, name: true, slug: true },
      },
      _count: {
        select: { children: true, places: true },
      },
    },
  });

  // Update children levels nếu có thay đổi parent
  if (parentId !== undefined && level !== existing.level) {
    await updateChildrenLevels(id, level);
  }

  return category;
};

// Helper: Update children levels recursively
const updateChildrenLevels = async (parentId, parentLevel) => {
  const children = await prisma.category.findMany({
    where: { parentId },
    select: { id: true },
  });

  for (const child of children) {
    const newLevel = parentLevel + 1;
    await prisma.category.update({
      where: { id: child.id },
      data: { level: newLevel },
    });
    await updateChildrenLevels(child.id, newLevel);
  }
};

// Xóa category
export const deleteCategory = async (id) => {
  // Check có children không
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { children: true, places: true },
      },
    },
  });

  if (!category) {
    throw new ServiceError(ERROR_MESSAGES.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }

  if (category._count.children > 0) {
    throw new ServiceError(
      "Cannot delete category with children. Delete children first."
    );
  }

  if (category._count.places > 0) {
    throw new ServiceError(
      `Cannot delete category. ${category._count.places} places are using it.`
    );
  }

  await prisma.category.delete({
    where: { id },
  });

  return { success: true, message: "Category deleted successfully" };
};

// Lấy suggested tags cho category
export const getSuggestedTags = async (categoryId) => {
  const categoryTags = await prisma.categoryTag.findMany({
    where: { categoryId },
    include: {
      tag: true,
    },
    orderBy: [{ isDefault: "desc" }, { tag: { usageCount: "desc" } }],
  });

  return categoryTags.map((ct) => ({
    ...ct.tag,
    isDefault: ct.isDefault,
  }));
};

// Gán tags cho category
export const assignTagsToCategory = async (
  categoryId,
  tagIds,
  defaultTagIds = []
) => {
  // Xóa tags cũ
  await prisma.categoryTag.deleteMany({
    where: { categoryId },
  });

  // Thêm tags mới
  const categoryTags = tagIds.map((tagId) => ({
    categoryId,
    tagId,
    isDefault: defaultTagIds.includes(tagId),
  }));

  await prisma.categoryTag.createMany({
    data: categoryTags,
  });

  return getSuggestedTags(categoryId);
};

export default {
  getAllCategories,
  getCategoryTree,
  getCategoryPath,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getSuggestedTags,
  assignTagsToCategory,
};
