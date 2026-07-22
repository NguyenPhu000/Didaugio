import * as placeService from "../../services/place/place.service.js";
import { ERROR_CODES } from "../../config/messages.js";
import appService from "../../services/app/app.service.js";
import prisma from "../../config/prismaClient.js";
import { ROLES } from "../../config/constants.js";
import {
  buildKey,
  get as cacheGet,
  set as cacheSet,
  flushPattern,
  TTL,
} from "../../services/cache/cache.service.js";

/** Flush all place-related cache entries after any mutation. */
const invalidatePlaces = () => flushPattern("places:");

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

    let businessId = req.query.businessId;
    const isPublicRequest = !req.user || req.user.roleId >= ROLES.BUSINESS;

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

    if (
      businessId &&
      req.user?.roleId != null &&
      req.user.roleId <= ROLES.ADMIN
    ) {
      filters.businessId = parseInt(businessId, 10);
    }

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

    // Cache only public/guest requests (no auth-specific filters)
    const cacheKey = isPublicRequest ? buildKey("places:list", filters) : null;
    if (cacheKey) {
      const cached = await cacheGet(cacheKey);
      if (cached) {
        return res.json(cached);
      }
    }

    const result = await placeService.getAllPlaces(filters);

    const body = {
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Lấy danh sách địa điểm thành công",
    };

    if (cacheKey) {
      await cacheSet(cacheKey, body, TTL.PLACES);
    }

    res.json(body);
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

    const cacheKey = buildKey("places:nearby", {
      latitude,
      longitude,
      radius,
      limit,
      categoryId,
    });
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const places = await placeService.getNearbyPlaces({
      latitude,
      longitude,
      radius,
      limit,
      categoryId,
    });

    const body = {
      success: true,
      data: places,
      message: "Lấy danh sách địa điểm gần bạn thành công",
    };

    await cacheSet(cacheKey, body, TTL.PLACES);
    res.json(body);
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

    // Skip cache when incrementing view count
    if (!incrementView) {
      const cacheKey = buildKey("places:detail:id", { id });
      const cached = await cacheGet(cacheKey);
      if (cached) {
        return res.json(cached);
      }
    }

    const place = await placeService.getPlaceById(id, incrementView);

    if (!place) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Không tìm thấy địa điểm",
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    const body = {
      success: true,
      data: place,
      message: "Lấy chi tiết địa điểm thành công",
    };

    if (!incrementView) {
      await cacheSet(buildKey("places:detail:id", { id }), body, TTL.PLACES);
    }

    res.json(body);
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

    if (!incrementView) {
      const cacheKey = buildKey("places:detail:slug", { slug });
      const cached = await cacheGet(cacheKey);
      if (cached) {
        return res.json(cached);
      }
    }

    const place = await placeService.getPlaceBySlug(slug, incrementView);

    if (!place) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Không tìm thấy địa điểm",
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    const body = {
      success: true,
      data: place,
      message: "Lấy địa điểm theo slug thành công",
    };

    if (!incrementView) {
      await cacheSet(buildKey("places:detail:slug", { slug }), body, TTL.PLACES);
    }

    res.json(body);
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
      provinceCode,
      wardCode,
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
      spokenGuide,
    } = req.body;

    const place = await placeService.createPlace(
      {
        name,
        slug,
        categoryId,
        provinceCode,
        wardCode,
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
        spokenGuide,
      },
      req.user.userId,
    );

    await invalidatePlaces();

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

    await invalidatePlaces();

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

    await invalidatePlaces();

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

    await invalidatePlaces();

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

    await invalidatePlaces();

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

    await invalidatePlaces();

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

    await invalidatePlaces();

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

    await invalidatePlaces();

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

    await invalidatePlaces();

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

    await invalidatePlaces();

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

    await invalidatePlaces();

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

    await invalidatePlaces();

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
    const cacheKey = "places:stats";
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const stats = await placeService.getPlaceStats();

    const body = {
      success: true,
      data: stats,
      message: "Lấy thống kê địa điểm thành công",
    };

    await cacheSet(cacheKey, body, TTL.PLACES);
    res.json(body);
  } catch (error) {
    next(error);
  }
};

const getUserId = (req) => req.user?.userId || req.user?.id || null;

export const getHomeData = async (req, res, next) => {
  try {
    const cacheKey = buildKey("places:home", req.query);
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const data = await appService.getHomeData(req.query);

    const body = {
      success: true,
      data,
      message: "Lấy dữ liệu trang chủ thành công",
    };

    await cacheSet(cacheKey, body, TTL.PLACES);
    res.json(body);
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

export const getMyPlaceReview = async (req, res, next) => {
  try {
    const review = await appService.getMyPlaceReview(
      Number(req.params.id),
      getUserId(req),
    );
    res.json({
      success: true,
      data: review,
      message: "Láº¥y Ä‘Ã¡nh giÃ¡ cá»§a báº¡n thÃ nh cÃ´ng",
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
  getMyPlaceReview,
  createReview,
};
