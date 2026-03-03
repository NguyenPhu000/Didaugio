import prisma from "../config/prismaClient.js";
import { ROLES } from "../config/constants.js";

const EDITABLE_STATUSES = ["draft", "rejected"];

export const checkPlaceOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    if (roleId <= ROLES.ADMIN) {
      return next();
    }

    const place = await prisma.place.findUnique({
      where: { id: parseInt(id), deletedAt: null },
      select: { id: true, createdBy: true, businessId: true },
    });

    if (!place) {
      return res.status(404).json({
        success: false,
        message: "Địa điểm không tồn tại",
        errorCode: "PLACE_NOT_FOUND",
      });
    }

    if (place.createdBy === userId) {
      return next();
    }

    if (place.businessId) {
      const business = await prisma.business.findUnique({
        where: { id: place.businessId },
        select: { ownerId: true },
      });

      if (business?.ownerId === userId) {
        return next();
      }
    }

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

export const checkPlaceEditable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const roleId = req.user.roleId;

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

    if (!EDITABLE_STATUSES.includes(place.status)) {
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

export const loadPlace = async (req, res, next) => {
  try {
    const place = await prisma.place.findUnique({
      where: { id: parseInt(req.params.id), deletedAt: null },
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

export default { checkPlaceOwnership, checkPlaceEditable, loadPlace };
