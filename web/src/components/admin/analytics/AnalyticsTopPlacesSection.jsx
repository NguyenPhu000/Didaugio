import React, { memo } from "react";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTableSerialNumber } from "@/utils/tableSerial";

export const AnalyticsTopPlacesSection = memo(({ topViewed, t }) => {
  return (
    <section className="rounded-3xl bg-white border border-black/[0.04] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-black/[0.04]">
        <TrendingUp className="h-4 w-4 text-slate-800" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          {t("admin.analytics.topViewedPlaces")}
        </h3>
      </div>
      <div className="space-y-2">
        {(topViewed || []).map((place, i) => (
          <div
            key={place.id}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8F7F3] hover:bg-[#FAF9F5] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold tabular-nums",
                  i === 0
                    ? "bg-[#FFFDE6] text-slate-950 border border-[#F3E600]/80"
                    : i === 1
                    ? "bg-slate-200 text-slate-800"
                    : i === 2
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-400"
                )}
              >
                #{getTableSerialNumber(topViewed?.length || 0, i)}
              </span>
              <div>
                <p className="font-bold text-xs text-slate-900">{place.name}</p>
                <p className="text-[11px] font-mono text-slate-400">
                  Đánh giá:{" "}
                  {place.averageRating
                    ? `${Number(place.averageRating).toFixed(1)} ★`
                    : "Chưa có"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold text-xs text-slate-950 tabular-nums">
                {(place.viewCount || 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400">
                {t("admin.analytics.views")}
              </p>
            </div>
          </div>
        ))}
        {(!topViewed || topViewed.length === 0) && (
          <p className="text-center text-slate-400 text-xs py-8">
            {t("admin.analytics.noData")}
          </p>
        )}
      </div>
    </section>
  );
});

AnalyticsTopPlacesSection.displayName = "AnalyticsTopPlacesSection";
export default AnalyticsTopPlacesSection;
