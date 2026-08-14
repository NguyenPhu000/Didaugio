import prisma from "../../config/prismaClient.js";
import ServiceError from "../../utils/serviceError.js";
import { ERROR_CODES } from "../../config/messages.js";
import { deleteImage } from "../../utils/cloudinaryService.js";
import { uploadPlaceImage } from "../media/media.service.js";
import { enqueueCloudinaryAssetCleanup } from "../media/cloudinaryCleanupJob.service.js";

const toInt = (value, fallback = null) => {
  const number = parseInt(value, 10);
  return Number.isNaN(number) ? fallback : number;
};

const isInlineImage = (value) =>
  typeof value === "string" && value.startsWith("data:image/");

const stageBannerImage = async (image) => {
  if (!isInlineImage(image)) return { imageUrl: image || null, imagePublicId: null };
  const uploaded = await uploadPlaceImage(image, "didaugio/banners");
  return { imageUrl: uploaded.secureUrl, imagePublicId: uploaded.publicId };
};

export const createBanner = async (userId, data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  if (startDate > endDate) {
    throw new ServiceError("Start date cannot be after end date", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const staged = await stageBannerImage(data.image);
  try {
    return await prisma.bannerMarketing.create({
      data: {
        title: data.title,
        description: data.description || null,
        imageData: staged.imageUrl || "",
        imageUrl: staged.imageUrl,
        imagePublicId: staged.imagePublicId,
        linkType: data.linkType || "none",
        linkValue: data.linkValue || null,
        position: data.position || "home",
        priority: data.priority || 0,
        startDate,
        endDate,
        isActive: data.isActive !== false,
        createdBy: userId,
      },
    });
  } catch (error) {
    if (staged.imagePublicId) await deleteImage(staged.imagePublicId).catch(() => {});
    throw error;
  }
};

export const updateBanner = async (bannerId, data) => {
  const existing = await prisma.bannerMarketing.findUnique({ where: { id: bannerId } });
  if (!existing) throw new ServiceError("Banner does not exist", 404, ERROR_CODES.NOT_FOUND);

  const updateData = {};
  for (const field of ["title", "linkType", "position", "priority", "isActive"]) {
    if (data[field] !== undefined) updateData[field] = data[field];
  }
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.linkValue !== undefined) updateData.linkValue = data.linkValue || null;
  if (data.startDate !== undefined || data.endDate !== undefined) {
    const startDate = new Date(data.startDate || existing.startDate);
    const endDate = new Date(data.endDate || existing.endDate);
    if (startDate > endDate) {
      throw new ServiceError("Start date cannot be after end date", 400, ERROR_CODES.VALIDATION_ERROR);
    }
    if (data.startDate !== undefined) updateData.startDate = startDate;
    if (data.endDate !== undefined) updateData.endDate = endDate;
  }

  let staged = null;
  if (data.image !== undefined && data.image !== existing.imageUrl) {
    staged = await stageBannerImage(data.image);
    updateData.imageData = staged.imageUrl || "";
    updateData.imageUrl = staged.imageUrl;
    updateData.imagePublicId = staged.imagePublicId;
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.bannerMarketing.update({ where: { id: bannerId }, data: updateData });
      if (existing.imagePublicId && existing.imagePublicId !== updated.imagePublicId) {
        await enqueueCloudinaryAssetCleanup(tx, {
          aggregate: "BannerMarketing",
          aggregateId: bannerId,
          publicIds: [existing.imagePublicId],
        });
      }
      return updated;
    });
  } catch (error) {
    if (staged?.imagePublicId) await deleteImage(staged.imagePublicId).catch(() => {});
    throw error;
  }
};

export const deleteBanner = async (bannerId) => {
  const banner = await prisma.bannerMarketing.findUnique({ where: { id: bannerId } });
  if (!banner) throw new ServiceError("Banner does not exist", 404, ERROR_CODES.NOT_FOUND);

  await prisma.$transaction(async (tx) => {
    await tx.bannerMarketing.delete({ where: { id: bannerId } });
    await enqueueCloudinaryAssetCleanup(tx, {
      aggregate: "BannerMarketing",
      aggregateId: bannerId,
      publicIds: [banner.imagePublicId],
    });
  });
  return { id: bannerId };
};

/**
 * Tạo banner marketing mới (admin only).
 */
export const getBanners = async (filters = {}) => {
  const { isActive, position, page = 1, limit = 20 } = filters;

  const where = {};
  if (isActive !== undefined) {
    where.isActive = isActive === "true" || isActive === true;
  }
  if (position) {
    where.position = position;
  }

  const pageNum = Math.max(toInt(page, 1), 1);
  const limitNum = Math.min(Math.max(toInt(limit, 20), 1), 50);
  const skip = (pageNum - 1) * limitNum;

  const [banners, total] = await Promise.all([
    prisma.bannerMarketing.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        imageData: true,
        imageUrl: true,
        imagePublicId: true,
        linkType: true,
        linkValue: true,
        position: true,
        priority: true,
        startDate: true,
        endDate: true,
        isActive: true,
        clickCount: true,
        viewCount: true,
        createdAt: true,
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip,
      take: limitNum,
    }),
    prisma.bannerMarketing.count({ where }),
  ]);

  return {
    data: banners,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};
