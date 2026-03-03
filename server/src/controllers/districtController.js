import * as districtService from "../services/districtService.js";

/**
 * GET /api/districts - Lấy danh sách quận/huyện
 */
export const getDistricts = async (req, res) => {
  try {
    const { isActive, search } = req.query;

    const districts = await districtService.getAllDistricts({
      isActive,
      search,
    });

    res.json({
      success: true,
      data: districts,
      total: districts.length,
    });
  } catch (error) {
    console.error("Error in getDistricts:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách quận/huyện",
      error: error.message,
    });
  }
};

/**
 * GET /api/districts/:id - Lấy quận/huyện theo ID
 */
export const getDistrictById = async (req, res) => {
  try {
    const { id } = req.params;

    const district = await districtService.getDistrictById(parseInt(id));

    if (!district) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy quận/huyện",
      });
    }

    res.json({
      success: true,
      data: district,
    });
  } catch (error) {
    console.error("Error in getDistrictById:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin quận/huyện",
      error: error.message,
    });
  }
};

/**
 * GET /api/districts/code/:code - Lấy quận/huyện theo code
 */
export const getDistrictByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const district = await districtService.getDistrictByCode(code);

    if (!district) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy quận/huyện",
      });
    }

    res.json({
      success: true,
      data: district,
    });
  } catch (error) {
    console.error("Error in getDistrictByCode:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin quận/huyện",
      error: error.message,
    });
  }
};

/**
 * GET /api/districts/:id/wards - Lấy phường/xã theo quận
 */
export const getWardsByDistrict = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, search, wardType } = req.query;

    const wards = await districtService.getWardsByDistrict(parseInt(id), {
      isActive,
      search,
      wardType,
    });

    res.json({
      success: true,
      data: wards,
      total: wards.length,
    });
  } catch (error) {
    console.error("Error in getWardsByDistrict:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách phường/xã",
      error: error.message,
    });
  }
};

/**
 * GET /api/wards - Lấy tất cả phường/xã
 */
export const getAllWards = async (req, res) => {
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
    });
  } catch (error) {
    console.error("Error in getAllWards:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách phường/xã",
      error: error.message,
    });
  }
};

/**
 * GET /api/wards/:id - Lấy phường/xã theo ID
 */
export const getWardById = async (req, res) => {
  try {
    const { id } = req.params;

    const ward = await districtService.getWardById(parseInt(id));

    if (!ward) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phường/xã",
      });
    }

    res.json({
      success: true,
      data: ward,
    });
  } catch (error) {
    console.error("Error in getWardById:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin phường/xã",
      error: error.message,
    });
  }
};

/**
 * GET /api/wards/code/:code - Lấy phường/xã theo code
 */
export const getWardByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const ward = await districtService.getWardByCode(code);

    if (!ward) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phường/xã",
      });
    }

    res.json({
      success: true,
      data: ward,
    });
  } catch (error) {
    console.error("Error in getWardByCode:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin phường/xã",
      error: error.message,
    });
  }
};

/**
 * GET /api/address/search - Tìm kiếm địa chỉ
 */
export const searchAddress = async (req, res) => {
  try {
    const { q, limit } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const results = await districtService.searchAddress(
      q,
      limit ? parseInt(limit) : 10
    );

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error in searchAddress:", error);
    res.status(500).json({
      success: false,
      message: "Không thể tìm kiếm địa chỉ",
      error: error.message,
    });
  }
};

/**
 * POST /api/districts/lookup - Tìm quận/huyện theo tọa độ
 */
export const lookupDistrict = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp tọa độ (latitude, longitude)",
      });
    }

    const district = await districtService.lookupDistrict(
      parseFloat(latitude),
      parseFloat(longitude)
    );

    if (!district) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy quận/huyện tại vị trí này",
      });
    }

    res.json({
      success: true,
      data: district,
    });
  } catch (error) {
    console.error("Error in lookupDistrict:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tìm kiếm quận/huyện",
      error: error.message,
    });
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
