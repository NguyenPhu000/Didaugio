import { useTranslation } from "react-i18next";
import { BarChart3, DollarSign, TrendingUp, TrendingDown, Download } from "lucide-react";
import { toast } from "sonner";
import { useBusinessDashboard } from "@/hooks/queries/useBusinessQueries";
import { BOOKING_STATUS } from "@/constants/constants";
import { exportToCsv, slugifyFilename } from "@/utils/csvExport";
import {
  StatusProgressRow,
} from "@/components/business/DashboardWidgets";
import {
  BusinessPageHeader,
  BusinessStatCard,
  BusinessStatCardSkeleton,
  BusinessSectionCard,
  BusinessSectionCardSkeleton,
} from "@/components/business/ui";
import { formatVND } from "@/components/business/dashboardWidgetHelpers";

const RevenuePage = () => {
  const { t } = useTranslation();
  const { data: statsRes, isLoading } = useBusinessDashboard();

  const stats = statsRes?.data || statsRes;
  const overview = stats?.overview || stats || {};

  const STATUS_ROWS = [
    {
      key: BOOKING_STATUS.COMPLETED,
      label: t("business.revenue.completed"),
      colorClass: "bg-emerald-500",
    },
    {
      key: BOOKING_STATUS.CONFIRMED,
      label: t("business.revenue.confirmed"),
      colorClass: "bg-blue-500",
    },
    {
      key: BOOKING_STATUS.PENDING,
      label: t("business.revenue.pending"),
      colorClass: "bg-amber-400",
    },
    { key: BOOKING_STATUS.CANCELLED, label: t("business.revenue.cancelled"), colorClass: "bg-rose-500" },
    {
      key: BOOKING_STATUS.NO_SHOW,
      label: t("business.revenue.noShow"),
      colorClass: "bg-gray-400",
    },
  ];

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

    data.push({ status: `--- ${t("business.revenue.overview")} ---`, count: "", percentage: "" });
    data.push({ status: t("business.revenue.totalRevenue"), count: totalRevenue, percentage: "" });
    data.push({ status: t("business.revenue.systemCommission"), count: totalCommission, percentage: "" });
    data.push({ status: t("business.revenue.netRevenue"), count: netRevenue, percentage: "" });
    data.push({ status: t("business.revenue.totalBookings"), count: bookingsTotal, percentage: "" });

    exportToCsv({
      columns: [
        { key: "status", label: t("business.revenue.status") },
        { key: "count", label: t("business.revenue.quantity") },
        { key: "percentage", label: t("business.revenue.ratio") },
      ],
      data,
      filename: slugifyFilename("bao_cao_doanh_thu"),
    });

    toast.success(t("business.revenue.reportExported"));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <BusinessPageHeader
          title={t("business.revenue.title")}
          description={t("business.revenue.subtitle")}
        />
        <button
          onClick={handleExportCsv}
          className="h-9 px-3 flex items-center gap-1.5 bg-zinc-950 text-white hover:bg-zinc-900 transition-colors font-mono text-xs uppercase font-bold shrink-0 rounded-lg"
        >
          <Download className="h-4 w-4" />
          CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <BusinessStatCardSkeleton key={i} />)
        ) : (
          <>
            <BusinessStatCard
              title={t("business.revenue.totalRevenue")}
              value={formatVND(overview?.totalRevenue ?? stats?.totalRevenue)}
              icon={TrendingUp}
              iconColor="emerald"
              description={t("business.revenue.totalRevenue")}
            />
            <BusinessStatCard
              title={t("business.revenue.systemCommission")}
              value={`-${formatVND(
                overview?.totalCommission ?? stats?.totalCommission
              )}`}
              icon={TrendingDown}
              iconColor="rose"
              description={t("business.revenue.systemCommission")}
            />
            <BusinessStatCard
              title={t("business.revenue.netRevenue")}
              value={formatVND(overview?.netRevenue ?? stats?.netRevenue)}
              icon={DollarSign}
              iconColor="amber"
              description={t("business.revenue.netRevenue")}
            />
          </>
        )}
      </div>

      {/* Breakdown Table */}
      {isLoading ? (
        <BusinessSectionCardSkeleton rows={5} />
      ) : (
        <BusinessSectionCard
          title={t("business.revenue.title")}
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
            <span className="font-medium text-muted-foreground">{t("business.revenue.overview")}</span>
            <span className="font-bold text-foreground">
              {overview?.bookingsTotal ?? stats?.bookingsCount ?? 0} {t("business.bookings.bookings")}
            </span>
          </div>
        </BusinessSectionCard>
      )}
    </div>
  );
};

export default RevenuePage;
