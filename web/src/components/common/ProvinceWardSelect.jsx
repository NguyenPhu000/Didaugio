import { useEffect, useMemo, useRef, useState } from "react";
import { locationService } from "@/apis/locationService";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";

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
  const [wardOpen, setWardOpen] = useState(false);
  const wardPickerRef = useRef(null);
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
    setWardOpen(false);
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
    const query = wardQuery
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("vi");
    if (!query) return wards;
    return wards.filter((ward) =>
      String(ward.fullName || ward.name)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("vi")
        .includes(query),
    );
  }, [wardQuery, wards]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (wardPickerRef.current && !wardPickerRef.current.contains(event.target)) {
        setWardOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const selectedWard = wards.find((ward) => ward.wardCode === wardCode);

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
        <div className="relative" ref={wardPickerRef}>
          <button
            id="wardCode"
            type="button"
            disabled={!provinceCode || loadingWards}
            aria-haspopup="listbox"
            aria-expanded={wardOpen}
            onClick={() => setWardOpen((open) => !open)}
            className={`${selectClassName} flex items-center justify-between text-left`}
          >
            <span className={selectedWard ? "text-slate-700 dark:text-slate-300" : "text-slate-400"}>
              {!provinceCode ? "Chọn tỉnh trước" : loadingWards ? "Đang tải..." : selectedWard?.fullName || selectedWard?.name || "Chọn phường/xã/đặc khu"}
            </span>
            {loadingWards ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          {wardOpen && provinceCode && !loadingWards ? (
            <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-800">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  autoFocus
                  type="search"
                  value={wardQuery}
                  onChange={(event) => setWardQuery(event.target.value)}
                  placeholder="Tìm phường, xã, đặc khu"
                  aria-label="Tìm kiếm phường xã"
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
                />
                {wardQuery ? (
                  <button type="button" onClick={() => setWardQuery("")} aria-label="Xóa tìm kiếm" className="text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <div className="mt-2 max-h-64 overflow-y-auto" role="listbox" aria-label="Danh sách phường xã">
                {filteredWards.length ? filteredWards.map((ward) => {
                  const selected = ward.wardCode === wardCode;
                  return (
                    <button
                      key={ward.wardCode}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onWardChange(ward.wardCode);
                        setWardOpen(false);
                        setWardQuery("");
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${selected ? "bg-blue-50 font-medium text-blue-700" : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"}`}
                    >
                      <span>{ward.fullName || ward.name}</span>
                      {selected ? <Check className="h-4 w-4 shrink-0" /> : null}
                    </button>
                  );
                }) : (
                  <p className="px-3 py-8 text-center text-sm text-slate-400">Không tìm thấy phường/xã phù hợp</p>
                )}
              </div>
            </div>
          ) : null}
        </div>
        {errors.wardCode && <p className="text-sm text-red-500 mt-1">{errors.wardCode}</p>}
      </div>
    </div>
  );
};

export default ProvinceWardSelect;
