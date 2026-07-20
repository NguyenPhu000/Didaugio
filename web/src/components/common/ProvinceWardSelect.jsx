import { useEffect, useMemo, useState } from "react";
import { locationService } from "@/apis/locationService";

const selectClassName =
  "w-full py-2.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:ring-blue-600 focus:border-blue-600 disabled:opacity-50";

const ProvinceWardSelect = ({
  provinceCode,
  wardCode,
  onProvinceChange,
  onWardChange,
  errors = {},
}) => {
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [wardQuery, setWardQuery] = useState("");
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    let active = true;
    locationService.getAllProvinces()
      .then((data) => active && setProvinces(data))
      .catch((error) => console.error("Failed to load provinces", error))
      .finally(() => active && setLoadingProvinces(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setWardQuery("");
    if (!provinceCode) {
      setWards([]);
      return () => { active = false; };
    }
    setLoadingWards(true);
    locationService.getWardsByProvince(provinceCode)
      .then((data) => active && setWards(data))
      .catch((error) => console.error("Failed to load wards", error))
      .finally(() => active && setLoadingWards(false));
    return () => { active = false; };
  }, [provinceCode]);

  const filteredWards = useMemo(() => {
    const query = wardQuery.trim().toLocaleLowerCase("vi");
    if (!query) return wards;
    return wards.filter((ward) =>
      `${ward.fullName || ward.name} ${ward.wardCode}`.toLocaleLowerCase("vi").includes(query),
    );
  }, [wardQuery, wards]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Tỉnh / Thành phố</label>
        <select
          id="provinceCode"
          value={provinceCode || ""}
          disabled={loadingProvinces}
          className={selectClassName}
          onChange={(event) => {
            onProvinceChange(event.target.value);
            onWardChange("");
          }}
        >
          <option value="">{loadingProvinces ? "Đang tải..." : "Chọn tỉnh/thành phố"}</option>
          {provinces.map((province) => (
            <option key={province.code} value={province.code}>{province.fullName || province.name}</option>
          ))}
        </select>
        {errors.provinceCode && <p className="text-sm text-red-500 mt-1">{errors.provinceCode}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Phường / Xã / Đặc khu</label>
        {provinceCode && (
          <input
            type="search"
            value={wardQuery}
            onChange={(event) => setWardQuery(event.target.value)}
            placeholder="Tìm theo tên hoặc mã hành chính"
            className={`${selectClassName} mb-2`}
          />
        )}
        <select
          id="wardCode"
          value={wardCode || ""}
          disabled={!provinceCode || loadingWards}
          className={selectClassName}
          onChange={(event) => onWardChange(event.target.value)}
        >
          <option value="">
            {!provinceCode ? "Chọn tỉnh trước" : loadingWards ? "Đang tải..." : "Chọn phường/xã/đặc khu"}
          </option>
          {filteredWards.map((ward) => (
            <option key={ward.wardCode} value={ward.wardCode}>{ward.fullName || ward.name}</option>
          ))}
        </select>
        {errors.wardCode && <p className="text-sm text-red-500 mt-1">{errors.wardCode}</p>}
      </div>
    </div>
  );
};

export default ProvinceWardSelect;
