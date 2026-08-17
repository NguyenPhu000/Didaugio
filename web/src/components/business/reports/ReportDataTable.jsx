import React, { memo } from "react";
import { formatVND } from "@/components/business/dashboardWidgetHelpers";

export const ReportDataTable = memo(
  ({
    reportType,
    statsData,
    ratingChartData,
    mappedStats,
    timelineChartData,
  }) => {
    return (
      <div className="p-6 sm:p-7 rounded-[36px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {reportType === "bookings" && "Bảng Kê Chi Tiết Nhật Ký Đặt Chỗ"}
              {reportType === "revenue" && "Bảng Đối Soát Dòng Tiền & Doanh Thu Thực Nhận"}
              {reportType === "reviews" && "Bảng Thống Kê Điểm Đánh Giá Chi Tiết"}
              {reportType === "customers" && "Danh Sách Gói Dịch Vụ Mang Lại Doanh Thu Cao Nhất"}
              {reportType === "performance" && "Báo Cáo Hiệu Suất & Tỷ Lệ Đáp Ứng Vận Hành"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
              Dữ liệu đối chiếu chuẩn xác theo thời gian thực
            </p>
          </div>
        </div>

        {reportType === "customers" && statsData?.topServices?.length > 0 ? (
          <div className="space-y-3 pt-1">
            {statsData.topServices.map((service, i) => (
              <div
                key={service.id || i}
                className="p-4 sm:p-5 rounded-[26px] border border-slate-100 dark:border-border/60 bg-slate-50/50 dark:bg-muted/20 hover:bg-slate-50 dark:hover:bg-muted/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    #{i + 1} {service.name}
                  </span>
                  <p className="text-xs text-slate-500 font-medium">
                    Tổng lượt đặt: <strong className="text-slate-800 dark:text-slate-200">{service.bookingCount} đơn</strong> • Đóng góp doanh thu: <strong className="text-emerald-600">{formatVND(service.revenue)}</strong>
                  </p>
                </div>

                <span className="text-base font-black text-slate-950 dark:text-white">
                  {formatVND(service.revenue)}
                </span>
              </div>
            ))}
          </div>
        ) : reportType === "reviews" && ratingChartData.length > 0 ? (
          <div className="space-y-3 pt-1">
            {ratingChartData.map((item, i) => (
              <div
                key={i}
                className="p-4 sm:p-5 rounded-[26px] border border-slate-100 dark:border-border/60 bg-slate-50/50 dark:bg-muted/20 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-slate-900 dark:text-white">{item.name}</span>
                  <span className="text-xs text-slate-400">({item.count} lượt đánh giá)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    {mappedStats.reviews.total > 0
                      ? `${((item.count / mappedStats.reviews.total) * 100).toFixed(1)}%`
                      : "0%"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : timelineChartData.length === 0 ? (
          <div className="py-14 text-center text-xs text-slate-400">
            Không có dữ liệu trong khoảng thời gian này.
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {timelineChartData.map((row, i) => (
              <div
                key={i}
                className="p-4 sm:p-5 rounded-[26px] border border-slate-100 dark:border-border/60 bg-slate-50/50 dark:bg-muted/20 hover:bg-slate-50 dark:hover:bg-muted/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    {row.name}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Lượt đặt: <strong className="text-slate-800 dark:text-slate-200">{row.bookings} đơn</strong>
                    {reportType === "revenue" && (
                      <>
                        {" "}• Phí sàn 5%: <strong className="text-amber-600">{formatVND(row.commission)}</strong>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-950 dark:text-white tracking-tight">
                      {formatVND(reportType === "revenue" ? row.netRevenue : row.revenue)}
                    </span>
                    {reportType === "revenue" && (
                      <p className="text-[10px] text-slate-400 font-bold">Thực nhận về ví</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

ReportDataTable.displayName = "ReportDataTable";
export default ReportDataTable;
