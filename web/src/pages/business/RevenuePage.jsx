import { useEffect, useState } from "react";
import { BarChart3, DollarSign, TrendingUp, TrendingDown, Download } from "lucide-react";
import toast from "react-hot-toast";
import useBusinessStore from "@/stores/businessStore";
import { BOOKING_STATUS } from "@/constants/constants";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import { exportToCsv, slugifyFilename } from "@/utils/csvExport";
import {
  PageHeader,
  StatCard,
  SectionCard,
  StatCardSkeleton,
  SectionCardSkeleton,
  StatusProgressRow,
} from "@/components/business/DashboardWidgets";
import { formatVND } from "@/components/business/dashboardWidgetHelpers";

const STATUS_ROWS = [
  {
    key: BOOKING_STATUS.COMPLETED,
    label: "Hoàn thành",
    colorClass: "bg-emerald-500",
  },
  {
    key: BOOKING_STATUS.CONFIRMED,
    label: "Đã xác nhận",
    colorClass: "bg-blue-500",
  },
  {
    key: BOOKING_STATUS.PENDING,
    label: "Chờ xác nhận",
    colorClass: "bg-amber-400",
  },
  { key: BOOKING_STATUS.CANCELLED, label: "Đã hủy", colorClass: "bg-rose-500" },
  {
    key: BOOKING_STATUS.NO_SHOW,
    label: "Không đến",
    colorClass: "bg-gray-400",
  },
];

const RevenuePage = () => {
  const dashboardStats = useBusinessStore((s) => s.dashboardStats);
  const fetchDashboard = useBusinessStore((s) => s.fetchDashboard);
  const [loading, setLoading] = useState(true);

  const stats = dashboardStats;
  const overview = stats?.overview || stats || {};

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        await fetchDashboard();
      } catch (error) {
        if (!cancelled) {
          toastApiErrorIfNeeded(error, "Không thể tải dữ liệu doanh thu");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchDashboard]);

  const handleExportCsv = () => {
    const totalRevenue = overview?.totalRevenue ?? stats?.totalRevenue ?? 0;
    const totalCommission = overview?.totalCommission ?? stats?.totalCommission ?? 0;
    const netRevenue = overview?.netRevenue ?? stats?.netRevenue ?? 0;
    const bookingsTotal = overview?.bookingsTotal ?? stats?.bookingsCount ?? 0;
    const byStatus = overview?.bookingsByStatus || {};

    const data = STATUS_ROWS.map(({ key, label }) => ({
      status: label,
      count: byStatus[key] || 0,
      percentage: bookingsTotal > 0 ? (((byStatus[key] || 0) / bookingsTotal) * 100).toFixed(1) + "%" : "0%",
    }));

    // Add summary rows
    data.push({ status: "--- TỔNG QUAN ---", count: "", percentage: "" });
    data.push({ status: "Tổng doanh thu", count: totalRevenue, percentage: "" });
    data.push({ status: "Hoa hồng hệ thống", count: totalCommission, percentage: "" });
    data.push({ status: "Doanh thu ròng", count: netRevenue, percentage: "" });
    data.push({ status: "Tổng đặt chỗ", count: bookingsTotal, percentage: "" });

    exportToCsv({
      columns: [
        { key: "status", label: "Trạng thái" },
        { key: "count", label: "Số lượng" },
        { key: "percentage", label: "Tỷ lệ" },
      ],
      data,
      filename: slugifyFilename("bao_cao_doanh_thu"),
    });

    toast.success("Đã xuất báo cáo doanh thu");
  };

  return (
    <div className="space-y-6 p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="Doanh thu"
          subtitle="Tổng quan tài chính từ tất cả dịch vụ và đặt chỗ"
        />
        <button
          onClick={handleExportCsv}
          className="h-9 px-3 flex items-center gap-1.5 border border-black bg-white hover:bg-black hover:text-white transition-colors font-mono text-xs uppercase font-bold shrink-0"
        >
          <Download className="h-4 w-4" />
          CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Tổng doanh thu"
              value={formatVND(overview?.totalRevenue ?? stats?.totalRevenue)}
              icon={TrendingUp}
              iconColor="emerald"
              description="Từ tất cả booking hoàn thành"
            />
            <StatCard
              title="Hoa hồng hệ thống"
              value={`-${formatVND(
                overview?.totalCommission ?? stats?.totalCommission,
              )}`}
              icon={TrendingDown}
              iconColor="rose"
              description="Phí nền tảng tính trên doanh thu"
            />
            <StatCard
              title="Doanh thu ròng"
              value={formatVND(overview?.netRevenue ?? stats?.netRevenue)}
              icon={DollarSign}
              iconColor="amber"
              description="Sau khi trừ hoa hồng"
            />
          </>
        )}
      </div>

      {/* Breakdown Table */}
      {loading ? (
        <SectionCardSkeleton rows={5} />
      ) : (
        <SectionCard
          title="Chi tiết theo trạng thái đặt chỗ"
          titleIcon={BarChart3}
        >
          <div className="space-y-5">
            {STATUS_ROWS.map(({ key, label, colorClass }) => (
              <StatusProgressRow
                key={key}
                label={label}
                count={overview?.bookingsByStatus?.[key] || 0}
                total={overview?.bookingsTotal ?? stats?.bookingsCount ?? 0}
                colorClass={colorClass}
              />
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground">Tổng cộng</span>
            <span className="font-bold text-foreground">
              {overview?.bookingsTotal ?? stats?.bookingsCount ?? 0} đặt chỗ
            </span>
          </div>
        </SectionCard>
      )}
    </div>
  );
};

export default RevenuePage;
