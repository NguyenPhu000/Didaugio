import prisma from "../config/prismaClient.js";
import { ROLES } from "../config/constants.js";

/**
 * PLACE MIDDLEWARE
 * Middleware kiểm tra quyền sở hữu địa điểm
 */

/**
 * Kiểm tra user có quyền truy cập place không
 * - Super Admin (1) và Admin (2): Truy cập tất cả
 * - Business (3): Chỉ truy cập place của mình hoặc business của mình
 * - Các role khác: Từ chối
 */
export const checkPlaceOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    // Admin+ có thể truy cập mọi place
    if (roleId <= ROLES.ADMIN) {
      return next();
    }

    // Lấy thông tin place
    const place = await prisma.place.findUnique({
      where: { id: parseInt(id), deletedAt: null },
      select: {
        id: true,
        createdBy: true,
        businessId: true,
      },
    });

    if (!place) {
      return res.status(404).json({
        success: false,
        message: "Địa điểm không tồn tại",
        errorCode: "PLACE_NOT_FOUND",
      });
    }

    // Kiểm tra ownership
    // 1. Người tạo
    if (place.createdBy === userId) {
      return next();
    }

    // 2. Business owner
    if (place.businessId) {
      const business = await prisma.business.findUnique({
        where: { id: place.businessId },
        select: { ownerId: true },
      });

      if (business && business.ownerId === userId) {
        return next();
      }
    }

    // Không có quyền
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền truy cập địa điểm này",
      errorCode: "FORBIDDEN_NOT_OWNER",
    });
  } catch (error) {
    console.error("Error in checkPlaceOwnership:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi kiểm tra quyền truy cập",
      errorCode: "OWNERSHIP_CHECK_ERROR",
    });
  }
};

/**
 * Kiểm tra place có đang ở trạng thái cho phép chỉnh sửa không
 * Chỉ cho phép chỉnh sửa khi: draft, rejected
 * Trừ Admin có thể chỉnh sửa mọi trạng thái
 */
export const checkPlaceEditable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const roleId = req.user.roleId;

    // Admin có thể chỉnh sửa mọi lúc
    if (roleId <= ROLES.ADMIN) {
      return next();
    }

    const place = await prisma.place.findUnique({
      where: { id: parseInt(id), deletedAt: null },
      select: { status: true },
    });

    if (!place) {
      return res.status(404).json({
        success: false,
        message: "Địa điểm không tồn tại",
      });
    }

    const editableStatuses = ["draft", "rejected"];
    if (!editableStatuses.includes(place.status)) {
      return res.status(403).json({
        success: false,
        message: `Không thể chỉnh sửa địa điểm đang ở trạng thái: ${place.status}. Vui lòng liên hệ Admin.`,
        errorCode: "PLACE_NOT_EDITABLE",
      });
    }

    next();
  } catch (error) {
    console.error("Error in checkPlaceEditable:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi kiểm tra trạng thái địa điểm",
    });
  }
};

/**
 * Middleware gắn place vào request để dùng trong controller
 */
export const loadPlace = async (req, res, next) => {
  try {
    const { id } = req.params;

    const place = await prisma.place.findUnique({
      where: { id: parseInt(id), deletedAt: null },
      include: {
        category: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        createdByUser: {
          select: {
            id: true,
            email: true,
            profile: { select: { fullName: true } },
          },
        },
      },
    });

    if (!place) {
      return res.status(404).json({
        success: false,
        message: "Địa điểm không tồn tại",
      });
    }

    req.place = place;
    next();
  } catch (error) {
    console.error("Error in loadPlace:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tải thông tin địa điểm",
    });
  }
};

export default {
  checkPlaceOwnership,
  checkPlaceEditable,
  loadPlace,
};
