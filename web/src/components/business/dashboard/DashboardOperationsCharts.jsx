import React, { memo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";
import { formatMoney } from "@/utils/formatters";

const STATUS_DONUT_COLORS = {
  pending: "#F59E0B",
  confirmed: "#3B82F6",
  completed: "#10B981",
  cancelled: "#EF4444",
  no_show: "#64748B",
};

const CustomAreaTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-[20px] border border-white/20 bg-slate-950/95 backdrop-blur-xl text-white p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] text-xs space-y-2 min-w-[160px] ring-1 ring-white/10">
        <p className="font-extrabold text-slate-300 tracking-wider text-[11px] uppercase border-b border-white/10 pb-1.5">
          {label}
        </p>
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color || item.fill }}
              />
              <span className="text-slate-400 font-medium">{item.name}:</span>
            </div>
            <span className="font-black text-white font-mono">
              {item.dataKey === "revenue" ? formatMoney(item.value) : `${item.value} đơn`}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const DashboardOperationsCharts = memo(
  ({
    timelineChartData,
    statusBreakdownData,
    chartMetric,
    setChartMetric,
    totalBookings,
  }) => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: AreaChart Diễn Biến Doanh Thu & Lượt Đặt (2/3 width) */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.06] p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_12px_32px_rgba(0,0,0,0.02)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Diễn Biến Tiếp Nhận & Doanh Số
                </h2>
                <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
                  Tương quan lượt đặt chỗ thực tế và doanh thu theo chu kỳ thời gian
                </p>
              </div>

              {/* Metric View Toggle Filter */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/[0.06] rounded-full self-start sm:self-auto border border-slate-200/60 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setChartMetric("both")}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    chartMetric === "both"
                      ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Cả hai
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric("bookings")}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    chartMetric === "bookings"
                      ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Lượt đặt
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric("revenue")}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    chartMetric === "revenue"
                      ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Doanh thu
                </button>
              </div>
            </div>

            {/* Recharts Area Container */}
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timelineChartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorAreaRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAreaBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#94A3B8"
                    opacity={0.15}
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#64748B" }}
                  />
                  <YAxis
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v)}
                  />
                  {chartMetric === "both" && (
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#64748B" }}
                    />
                  )}
                  <RechartsTooltip content={<CustomAreaTooltip />} />
                  {(chartMetric === "both" || chartMetric === "revenue") && (
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      name="Doanh thu"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorAreaRevenue)"
                    />
                  )}
                  {(chartMetric === "both" || chartMetric === "bookings") && (
                    <Area
                      yAxisId={chartMetric === "both" ? "right" : "left"}
                      type="monotone"
                      dataKey="bookings"
                      name="Lượt đặt chỗ"
                      stroke="#6366F1"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorAreaBookings)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
        </div>

        {/* Chart 2: Donut Status Breakdown (1/3 width) */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.06] p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_12px_32px_rgba(0,0,0,0.02)] space-y-4 flex flex-col justify-between h-full">
            <div>
              <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                Cơ Cấu Trạng Thái Đơn
              </h3>
              <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
                Tỷ trọng phân bổ các giai đoạn phục vụ
              </p>
            </div>

            {/* Donut Chart with Centered Total Value */}
            <div className="relative h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusBreakdownData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_DONUT_COLORS[entry.status] || "#94A3B8"}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(val, name) => [`${val} đơn`, name]}
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderRadius: "14px",
                      border: "none",
                      color: "#fff",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                  {totalBookings}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Tổng đơn
                </span>
              </div>
            </div>

            {/* Status Legend Pills */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
              {statusBreakdownData.map((item) => (
                <div key={item.status} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: STATUS_DONUT_COLORS[item.status] || "#94A3B8",
                      }}
                    />
                    <span className="text-slate-600 dark:text-slate-400 truncate text-[11px]">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
        </div>
      </div>
    );
  }
);

DashboardOperationsCharts.displayName = "DashboardOperationsCharts";
export default DashboardOperationsCharts;
