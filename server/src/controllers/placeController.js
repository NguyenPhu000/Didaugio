import * as placeService from "../services/placeService.js";
import appService from "../services/appService.js";
import prisma from "../config/prismaClient.js";
import { ROLES } from "../config/constants.js";

/**
 * GET /api/places - Lấy danh sách địa điểm
 */
export const getPlaces = async (req, res) => {
  try {
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
      sortBy,
      page,
      limit,
    } = req.query;

    const filters = {
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
      sortBy,
      page,
      limit,
    };

    if (req.user?.roleId === ROLES.BUSINESS) {
      filters.ownerUserId = req.user.userId;
      const business = await prisma.business.findUnique({
        where: { ownerId: req.user.userId },
        select: { id: true },
      });
      if (business) {
        filters.businessId = business.id;
      }
    }

    const result = await placeService.getAllPlaces(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error in getPlaces:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách địa điểm",
      error: error.message,
    });
  }
};

/**
 * GET /api/places/nearby - Lấy danh sách địa điểm gần vị trí hiện tại
 */
export const getNearbyPlaces = async (req, res) => {
  try {
    const { latitude, longitude, radius, limit, categoryId } = req.query;

    const places = await placeService.getNearbyPlaces({
      latitude,
      longitude,
      radius,
      limit,
      categoryId,
    });

    res.json({
      success: true,
      data: places,
      message: "Lấy danh sách địa điểm gần bạn thành công",
    });
  } catch (error) {
    console.error("Error in getNearbyPlaces:", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "Không thể lấy danh sách địa điểm gần bạn",
      errorCode: "NEARBY_PLACES_ERROR",
    });
  }
};

/**
 * GET /api/places/:id - Lấy địa điểm theo ID
 */
export const getPlaceById = async (req, res) => {
  try {
    const { id } = req.params;
    const incrementView = req.query.view === "true";

    const place = await placeService.getPlaceById(parseInt(id), incrementView);

    if (!place) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy địa điểm",
      });
    }

    res.json({
      success: true,
      data: place,
    });
  } catch (error) {
    console.error("Error in getPlaceById:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin địa điểm",
      error: error.message,
    });
  }
};

/**
 * GET /api/places/slug/:slug - Lấy địa điểm theo slug
 */
export const getPlaceBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const incrementView = req.query.view === "true";

    const place = await placeService.getPlaceBySlug(slug, incrementView);

    if (!place) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy địa điểm",
      });
    }

    res.json({
      success: true,
      data: place,
    });
  } catch (error) {
    console.error("Error in getPlaceBySlug:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin địa điểm",
      error: error.message,
    });
  }
};

/**
 * GET /api/places/check-slug/:slug - Kiểm tra slug tồn tại
 */
export const checkSlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { excludeId } = req.query;

    const exists = await placeService.checkSlugExists(
      slug,
      excludeId ? parseInt(excludeId) : null,
    );

    res.json({
      success: true,
      data: { exists, slug },
    });
  } catch (error) {
    console.error("Error in checkSlug:", error);
    res.status(500).json({
      success: false,
      message: "Không thể kiểm tra slug",
      error: error.message,
    });
  }
};

/**
 * POST /api/places - Tạo địa điểm mới
 */
export const createPlace = async (req, res) => {
  try {
    const {
      name,
      slug,
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
      images,
      openingHours,
      amenities,
      status,
    } = req.body;

    // Validation
    if (
      !name ||
      !categoryId ||
      !districtId ||
      !address ||
      !latitude ||
      !longitude
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Thiếu thông tin bắt buộc: name, categoryId, districtId, address, latitude, longitude",
      });
    }

    const place = await placeService.createPlace(
      {
        name,
        slug,
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
        images,
        openingHours,
        amenities,
        status,
      },
      req.user.userId,
    );

    res.status(201).json({
      success: true,
      message: "Tạo địa điểm thành công",
      data: place,
    });
  } catch (error) {
    console.error("Error in createPlace:", error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Không thể tạo địa điểm",
      error: error.message,
    });
  }
};

