import prisma from "../config/prismaClient.js";
import { PLACE_STATUS, PAGINATION } from "../config/constants.js";
import { ERROR_MESSAGES, ERROR_CODES } from "../config/messages.js";
import eventEmitter, { EVENTS } from "../utils/eventEmitter.js";
import ServiceError from "../utils/serviceError.js";

/**
 * PLACE SERVICE
 * Quản lý địa điểm - CRUD operations
 */

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate slug từ tên
 */
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

/**
 * Kiểm tra slug unique
 */
const ensureUniqueSlug = async (baseSlug, excludeId = null) => {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.place.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || (excludeId && existing.id === excludeId)) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

/**
 * Default include cho queries
 */
const defaultInclude = {
  category: {
    select: { id: true, name: true, slug: true, icon: true, color: true },
  },
  district: {
    select: { id: true, name: true, code: true },
  },
  ward: {
    select: { id: true, name: true, wardType: true },
  },
  createdByUser: {
    select: {
      id: true,
      email: true,
      profile: { select: { fullName: true, avatar: true } },
    },
  },
  images: {
    orderBy: [{ isCover: "desc" }, { order: "asc" }],
    take: 10,
  },
  tagLinks: {
    include: {
      tag: {
        select: { id: true, name: true, slug: true, color: true, icon: true },
      },
    },
  },
  amenities: true,
  openingHours: true,
  tagLinks: {
    include: {
      tag: true,
    },
  },
  _count: {
    select: { reviews: true, favorites: true, checkins: true },
  },
};

// =============================================================================
// CRUD OPERATIONS
// =============================================================================

/**
 * Lấy danh sách địa điểm (có filter, search, pagination)
 */
