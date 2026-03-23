import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BarChart3, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import * as businessApi from "@/apis/businessApi";
import { BOOKING_STATUS } from "@/constants/constants";
import {
  PageHeader,
  StatCard,
  SectionCard,
  StatCardSkeleton,
  SectionCardSkeleton,
  StatusProgressRow,
  formatVND,
} from "@/components/business/DashboardWidgets";

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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await businessApi.getDashboard();
        setStats(response.data);
      } catch {
        toast.error("Không thể tải dữ liệu doanh thu");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6 p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <PageHeader
        title="Doanh thu"
        subtitle="Tổng quan tài chính từ tất cả dịch vụ và đặt chỗ"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Tổng doanh thu"
              value={formatVND(stats?.totalRevenue)}
              icon={TrendingUp}
              iconColor="emerald"
              description="Từ tất cả booking hoàn thành"
            />
            <StatCard
              title="Hoa hồng hệ thống"
              value={`-${formatVND(stats?.totalCommission)}`}
              icon={TrendingDown}
              iconColor="rose"
              description="Phí nền tảng tính trên doanh thu"
            />
            <StatCard
              title="Doanh thu ròng"
              value={formatVND(stats?.netRevenue)}
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
                count={stats?.bookingsByStatus?.[key] || 0}
                total={stats?.bookingsCount || 0}
                colorClass={colorClass}
              />
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground">Tổng cộng</span>
            <span className="font-bold text-foreground">
              {stats?.bookingsCount || 0} đặt chỗ
            </span>
          </div>
        </SectionCard>
      )}
    </div>
  );
};

export default RevenuePage;
