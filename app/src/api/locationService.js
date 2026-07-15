import axios from "axios";
import { logger } from "../lib/logger";

const API_BASE_URL = "https://34tinhthanh.com/api";

class LocationService {
  /**
   * Lấy danh sách 34 tỉnh/thành phố (đã cập nhật danh giới 2025)
   */
  async getAllProvinces() {
    try {
      const response = await axios.get(`${API_BASE_URL}/provinces`);
      return response.data;
    } catch (error) {
      logger.error("Error fetching provinces:", error);
      throw error;
    }
  }

  /**
   * Lấy danh sách phường/xã (bao gồm cả quận/huyện do gộp 2 cấp)
   * theo mã tỉnh.
   *
   * @param {string} provinceCode - Mã tỉnh/thành phố (ví dụ: "CAN_THO")
   */
  async getWardsByProvince(provinceCode) {
    if (!provinceCode) return [];
    try {
      const response = await axios.get(`${API_BASE_URL}/wards`, {
        params: { province_code: provinceCode },
      });
      return response.data;
    } catch (error) {
      logger.error(`Error fetching wards for province ${provinceCode}:`, error);
      throw error;
    }
  }
}

export const locationService = new LocationService();
