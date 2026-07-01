import axios from "axios";
import { CACHE_TTL, CAN_THO_PROVINCE_CODE } from "@/constants/timing";

const API_BASE =
  import.meta.env.VITE_LOCATION_API_URL || "https://34tinhthanh.com/api";

// Cache để giảm số lần gọi API
const cache = new Map();

// Mã Cần Thơ - dùng cho dự án iPoint Genie
// CAN_THO_PROVINCE_CODE imported from constants/timing

const setCacheWithTTL = (key, data) => {
  cache.set(key, data);
  setTimeout(() => cache.delete(key), CACHE_TTL.LOCATION);
};

export const locationService = {
  /**
   * Lấy tất cả tỉnh/thành phố (34 tỉnh/thành sau sát nhập 2025)
   */
  getAllProvinces: async () => {
    const cacheKey = "provinces_all";
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const response = await axios.get(`${API_BASE}/provinces`);
      const data = response.data;
      setCacheWithTTL(cacheKey, data);
      // Backup to localStorage
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    } catch (error) {
      console.error("Error fetching provinces:", error);
      // Fallback to localStorage if available
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        return JSON.parse(stored);
      }
      throw error;
    }
  },

  /**
   * Lấy danh sách phường/xã theo mã tỉnh
   * Lưu ý: API mới trả về cả quận/huyện và phường/xã trong cùng 1 list
   */
  getWardsByProvince: async (provinceCode) => {
    const cacheKey = `wards_${provinceCode}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const response = await axios.get(`${API_BASE}/wards`, {
        params: { province_code: provinceCode },
      });
      const data = response.data;
      setCacheWithTTL(cacheKey, data);
      // Backup to localStorage
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    } catch (error) {
      console.error("Error fetching wards:", error);
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        return JSON.parse(stored);
      }
      throw error;
    }
  },

  /**
   * Tìm kiếm tỉnh/thành hoặc phường/xã
   */
  search: async (query) => {
    if (!query || query.length < 2) {
      return [];
    }

    const cacheKey = `search_${query}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const response = await axios.get(`${API_BASE}/search`, {
        params: { q: query },
      });
      const data = response.data;
      setCacheWithTTL(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Error searching:", error);
      return [];
    }
  },

  /**
   * Clear cache (dùng khi cần refresh data)
   */
  clearCache: () => {
    cache.clear();
  },

  /**
   * Lấy thông tin Cần Thơ (dùng cho dự án iPoint Genie)
   */
  getCanThoWards: async () => {
    return await locationService.getWardsByProvince(CAN_THO_PROVINCE_CODE);
  },
};
