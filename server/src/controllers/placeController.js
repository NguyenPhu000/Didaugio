import * as placeService from "../services/placeService.js";
import { ERROR_CODES } from "../config/messages.js";
import appService from "../services/appService.js";
import prisma from "../config/prismaClient.js";
import { ROLES } from "../config/constants.js";

/**
 * GET /api/places - Lấy danh sách địa điểm
 */
export const getPlaces = async (req, res, next) => {
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
      message: "Lấy danh sách địa điểm thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/places/nearby - Lấy danh sách địa điểm gần vị trí hiện tại
 */
export const getNearbyPlaces = async (req, res, next) => {
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
    next(error);
  }
};

/**
 * GET /api/places/:id - Lấy địa điểm theo ID
 */
export const getPlaceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const incrementView = req.query.view === "true";

    const place = await placeService.getPlaceById(id, incrementView);

    if (!place) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Không tìm thấy địa điểm",
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    res.json({
      success: true,
      data: place,
      message: "Lấy chi tiết địa điểm thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/places/slug/:slug - Lấy địa điểm theo slug
 */
export const getPlaceBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const incrementView = req.query.view === "true";

    const place = await placeService.getPlaceBySlug(slug, incrementView);

    if (!place) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Không tìm thấy địa điểm",
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    res.json({
      success: true,
      data: place,
      message: "Lấy địa điểm theo slug thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/places/check-slug/:slug - Kiểm tra slug tồn tại
 */
export const checkSlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { excludeId } = req.query;

    const exists = await placeService.checkSlugExists(slug, excludeId ?? null);

    res.json({
      success: true,
      data: { exists, slug },
      message: "Kiểm tra slug thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/places - Tạo địa điểm mới
 */
export const createPlace = async (req, res, next) => {
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
    next(error);
  }
};

/**
 * PUT /api/places/:id - Cập nhật địa điểm
 */
export const updatePlace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const place = await placeService.updatePlace(
      id,
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
    next(error);
  }
};
/**
 * DELETE /api/places/:id - Xóa địa điểm (soft delete)
 */
export const deletePlace = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await placeService.deletePlace(id);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/places/:id/approve - Duyệt địa điểm
 */
export const approvePlace = async (req, res, next) => {
  try {
    const { id } = req.params;

    const place = await placeService.approvePlace(id, req.user.userId);

    res.json({
      success: true,
      message: "Duyệt địa điểm thành công",
      data: place,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/places/:id/reject - Từ chối địa điểm
 */
export const rejectPlace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const place = await placeService.rejectPlace(id, req.user.userId, reason);

    res.json({
      success: true,
      message: "Từ chối địa điểm thành công",
      data: place,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/places/:id/status - Đổi trạng thái
 */
export const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const place = await placeService.updateStatus(id, status, req.user.roleId);

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: place,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/places/:id/feature - Đánh dấu nổi bật
 */
export const toggleFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isFeatured } = req.body;

    const place = await placeService.toggleFeatured(id, isFeatured);

    res.json({
      success: true,
      message: isFeatured
        ? "Đánh dấu nổi bật thành công"
        : "Bỏ đánh dấu nổi bật thành công",
      data: place,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/places/:id/submit - Gửi duyệt
 */
export const submitForReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const place = await placeService.submitForReview(id);

    res.json({
      success: true,
      message: "Gửi duyệt thành công",
      data: place,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/places/:id/images - Thêm ảnh
 */
export const addImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { images } = req.body;

    const result = await placeService.addImages(id, images, req.user.userId);

    res.status(201).json({
      success: true,
      message: "Thêm ảnh thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/places/:id/images/:imageId - Xóa ảnh
 */
export const deleteImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;

    await placeService.deleteImage(id, imageId);

    res.json({
      success: true,
      message: "Xóa ảnh thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/places/:id/images/:imageId/cover - Đặt làm ảnh bìa
 */
export const setCoverImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;

    await placeService.setCoverImage(id, imageId);

    res.json({
      success: true,
      message: "Đặt ảnh bìa thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/places/:id/images/reorder - Sắp xếp ảnh
 */
export const reorderImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { imageOrders } = req.body;

    await placeService.reorderImages(id, imageOrders);

    res.json({
      success: true,
      message: "Sắp xếp ảnh thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/places/stats - Thống kê địa điểm
 */
export const getStats = async (req, res, next) => {
  try {
    const stats = await placeService.getPlaceStats();

    res.json({
      success: true,
      data: stats,
      message: "Lấy thống kê địa điểm thành công",
    });
  } catch (error) {
    next(error);
  }
};

const getUserId = (req) => req.user?.userId || req.user?.id || null;

export const getHomeData = async (req, res, next) => {
  try {
    const data = await appService.getHomeData(req.query);
    res.json({
      success: true,
      data,
      message: "Lấy dữ liệu trang chủ thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const getBusinessServices = async (req, res, next) => {
  try {
    const result = await appService.getServices(req.query);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Lấy danh sách dịch vụ thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const getPlaceReviews = async (req, res, next) => {
  try {
    const result = await appService.getPlaceReviews(req.params.id, req.query);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Lấy danh sách đánh giá địa điểm thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const review = await appService.createOrUpdateReview(
      req.params.id,
      getUserId(req),
      req.body,
    );
    res.status(201).json({
      success: true,
      data: review,
      message: "Gửi đánh giá thành công",
    });
  } catch (error) {
    next(error);
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
