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

const PlaceRow = ({ place, idx }) => {
  const { t } = useTranslation();
  const STATUS_MAP = getStatusMap(t);
  const badge = STATUS_MAP[place.status] || STATUS_MAP.draft;
  const Icon = STATUS_ICON[place.status] || AlertCircle;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      <span className="font-mono text-[10px] text-gray-400 w-6 shrink-0">
        {String(idx + 1).padStart(2, "0")}
      </span>
      <div className="flex-1 min-w-0">
        <Link
          to={`${ADMIN_ROUTES.PLACES}?search=${encodeURIComponent(place.name)}`}
          className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1"
        >
          {place.name}
        </Link>
        {place.address && (
          <p className="text-[10px] text-muted-foreground font-mono truncate">
            {place.address}
          </p>
        )}
      </div>
      {place.category?.name && (
        <span className="hidden sm:block text-[10px] font-mono text-muted-foreground border border-gray-200 px-1.5 py-0.5 shrink-0">
          {place.category.name}
        </span>
      )}
      {place.averageRating > 0 && (
        <div className="hidden md:flex items-center gap-1 shrink-0">
          <Star className="h-3 w-3 text-yellow-400 fill-current" />
          <span className="text-xs font-mono">
            {Number(place.averageRating).toFixed(1)}
          </span>
        </div>
      )}
      <div
        className={`flex items-center gap-1 text-[10px] font-bold border px-1.5 py-0.5 shrink-0 ${badge.cls}`}
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
  // null = not yet fetched, [] = fetched but empty, [...] = fetched with data
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
      <Collapsible.Trigger asChild>
        <button
          className={`w-full text-left bg-white border border-black transition-all duration-200 group
            ${open ? "shadow-hard" : "hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]"}`}
        >
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="shrink-0 w-4">
              {open ? (
                <ChevronDown className="h-4 w-4 text-primary" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm uppercase tracking-wide">
                  {district.name}
                </span>
                {placeCount === 0 && (
                  <span className="text-[10px] font-mono text-muted-foreground border border-dashed border-gray-300 px-1.5 py-0.5">
                    {t("admin.districts.empty")}
                  </span>
                )}
              </div>
              <div className="mt-2 h-1.5 bg-gray-100 border border-gray-200 overflow-hidden w-full max-w-xs">
                <div
                  className="h-full bg-primary transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4 shrink-0">
              {approved > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-600">
                  <CheckCircle className="h-3 w-3" /> {approved}
                </div>
              )}
              {pending > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-mono text-yellow-600">
                  <Clock className="h-3 w-3" /> {pending}
                </div>
              )}
            </div>
            <div
              className={`shrink-0 min-w-[2.5rem] text-center font-black font-mono text-lg leading-none px-3 py-1 border
              ${placeCount > 0 ? "bg-black text-primary border-black" : "bg-gray-100 text-gray-400 border-gray-200"}`}
            >
              {placeCount}
            </div>
          </div>
        </button>
      </Collapsible.Trigger>

      <Collapsible.Content>
        <div className="border border-t-0 border-black bg-white">
          {(() => {
            if (loadingPlaces) {
              return (
                <div className="flex items-center justify-center gap-2 py-6 tim-meta">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("admin.districts.loadingPlaces")}
                </div>
              );
            }

            if (sorted.length > 0) {
              return (
                <>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <span className="tim-meta">{sorted.length} {t("admin.districts.places")}</span>
                    <Link
                      to={`${ADMIN_ROUTES.PLACES}?districtId=${district.id}`}
                      className="text-[10px] font-mono uppercase text-primary hover:underline"
                    >
                      {t("admin.districts.viewInManagement")}
                    </Link>
                  </div>
                  {sorted.map((place, i) => (
                    <PlaceRow key={place.id} place={place} idx={i} />
                  ))}
                </>
              );
            }

            return (
              <div className="px-4 py-6 text-center tim-meta">
                {t("admin.districts.noPlacesYet")}
              </div>
            );
          })()}
        </div>
      </Collapsible.Content>
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
    const load = async () => {
      try {
        setLoading(true);
        const distRes = await districtService.getAllDistricts();
        setDistricts(distRes.data || []);
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const list = districts.filter((d) =>
      d.name.toLowerCase().includes(search.toLowerCase()),
    );
    return list.sort((a, b) => {
      const ca = a._count?.places || 0;
      const cb = b._count?.places || 0;
      if (sort === "name_asc") return a.name.localeCompare(b.name);
      if (sort === "name_desc") return b.name.localeCompare(a.name);
      if (sort === "count_asc") return ca - cb;
      return cb - ca;
    });
  }, [districts, search, sort]);

  const maxCount = Math.max(...filtered.map((d) => d._count?.places || 0), 1);
  const totalPlaces = districts.reduce(
    (sum, d) => sum + (d._count?.places || 0),
    0,
  );

  const toggleSort = (field) =>
    setSort((prev) =>
      prev === `${field}_desc` ? `${field}_asc` : `${field}_desc`,
    );

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-background relative">
      <div className="absolute inset-0 bg-grid-dots opacity-30 pointer-events-none" />

      <div className="relative z-10 space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between border-b-2 border-black pb-6">
          <div className="flex items-center gap-6">
            <div className="accent-bar h-16" />
            <div>
              <h1 className="tim-title">{t("admin.districts.title")}</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1">
                  {t("admin.districts.system")}
                </span>
                <p className="tim-meta">{t("admin.districts.subtitle")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Thống kê nhanh */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <TimStatsCard
              title={t("admin.districts.areas")}
              value={districts.length}
              icon={Map}
              serial="DST-001"
            />
            <TimStatsCard
              title={t("admin.districts.totalPlaces")}
              value={totalPlaces}
              icon={MapPin}
              serial="DST-002"
              color="bg-yellow-50"
            />
            <TimStatsCard
              title={t("admin.districts.hasPlaces")}
              value={filtered.filter((d) => (d._count?.places || 0) > 0).length}
              icon={CheckCircle}
              serial="DST-003"
              textColor="text-emerald-600"
            />
            <TimStatsCard
              title={t("admin.districts.emptyAreas")}
              value={
                filtered.filter((d) => (d._count?.places || 0) === 0).length
              }
              icon={EyeOff}
              serial="DST-004"
              textColor="text-gray-400"
            />
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white border border-black p-4 flex flex-col sm:flex-row gap-3 shadow-sm">
          <div className="flex flex-1 shadow-sm">
            <div className="h-10 w-10 bg-black flex items-center justify-center text-white shrink-0">
              <Search className="h-4 w-4" />
            </div>
            <input
              placeholder={t("admin.districts.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 h-10 px-4 border-y border-r border-black font-mono text-sm uppercase focus:outline-none focus:bg-primary/5 placeholder:text-gray-400"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => toggleSort("name")}
              className={`h-10 px-3 border border-black font-mono text-[10px] uppercase flex items-center gap-1.5 transition-colors
                ${sort.startsWith("name") ? "bg-black text-white" : "bg-white hover:bg-gray-50"}`}
            >
              {sort === "name_desc" ? (
                <SortDesc className="h-3.5 w-3.5" />
              ) : (
                <SortAsc className="h-3.5 w-3.5" />
              )}
              {t("admin.districts.name")}
            </button>
            <button
              onClick={() => toggleSort("count")}
              className={`h-10 px-3 border border-black font-mono text-[10px] uppercase flex items-center gap-1.5 transition-colors
                ${sort.startsWith("count") ? "bg-black text-white" : "bg-white hover:bg-gray-50"}`}
            >
              {sort === "count_desc" ? (
                <SortDesc className="h-3.5 w-3.5" />
              ) : (
                <SortAsc className="h-3.5 w-3.5" />
              )}
              {t("admin.districts.quantity")}
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-black border-t-primary rounded-full animate-spin" />
            <div className="tim-meta">{t("admin.districts.loading")}</div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header row */}
            <div className="flex items-center gap-4 px-5 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <div className="w-4 shrink-0" />
              <div className="flex-1">{t("admin.districts.areaDistribution")}</div>
              <div className="hidden sm:block w-24 text-center">
                {t("admin.districts.approvedPending")}
              </div>
              <div className="w-16 text-center">{t("admin.districts.placesLabel")}</div>
            </div>

            {filtered.map((district) => (
              <DistrictRow
                key={district.id}
                district={district}
                placeCount={district._count?.places || 0}
                maxCount={maxCount}
              />
            ))}

            {filtered.length === 0 && (
              <div className="py-12 text-center border border-dashed border-gray-300">
                <Map className="h-8 w-8 mx-auto text-gray-300 mb-3" />
                <p className="tim-meta">{t("admin.districts.noMatchingAreas")}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DistrictListPage;