/**
 * PUT /api/places/:id - Cập nhật địa điểm
 */
export const updatePlace = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "ID địa điểm không hợp lệ",
      });
    }

    const place = await placeService.updatePlace(
      parseInt(id),
      updateData,
      req.user.userId,
      req.user.roleId,
    );

    res.json({
      success: true,
      message: "Cập nhật địa điểm thành công",
      data: place,
    });
  } catch (error) {
    console.error("Error in updatePlace:", error);

    if (error.message.includes("không tồn tại")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Không thể cập nhật địa điểm",
      error: error.message,
    });
  }
};
/**
 * DELETE /api/places/:id - Xóa địa điểm (soft delete)
 */
export const deletePlace = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await placeService.deletePlace(parseInt(id));

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error in deletePlace:", error);

    if (error.message.includes("không tồn tại")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Không thể xóa địa điểm",
      error: error.message,
    });
  }
};

/**
 * PUT /api/places/:id/approve - Duyệt địa điểm
 */
export const approvePlace = async (req, res) => {
  try {
    const { id } = req.params;

    const place = await placeService.approvePlace(
      parseInt(id),
      req.user.userId,
    );

    res.json({
      success: true,
      message: "Duyệt địa điểm thành công",
      data: place,
    });
  } catch (error) {
    console.error("Error in approvePlace:", error);

    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Không thể duyệt địa điểm",
      error: error.message,
    });
  }
};

/**
 * PUT /api/places/:id/reject - Từ chối địa điểm
 */
export const rejectPlace = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp lý do từ chối",
      });
    }

    const place = await placeService.rejectPlace(
      parseInt(id),
      req.user.userId,
      reason,
    );

    res.json({
      success: true,
      message: "Từ chối địa điểm thành công",
      data: place,
    });
  } catch (error) {
    console.error("Error in rejectPlace:", error);

    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Không thể từ chối địa điểm",
      error: error.message,
    });
  }
};

/**
 * PUT /api/places/:id/status - Đổi trạng thái
 */
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp trạng thái mới",
      });
    }

    const place = await placeService.updateStatus(
      parseInt(id),
      status,
      req.user.roleId,
    );

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: place,
    });
  } catch (error) {
    console.error("Error in updateStatus:", error);

    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Không thể cập nhật trạng thái",
      error: error.message,
    });
  }
};

/**
 * PUT /api/places/:id/feature - Đánh dấu nổi bật
 */
export const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    const { isFeatured } = req.body;

    const place = await placeService.toggleFeatured(parseInt(id), isFeatured);

    res.json({
      success: true,
      message: isFeatured
        ? "Đánh dấu nổi bật thành công"
        : "Bỏ đánh dấu nổi bật thành công",
      data: place,
    });
  } catch (error) {
    console.error("Error in toggleFeatured:", error);

    if (error.message.includes("không tồn tại")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Không thể cập nhật trạng thái nổi bật",
      error: error.message,
    });
  }
};

/**
 * POST /api/places/:id/submit - Gửi duyệt
 */
export const submitForReview = async (req, res) => {
  try {
    const { id } = req.params;

    const place = await placeService.submitForReview(parseInt(id));

    res.json({
      success: true,
      message: "Gửi duyệt thành công",
      data: place,
    });
  } catch (error) {
    console.error("Error in submitForReview:", error);

    if (
      error.message.includes("không tồn tại") ||
      error.message.includes("Chỉ có thể")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Không thể gửi duyệt",
      error: error.message,
    });
  }
};

/**
 * POST /api/places/:id/images - Thêm ảnh
 */
