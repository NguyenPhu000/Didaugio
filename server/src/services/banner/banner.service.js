import prisma from "../../config/prismaClient.js";
import ServiceError from "../../utils/serviceError.js";
import { ERROR_CODES } from "../../config/messages.js";
import { deleteImage } from "../../utils/cloudinaryService.js";
import { uploadPlaceImage } from "../media/media.service.js";

const toInt = (value, fallback = null) => {
  const number = parseInt(value, 10);
  return Number.isNaN(number) ? fallback : number;
};

/**
 * Tạo banner marketing mới (admin only).
 * Upload ảnh base64 lên Cloudinary, lưu imageUrl + imagePublicId.
 */
export const createBanner = async (userId, data) => {
  const {
    title,
    description,
    image,
    linkType,
    linkValue,
    position,
    priority,
    startDate,
    endDate,
    isActive,
  } = data;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    throw new ServiceError(
      ERROR_CODES.VALIDATION_ERROR,
      "Ngày bắt đầu không được lớn hơn ngày kết thúc",
      400
    );
  }

  // Upload ảnh lên Cloudinary nếu là base64
  let imageUrl = null;
  let imagePublicId = null;

  if (image && image.startsWith("data:image/")) {
    try {
      const uploadResult = await uploadPlaceImage(image, "didaugio/banners");
      imageUrl = uploadResult.secureUrl;
      imagePublicId = uploadResult.publicId;
    } catch (err) {
      console.error("Lỗi upload banner image lên Cloudinary:", err);
      throw new ServiceError(
        ERROR_CODES.SERVER_ERROR,
        "Lỗi upload ảnh lên Cloudinary",
        500
      );
    }
  } else if (image) {
    // Nếu là URL sẵn có (không phải base64)
    imageUrl = image;
  }

  const banner = await prisma.bannerMarketing.create({
    data: {
      title,
      description: description || null,
      imageData: imageUrl || "",
      imageUrl,
      imagePublicId,
      linkType: linkType || "none",
      linkValue: linkValue || null,
      position: position || "home",
      priority: priority || 0,
      startDate: start,
      endDate: end,
      isActive: isActive !== false,
      createdBy: userId,
    },
  });

  return banner;
};

/**
 * Cập nhật banner marketing (admin only).
 * Nếu upload ảnh mới → xóa ảnh cũ trên Cloudinary.
 */
export const updateBanner = async (bannerId, data) => {
  const existing = await prisma.bannerMarketing.findUnique({
    where: { id: bannerId },
  });

  if (!existing) {
    throw new ServiceError(ERROR_CODES.NOT_FOUND, "Không tìm thấy banner", 404);
  }

  const updateData = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.linkType !== undefined) updateData.linkType = data.linkType;
  if (data.linkValue !== undefined) updateData.linkValue = data.linkValue || null;
  if (data.position !== undefined) updateData.position = data.position;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  // Xử lý ngày tháng
  if (data.startDate !== undefined || data.endDate !== undefined) {
    const start = new Date(data.startDate || existing.startDate);
    const end = new Date(data.endDate || existing.endDate);
    if (start > end) {
      throw new ServiceError(
        ERROR_CODES.VALIDATION_ERROR,
        "Ngày bắt đầu không được lớn hơn ngày kết thúc",
        400
      );
    }
    if (data.startDate !== undefined) updateData.startDate = start;
    if (data.endDate !== undefined) updateData.endDate = end;
  }

  // Xử lý ảnh — upload mới + dọn dẹp ảnh cũ
  if (data.image !== undefined) {
    // Nếu ảnh không thay đổi (giữ nguyên URL cũ) → bỏ qua
    if (data.image === existing.imageUrl) {
      // Không làm gì cả
    } else if (data.image && data.image.startsWith("data:image/")) {
      // Upload base64 mới lên Cloudinary
      let newImageUrl = existing.imageUrl;
      let newImagePublicId = existing.imagePublicId;

      try {
        const uploadResult = await uploadPlaceImage(
          data.image,
          "didaugio/banners"
        );
        newImageUrl = uploadResult.secureUrl;
        newImagePublicId = uploadResult.publicId;
      } catch (err) {
        console.error("Lỗi upload banner image mới:", err);
        throw new ServiceError(
          ERROR_CODES.SERVER_ERROR,
          "Lỗi upload ảnh lên Cloudinary",
          500
        );
      }

      // Dọn dẹp ảnh cũ trên Cloudinary
      if (existing.imagePublicId) {
        try {
          await deleteImage(existing.imagePublicId);
        } catch (err) {
          console.error("Lỗi xóa banner image cũ trên Cloudinary:", err);
        }
      }

      updateData.imageUrl = newImageUrl;
      updateData.imagePublicId = newImagePublicId;
      updateData.imageData = newImageUrl;
    } else if (data.image) {
      // URL mới khác URL cũ → thay thế (không upload Cloudinary)
      updateData.imageUrl = data.image;
      updateData.imagePublicId = null;
      updateData.imageData = data.image;

      // Dọn dẹp ảnh cũ trên Cloudinary
      if (existing.imagePublicId) {
        try {
          await deleteImage(existing.imagePublicId);
        } catch (err) {
          console.error("Lỗi xóa banner image cũ trên Cloudinary:", err);
        }
      }
    }
  }

  const updated = await prisma.bannerMarketing.update({
    where: { id: bannerId },
    data: updateData,
  });

  return updated;
};

/**
 * Xóa banner marketing (admin only).
 * Dọn dẹp ảnh trên Cloudinary trước khi xóa record.
 */
export const deleteBanner = async (bannerId) => {
  const banner = await prisma.bannerMarketing.findUnique({
    where: { id: bannerId },
  });

  if (!banner) {
    throw new ServiceError(ERROR_CODES.NOT_FOUND, "Không tìm thấy banner", 404);
  }

  // Dọn dẹp ảnh trên Cloudinary
  if (banner.imagePublicId) {
    try {
      await deleteImage(banner.imagePublicId);
    } catch (err) {
      console.error("Lỗi xóa banner image trên Cloudinary:", err);
    }
  }

  await prisma.bannerMarketing.delete({
    where: { id: bannerId },
  });

  return { id: bannerId };
};

/**
 * Lấy danh sách banner marketing (admin — có filter, pagination).
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