export const getAllPlaces = async (filters = {}) => {
  const {
    categoryId,
    districtId,
    wardId,
    status,
    isFeatured,
    isVerified,
    createdBy,
    search,
    priceRange,
    minRating,
    sortBy = "newest",
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
  } = filters;

  const where = {
    deletedAt: null,
  };

  // Filters
  if (categoryId) where.categoryId = parseInt(categoryId);
  if (districtId) where.districtId = parseInt(districtId);
  if (wardId) where.wardId = parseInt(wardId);
  if (status) where.status = status;
  if (isFeatured !== undefined)
    where.isFeatured = isFeatured === "true" || isFeatured === true;
  if (isVerified !== undefined)
    where.isVerified = isVerified === "true" || isVerified === true;
  if (createdBy) where.createdBy = parseInt(createdBy);
  if (priceRange) where.priceRange = priceRange;
  if (minRating) where.ratingAvg = { gte: parseFloat(minRating) };

  // Search
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { shortDescription: { contains: search, mode: "insensitive" } },
      { address: { contains: search, mode: "insensitive" } },
    ];
  }

  // Sorting
  let orderBy = [];
  switch (sortBy) {
    case "newest":
      orderBy = [{ createdAt: "desc" }];
      break;
    case "oldest":
      orderBy = [{ createdAt: "asc" }];
      break;
    case "rating":
      orderBy = [{ ratingAvg: "desc" }, { ratingCount: "desc" }];
      break;
    case "popular":
      orderBy = [{ viewCount: "desc" }];
      break;
    case "name":
      orderBy = [{ name: "asc" }];
      break;
    default:
      orderBy = [{ createdAt: "desc" }];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = Math.min(parseInt(limit), PAGINATION.MAX_LIMIT);

  const [places, total] = await Promise.all([
    prisma.place.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true, color: true },
        },
        district: {
          select: { id: true, name: true },
        },
        ward: {
          select: { id: true, name: true },
        },
        // Include creator info using consistent profile selection
        createdByUser: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatar: true,
              },
            },
          },
        },
        // Include first 5 images for gallery preview (optimized for list view)
        images: {
          take: 5,
          orderBy: [{ isCover: "desc" }, { order: "asc" }],
          select: {
            id: true,
            imageData: true,
            caption: true,
            isCover: true,
          },
        },
        amenities: true,
        openingHours: true,
        tagLinks: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: { reviews: true, favorites: true },
        },
      },
      orderBy,
      skip,
      take,
    }),
    prisma.place.count({ where }),
  ]);

  return {
    data: places,
    pagination: {
      page: parseInt(page),
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

/**
 * Lấy địa điểm theo ID
 */
export const getPlaceById = async (id, incrementView = false) => {
  const place = await prisma.place.findUnique({
    where: { id, deletedAt: null },
    include: {
      ...defaultInclude,
      openingHours: {
        orderBy: { dayOfWeek: "asc" },
      },
      amenities: true,
      approvedByUser: {
        select: {
          id: true,
          email: true,
          profile: { select: { fullName: true } },
        },
      },
      business: {
        select: { id: true, businessName: true, status: true },
      },
    },
  });

  if (!place) return null;

  // Increment view count
  if (incrementView) {
    await prisma.place.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  return place;
};

/**
 * Lấy địa điểm theo slug
 */
export const getPlaceBySlug = async (slug, incrementView = false) => {
  const place = await prisma.place.findUnique({
    where: { slug, deletedAt: null },
    include: {
      ...defaultInclude,
      openingHours: {
        orderBy: { dayOfWeek: "asc" },
      },
      amenities: true,
    },
  });

  if (!place) return null;

  // Transform tagLinks to tags for easy consumption
  if (place.tagLinks) {
    place.tags = place.tagLinks.map((link) => link.tag);
    delete place.tagLinks;
  }

  // Increment view count
  if (incrementView) {
    await prisma.place.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  return place;
};

/**
 * Kiểm tra slug có tồn tại không
 */
export const checkSlugExists = async (slug, excludeId = null) => {
  const where = { slug };
  if (excludeId) {
    where.id = { not: excludeId };
  }

  const existing = await prisma.place.findFirst({
    where,
    select: { id: true },
  });

  return !!existing;
};

/**
 * Tạo địa điểm mới
 */
export const createPlace = async (data, userId) => {
  const {
    name,
    slug: customSlug,
    categoryId,
    districtId,
    wardId,
    description,
    shortDescription,
    address,
    latitude,
    longitude,
    phone,
    email,
    website,
    facebook,
    priceRange,
    priceFrom,
    priceTo,
    tagIds = [],
    images = [],
    openingHours = [],
    amenities = [],
    status = PLACE_STATUS.PENDING,
  } = data;

  // Basic Validation
  if (
    !name ||
    !categoryId ||
    !districtId ||
    !address ||
    !latitude ||
    !longitude
  ) {
    throw new ServiceError(
      ERROR_CODES.INVALID_INPUT,
      "Thiếu thông tin bắt buộc: Tên, Danh mục, Quận/Huyện, Địa chỉ, Tọa độ",
      400,
    );
  }

  // Validate Category & Location
  const [category, district] = await Promise.all([
    prisma.category.findUnique({ where: { id: parseInt(categoryId) } }),
    prisma.districtCantho.findUnique({ where: { id: parseInt(districtId) } }),
  ]);

  if (!category)
    throw new ServiceError(
      ERROR_CODES.NOT_FOUND,
      "Danh mục không tồn tại",
      404,
    );
  if (!district)
    throw new ServiceError(
      ERROR_CODES.NOT_FOUND,
      "Quận/Huyện không tồn tại",
      404,
    );

  // Validate Tags (filter out invalid IDs)
  let validTagIds = [];
  if (tagIds && tagIds.length > 0) {
    const tags = await prisma.placeTag.findMany({
      where: { id: { in: tagIds.map((id) => parseInt(id)) } },
      select: { id: true },
    });
    validTagIds = tags.map((t) => t.id);
  }

  // Validate Opening Hours
  const validOpeningHours = Array.isArray(openingHours)
    ? openingHours.filter((oh) => {
        const day = parseInt(oh.dayOfWeek);
        return !isNaN(day) && day >= 0 && day <= 8; // 0-6 or 1-8 depending on convention, safer to allow standard range
      })
    : [];

  // Validate Amenities
  const validAmenities = Array.isArray(amenities)
    ? amenities.filter(
        (am) => am.amenityType && typeof am.amenityType === "string",
      )
    : [];

  // Generate or validate slug
  const baseSlug = customSlug || generateSlug(name);
  const slug = await ensureUniqueSlug(baseSlug);

  try {
    // Create place với transaction
    const place = await prisma.$transaction(async (tx) => {
      // 1. Create place
      const newPlace = await tx.place.create({
        data: {
          name,
          slug,
          categoryId: parseInt(categoryId),
          districtId: parseInt(districtId),
          wardId: wardId ? parseInt(wardId) : null,
          description,
          shortDescription,
          address,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          phone,
          email,
          website,
          facebook,
          priceRange,
          priceFrom: priceFrom ? parseInt(priceFrom) : null,
          priceTo: priceTo ? parseInt(priceTo) : null,
          status,
          createdBy: userId,
        },
      });

      // 2. Create tag links
      if (validTagIds.length > 0) {
        await tx.placeTagLink.createMany({
          data: validTagIds.map((tagId) => ({
            placeId: newPlace.id,
            tagId: tagId,
          })),
        });

        // Update tag usage count
        await tx.placeTag.updateMany({
          where: { id: { in: validTagIds } },
          data: { usageCount: { increment: 1 } },
        });
      }

      // 3. Create images
      // NOTE: Storing large images in DB is not recommended. Ideally use S3/Cloudinary.
      if (images && images.length > 0) {
        await tx.placeImage.createMany({
          data: images.map((img, index) => ({
            placeId: newPlace.id,
            imageData: img.imageData, // Assumed to be base64 or URL
            caption: img.caption || null,
            order: img.order ?? index,
            isCover: img.isCover || index === 0,
            uploadedBy: userId,
          })),
        });

        // Update thumbnail (first cover image)
        const coverImage = images.find((img) => img.isCover) || images[0];
        if (coverImage) {
          await tx.place.update({
            where: { id: newPlace.id },
            data: { thumbnail: coverImage.imageData },
          });
        }
      }

      // 4. Create opening hours
      if (validOpeningHours.length > 0) {
        await tx.placeOpeningHour.createMany({
          data: validOpeningHours.map((oh) => ({
            placeId: newPlace.id,
            dayOfWeek: parseInt(oh.dayOfWeek),
            isClosed: oh.isClosed || false,
            openTime: oh.openTime || null,
            closeTime: oh.closeTime || null,
            breakStart: oh.breakStart || null,
            breakEnd: oh.breakEnd || null,
            note: oh.note || null,
          })),
        });
      }

      // 5. Create amenities
      if (validAmenities.length > 0) {
        await tx.placeAmenity.createMany({
          data: validAmenities.map((am) => ({
            placeId: newPlace.id,
            amenityType: am.amenityType,
            amenityValue: am.amenityValue || null,
            icon: am.icon || null,
          })),
        });
      }

      return newPlace;
    });

    // Emit event
    eventEmitter.emit(EVENTS.PLACE.CREATED, {
      id: place.id,
      name,
      createdBy: userId,
    });

    // Return full place data
    return getPlaceById(place.id);
  } catch (error) {
    console.error("Create place transaction failed:", error);
    throw new ServiceError(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "Lỗi khi tạo địa điểm: " + error.message,
      500,
    );
  }
};

/**
 * Cập nhật địa điểm
 */
export const updatePlace = async (id, data, userId) => {
  const {
    name,
    slug: customSlug,
    categoryId,
    districtId,
    wardId,
    description,
    shortDescription,
    address,
    latitude,
    longitude,
    phone,
    email,
    website,
    facebook,
    priceRange,
    priceFrom,
    priceTo,
    tagIds,
    openingHours,
    amenities,
    images, // Add images to destructuring
  } = data;

  // Check place exists
  const existing = await prisma.place.findUnique({
    where: { id, deletedAt: null },
    select: { id: true, slug: true, status: true },
  });

  if (!existing) {
    throw new ServiceError(
      ERROR_CODES.NOT_FOUND,
      ERROR_MESSAGES.NOT_FOUND,
      404,
    );
  }

  // Generate or validate slug if changed
  let slug = existing.slug;
  if (customSlug && customSlug !== existing.slug) {
    slug = await ensureUniqueSlug(customSlug, id);
  } else if (name && customSlug === undefined) {
    // Auto-generate new slug from new name
    const baseSlug = generateSlug(name);
    if (baseSlug !== existing.slug) {
      slug = await ensureUniqueSlug(baseSlug, id);
    }
  }

  // Update với transaction
  const place = await prisma.$transaction(async (tx) => {
    // 1. Update place data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== existing.slug) updateData.slug = slug;
    if (categoryId !== undefined) updateData.categoryId = parseInt(categoryId);
    if (districtId !== undefined) updateData.districtId = parseInt(districtId);
    if (wardId !== undefined)
      updateData.wardId = wardId ? parseInt(wardId) : null;
    if (description !== undefined) updateData.description = description;
    if (shortDescription !== undefined)
      updateData.shortDescription = shortDescription;
    if (address !== undefined) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (website !== undefined) updateData.website = website;
    if (facebook !== undefined) updateData.facebook = facebook;
    if (priceRange !== undefined) updateData.priceRange = priceRange;
    if (priceFrom !== undefined)
      updateData.priceFrom = priceFrom ? parseInt(priceFrom) : null;
    if (priceTo !== undefined)
      updateData.priceTo = priceTo ? parseInt(priceTo) : null;

    await tx.place.update({
      where: { id },
      data: updateData,
    });

    // 2. Update tags if provided
    if (tagIds !== undefined) {
      // Get current tags
      const currentTags = await tx.placeTagLink.findMany({
        where: { placeId: id },
        select: { tagId: true },
      });
      const currentTagIds = currentTags.map((t) => t.tagId);
      const newTagIds = tagIds.map((id) => parseInt(id));

      // Remove old tags
      const tagsToRemove = currentTagIds.filter(
        (tid) => !newTagIds.includes(tid),
      );
      if (tagsToRemove.length > 0) {
        await tx.placeTagLink.deleteMany({
          where: { placeId: id, tagId: { in: tagsToRemove } },
        });
        await tx.placeTag.updateMany({
          where: { id: { in: tagsToRemove } },
          data: { usageCount: { decrement: 1 } },
        });
      }

      // Add new tags
      const tagsToAdd = newTagIds.filter((tid) => !currentTagIds.includes(tid));
      if (tagsToAdd.length > 0) {
        await tx.placeTagLink.createMany({
          data: tagsToAdd.map((tagId) => ({ placeId: id, tagId })),
        });
        await tx.placeTag.updateMany({
          where: { id: { in: tagsToAdd } },
          data: { usageCount: { increment: 1 } },
        });
      }
    }

    // 3. Update opening hours if provided
    if (openingHours !== undefined) {
      // Delete existing
      await tx.placeOpeningHour.deleteMany({ where: { placeId: id } });

      // Create new
      if (openingHours.length > 0) {
        await tx.placeOpeningHour.createMany({
          data: openingHours.map((oh) => ({
            placeId: id,
            dayOfWeek: parseInt(oh.dayOfWeek),
            isClosed: oh.isClosed || false,
            openTime: oh.openTime || null,
            closeTime: oh.closeTime || null,
            breakStart: oh.breakStart || null,
            breakEnd: oh.breakEnd || null,
            note: oh.note || null,
          })),
        });
      }
    }

    // 4. Update amenities if provided
    if (amenities !== undefined) {
      // Delete existing
      await tx.placeAmenity.deleteMany({ where: { placeId: id } });

      // Create new
      if (amenities.length > 0) {
        await tx.placeAmenity.createMany({
          data: amenities.map((am) => ({
            placeId: id,
            amenityType: am.amenityType,
            amenityValue: am.amenityValue || null,
            icon: am.icon || null,
          })),
        });
      }
    }

    // 5. Update Images (Synchronize)
    if (images !== undefined) {
      // Get current images to map IDs
      const currentImages = await tx.placeImage.findMany({
        where: { placeId: id },
      });
      const currentImageIds = currentImages.map((img) => img.id);

      // Identify images to keep/update and new images
      // Expecting images from FE to have 'id' if existing, or just 'imageData' if new
      // Note: FE currently sends all images.

      const imagesToKeep = images.filter(
        (img) => img.id && currentImageIds.includes(img.id),
      );
      const imagesToKeepIds = imagesToKeep.map((img) => img.id);

      const imagesToAdd = images.filter((img) => !img.id); // No ID = New

      // 5.1 Delete removed images
      const imagesToDelete = currentImageIds.filter(
        (tid) => !imagesToKeepIds.includes(tid),
      );
      if (imagesToDelete.length > 0) {
        await tx.placeImage.deleteMany({
          where: { id: { in: imagesToDelete } },
        });
      }

      // 5.2 Update existing images (order, caption, isCover)
      for (const img of imagesToKeep) {
        await tx.placeImage.update({
          where: { id: img.id },
          data: {
            caption: img.caption || null,
            order: img.order ?? 0,
            isCover: img.isCover || false,
            // Note: We generally don't update imageData for existing images to save bandwidth
            // unless explicitly needed. Assuming FE sends same ID.
          },
        });
      }

      // 5.3 Add new images
      if (imagesToAdd.length > 0) {
        await tx.placeImage.createMany({
          data: imagesToAdd.map((img, index) => ({
            placeId: id,
            imageData: img.imageData,
            caption: img.caption || null,
            order: img.order ?? imagesToKeep.length + index,
            isCover: img.isCover || false,
            uploadedBy: userId,
          })),
        });
      }

      // 5.4 Update thumbnail if cover changed
      // We need to re-fetch to be sure which one is cover now
      // Or just trust the input. Let's find the cover in the INPUT list.
      const coverImage = images.find((img) => img.isCover) || images[0];
      if (coverImage && coverImage.imageData) {
        // If it's a new image, it has imageData.
        // If it's an existing image, we might NOT have sent imageData back if we optimized FE?
        // But currently FE ImageUploader keeps imageData in state.
        // Let's assume imageData is present.
        await tx.place.update({
          where: { id },
          data: { thumbnail: coverImage.imageData },
        });
      } else if (coverImage && coverImage.id) {
        // Existing image is cover, but we might not have imageData in the payload to update thumbnail
        // Fetch it from DB
        const dbImage = await tx.placeImage.findUnique({
          where: { id: coverImage.id },
          select: { imageData: true },
        });
        if (dbImage) {
          await tx.place.update({
            where: { id },
            data: { thumbnail: dbImage.imageData },
          });
        }
      }
    }

    return { id };
  });

  // Emit event
  eventEmitter.emit(EVENTS.PLACE.UPDATED, { id, updatedBy: userId });

  return getPlaceById(place.id);
};

/**
 * Xóa địa điểm (soft delete)
 */
export const deletePlace = async (id) => {
  const existing = await prisma.place.findUnique({
    where: { id, deletedAt: null },
    select: { id: true },
  });

  if (!existing) {
    throw new ServiceError(
      ERROR_CODES.NOT_FOUND,
      ERROR_MESSAGES.NOT_FOUND,
      404,
    );
  }

  await prisma.place.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  eventEmitter.emit(EVENTS.PLACE.DELETED, { id });

  return { success: true, message: "Xóa địa điểm thành công" };
};

/**
 * Xóa vĩnh viễn (hard delete) - Admin only
 */
export const hardDeletePlace = async (id) => {
  const existing = await prisma.place.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new ServiceError(
      ERROR_CODES.NOT_FOUND,
      "Địa điểm không tồn tại",
      404,
    );
  }

  // Cascade delete is handled by Prisma relations
  await prisma.place.delete({ where: { id } });

  return { success: true, message: "Xóa vĩnh viễn địa điểm thành công" };
};

// =============================================================================
// STATUS MANAGEMENT
// =============================================================================

/**
 * Duyệt địa điểm
 */
export const approvePlace = async (id, userId) => {
  const existing = await prisma.place.findUnique({
    where: { id, deletedAt: null },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new ServiceError(
      ERROR_CODES.NOT_FOUND,
      "Địa điểm không tồn tại",
      404,
    );
  }

  if (existing.status === PLACE_STATUS.APPROVED) {
    throw new ServiceError(
      ERROR_CODES.INVALID_INPUT,
      "Địa điểm đã được duyệt trước đó",
      400,
    );
  }

  const place = await prisma.place.update({
    where: { id },
    data: {
      status: PLACE_STATUS.APPROVED,
      approvedBy: userId,
      approvedAt: new Date(),
      rejectionReason: null,
    },
  });

  // Emit event
  eventEmitter.emit(EVENTS.PLACE.APPROVED, {
    id,
    approvedBy: userId,
    ownerId: existing.createdBy,
  });

  return place;
};

/**
 * Từ chối địa điểm
 */
export const rejectPlace = async (id, userId, reason) => {
  const existing = await prisma.place.findUnique({
    where: { id, deletedAt: null },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new ServiceError(
      ERROR_CODES.NOT_FOUND,
      "Địa điểm không tồn tại",
      404,
    );
  }

  const place = await prisma.place.update({
    where: { id },
    data: {
      status: PLACE_STATUS.REJECTED,
      approvedBy: userId,
      approvedAt: new Date(),
      rejectionReason: reason || "Không đạt yêu cầu",
    },
  });

  // Emit event
  eventEmitter.emit(EVENTS.PLACE.REJECTED, {
    id,
    rejectedBy: userId,
    reason,
    ownerId: existing.createdBy,
  });

  return place;
};

/**
 * Đổi trạng thái
 */
export const updateStatus = async (id, status) => {
  const validStatuses = Object.values(PLACE_STATUS);
  if (!validStatuses.includes(status)) {
    throw new ServiceError(
      ERROR_CODES.INVALID_INPUT,
      `Trạng thái không hợp lệ. Các trạng thái hợp lệ: ${validStatuses.join(", ")}`,
      400,
    );
  }

  const existing = await prisma.place.findUnique({
    where: { id, deletedAt: null },
    select: { id: true },
  });

  if (!existing) {
    throw new ServiceError(
      ERROR_CODES.NOT_FOUND,
      "Địa điểm không tồn tại",
      404,
    );
  }

  const place = await prisma.place.update({
    where: { id },
    data: { status },
  });

  return place;
};

/**
 * Đánh dấu nổi bật
 */
export const toggleFeatured = async (id, isFeatured) => {
  const existing = await prisma.place.findUnique({
    where: { id, deletedAt: null },
    select: { id: true },
  });

  if (!existing) {
    throw new ServiceError(
      ERROR_CODES.NOT_FOUND,
      "Địa điểm không tồn tại",
      404,
    );
  }

  const place = await prisma.place.update({
    where: { id },
    data: { isFeatured },
  });

  return place;
};

/**
 * Submit để review (từ draft -> pending)
 */
export const submitForReview = async (id) => {
  const existing = await prisma.place.findUnique({
    where: { id, deletedAt: null },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new ServiceError(
      ERROR_CODES.NOT_FOUND,
      "Địa điểm không tồn tại",
      404,
    );
  }

  if (
    existing.status !== PLACE_STATUS.DRAFT &&
    existing.status !== PLACE_STATUS.REJECTED
  ) {
    throw new ServiceError(
      ERROR_CODES.INVALID_INPUT,
      "Chỉ có thể gửi duyệt từ trạng thái Bản nháp hoặc Bị từ chối",
      400,
    );
  }

  const place = await prisma.place.update({
    where: { id },
    data: {
      status: PLACE_STATUS.PENDING,
      rejectionReason: null,
    },
  });

  return place;
};

// =============================================================================
// IMAGE MANAGEMENT
// =============================================================================

/**
 * Thêm ảnh cho địa điểm
 */
export const addImages = async (placeId, images, userId) => {
  const existing = await prisma.place.findUnique({
    where: { id: placeId, deletedAt: null },
    include: { images: true },
  });

  if (!existing) {
    throw new ServiceError(
      ERROR_CODES.NOT_FOUND,
      "Địa điểm không tồn tại",
      404,
    );
  }

  const currentImageCount = existing.images.length;
  const maxImages = 10;

  if (currentImageCount + images.length > maxImages) {
    throw new ServiceError(
      ERROR_CODES.INVALID_INPUT,
      `Tối đa ${maxImages} ảnh. Hiện tại: ${currentImageCount}, thêm: ${images.length}`,
      400,
    );
  }

  const hasCover = existing.images.some((img) => img.isCover);

  const createdImages = await prisma.placeImage.createMany({
    data: images.map((img, index) => ({
      placeId,
      imageData: img.imageData,
      caption: img.caption || null,
      order: currentImageCount + index,
      isCover: !hasCover && index === 0,
      uploadedBy: userId,
    })),
  });

  // Update thumbnail if no cover existed
  if (!hasCover && images.length > 0) {
    await prisma.place.update({
      where: { id: placeId },
      data: { thumbnail: images[0].imageData },
    });
  }

  return createdImages;
};

/**
 * Xóa ảnh
 */
export const deleteImage = async (placeId, imageId) => {
  const image = await prisma.placeImage.findFirst({
    where: { id: imageId, placeId },
  });

  if (!image) {
    throw new ServiceError(
      ERROR_CODES.NOT_FOUND,
      "Ảnh không tồn tại hoặc không thuộc địa điểm này",
      404,
    );
  }

  await prisma.placeImage.delete({ where: { id: imageId } });

  // If deleted cover, set new cover
  if (image.isCover) {
    const nextImage = await prisma.placeImage.findFirst({
      where: { placeId },
      orderBy: { order: "asc" },
    });

    if (nextImage) {
      await prisma.placeImage.update({
        where: { id: nextImage.id },
        data: { isCover: true },
      });
      await prisma.place.update({
        where: { id: placeId },
        data: { thumbnail: nextImage.imageData },
      });
    } else {
      await prisma.place.update({
        where: { id: placeId },
        data: { thumbnail: null },
      });
    }
  }

  return { success: true };
};

/**
 * Đặt ảnh làm cover
 */
export const setCoverImage = async (placeId, imageId) => {
  const image = await prisma.placeImage.findFirst({
    where: { id: imageId, placeId },
  });

  if (!image) {
    throw new ServiceError(
      ERROR_CODES.NOT_FOUND,
      "Ảnh không tồn tại hoặc không thuộc địa điểm này",
      404,
    );
  }

  await prisma.$transaction([
    // Remove current cover
    prisma.placeImage.updateMany({
      where: { placeId, isCover: true },
      data: { isCover: false },
    }),
    // Set new cover
    prisma.placeImage.update({
      where: { id: imageId },
      data: { isCover: true },
    }),
    // Update thumbnail
    prisma.place.update({
      where: { id: placeId },
      data: { thumbnail: image.imageData },
    }),
  ]);

  return { success: true };
};

/**
 * Sắp xếp lại thứ tự ảnh
 */
export const reorderImages = async (placeId, imageOrders) => {
  // Validate imageOrders
  if (!imageOrders || !Array.isArray(imageOrders)) {
    throw new ServiceError(
      ERROR_CODES.INVALID_INPUT,
      "Danh sách thứ tự ảnh không hợp lệ",
      400,
    );
  }

  // Validate images belong to place
  const imageIds = imageOrders.map((i) => i.id);
  const count = await prisma.placeImage.count({
    where: {
      id: { in: imageIds },
      placeId,
    },
  });

  if (count !== imageIds.length) {
    throw new ServiceError(
      ERROR_CODES.INVALID_INPUT,
      "Một số ảnh không thuộc địa điểm này",
      400,
    );
  }

  await prisma.$transaction(
    imageOrders.map((item) =>
      prisma.placeImage.update({
        where: { id: item.id }, // Already validated placeId
        data: { order: item.order },
      }),
    ),
  );

  return { success: true };
};

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Thống kê địa điểm
 */
export const getPlaceStats = async () => {
  const [total, byStatus, byCategory, byDistrict] = await Promise.all([
    // Total
    prisma.place.count({ where: { deletedAt: null } }),

    // By status
    prisma.place.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { id: true },
    }),

    // By category (top 10)
    prisma.place.groupBy({
      by: ["categoryId"],
      where: { deletedAt: null },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),

    // By district
    prisma.place.groupBy({
      by: ["districtId"],
      where: { deletedAt: null },
      _count: { id: true },
    }),
  ]);

  return {
    total,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
    byCategory,
    byDistrict,
  };
};

export default {
  getAllPlaces,
  getPlaceById,
  getPlaceBySlug,
  checkSlugExists,
  createPlace,
  updatePlace,
  deletePlace,
  hardDeletePlace,
  approvePlace,
  rejectPlace,
  updateStatus,
  toggleFeatured,
  submitForReview,
  addImages,
  deleteImage,
  setCoverImage,
  reorderImages,
  getPlaceStats,
};
