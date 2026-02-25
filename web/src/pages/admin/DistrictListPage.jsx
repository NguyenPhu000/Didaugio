import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ChevronDown,
  ChevronRight,
  SortAsc,
  SortDesc,
  Map,
  AlertCircle,
  Star,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as districtService from "@/apis/districtService";
import * as placeService from "@/apis/placeService";
import { ADMIN_ROUTES } from "@/constants/routes";

const STATUS_MAP = {
  approved: {
    label: "Duyệt",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  pending: {
    label: "Chờ",
    cls: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  rejected: { label: "Hủy", cls: "bg-red-50 text-red-600 border-red-200" },
  draft: { label: "Nháp", cls: "bg-gray-50 text-gray-500 border-gray-200" },
};

const STATUS_ICON = {
  approved: CheckCircle,
  pending: Clock,
  rejected: XCircle,
  draft: AlertCircle,
};

const PlaceRow = ({ place, idx }) => {
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

const DistrictRow = ({ district, places, maxCount }) => {
  const [open, setOpen] = useState(false);
  const pct = maxCount > 0 ? Math.round((places.length / maxCount) * 100) : 0;
  const sorted = [...places].sort((a, b) => a.name.localeCompare(b.name));
  const approved = places.filter((p) => p.status === "approved").length;
  const pending = places.filter((p) => p.status === "pending").length;

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
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
                {places.length === 0 && (
                  <span className="text-[10px] font-mono text-muted-foreground border border-dashed border-gray-300 px-1.5 py-0.5">
                    TRỐNG
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
              ${places.length > 0 ? "bg-black text-primary border-black" : "bg-gray-100 text-gray-400 border-gray-200"}`}
            >
              {places.length}
            </div>
          </div>
        </button>
      </Collapsible.Trigger>

      <Collapsible.Content>
        <div className="border border-t-0 border-black bg-white">
          {sorted.length > 0 ? (
            <>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="tim-meta">{sorted.length} ĐỊA ĐIỂM</span>
                <Link
                  to={`${ADMIN_ROUTES.PLACES}?districtId=${district.id}`}
                  className="text-[10px] font-mono uppercase text-primary hover:underline"
                >
                  XEM TRONG QUẢN LÝ →
                </Link>
              </div>
              {sorted.map((place, i) => (
                <PlaceRow key={place.id} place={place} idx={i} />
              ))}
            </>
          ) : (
            <div className="px-4 py-6 text-center tim-meta">
              CHƯA CÓ ĐỊA ĐIỂM NÀO
            </div>
          )}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};

const DistrictListPage = () => {
  const [districts, setDistricts] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("count_desc");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [distRes, placeRes] = await Promise.all([
          districtService.getAllDistricts(),
          placeService.getAllPlaces({ limit: 1000 }),
        ]);
        setDistricts(distRes.data || []);
        setPlaces(placeRes.data || []);
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const placesByDistrict = useMemo(() => {
    const map = {};
    places.forEach((p) => {
      const key = p.districtId ?? "none";
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [places]);

  const unassigned = placesByDistrict["none"] || [];

  const filtered = useMemo(() => {
    let list = districts.filter((d) =>
      d.name.toLowerCase().includes(search.toLowerCase()),
    );
    return list.sort((a, b) => {
      const ca = (placesByDistrict[a.id] || []).length;
      const cb = (placesByDistrict[b.id] || []).length;
      if (sort === "name_asc") return a.name.localeCompare(b.name);
      if (sort === "name_desc") return b.name.localeCompare(a.name);
      if (sort === "count_asc") return ca - cb;
      return cb - ca;
    });
  }, [districts, placesByDistrict, search, sort]);

  const maxCount = Math.max(
    ...filtered.map((d) => (placesByDistrict[d.id] || []).length),
    1,
  );
  const totalPlaces = places.length;
  const assigned = places.filter((p) => p.districtId).length;

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
              <h1 className="tim-title">QUẬN / HUYỆN</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1">
                  GEODATA // DISTRICTS
                </span>
                <p className="tim-meta">PHÂN BỐ ĐỊA ĐIỂM THEO KHU VỰC</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "KHU VỰC",
                value: districts.length,
                cls: "border-black",
              },
              {
                label: "TỔNG ĐỊA ĐIỂM",
                value: totalPlaces,
                cls: "border-primary",
              },
              {
                label: "ĐÃ PHÂN VÙNG",
                value: assigned,
                cls: "border-emerald-500 text-emerald-700",
              },
              {
                label: "CHƯA PHÂN VÙNG",
                value: unassigned.length,
                cls:
                  unassigned.length > 0
                    ? "border-yellow-400 text-yellow-700"
                    : "border-gray-300 text-gray-400",
              },
            ].map(({ label, value, cls }) => (
              <div
                key={label}
                className={`bg-white border-l-4 border border-black pl-4 py-3 pr-4 flex items-center justify-between ${cls}`}
              >
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {label}
                </span>
                <span className="font-black font-mono text-xl">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white border border-black p-4 flex flex-col sm:flex-row gap-3 shadow-sm">
          <div className="flex flex-1 shadow-sm">
            <div className="h-10 w-10 bg-black flex items-center justify-center text-white shrink-0">
              <Search className="h-4 w-4" />
            </div>
            <input
              placeholder="TÌM KIẾM QUẬN/HUYỆN..."
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
              TÊN
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
              SỐ LƯỢNG
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-black border-t-primary rounded-full animate-spin" />
            <div className="tim-meta">ĐANG TẢI DỮ LIỆU...</div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header row */}
            <div className="flex items-center gap-4 px-5 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <div className="w-4 shrink-0" />
              <div className="flex-1">KHU VỰC + PHÂN BỔ</div>
              <div className="hidden sm:block w-24 text-center">
                DUYỆT / CHỜ
              </div>
              <div className="w-16 text-center">ĐỊA ĐIỂM</div>
            </div>

            {filtered.map((district) => (
              <DistrictRow
                key={district.id}
                district={district}
                places={placesByDistrict[district.id] || []}
                maxCount={maxCount}
              />
            ))}

            {filtered.length === 0 && (
              <div className="py-12 text-center border border-dashed border-gray-300">
                <Map className="h-8 w-8 mx-auto text-gray-300 mb-3" />
                <p className="tim-meta">KHÔNG TÌM THẤY KHU VỰC PHÙ HỢP</p>
              </div>
            )}

            {/* Unassigned section */}
            {unassigned.length > 0 && !search && (
              <div className="mt-6 pt-4 border-t border-dashed border-gray-300">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="font-mono text-xs uppercase tracking-widest text-yellow-700 font-bold">
                    CHƯA PHÂN VÙNG ({unassigned.length})
                  </span>
                </div>
                <Collapsible.Root>
                  <Collapsible.Trigger asChild>
                    <button className="w-full text-left bg-yellow-50 border border-yellow-300 hover:border-yellow-500 transition-colors group">
                      <div className="flex items-center gap-4 px-5 py-4">
                        <ChevronRight className="h-4 w-4 text-yellow-500 group-data-[state=open]:hidden" />
                        <ChevronDown className="h-4 w-4 text-yellow-500 hidden group-data-[state=open]:block" />
                        <span className="flex-1 font-bold text-sm uppercase text-yellow-800">
                          Địa điểm chưa được gán quận/huyện
                        </span>
                        <div className="bg-yellow-400 text-black font-black font-mono text-lg px-3 py-1 border border-yellow-500">
                          {unassigned.length}
                        </div>
                      </div>
                    </button>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <div className="border border-t-0 border-yellow-300 bg-white">
                      {unassigned.map((place, i) => (
                        <PlaceRow key={place.id} place={place} idx={i} />
                      ))}
                    </div>
                  </Collapsible.Content>
                </Collapsible.Root>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DistrictListPage;
