import { useState, useEffect } from "react";
import { Label } from "@/components/ui";
import { locationService } from "@/services/locationService";

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

  return (
    <div className="space-y-4">
      {/* Province Select */}
      <div>
        <Label htmlFor="provinceCode">Tỉnh/Thành phố</Label>
        <select
          id="provinceCode"
          value={provinceCode || ""}
          onChange={handleProvinceChange}
          disabled={loadingProvinces}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">
            {loadingProvinces ? "Đang tải..." : "-- Chọn tỉnh/thành phố --"}
          </option>
          {provinces.map((province) => (
            <option key={province.province_code} value={province.province_code}>
              {province.name}
            </option>
          ))}
        </select>
        {errors.provinceCode && (
          <p className="text-sm text-red-500 mt-1">{errors.provinceCode}</p>
        )}
      </div>

      {/* District Select */}
      <div>
        <Label htmlFor="districtCode">Quận/Huyện/Phường/Xã</Label>
        <select
          id="districtCode"
          value={districtCode || ""}
          onChange={(e) => onDistrictChange(e.target.value)}
          disabled={!provinceCode || loadingDistricts || districts.length === 0}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">
            {loadingDistricts
              ? "Đang tải..."
              : !provinceCode
              ? "Vui lòng chọn tỉnh/thành phố trước"
              : "-- Chọn quận/huyện/phường/xã --"}
          </option>
          {districts.map((district) => (
            <option key={district.ward_code} value={district.ward_code}>
              {district.ward_name}
            </option>
          ))}
        </select>
        {errors.districtCode && (
          <p className="text-sm text-red-500 mt-1">{errors.districtCode}</p>
        )}
      </div>
    </div>
  );
};

export default ProvinceDistrictSelect;
