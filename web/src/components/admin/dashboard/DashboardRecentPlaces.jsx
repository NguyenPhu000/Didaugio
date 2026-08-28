import { MapPin, ExternalLink, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { ADMIN_ROUTES } from "@/constants/routes";
import { useTranslation } from "react-i18next";
import { formatTableSerial } from "@/utils/tableSerial";

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

const DashboardRecentPlaces = ({ places }) => {
  const { t } = useTranslation();

  const STATUS_MAP = {
    approved: {
      label: t("dashboard.recentPlaces.approved"),
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    pending: {
      label: t("dashboard.recentPlaces.pending"),
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    },
    rejected: { label: t("dashboard.recentPlaces.cancelled"), cls: "bg-rose-50 text-rose-700 border-rose-200" },
  };

  const recent = [...places]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  return (
    <div className="rounded-3xl border border-black/[0.04] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.04] bg-[#FAF9F5]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <MapPin className="h-3.5 w-3.5" />
          </div>
          <h3 className="font-extrabold text-sm text-slate-950 tracking-tight">
            {t("dashboard.recentPlaces.title")}
          </h3>
        </div>
        <Link
          to={ADMIN_ROUTES.PLACES}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-950 transition-colors"
        >
          {t("dashboard.recentPlaces.viewAll")} <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-black/[0.04] bg-[#FAF9F5]/50 text-slate-500 font-semibold">
              <th className="text-left px-5 py-3 w-12">#</th>
              <th className="text-left px-5 py-3">{t("dashboard.recentPlaces.placeName")}</th>
              <th className="text-left px-5 py-3 hidden sm:table-cell">{t("dashboard.recentPlaces.rating")}</th>
              <th className="text-left px-5 py-3 hidden md:table-cell">{t("dashboard.recentPlaces.createdDate")}</th>
              <th className="text-left px-5 py-3">{t("dashboard.recentPlaces.status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {recent.map((place, idx) => {
              const badge = STATUS_MAP[place.status] || STATUS_MAP.pending;
              return (
                <tr
                  key={place.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="px-5 py-3 font-mono text-slate-400">
                    {formatTableSerial(recent.length, idx)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`${ADMIN_ROUTES.PLACES}/${place.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                      >
                        {place.name}
                      </Link>
                      {place.isFeatured && (
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md">
                          {t("dashboard.recentPlaces.hot")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="font-mono text-xs font-semibold text-slate-700">
                        {place.averageRating
                          ? Number(place.averageRating).toFixed(1)
                          : "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-slate-500 hidden md:table-cell">
                    {formatDate(place.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center text-[10px] font-semibold border px-2 py-0.5 rounded-full ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {recent.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-400 font-medium">
                  {t("dashboard.recentPlaces.noData")}
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
