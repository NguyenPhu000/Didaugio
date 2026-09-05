import React, { memo } from "react";
import { RefreshCw } from "lucide-react";
import PlaceHeatmap from "@/components/analytics/PlaceHeatmap";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const PlaceTrafficHeatmapTab = memo(
  ({
    trafficSummary,
    heatmapAction,
    setHeatmapAction,
    heatmapRange,
    setHeatmapRange,
    heatmapData,
    heatmapLoading,
    heatmapError,
    trafficLoading,
    refetchHeatmap,
    refetchTraffic,
  }) => {
    return (
      <div className="space-y-6">
        {/* 4 Real-time Traffic KPI Pods */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Metric 1: Lượt Xem Cơ Sở */}
          <div className="p-4 rounded-[26px] bg-sky-50/70 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300 block">
              Lượt Xem Hôm Nay
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                {trafficSummary.todayViews}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                / {trafficSummary.totalViews} tổng
              </span>
            </div>
          </div>

          {/* Metric 2: AI Đề Xuất Lịch Trình */}
          <div className="p-4 rounded-[26px] bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
              AI Đề Xuất Lịch Trình
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                {trafficSummary.todayAiRecommendations}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                / {trafficSummary.totalAiRecommendations} tổng
              </span>
            </div>
          </div>

          {/* Metric 3: Chỉ Đường GPS */}
          <div className="p-4 rounded-[26px] bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
              Chỉ Đường GPS
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                {trafficSummary.todayDirections}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                / {trafficSummary.totalDirections} tổng
              </span>
            </div>
          </div>

          {/* Metric 4: Nhấn Đặt Chỗ */}
          <div className="p-4 rounded-[26px] bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
              Quan Tâm Dịch Vụ
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                {trafficSummary.todayBookingClicks}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                / {trafficSummary.totalBookingClicks} tổng
              </span>
            </div>
          </div>
        </div>

        {/* Heatmap Control & Filter Bar */}
        <div className="p-4 sm:p-5 rounded-[32px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "all", label: "Tất cả tương tác" },
              { id: "VIEW", label: "Lượt xem" },
              { id: "DIRECTION", label: "Chỉ đường" },
              { id: "BOOKING_CLICK", label: "Đặt chỗ" },
              { id: "SHARE", label: "Chia sẻ" },
            ].map((act) => (
              <button
                key={act.id}
                type="button"
                onClick={() => setHeatmapAction(act.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all",
                  heatmapAction === act.id
                    ? "bg-slate-950 text-white dark:bg-primary dark:text-primary-foreground shadow-xs"
                    : "bg-slate-100 dark:bg-muted text-slate-600 dark:text-muted-foreground hover:text-slate-950"
                )}
              >
                {act.label}
              </button>
            ))}
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            {[
              { id: "7d", label: "7 ngày" },
              { id: "30d", label: "30 ngày" },
              { id: "90d", label: "90 ngày" },
              { id: "1y", label: "1 năm" },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setHeatmapRange(r.id)}
                className={cn(
                  "px-3 py-1.5 rounded-2xl text-xs font-bold transition-all",
                  heatmapRange === r.id
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-slate-50 dark:bg-muted/60 text-slate-500 border border-slate-200/60 dark:border-border/60 hover:text-slate-900"
                )}
              >
                {r.label}
              </button>
            ))}

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                refetchHeatmap();
                refetchTraffic();
              }}
              className="rounded-2xl h-8 px-3 text-xs font-bold border-slate-200 dark:border-border/80"
            >
              <RefreshCw
                className={cn(
                  "w-3 h-3 mr-1",
                  (heatmapLoading || trafficLoading) && "animate-spin"
                )}
              />{" "}
              Tải lại
            </Button>
          </div>
        </div>

        {/* The Live Heatmap Canvas */}
        <div className="rounded-[36px] overflow-hidden border border-slate-200/80 dark:border-border/80 shadow-md">
          <PlaceHeatmap
            data={heatmapData}
            isLoading={heatmapLoading}
            isError={heatmapError}
          />
        </div>
      </div>
    );
  }
);

PlaceTrafficHeatmapTab.displayName = "PlaceTrafficHeatmapTab";
export default PlaceTrafficHeatmapTab;
