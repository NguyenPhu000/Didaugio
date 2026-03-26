import { Link } from "react-router-dom";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Star from "lucide-react/dist/esm/icons/star";
import { ADMIN_ROUTES } from "@/constants/routes";

const STATUS_MAP = {
  approved: {
    label: "ĐÃ DUYỆT",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  pending: {
    label: "CHỜ DUYỆT",
    cls: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  rejected: { label: "ĐÃ HỦY", cls: "bg-red-50 text-red-600 border-red-200" },
};

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

const DashboardRecentPlaces = ({ places }) => {
  const recent = [...places]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  return (
    <div className="border border-black bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black bg-black text-white">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="font-bold font-mono text-sm uppercase tracking-widest">
            ĐỊA ĐIỂM GẦN ĐÂY
          </h3>
        </div>
        <Link
          to={ADMIN_ROUTES.PLACES}
          className="flex items-center gap-1 text-[10px] font-mono uppercase text-gray-400 hover:text-primary transition-colors"
        >
          XEM TẤT CẢ <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                #
              </th>
              <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                TÊN ĐỊA ĐIỂM
              </th>
              <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hidden sm:table-cell">
                RATING
              </th>
              <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hidden md:table-cell">
                NGÀY TẠO
              </th>
              <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                TRẠNG THÁI
              </th>
            </tr>
          </thead>
          <tbody>
            {recent.map((place, idx) => {
              const badge = STATUS_MAP[place.status] || STATUS_MAP.pending;
              return (
                <tr
                  key={place.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors group"
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {String(idx + 1).padStart(2, "0")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`${ADMIN_ROUTES.PLACES}/${place.id}`}
                      className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1"
                    >
                      {place.name}
                    </Link>
                    {place.isFeatured && (
                      <span className="ml-2 text-[9px] font-mono uppercase bg-primary text-black px-1 py-0.5">
                        HOT
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="font-mono text-xs text-foreground">
                        {place.averageRating
                          ? Number(place.averageRating).toFixed(1)
                          : "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden md:table-cell">
                    {formatDate(place.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold font-mono border px-1.5 py-0.5 uppercase ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {recent.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center tim-meta">
                  CHƯA CÓ DỮ LIỆU
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardRecentPlaces;
