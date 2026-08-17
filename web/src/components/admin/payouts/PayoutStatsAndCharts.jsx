import React, { memo } from "react";
import { DollarSign, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatVND } from "./payoutConstants";

const StatCard = ({ title, value, icon: Icon, subtitle }) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-black/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)] transition-all duration-300 relative group overflow-hidden">
      <div className="h-0.5 w-0 group-hover:w-full bg-[#F3E600] absolute top-0 left-0 transition-all duration-300" />
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
            {title}
          </p>
          <p className="text-2xl font-black tracking-tight text-slate-950 font-mono tabular-nums">
            {value ?? 0}
          </p>
          {subtitle && (
            <p className="text-[11px] text-slate-400 font-medium">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-black/[0.04] text-slate-800 shrink-0 group-hover:bg-[#FFFDE6] group-hover:text-slate-950 transition-colors">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
};

export const PayoutStatsAndCharts = memo(
  ({ stats, statsLoading, lineChartData, statusDistributionData }) => {
    const statCards = [
      {
        title: "Tổng chờ duyệt",
        value: formatVND(stats.totalPendingAmount),
        icon: Clock,
        subtitle: `${stats.pendingCount || 0} yêu cầu`,
      },
      {
        title: "Đã xử lý hôm nay",
        value: formatVND(stats.processedTodayAmount),
        icon: CheckCircle2,
        subtitle: `${stats.processedTodayCount || 0} yêu cầu`,
      },
      {
        title: "Thời gian xử lý TB",
        value: stats.avgProcessingTime || "—",
        icon: Clock,
        subtitle: "Thời gian trung bình",
      },
      {
        title: "Thất bại",
        value: String(stats.failedCount || 0),
        icon: AlertTriangle,
        subtitle: "Yêu cầu lỗi/từ chối",
      },
    ];

    return (
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-black/[0.04] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <Skeleton className="h-3 w-24 rounded-lg" />
                    <Skeleton className="h-8 w-32 rounded-lg" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-xl" />
                </div>
              ))
            : statCards.map((card) => (
                <StatCard
                  key={card.title}
                  title={card.title}
                  value={card.value}
                  icon={card.icon}
                  subtitle={card.subtitle}
                />
              ))}
        </div>

        {/* Charts Row */}
        {!statsLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-3xl bg-white border border-black/[0.04] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
              <div className="pb-4 border-b border-black/[0.04] flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[#F3E600]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Xu hướng yêu cầu rút tiền theo ngày
                </h3>
              </div>
              <div className="h-64 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={lineChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <YAxis
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickFormatter={(val) =>
                        val >= 1000000
                          ? `${(val / 1000000).toFixed(1)}M`
                          : val >= 1000
                          ? `${(val / 1000).toFixed(0)}k`
                          : val
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid rgba(0,0,0,0.05)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                      }}
                      formatter={(value) => [
                        `${Number(value).toLocaleString("vi-VN")} đ`,
                        "Số tiền",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#0f172a"
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: "#0f172a" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-black/[0.04] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
              <div className="pb-4 border-b border-black/[0.04] flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-800" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Cơ cấu trạng thái rút tiền
                </h3>
              </div>
              <div className="h-64 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid rgba(0,0,0,0.05)",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

PayoutStatsAndCharts.displayName = "PayoutStatsAndCharts";
export default PayoutStatsAndCharts;
