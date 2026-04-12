import { useState, useEffect } from "react";
import { locationService } from "@/apis/locationService";

/**
 * ProvinceDistrictSelect Component
 *
 * Component chọn tỉnh/thành phố và phường/xã cho địa chỉ người dùng.
 * Sử dụng API: https://34tinhthanh.com/api
 *
 * Lưu ý: API mới (2025) trả về 2 cấp:
 * - Level 1: Province (34 tỉnh/thành sau sát nhập)
 * - Level 2: Ward (bao gồm cả quận/huyện và phường/xã)
 *
 * Do đó, dropdown "Quận/Huyện/Phường/Xã" sẽ hiển thị tất cả đơn vị hành chính
 * cấp dưới của tỉnh/thành phố đã chọn.
 */

const ProvinceDistrictSelect = ({
  provinceCode,
  districtCode,
  onProvinceChange,
  onDistrictChange,
  errors = {},
}) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // Load provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const data = await locationService.getAllProvinces();
        setProvinces(data);
      } catch (error) {
        console.error("Failed to load provinces:", error);
      } finally {
        setLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (!provinceCode) {
      setDistricts([]);
      return;
    }

    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        // API mới trả về wards (bao gồm cả quận/huyện và phường/xã)
        const data = await locationService.getWardsByProvince(provinceCode);
        setDistricts(data);
      } catch (error) {
        console.error("Failed to load districts:", error);
      } finally {
        setLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, [provinceCode]);

  const handleProvinceChange = (e) => {
    const newProvinceCode = e.target.value;
    onProvinceChange(newProvinceCode);
    // Reset district when province changes
    onDistrictChange("");
  };

  const selectClassName =
    "w-full py-2.5 pl-10 pr-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:ring-blue-600 focus:border-blue-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors appearance-none disabled:opacity-50 disabled:cursor-not-allowed";

  let districtPlaceholder = "-- Chọn quận/huyện/phường/xã --";
  if (loadingDistricts) {
    districtPlaceholder = "Đang tải...";
  } else if (!provinceCode) {
    districtPlaceholder = "Vui lòng chọn tỉnh/thành phố trước";
  }

  return (
    <div className="space-y-4">
      {/* Province Select */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Tỉnh/Thành phố
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
            <span className="material-icons-round text-lg">location_city</span>
          </span>
          <select
            id="provinceCode"
            value={provinceCode || ""}
            onChange={handleProvinceChange}
            disabled={loadingProvinces}
            className={selectClassName}
          >
            <option value="">
              {loadingProvinces ? "Đang tải..." : "-- Chọn tỉnh/thành phố --"}
            </option>
            {provinces.map((province) => (
              <option
                key={province.province_code}
                value={province.province_code}
              >
                {province.name}
              </option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <span className="material-icons-round text-lg">expand_more</span>
          </span>
        </div>
        {errors.provinceCode && (
          <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
            <span className="material-icons-round text-sm">error</span>
            {errors.provinceCode}
          </p>
        )}
      </div>

      {/* District Select */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Quận/Huyện/Phường/Xã
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
            <span className="material-icons-round text-lg">map</span>
          </span>
          <select
            id="districtCode"
            value={districtCode || ""}
            onChange={(e) => onDistrictChange(e.target.value)}
            disabled={
              !provinceCode || loadingDistricts || districts.length === 0
            }
            className={selectClassName}
          >
            <option value="">{districtPlaceholder}</option>
            {districts.map((district) => (
              <option key={district.ward_code} value={district.ward_code}>
                {district.ward_name}
              </option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <span className="material-icons-round text-lg">expand_more</span>
          </span>
        </div>
        {errors.districtCode && (
          <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
            <span className="material-icons-round text-sm">error</span>
            {errors.districtCode}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProvinceDistrictSelect;
