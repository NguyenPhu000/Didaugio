import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Navigation2, Flag, X } from "lucide-react";

export const MapRoutingBar = memo(
  ({ routingMode, routing, setRoutingMode }) => {
    const { t } = useTranslation();

    if (!routingMode) return null;

    return (
      <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-950 border-b border-white/[0.08] flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <Navigation2 className="w-2.5 h-2.5 text-white fill-white" />
          </div>
          <span className="text-xs text-slate-200 font-medium truncate">
            {routing.origin?.name ?? (
              <span className="text-slate-400 italic">
                {t("admin.map.selectOrigin")}
              </span>
            )}
          </span>
        </div>

        <span className="text-[#F3E600] font-mono shrink-0">→</span>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center shrink-0">
            <Flag className="w-2.5 h-2.5 text-white fill-white" />
          </div>
          <span className="text-xs text-slate-200 font-medium truncate">
            {routing.destination?.name ?? (
              <span className="text-slate-400 italic">
                {t("admin.map.selectDestination")}
              </span>
            )}
          </span>
        </div>

        {routing.routeInfo && (
          <div className="flex items-center gap-2.5 shrink-0 bg-white/[0.1] rounded-full px-3 py-1 border border-white/[0.1]">
            <span className="text-xs font-mono font-bold text-[#F3E600] tabular-nums">
              {routing.routeInfo.distanceLabel}
            </span>
            <span className="text-[10px] text-slate-300 font-mono">
              {routing.routeInfo.durationLabel}
            </span>
          </div>
        )}

        {routing.loading && (
          <span className="text-xs text-[#F3E600] italic shrink-0">
            {t("admin.map.findingRoute")}
          </span>
        )}
        {routing.error && (
          <span className="text-xs text-rose-400 shrink-0">
            {routing.error}
          </span>
        )}

        <button
          type="button"
          onClick={() => {
            routing.clearRoute();
            setRoutingMode(false);
          }}
          className="shrink-0 text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label={t("admin.map.closeRouting")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }
);

MapRoutingBar.displayName = "MapRoutingBar";
export default MapRoutingBar;
