import * as districtService from "../../services/district/district.service.js";
import { ERROR_CODES } from "../../config/messages.js";
import { setPublicListCache } from "../../utils/httpCacheHeaders.js";
import {
  get as cacheGet,
  set as cacheSet,
  TTL,
} from "../../services/cache/cache.service.js";

/**
 * GET /api/districts - Lấy danh sách quận/huyện
 */
export const getDistricts = async (req, res, next) => {
  try {
    const cacheKey = "districts:list";
    const cached = cacheGet(cacheKey);
    if (cached) {
      setPublicListCache(res);
      return res.json(cached);
    }

    const { isActive, search } = req.query;

    const districts = await districtService.getAllDistricts({
      isActive,
      search,
    });

    const body = {
      success: true,
      data: districts,
      total: districts.length,
      message: "Lấy danh sách quận/huyện thành công",
    };
    cacheSet(cacheKey, body, TTL.STATIC);
    setPublicListCache(res);
    res.json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/districts/:id - Lấy quận/huyện theo ID
 */
export const getDistrictById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const district = await districtService.getDistrictById(parseInt(id));

    if (!district) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Không tìm thấy quận/huyện",
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    res.json({
      success: true,
      data: district,
      message: "Lấy chi tiết quận/huyện thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/districts/code/:code - Lấy quận/huyện theo code
 */
export const getDistrictByCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    const district = await districtService.getDistrictByCode(code);

    if (!district) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Không tìm thấy quận/huyện",
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    res.json({
      success: true,
      data: district,
      message: "Lấy quận/huyện theo mã thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/districts/:id/wards - Lấy phường/xã theo quận
 */
export const getWardsByDistrict = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `districts:wards:${id}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      setPublicListCache(res);
      return res.json(cached);
    }

    const { isActive, search, wardType } = req.query;

    const wards = await districtService.getWardsByDistrict(parseInt(id), {
      isActive,
      search,
      wardType,
    });

    const body = {
      success: true,
      data: wards,
      total: wards.length,
      message: "Lấy danh sách phường/xã theo quận/huyện thành công",
    };
    cacheSet(cacheKey, body, TTL.STATIC);
    setPublicListCache(res);
    res.json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/wards - Lấy tất cả phường/xã
 */
export const getAllWards = async (req, res, next) => {
  try {
    const { isActive, wardType, search, page, limit } = req.query;

    const result = await districtService.getAllWards({
      isActive,
      wardType,
      search,
      page,
      limit,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Lấy danh sách phường/xã thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/wards/:id - Lấy phường/xã theo ID
 */
export const getWardById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ward = await districtService.getWardById(parseInt(id));

    if (!ward) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Không tìm thấy phường/xã",
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    res.json({
      success: true,
      data: ward,
      message: "Lấy chi tiết phường/xã thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/wards/code/:code - Lấy phường/xã theo code
 */
export const getWardByCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    const ward = await districtService.getWardByCode(code);

    if (!ward) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Không tìm thấy phường/xã",
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    res.json({
      success: true,
      data: ward,
      message: "Lấy phường/xã theo mã thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/address/search - Tìm kiếm địa chỉ
 */
export const searchAddress = async (req, res, next) => {
  try {
    const { q, limit } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: [],
        message: "Không có kết quả tìm kiếm địa chỉ",
      });
    }

    const results = await districtService.searchAddress(
      q,
      limit ? parseInt(limit) : 10,
    );

    res.json({
      success: true,
      data: results,
      message: "Tìm kiếm địa chỉ thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/districts/lookup - Tìm quận/huyện theo tọa độ
 */
export const lookupDistrict = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Vui lòng cung cấp tọa độ (latitude, longitude)",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const district = await districtService.lookupDistrict(
      parseFloat(latitude),
      parseFloat(longitude),
    );

    if (!district) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Không tìm thấy quận/huyện tại vị trí này",
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    res.json({
      success: true,
      data: district,
      message: "Tra cứu quận/huyện theo tọa độ thành công",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getDistricts,
  getDistrictById,
  getDistrictByCode,
  getWardsByDistrict,
  getAllWards,
  getWardById,
  getWardByCode,
  searchAddress,
  lookupDistrict,
};
