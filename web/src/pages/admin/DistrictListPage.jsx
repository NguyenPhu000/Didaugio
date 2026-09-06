import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  ChevronDown,
  ChevronRight,
  SortAsc,
  SortDesc,
  Map as MapIcon,
  MapPin,
  AlertCircle,
  Star,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  EyeOff,
  RefreshCw,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import TimStatsCard from "@/components/admin/TimStatsCard";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as districtService from "@/apis/districtService";
import * as placeService from "@/apis/placeService";
import { ADMIN_ROUTES } from "@/constants/routes";
import { formatTableSerial } from "@/utils/tableSerial";

const getStatusMap = (t) => ({
  approved: {
    label: t("admin.districts.statusApproved", "Đã duyệt"),
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  pending: {
    label: t("admin.districts.statusPending", "Chờ duyệt"),
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  rejected: {
    label: t("admin.districts.statusRejected", "Từ chối"),
    cls: "bg-rose-50 text-rose-700 border-rose-200",
  },
  draft: {
    label: t("admin.districts.statusDraft", "Bản nháp"),
    cls: "bg-slate-100 text-slate-600 border-slate-200",
  },
});

const STATUS_ICON = {
  approved: CheckCircle,
  pending: Clock,
  rejected: XCircle,
  draft: AlertCircle,
};

const PlaceRow = ({ place, serial }) => {
  const { t } = useTranslation();
  const STATUS_MAP = getStatusMap(t);
  const badge = STATUS_MAP[place.status] || STATUS_MAP.draft;
  const Icon = STATUS_ICON[place.status] || AlertCircle;
  const rating = Number(place.averageRating ?? place.ratingAvg ?? 0);

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-black/[0.03] last:border-0 hover:bg-[#FAF9F5] transition-colors">
      <span className="font-mono text-[11px] text-slate-400 w-8 shrink-0 tabular-nums">
        #{serial}
      </span>
      <div className="flex-1 min-w-0">
        <Link
          to={`${ADMIN_ROUTES.PLACES}?search=${encodeURIComponent(place.name)}`}
          className="font-bold text-xs text-slate-900 hover:text-black transition-colors line-clamp-1 flex items-center gap-1.5"
        >
          <span>{place.name}</span>
          <ExternalLink className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
        {place.address && (
          <p className="text-[11px] text-slate-400 font-medium truncate">
            {place.address}
          </p>
        )}
      </div>
      {place.category?.name && (
        <span className="hidden sm:inline-flex text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
          {place.category.name}
        </span>
      )}
      {rating > 0 && (
        <div className="hidden md:flex items-center gap-1 shrink-0 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          <Star className="h-3 w-3 text-amber-500 fill-current" />
          <span className="text-[11px] font-mono font-bold text-amber-700 tabular-nums">
            {rating.toFixed(1)}
          </span>
        </div>
      )}
      <div
        className={`flex items-center gap-1 text-[10px] font-semibold rounded-full px-2.5 py-0.5 shrink-0 ${badge.cls}`}
      >
        <Icon className="h-3 w-3" />
        {badge.label}
      </div>
    </div>
  );
};

const DistrictRow = ({
  district,
  places = [],
  maxCount,
  defaultOpen = false,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);

  const placeCount = places.length;
  const pct = maxCount > 0 ? Math.round((placeCount / maxCount) * 100) : 0;
  const sorted = useMemo(
    () => [...places].sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [places],
  );
  const approved = useMemo(
    () => places.filter((p) => p.status === "approved").length,
    [places],
  );
  const pending = useMemo(
    () => places.filter((p) => p.status === "pending").length,
    [places],
  );

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <div className="rounded-2xl border border-black/[0.04] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden transition-all">
        <Collapsible.Trigger asChild>
          <button
            type="button"
            className="w-full text-left bg-white hover:bg-[#FAF9F5] transition-all duration-200 group cursor-pointer"
          >
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="shrink-0 w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
                {open ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-900" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-900" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-sm text-slate-950">
                    {district.name}
                  </span>
                  {placeCount === 0 && (
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {t("admin.districts.empty", "Chưa có địa điểm")}
                    </span>
                  )}
                  {district.isUnassigned && (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      Cần gán quận
                    </span>
                  )}
                </div>
                <div className="mt-2 h-1.5 bg-[#F4F2EC] rounded-full overflow-hidden w-full max-w-xs">
                  <div
                    className="h-full bg-slate-950 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-3 shrink-0">
                {approved > 0 && (
                  <div className="flex items-center gap-1 text-xs font-mono font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-full">
                    <CheckCircle className="h-3 w-3 text-emerald-600" /> {approved}
                  </div>
                )}
                {pending > 0 && (
                  <div className="flex items-center gap-1 text-xs font-mono font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    <Clock className="h-3 w-3 text-amber-600" /> {pending}
                  </div>
                )}
              </div>
              <div
                className={`shrink-0 min-w-[2.5rem] text-center font-mono font-bold text-sm px-3 py-1 rounded-full border tabular-nums
                ${placeCount > 0 ? "bg-slate-900 text-white border-slate-900 shadow-xs" : "bg-slate-100 text-slate-400 border-slate-200"}`}
              >
                {placeCount}
              </div>
            </div>
          </button>
        </Collapsible.Trigger>

        <Collapsible.Content>
          <div className="border-t border-black/[0.04] bg-white">
            {sorted.length > 0 ? (
              <>
                <div className="px-5 py-2.5 bg-[#FAF9F5] border-b border-black/[0.04] flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    {sorted.length} {t("admin.districts.places", "địa điểm")}
                  </span>
                  <Link
                    to={
                      district.isUnassigned
                        ? ADMIN_ROUTES.PLACES
                        : `${ADMIN_ROUTES.PLACES}?districtId=${district.id}`
                    }
                    className="text-xs font-bold text-slate-950 hover:text-black hover:underline inline-flex items-center gap-1"
                  >
                    <span>{t("admin.districts.viewInManagement", "Xem trong Quản lý Địa điểm")}</span>
                    <span>→</span>
                  </Link>
                </div>
                {sorted.map((place, i) => (
                  <PlaceRow
                    key={place.id}
                    place={place}
                    serial={formatTableSerial(sorted.length, i)}
                  />
                ))}
              </>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                {t("admin.districts.noPlacesInArea", "Khu vực này hiện chưa có địa điểm nào.")}
              </div>
            )}
          </div>
        </Collapsible.Content>
      </div>
    </Collapsible.Root>
  );
};

const DistrictListPage = () => {
  const { t } = useTranslation();
  const [districts, setDistricts] = useState([]);
  const [allPlaces, setAllPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("count_desc");

  const fetchData = useCallback(async () => {
    try {
      const [districtsRes, placesRes] = await Promise.all([
        districtService.getAllDistricts().catch(() => ({ data: [] })),
        placeService
          .getAllPlaces({ limit: 500, page: 1 })
          .catch(() => ({ data: [] })),
      ]);

      const rawDistricts = Array.isArray(districtsRes?.data)
        ? districtsRes.data
        : Array.isArray(districtsRes)
        ? districtsRes
        : [];

      const rawPlaces = Array.isArray(placesRes?.data)
        ? placesRes.data
        : Array.isArray(placesRes?.places)
        ? placesRes.places
        : Array.isArray(placesRes)
        ? placesRes
        : [];

      setDistricts(rawDistricts);
      setAllPlaces(rawPlaces);
    } catch {
      setDistricts([]);
      setAllPlaces([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Group all places by district
  const { districtGroups, unassignedPlaces } = useMemo(() => {
    const map = new Map();
    districts.forEach((d) => map.set(Number(d.id), []));

    const unassigned = [];

    allPlaces.forEach((place) => {
      const dId = Number(place.districtId || place.district?.id);
      if (dId && map.has(dId)) {
        map.get(dId).push(place);
      } else {
        // Match by district name if districtId is not matching
        const placeDistrictName = (place.district?.name || "").toLowerCase().trim();
        const matchedDistrict = districts.find(
          (d) =>
            d.name.toLowerCase().trim() === placeDistrictName ||
            placeDistrictName.includes(d.name.toLowerCase().trim()),
        );

        if (matchedDistrict && map.has(Number(matchedDistrict.id))) {
          map.get(Number(matchedDistrict.id)).push(place);
        } else {
          unassigned.push(place);
        }
      }
    });

    return { districtGroups: map, unassignedPlaces: unassigned };
  }, [districts, allPlaces]);

  // Combine standard districts with unassigned group if any exists
  const combinedDistricts = useMemo(() => {
    const list = districts.map((d) => ({
      ...d,
      places: districtGroups.get(Number(d.id)) || [],
    }));

    if (unassignedPlaces.length > 0) {
      list.push({
        id: "unassigned",
        name: "Địa điểm chưa phân quận / Ngoài phạm vi",
        isUnassigned: true,
        places: unassignedPlaces,
      });
    }

    return list;
  }, [districts, districtGroups, unassignedPlaces]);

  // Filter & Sort
  const filtered = useMemo(() => {
    let list = combinedDistricts;
    const q = search.trim().toLowerCase();

    if (q) {
      list = list
        .map((d) => {
          const nameMatch = d.name.toLowerCase().includes(q);
          const matchedPlaces = d.places.filter(
            (p) =>
              (p.name || "").toLowerCase().includes(q) ||
              (p.address || "").toLowerCase().includes(q) ||
              (p.category?.name || "").toLowerCase().includes(q),
          );

          if (nameMatch) return d;
          if (matchedPlaces.length > 0) {
            return { ...d, places: matchedPlaces };
          }
          return null;
        })
        .filter(Boolean);
    }

    return [...list].sort((a, b) => {
      // Always put unassigned at the end
      if (a.isUnassigned) return 1;
      if (b.isUnassigned) return -1;

      if (sort === "name_asc") return a.name.localeCompare(b.name);
      if (sort === "name_desc") return b.name.localeCompare(a.name);
      const ca = a.places.length;
      const cb = b.places.length;
      if (sort === "count_asc") return ca - cb;
      return cb - ca;
    });
  }, [combinedDistricts, search, sort]);

  const maxCount = useMemo(
    () => Math.max(...combinedDistricts.map((d) => d.places.length), 1),
    [combinedDistricts],
  );

  const totalApproved = useMemo(
    () => allPlaces.filter((p) => p.status === "approved").length,
    [allPlaces],
  );

  const totalPending = useMemo(
    () => allPlaces.filter((p) => p.status === "pending").length,
    [allPlaces],
  );

  const toggleSort = (field) =>
    setSort((prev) =>
      prev === `${field}_desc` ? `${field}_asc` : `${field}_desc`,
    );

  return (
    <div className="space-y-6 text-slate-900 antialiased max-w-[1560px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-black/[0.04]">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Địa giới & Phân vùng Du lịch Cần Thơ
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            {t("admin.districts.title", "Danh sách Quận / Huyện")}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {t("admin.districts.subtitle", "Thống kê và quản lý phân bổ địa điểm du lịch theo từng địa giới hành chính")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-2xs cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
          <Link
            to={ADMIN_ROUTES.PLACES}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-950 rounded-xl hover:bg-black transition-all shadow-2xs"
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Tất cả địa điểm</span>
          </Link>
        </div>
      </header>

      {loading ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white border border-black/[0.04] p-4 animate-pulse">
              <div className="h-3.5 w-24 bg-slate-200 rounded-md mb-3" />
              <div className="h-7 w-16 bg-slate-200 rounded-lg" />
            </div>
          ))}
        </section>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TimStatsCard
            title={t("admin.districts.areas", "Quận / Huyện")}
            value={districts.length}
            icon={MapIcon}
          />
          <TimStatsCard
            title={t("admin.districts.totalPlaces", "Tổng địa điểm hệ thống")}
            value={allPlaces.length}
            icon={MapPin}
          />
          <TimStatsCard
            title={t("admin.districts.hasPlaces", "Đã duyệt & Hoạt động")}
            value={totalApproved}
            icon={CheckCircle}
          />
          <TimStatsCard
            title={t("admin.districts.emptyAreas", "Đang chờ duyệt")}
            value={totalPending}
            icon={Clock}
          />
        </section>
      )}

      <section className="bg-white rounded-2xl border border-black/[0.04] p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            placeholder={t(
              "admin.districts.searchPlaceholder",
              "Tìm theo quận/huyện, tên địa điểm hoặc địa chỉ...",
            )}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-50 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-300 placeholder:text-slate-400 transition-all border border-slate-200 focus:border-slate-400"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => toggleSort("name")}
            className={`flex-1 sm:flex-initial justify-center h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer
              ${sort.startsWith("name") ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"}`}
          >
            {sort === "name_desc" ? (
              <SortDesc className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <SortAsc className="h-3.5 w-3.5 text-slate-400" />
            )}
            {t("admin.districts.name", "Tên quận")}
          </button>
          <button
            type="button"
            onClick={() => toggleSort("count")}
            className={`flex-1 sm:flex-initial justify-center h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer
              ${sort.startsWith("count") ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"}`}
          >
            {sort === "count_desc" ? (
              <SortDesc className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <SortAsc className="h-3.5 w-3.5 text-slate-400" />
            )}
            {t("admin.districts.quantity", "Số lượng")}
          </button>
        </div>
      </section>

      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto" />
          <span className="text-xs font-semibold text-slate-500">
            {t("admin.districts.loading", "Đang tải dữ liệu phân vùng du lịch...")}
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((district) => (
            <DistrictRow
              key={district.id}
              district={district}
              places={district.places}
              maxCount={maxCount}
              defaultOpen={Boolean(search.trim())}
            />
          ))}

          {filtered.length === 0 && (
            <div className="py-16 text-center rounded-3xl bg-white border border-black/[0.04] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
              <MapIcon className="h-10 w-10 mx-auto text-slate-300 stroke-[1.5] mb-2" />
              <p className="font-bold text-slate-800">
                {t("admin.districts.noMatchingAreas", "Không tìm thấy khu vực hoặc địa điểm phù hợp")}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Vui lòng thử lại với từ khóa tìm kiếm khác hoặc bấm nút làm mới.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DistrictListPage;
