import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import {
  Star,
  AlertTriangle,
  MessageSquare,
  EyeOff,
  Tag,
  ShieldAlert,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

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

export const ReviewModerationStats = memo(
  ({ stats, ratingDistributionData, moderationStatusData }) => {
    const { t } = useTranslation();

    if (!stats) return null;

    return (
      <div className="space-y-6">
        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <StatCard
            title={t("admin.reviewModeration.totalReviews")}
            value={stats.total}
            icon={Star}
            subtitle="Tất cả đánh giá"
          />
          <StatCard
            title={t("admin.reviewModeration.reported")}
            value={stats.reported}
            icon={AlertTriangle}
            subtitle="Cần kiểm tra"
          />
          <StatCard
            title={t("admin.reviewModeration.pending")}
            value={stats.pending}
            icon={MessageSquare}
            subtitle="Đang chờ duyệt"
          />
          <StatCard
            title={t("admin.reviewModeration.hidden")}
            value={stats.hidden}
            icon={EyeOff}
            subtitle="Đã bị ẩn"
          />
          <StatCard
            title={t("admin.reviewModeration.seedData")}
            value={stats.seeded ?? 0}
            icon={Tag}
            subtitle="Dữ liệu mẫu"
          />
          <StatCard
            title={t("admin.reviewModeration.avgRating")}
            value={stats.avgRating}
            icon={Star}
            subtitle="Điểm trung bình"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl bg-white border border-black/[0.04] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            <div className="pb-4 border-b border-black/[0.04] flex items-center gap-2">
              <Star className="h-4 w-4 text-[#F3E600]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Phân phối số sao đánh giá (Ước tính)
              </h3>
            </div>
            <div className="h-64 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ratingDistributionData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="star"
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid rgba(0,0,0,0.05)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Số lượng đánh giá"
                    fill="#0f172a"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-black/[0.04] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            <div className="pb-4 border-b border-black/[0.04] flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-slate-800" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Cơ cấu trạng thái duyệt
              </h3>
            </div>
            <div className="h-64 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={moderationStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {moderationStatusData.map((entry, index) => (
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
      </div>
    );
  }
);

ReviewModerationStats.displayName = "ReviewModerationStats";
export default ReviewModerationStats;
