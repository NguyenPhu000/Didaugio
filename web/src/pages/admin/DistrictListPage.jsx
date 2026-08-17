import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  ChevronDown,
  ChevronRight,
  SortAsc,
  SortDesc,
  Map,
  MapPin,
  AlertCircle,
  Star,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  EyeOff,
} from "lucide-react";
import TimStatsCard from "@/components/admin/TimStatsCard";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as districtService from "@/apis/districtService";
import * as placeService from "@/apis/placeService";
import { ADMIN_ROUTES } from "@/constants/routes";
import { formatTableSerial } from "@/utils/tableSerial";

const getStatusMap = (t) => ({
  approved: {
    label: t("admin.districts.statusApproved"),
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  pending: {
    label: t("admin.districts.statusPending"),
    cls: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  rejected: { label: t("admin.districts.statusRejected"), cls: "bg-red-50 text-red-600 border-red-200" },
  draft: { label: t("admin.districts.statusDraft"), cls: "bg-gray-50 text-gray-500 border-gray-200" },
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
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-black/[0.03] last:border-0 hover:bg-[#FAF9F5] transition-colors">
      <span className="font-mono text-[11px] text-slate-400 w-8 shrink-0 tabular-nums">
        #{serial}
      </span>
      <div className="flex-1 min-w-0">
        <Link
          to={`${ADMIN_ROUTES.PLACES}?search=${encodeURIComponent(place.name)}`}
          className="font-bold text-xs text-slate-900 hover:text-black transition-colors line-clamp-1"
        >
          {place.name}
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
      {place.averageRating > 0 && (
        <div className="hidden md:flex items-center gap-1 shrink-0 bg-[#FFFDE6] px-2 py-0.5 rounded-full border border-[#F3E600]/80">
          <Star className="h-3 w-3 text-slate-900 fill-current" />
          <span className="text-[11px] font-mono font-bold text-slate-900 tabular-nums">
            {Number(place.averageRating).toFixed(1)}
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

const DistrictRow = ({ district, placeCount, maxCount }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [places, setPlaces] = useState(null);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  const pct = maxCount > 0 ? Math.round((placeCount / maxCount) * 100) : 0;
  const sorted = places
    ? [...places].sort((a, b) => a.name.localeCompare(b.name))
    : [];
  const approved = places
    ? places.filter((p) => p.status === "approved").length
    : 0;
  const pending = places
    ? places.filter((p) => p.status === "pending").length
    : 0;

  const handleToggle = async (isOpen) => {
    setOpen(isOpen);
    if (isOpen && places === null) {
      setLoadingPlaces(true);
      try {
        const res = await placeService.getAllPlaces({
          districtId: district.id,
          limit: 500,
          page: 1,
        });
        setPlaces(res.data || []);
      } catch {
        setPlaces([]);
      } finally {
        setLoadingPlaces(false);
      }
    }
  };

  return (
    <Collapsible.Root open={open} onOpenChange={handleToggle}>
      <div className="rounded-2xl border border-black/[0.04] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden transition-all">
        <Collapsible.Trigger asChild>
          <button
            type="button"
            className="w-full text-left bg-white hover:bg-[#FAF9F5] transition-all duration-200 group"
          >
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="shrink-0 w-6 h-6 rounded-lg bg-[#F8F7F3] group-hover:bg-[#FFFDE6] flex items-center justify-center transition-colors">
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
                      {t("admin.districts.empty")}
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
                className={`shrink-0 min-w-[2.5rem] text-center font-mono font-black text-sm px-3 py-1 rounded-full border tabular-nums
                ${placeCount > 0 ? "bg-slate-950 text-[#F3E600] border-slate-950 shadow-2xs" : "bg-slate-100 text-slate-400 border-slate-200"}`}
              >
                {placeCount}
              </div>
            </div>
          </button>
        </Collapsible.Trigger>

        <Collapsible.Content>
          <div className="border-t border-black/[0.04] bg-white">
            {(() => {
              if (loadingPlaces) {
                return (
                  <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
                    {t("admin.districts.loadingPlaces")}
                  </div>
                );
              }

              if (sorted.length > 0) {
                return (
                  <>
                    <div className="px-5 py-2.5 bg-[#FAF9F5] border-b border-black/[0.04] flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">{sorted.length} {t("admin.districts.places")}</span>
                      <Link
                        to={`${ADMIN_ROUTES.PLACES}?districtId=${district.id}`}
                        className="text-xs font-bold text-slate-950 hover:text-black hover:underline"
                      >
                        {t("admin.districts.viewInManagement")} →
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
                );
              }

              return (
                <div className="py-6 text-center text-xs text-slate-400">
                  {t("admin.districts.noPlacesInArea")}
                </div>
              );
            })()}
          </div>
        </Collapsible.Content>
      </div>
    </Collapsible.Root>
  );
};

const DistrictListPage = () => {
  const { t } = useTranslation();
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("count_desc");

  useEffect(() => {
    districtService
      .getAllDistricts()
      .then((res) => {
        setDistricts(res.data || []);
      })
      .catch(() => {
        setDistricts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = districts;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sort === "name_asc") return a.name.localeCompare(b.name);
      if (sort === "name_desc") return b.name.localeCompare(a.name);
      const ca = a._count?.places || 0;
      const cb = b._count?.places || 0;
      if (sort === "count_asc") return ca - cb;
      return cb - ca;
    });
  }, [districts, search, sort]);

  const maxCount = useMemo(
    () => Math.max(...districts.map((d) => d._count?.places || 0), 1),
    [districts],
  );

  const totalPlaces = districts.reduce(
    (sum, d) => sum + (d._count?.places || 0),
    0,
  );

  const toggleSort = (field) =>
    setSort((prev) =>
      prev === `${field}_desc` ? `${field}_asc` : `${field}_desc`,
    );

  return (
    <div className="space-y-6 text-slate-900 antialiased selection:bg-[#F3E600] selection:text-slate-950 max-w-[1560px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-black/[0.04]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#F3E600] shadow-[0_0_6px_#F3E600]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Địa giới & Phân vùng Du lịch
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            {t("admin.districts.title")}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {t("admin.districts.subtitle")}
          </p>
        </div>
      </header>

      {!loading && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TimStatsCard
            title={t("admin.districts.areas")}
            value={districts.length}
            icon={Map}
          />
          <TimStatsCard
            title={t("admin.districts.totalPlaces")}
            value={totalPlaces}
            icon={MapPin}
          />
          <TimStatsCard
            title={t("admin.districts.hasPlaces")}
            value={filtered.filter((d) => (d._count?.places || 0) > 0).length}
            icon={CheckCircle}
          />
          <TimStatsCard
            title={t("admin.districts.emptyAreas")}
            value={
              filtered.filter((d) => (d._count?.places || 0) === 0).length
            }
            icon={EyeOff}
          />
        </section>
      )}

      <section className="bg-white rounded-2xl border border-black/[0.04] p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            placeholder={t("admin.districts.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-[#F8F7F3] rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#F3E600] placeholder:text-slate-400 transition-all border border-transparent focus:border-[#F3E600]/50"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => toggleSort("name")}
            className={`flex-1 sm:flex-initial justify-center h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs
              ${sort.startsWith("name") ? "bg-slate-950 text-white" : "bg-[#F8F7F3] text-slate-700 hover:bg-[#F4F2EC] border border-black/[0.04]"}`}
          >
            {sort === "name_desc" ? (
              <SortDesc className="h-3.5 w-3.5 text-[#F3E600]" />
            ) : (
              <SortAsc className="h-3.5 w-3.5 text-[#F3E600]" />
            )}
            {t("admin.districts.name")}
          </button>
          <button
            type="button"
            onClick={() => toggleSort("count")}
            className={`flex-1 sm:flex-initial justify-center h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs
              ${sort.startsWith("count") ? "bg-slate-950 text-white" : "bg-[#F8F7F3] text-slate-700 hover:bg-[#F4F2EC] border border-black/[0.04]"}`}
          >
            {sort === "count_desc" ? (
              <SortDesc className="h-3.5 w-3.5 text-[#F3E600]" />
            ) : (
              <SortAsc className="h-3.5 w-3.5 text-[#F3E600]" />
            )}
            {t("admin.districts.quantity")}
          </button>
        </div>
      </section>

      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-9 h-9 border-3 border-slate-950 border-t-[#F3E600] rounded-full animate-spin mx-auto" />
          <span className="text-xs font-semibold text-slate-500">{t("admin.districts.loading")}</span>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((district) => (
            <DistrictRow
              key={district.id}
              district={district}
              placeCount={district._count?.places || 0}
              maxCount={maxCount}
            />
          ))}

          {filtered.length === 0 && (
            <div className="py-16 text-center rounded-3xl bg-white border border-black/[0.04] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
              <Map className="h-10 w-10 mx-auto text-slate-300 stroke-[1.5] mb-2" />
              <p className="font-bold text-slate-800">{t("admin.districts.noMatchingAreas")}</p>
              <p className="text-xs text-slate-500 mt-1">Vui lòng thử lại với từ khóa tìm kiếm khác.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DistrictListPage;
