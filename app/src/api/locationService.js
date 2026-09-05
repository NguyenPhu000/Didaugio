import { getProvinces, getWards, searchLocations } from "../modules/location/locationApi";

class LocationService {
  /**
   * Lấy danh sách 34 tỉnh/thành phố (đã cập nhật danh giới 2025)
   */
  async getAllProvinces() {
    return (await getProvinces()).data;
  }

  /**
   * Lấy danh sách phường/xã/đặc khu theo mô hình hành chính hai tầng.
   * theo mã tỉnh.
   *
   * @param {string} provinceCode - Mã tỉnh/thành phố chính thức (ví dụ: "92")
   */
  async getWardsByProvince(provinceCode) {
    if (!provinceCode) return [];
    return (await getWards(provinceCode)).data;
  }

  async search(provinceCode, query) {
    return (await searchLocations({ provinceCode, query })).data;
  }
}

export const locationService = new LocationService();
