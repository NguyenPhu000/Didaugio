import React, { memo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatVND } from "@/components/business/dashboardWidgetHelpers";

export const ReportChartsMatrix = memo(
  ({
    reportType,
    ratingChartData,
    timelineChartData,
    servicesChartData,
  }) => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CHART 1: Primary Metric Trend */}
        <div className="p-6 sm:p-7 rounded-[36px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {reportType === "bookings" && "Xu Hướng Tần Suất Đặt Chỗ"}
                {reportType === "revenue" && "Dòng Tiền Thực Nhận & Doanh Thu Gộp"}
                {reportType === "reviews" && "Phân Phối Điểm Đánh Giá Sao"}
                {reportType === "customers" && "Lượt Khách Phục Vụ Theo Ngày"}
                {reportType === "performance" && "Tỷ Lệ Hoàn Tất Đơn Hàng"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Biểu đồ đối soát trực quan theo thời gian</p>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-emerald-800 border border-[#BBF7D0]">
              Thời gian thực
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            {reportType === "reviews" ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "18px", border: "1px solid #E2E8F0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}
                    formatter={(value) => [`${value} lượt`, "Đánh giá"]}
                  />
                  <Bar dataKey="count" radius={[12, 12, 0, 0]}>
                    {ratingChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : timelineChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Chưa có dữ liệu biểu đồ
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReportNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorReportGross" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    tickFormatter={(v) => (reportType === "revenue" ? `${(v / 1000).toFixed(0)}k` : v)}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: "18px", border: "1px solid #E2E8F0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}
                    formatter={(value, name) => [
                      reportType === "revenue" ? formatVND(value) : `${value} lượt`,
                      name === "netRevenue" ? "Doanh thu thực nhận" : name === "revenue" ? "Doanh thu gộp" : "Lượt đặt",
                    ]}
                  />
                  {reportType === "revenue" ? (
                    <>
                      <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorReportGross)" />
                      <Area type="monotone" dataKey="netRevenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorReportNet)" />
                    </>
                  ) : (
                    <Area type="monotone" dataKey="bookings" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorReportGross)" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART 2: Breakdown Volume or Top Services */}
        <div className="p-6 sm:p-7 rounded-[36px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {reportType === "bookings" && "Khối Lượng Đặt Chỗ Thành Công"}
                {reportType === "revenue" && "Phí Dịch Vụ Khấu Trừ Nền Tảng (5%)"}
                {reportType === "reviews" && "Tỷ Lệ Hài Lòng Theo Mốc Thời Gian"}
                {reportType === "customers" && "Xếp Hạng Gói Dịch Vụ Thịnh Hành"}
                {reportType === "performance" && "Lưu Lượng Phục Vụ Chi Nhánh"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Phân tích chuyên sâu cơ cấu dữ liệu</p>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#D7E5FF] text-blue-800 border border-[#BED6FF]">
              Phân khúc
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            {reportType === "customers" && servicesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={servicesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#94A3B8" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "18px", border: "1px solid #E2E8F0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}
                    formatter={(value, name) => [name === "revenue" ? formatVND(value) : `${value} đơn`, name === "revenue" ? "Doanh thu" : "Lượt đặt"]}
                  />
                  <Bar dataKey="bookings" fill="#3B82F6" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : timelineChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Chưa có dữ liệu biểu đồ
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    tickFormatter={(v) => (reportType === "revenue" ? `${(v / 1000).toFixed(0)}k` : v)}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: "18px", border: "1px solid #E2E8F0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}
                    formatter={(value) => [
                      reportType === "revenue" ? formatVND(value) : `${value} lượt`,
                      reportType === "revenue" ? "Phí sàn" : "Lượt đặt",
                    ]}
                  />
                  <Bar
                    dataKey={reportType === "revenue" ? "commission" : "bookings"}
                    fill={reportType === "revenue" ? "#F59E0B" : "#10B981"}
                    radius={[12, 12, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ReportChartsMatrix.displayName = "ReportChartsMatrix";
export default ReportChartsMatrix;
