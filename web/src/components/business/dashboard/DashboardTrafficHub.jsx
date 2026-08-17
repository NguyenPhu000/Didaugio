import React, { memo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PlaceHeatmap from "@/components/analytics/PlaceHeatmap";

export const DashboardTrafficHub = memo(
  ({
    trafficPeriod,
    setTrafficPeriod,
    trafficSummary,
    placesTraffic,
    heatmapAction,
    setHeatmapAction,
    placeHeatmap,
  }) => {
    return (
      <div className="p-1.5 rounded-[36px] bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
        <div className="p-6 sm:p-7 rounded-[30px] bg-white dark:bg-slate-900/90 border border-slate-200/40 dark:border-white/[0.04] space-y-6">
          {/* Header & Period Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-white/[0.04]">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                <h3 className="font-black text-base text-slate-900 dark:text-white tracking-tight">
                  Lưu Lượng Truy Cập & Đề Xuất AI Theo Địa Điểm
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
                Thống kê lưu lượng du khách hôm nay, số lần AI đưa vào lịch trình gợi ý và yêu cầu chỉ đường GPS
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Select value={trafficPeriod} onValueChange={setTrafficPeriod}>
                <SelectTrigger className="w-36 h-8 text-xs rounded-full bg-slate-50 dark:bg-muted border-slate-200 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="today" className="text-xs font-medium">
                    Hôm nay (24h)
                  </SelectItem>
                  <SelectItem value="7d" className="text-xs font-medium">
                    7 ngày qua
                  </SelectItem>
                  <SelectItem value="30d" className="text-xs font-medium">
                    30 ngày qua
                  </SelectItem>
                  <SelectItem value="90d" className="text-xs font-medium">
                    90 ngày qua
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 4 Real-time Traffic KPI Pods */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Metric 1: Lượt Xem Cơ Sở */}
            <div className="p-3.5 rounded-[22px] bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 space-y-1">
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
            <div className="p-3.5 rounded-[22px] bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 space-y-1">
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
            <div className="p-3.5 rounded-[22px] bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 space-y-1">
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
            <div className="p-3.5 rounded-[22px] bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 space-y-1">
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

          {/* By-Place Breakdown Table */}
          {placesTraffic.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Chi Tiết Theo Từng Cơ Sở & Chi Nhánh
                </h4>
                <span className="text-[11px] font-semibold text-slate-500">
                  {placesTraffic.length} cơ sở đang theo dõi
                </span>
              </div>

              <div className="overflow-x-auto rounded-[22px] border border-slate-100 dark:border-white/[0.04]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 dark:bg-slate-950 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-white/[0.04]">
                    <tr>
                      <th className="py-3 px-4">Cơ sở / Địa điểm</th>
                      <th className="py-3 px-3 text-center">Xem hôm nay</th>
                      <th className="py-3 px-3 text-center">AI đề xuất</th>
                      <th className="py-3 px-3 text-center">Chỉ đường</th>
                      <th className="py-3 px-3 text-center">Đặt chỗ</th>
                      <th className="py-3 px-4 text-right">Đánh giá</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {placesTraffic.map((p) => (
                      <tr
                        key={p.placeId}
                        className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white truncate max-w-[220px]">
                            {p.placeName}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[220px]">
                            {p.address || "Cần Thơ"}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono font-black text-sky-600 dark:text-sky-400">
                            {p.todayViews}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            ({p.totalViews})
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                            {p.todayAiRecommendations}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            ({p.totalAiRecommendations})
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                            {p.todayDirections}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            ({p.totalDirections})
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {p.totalBookings} đơn
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-500">
                          ★ {p.ratingAvg.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Spatial Heatmap Visualizer */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Bản Đồ Nhiệt Mật Độ Phân Bổ Du Khách
              </h4>

              <Select value={heatmapAction} onValueChange={setHeatmapAction}>
                <SelectTrigger className="w-44 h-7 text-[11px] rounded-full bg-slate-50 dark:bg-muted border-slate-200 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all" className="text-xs font-medium">
                    Tất cả tương tác
                  </SelectItem>
                  <SelectItem value="VIEW" className="text-xs font-medium">
                    Lượt xem cơ sở
                  </SelectItem>
                  <SelectItem value="DIRECTION" className="text-xs font-medium">
                    Yêu cầu chỉ đường
                  </SelectItem>
                  <SelectItem value="BOOKING_CLICK" className="text-xs font-medium">
                    Nhấn đặt chỗ
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-[24px] overflow-hidden border border-slate-100 dark:border-border/60">
              <PlaceHeatmap {...placeHeatmap} />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

DashboardTrafficHub.displayName = "DashboardTrafficHub";
export default DashboardTrafficHub;
