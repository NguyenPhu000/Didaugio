import prisma from "../../config/prismaClient.js";
import { TAG_TYPES } from "../../config/constants.js";
import { ERROR_CODES } from "../../config/messages.js";
import ServiceError from "../../utils/serviceError.js";

/**
 * TAG SERVICE
 * Quản lý tags cho địa điểm
 */

// Lấy tất cả tags
export const getAllTags = async (filters = {}) => {
  const { tagType, isActive, search, sortBy = "usageCount" } = filters;

  const where = {};

  if (tagType) {
    where.tagType = tagType;
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

  const orderBy = [];
  if (sortBy === "usageCount") {
    orderBy.push({ usageCount: "desc" });
  } else if (sortBy === "name") {
    orderBy.push({ name: "asc" });
  } else if (sortBy === "newest") {
    orderBy.push({ createdAt: "desc" });
  }

  const tags = await prisma.placeTag.findMany({
    where,
    include: {
      tagGroup: true,
      _count: {
        select: { placeTagLinks: true, categoryTags: true },
      },
    },
    orderBy,
  });

  return tags;
};

// Lấy tag theo ID
export const getTagById = async (id) => {
  const tag = await prisma.placeTag.findUnique({
    where: { id },
    include: {
      tagGroup: true,
      placeTagLinks: {
        include: {
          place: {
            select: { id: true, name: true, slug: true, thumbnail: true },
          },
        },
        take: 10, // Lấy 10 places mẫu
      },
      categoryTags: {
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
      _count: {
        select: { placeTagLinks: true },
      },
    },
  });

  return tag;
};

// Lấy tag theo slug
export const getTagBySlug = async (slug) => {
  const tag = await prisma.placeTag.findUnique({
    where: { slug },
    include: {
      tagGroup: true,
      _count: {
        select: { placeTagLinks: true },
      },
    },
  });

  return tag;
};

// Tạo tag mới
export const createTag = async (data) => {
  const { name, slug, tagGroupId, icon, color } = data;

  // Check unique slug
  const existing = await prisma.placeTag.findUnique({
    where: { slug },
  });

  if (existing) {
    throw new ServiceError("Slug đã tồn tại", 400, ERROR_CODES.EXISTED);
  }

  const tagGroup = await prisma.tagGroup.findFirst({
    where: { id: tagGroupId, isActive: true },
  });

  if (!tagGroup) {
    throw new ServiceError(
      "Tag group is not available",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const tag = await prisma.placeTag.create({
    data: {
      name,
      slug,
      tagType: TAG_TYPES.GENERAL,
      tagGroupId,
      icon: icon || null,
      color: color || "#6B7280",
      usageCount: 0,
      isActive: true,
    },
    include: { tagGroup: true },
  });

  return tag;
};

// Update tag
export const updateTag = async (id, data) => {
  const { name, slug, tagGroupId, icon, color, isActive } = data;

  // Check tag exists
  const existing = await prisma.placeTag.findUnique({
    where: { id },
    select: { slug: true },
  });

  if (!existing) {
    throw new ServiceError("Không tìm thấy tag", 404, ERROR_CODES.NOT_FOUND);
  }

  // Check unique slug (nếu thay đổi)
  if (slug && slug !== existing.slug) {
    const duplicateSlug = await prisma.placeTag.findUnique({
      where: { slug },
    });

    if (duplicateSlug) {
      throw new ServiceError("Slug đã tồn tại", 400, ERROR_CODES.EXISTED);
    }
  }

  if (tagGroupId !== undefined) {
    const tagGroup = await prisma.tagGroup.findFirst({
      where: { id: tagGroupId, isActive: true },
    });

    if (!tagGroup) {
      throw new ServiceError(
        "Tag group is not available",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (slug !== undefined) updateData.slug = slug;
  if (tagGroupId !== undefined) {
    updateData.tagGroupId = tagGroupId;
    updateData.tagType = TAG_TYPES.GENERAL;
  }
  if (icon !== undefined) updateData.icon = icon;
  if (color !== undefined) updateData.color = color;
  if (isActive !== undefined) updateData.isActive = isActive;

  const tag = await prisma.placeTag.update({
    where: { id },
    data: updateData,
    include: {
      tagGroup: true,
      _count: {
        select: { placeTagLinks: true },
      },
    },
  });

  return tag;
};

// Xóa tag
export const deleteTag = async (id) => {
  // Check tag exists và usage
  const tag = await prisma.placeTag.findUnique({
    where: { id },
    include: {
      _count: {
        select: { placeTagLinks: true },
      },
    },
  });

  if (!tag) {
    throw new ServiceError("Không tìm thấy tag", 404, ERROR_CODES.NOT_FOUND);
  }

  if (tag._count.placeTagLinks > 0) {
    throw new ServiceError(
      `Không thể xóa tag vì đang được ${tag._count.placeTagLinks} địa điểm sử dụng`,
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  await prisma.placeTag.delete({
    where: { id },
  });

  return { success: true, message: "Xóa tag thành công" };
};

// Lấy suggested tags theo category
export const getSuggestedTagsByCategory = async (categoryId) => {
  const categoryTags = await prisma.categoryTag.findMany({
    where: { categoryId },
    include: {
      tag: { include: { tagGroup: true } },
    },
    orderBy: [{ isDefault: "desc" }, { tag: { usageCount: "desc" } }],
  });

  return categoryTags.map((ct) => ({
    ...ct.tag,
    isDefault: ct.isDefault,
  }));
};

// Lấy popular tags
export const getPopularTags = async (limit = 20, tagType = null) => {
  const where = {
    isActive: true,
  };

  if (tagType) {
    where.tagType = tagType;
  }

  const tags = await prisma.placeTag.findMany({
    where,
    include: { tagGroup: true },
    orderBy: {
      usageCount: "desc",
    },
    take: limit,
  });

  return tags;
};

// Increment usage count (gọi khi tag được dùng cho place)
export const incrementUsageCount = async (tagId) => {
  const tag = await prisma.placeTag.update({
    where: { id: tagId },
    data: {
      usageCount: {
        increment: 1,
      },
    },
  });

  return tag;
};

// Decrement usage count (gọi khi tag bị xóa khỏi place)
export const decrementUsageCount = async (tagId) => {
  const tag = await prisma.placeTag.update({
    where: { id: tagId },
    data: {
      usageCount: {
        decrement: 1,
      },
    },
  });

  return tag;
};

// Recalculate usage count (sync lại nếu sai lệch)
export const recalculateUsageCount = async (tagId) => {
  const count = await prisma.placeTagLink.count({
    where: { tagId },
  });

  const tag = await prisma.placeTag.update({
    where: { id: tagId },
    data: {
      usageCount: count,
    },
  });

  return tag;
};

// Bulk create tags
export const bulkCreateTags = async (tags) => {
  await Promise.all(
    tags.map(async ({ tagGroupId }) => {
      const tagGroup = await prisma.tagGroup.findFirst({
        where: { id: tagGroupId, isActive: true },
      });

      if (!tagGroup) {
        throw new ServiceError(
          "Tag group is not available",
          400,
          ERROR_CODES.VALIDATION_ERROR,
        );
      }
    }),
  );

  const created = await prisma.$transaction(
    tags.map((tag) =>
      prisma.placeTag.create({
        data: {
          name: tag.name,
          slug: tag.slug,
          tagType: TAG_TYPES.GENERAL,
          tagGroupId: tag.tagGroupId,
          icon: tag.icon || null,
          color: tag.color || "#6B7280",
          usageCount: 0,
          isActive: true,
        },
        include: { tagGroup: true },
      }),
    ),
  );

  return created;
};

export default {
  getAllTags,
  getTagById,
  getTagBySlug,
  createTag,
  updateTag,
  deleteTag,
  getSuggestedTagsByCategory,
  getPopularTags,
  incrementUsageCount,
  decrementUsageCount,
  recalculateUsageCount,
  bulkCreateTags,
};