export const addImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp danh sách ảnh",
      });
    }

    const result = await placeService.addImages(
      parseInt(id),
      images,
      req.user.userId,
    );

    res.status(201).json({
      success: true,
      message: "Thêm ảnh thành công",
      data: result,
    });
  } catch (error) {
    console.error("Error in addImages:", error);

    if (
      error.message.includes("không tồn tại") ||
      error.message.includes("Tối đa")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Không thể thêm ảnh",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/places/:id/images/:imageId - Xóa ảnh
 */
export const deleteImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;

    await placeService.deleteImage(parseInt(id), parseInt(imageId));

    res.json({
      success: true,
      message: "Xóa ảnh thành công",
    });
  } catch (error) {
    console.error("Error in deleteImage:", error);

    if (error.message.includes("không tồn tại")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Không thể xóa ảnh",
      error: error.message,
    });
  }
};

/**
 * PUT /api/places/:id/images/:imageId/cover - Đặt làm ảnh bìa
 */
export const setCoverImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;

    await placeService.setCoverImage(parseInt(id), parseInt(imageId));

    res.json({
      success: true,
      message: "Đặt ảnh bìa thành công",
    });
  } catch (error) {
    console.error("Error in setCoverImage:", error);

    if (error.message.includes("không tồn tại")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Không thể đặt ảnh bìa",
      error: error.message,
    });
  }
};

/**
 * PUT /api/places/:id/images/reorder - Sắp xếp ảnh
 */
export const reorderImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageOrders } = req.body;

    if (!imageOrders || !Array.isArray(imageOrders)) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp thứ tự ảnh",
      });
    }

    await placeService.reorderImages(parseInt(id), imageOrders);

    res.json({
      success: true,
      message: "Sắp xếp ảnh thành công",
    });
  } catch (error) {
    console.error("Error in reorderImages:", error);
    res.status(500).json({
      success: false,
      message: "Không thể sắp xếp ảnh",
      error: error.message,
    });
  }
};

/**
 * GET /api/places/stats - Thống kê địa điểm
 */
export const getStats = async (req, res) => {
  try {
    const stats = await placeService.getPlaceStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error in getStats:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy thống kê",
      error: error.message,
    });
  }
};

const getUserId = (req) => req.user?.userId || req.user?.id || null;

const parseId = (raw) => {
  const id = parseInt(raw, 10);
  return Number.isNaN(id) ? null : id;
};

export const getHomeData = async (req, res) => {
  try {
    const data = await appService.getHomeData(req.query);
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error in getHomeData:", error);
    res
      .status(500)
      .json({ success: false, message: "Không thể lấy dữ liệu trang chủ" });
  }
};

export const getBusinessServices = async (req, res) => {
  try {
    const result = await appService.getServices(req.query);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error in getBusinessServices:", error);
    res
      .status(500)
      .json({ success: false, message: "Không thể lấy danh sách dịch vụ" });
  }
};

export const getPlaceReviews = async (req, res) => {
  try {
    const placeId = parseId(req.params.id);
    if (!placeId)
      return res
        .status(400)
        .json({ success: false, message: "ID địa điểm không hợp lệ" });

    const result = await appService.getPlaceReviews(placeId, req.query);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error in getPlaceReviews:", error);
    res
      .status(500)
      .json({ success: false, message: "Không thể lấy danh sách đánh giá" });
  }
};

export const createReview = async (req, res) => {
  try {
    const placeId = parseId(req.params.id);
    if (!placeId)
      return res
        .status(400)
        .json({ success: false, message: "ID địa điểm không hợp lệ" });

    const review = await appService.createOrUpdateReview(
      placeId,
      getUserId(req),
      req.body,
    );
    res.status(201).json({
      success: true,
      data: review,
      message: "Gửi đánh giá thành công",
    });
  } catch (error) {
    console.error("Error in createReview:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Không thể gửi đánh giá",
    });
  }
};

export default {
  getPlaces,
  getNearbyPlaces,
  getPlaceById,
  getPlaceBySlug,
  checkSlug,
  createPlace,
  updatePlace,
  deletePlace,
  approvePlace,
  rejectPlace,
  updateStatus,
  toggleFeatured,
  submitForReview,
  addImages,
  deleteImage,
  setCoverImage,
  reorderImages,
  getStats,
  getHomeData,
  getBusinessServices,
  getPlaceReviews,
  createReview,
};
