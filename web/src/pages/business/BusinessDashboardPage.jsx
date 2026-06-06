import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MapPin,
  Ticket,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileSignature,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useBusinessProfile, useBusinessDashboard } from "@/hooks/queries/useBusinessQueries";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { BOOKING_STATUS } from "@/constants/constants";
import { useAuthStore } from "@/stores/authStore";
import {
  WelcomeBanner,
  StatCard,
  SectionCard,
  StatCardSkeleton,
  SectionCardSkeleton,
  StatusProgressRow,
} from "@/components/business/DashboardWidgets";
import { formatVND } from "@/components/business/dashboardWidgetHelpers";
import { Button } from "@/components/ui/Button";

const BusinessDashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: businessRes } = useBusinessProfile();
  const { data: statsRes, isLoading } = useBusinessDashboard();

  const business = businessRes?.data || businessRes;
  const stats = statsRes?.data || statsRes;
  const overview = useMemo(() => stats?.overview || stats || {}, [stats]);
  const topServices = stats?.topServices || [];
  const period = stats?.period || null;

  const statMiniCharts = useMemo(() => {
    const places = Number(overview?.placesCount || 0);
    const services = Number(overview?.servicesCount || 0);
    const bookings = Number(
      overview?.bookingsTotal || stats?.bookingsCount || 0
    );
    const netRevenue = Number(overview?.netRevenue || 0);

    return {
      places: [
        Math.max(1, Math.floor(places * 0.35)),
        Math.max(1, Math.floor(places * 0.55)),
        Math.max(1, Math.floor(places * 0.8)),
        Math.max(1, places),
      ],
      services: [
        Math.max(1, Math.floor(services * 0.45)),
        Math.max(1, Math.floor(services * 0.65)),
        Math.max(1, Math.floor(services * 0.85)),
        Math.max(1, services),
      ],
      bookings: [
        Math.max(1, Math.floor(bookings * 0.4)),
        Math.max(1, Math.floor(bookings * 0.7)),
        Math.max(1, Math.floor(bookings * 0.9)),
        Math.max(1, bookings),
      ],
      revenue: [
        Math.max(1, Math.floor(netRevenue * 0.3)),
        Math.max(1, Math.floor(netRevenue * 0.5)),
        Math.max(1, Math.floor(netRevenue * 0.75)),
        Math.max(1, netRevenue),
      ],
    };
  }, [overview, stats?.bookingsCount]);

  const STATUS_ROWS = useMemo(() => [
    { key: BOOKING_STATUS.PENDING, label: t("business.dashboard.bookingStatus.pending"), colorClass: "bg-amber-400" },
    { key: BOOKING_STATUS.CONFIRMED, label: t("business.dashboard.bookingStatus.confirmed"), colorClass: "bg-blue-500" },
    { key: BOOKING_STATUS.COMPLETED, label: t("business.dashboard.bookingStatus.completed"), colorClass: "bg-emerald-500" },
    { key: BOOKING_STATUS.CANCELLED, label: t("business.dashboard.bookingStatus.cancelled"), colorClass: "bg-rose-500" },
    { key: BOOKING_STATUS.NO_SHOW, label: t("business.dashboard.bookingStatus.noShow"), colorClass: "bg-gray-400" },
  ], [t]);

  const CONTRACT_STATUS_CONFIG = {
    signed: {
      title: t("business.dashboard.contractStatus.signed"),
      description: t("business.dashboard.contractStatus.signedDesc"),
      icon: ShieldCheck,
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
    },
    pending: {
      title: t("business.dashboard.contractStatus.unsigned"),
      description: t("business.dashboard.contractStatus.unsignedDesc"),
      icon: AlertTriangle,
      className: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    },
  };

  const contractStatusKey = useMemo(() => {
    const isSigned =
      Boolean(business?.contractSigned) ||
      Boolean(user?.businessProfile?.contractSigned);
    return isSigned ? "signed" : "pending";
  }, [business?.contractSigned, user?.businessProfile?.contractSigned]);

  const contractStatus = CONTRACT_STATUS_CONFIG[contractStatusKey];
  const ContractStatusIcon = contractStatus.icon;

  return (
    <div className="space-y-6 p-6 lg:p-8 min-h-screen">
      {/* Welcome Banner */}
      <WelcomeBanner
        name={user?.fullName || user?.username}
        role={user?.businessProfile?.businessType || t("business.dashboard.businessOwner")}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title={t("business.dashboard.stat.places")}
              value={overview?.placesCount ?? stats?.placesCount ?? 0}
              icon={MapPin}
              iconColor="emerald"
              trend="+8%"
              miniChart={statMiniCharts.places}
              description={t("business.dashboard.stat.placesDesc")}
            />
            <StatCard
              title={t("business.dashboard.stat.services")}
              value={overview?.servicesCount ?? stats?.servicesCount ?? 0}
              icon={Ticket}
              iconColor="teal"
              trend="+5%"
              miniChart={statMiniCharts.services}
              description={t("business.dashboard.stat.servicesDesc")}
              href={BUSINESS_ROUTES.SERVICES}
            />
            <StatCard
              title={t("business.dashboard.stat.totalBookings")}
              value={overview?.bookingsTotal ?? stats?.bookingsCount ?? 0}
              icon={CalendarCheck}
              iconColor="blue"
              trend="+12%"
              miniChart={statMiniCharts.bookings}
              description={t("business.dashboard.stat.totalBookingsDesc")}
              href={BUSINESS_ROUTES.BOOKINGS}
            />
            <StatCard
              title={t("business.dashboard.stat.netRevenue")}
              value={formatVND(overview?.netRevenue ?? stats?.netRevenue)}
              icon={DollarSign}
              iconColor="amber"
              trend="+9%"
              miniChart={statMiniCharts.revenue}
              description={t("business.dashboard.stat.netRevenueDesc")}
              href={BUSINESS_ROUTES.REVENUE}
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Booking by status */}
        {isLoading ? (
          <SectionCardSkeleton rows={5} />
        ) : (
          <SectionCard
            title={t("business.dashboard.section.bookingsByStatus")}
            titleIcon={CalendarCheck}
          >
            <div className="space-y-4">
              {STATUS_ROWS.map(({ key, label, colorClass }) => (
                <StatusProgressRow
                  key={key}
                  label={label}
                  count={overview?.bookingsByStatus?.[key] || 0}
                  total={overview?.bookingsTotal || stats?.bookingsCount || 0}
                  colorClass={colorClass}
                />
              ))}
            </div>
          </SectionCard>
        )}

        {/* Revenue Summary */}
        {isLoading ? (
          <SectionCardSkeleton rows={3} />
        ) : (
          <SectionCard title={t("business.dashboard.section.revenueSummary")} titleIcon={BarChart3}>
            <div className="space-y-4">
              <div className="flex items-start justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-2 bg-emerald-100 dark:bg-emerald-950/50">
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("business.dashboard.revenue.totalRevenue")}
                    </p>
                    <p className="text-lg font-bold text-foreground leading-tight">
                      {formatVND(overview?.totalRevenue ?? stats?.totalRevenue)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-2 bg-rose-100 dark:bg-rose-950/50">
                    <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("business.dashboard.revenue.systemCommission")}
                    </p>
                    <p className="text-lg font-bold text-rose-600 dark:text-rose-400 leading-tight">
                      -
                      {formatVND(
                        overview?.totalCommission ?? stats?.totalCommission
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-2 bg-emerald-100 dark:bg-emerald-900/50">
                    <DollarSign className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                      {t("business.dashboard.revenue.netRevenue")}
                    </p>
                    <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 leading-tight">
                      {formatVND(overview?.netRevenue ?? stats?.netRevenue)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-border/60 p-2.5">
                  <p className="text-muted-foreground">{t("business.dashboard.revenue.conversionRate")}</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {overview?.conversionRate ?? 0}%
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 p-2.5">
                  <p className="text-muted-foreground">{t("business.dashboard.revenue.avgRating")}</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {(overview?.avgRating ?? 0).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {isLoading ? (
          <SectionCardSkeleton rows={3} />
        ) : (
          <SectionCard title={t("business.dashboard.section.legalCompliance")} titleIcon={FileSignature}>
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
                <div className={`rounded-lg p-2 ${contractStatus.className}`}>
                  <ContractStatusIcon className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {contractStatus.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {contractStatus.description}
                  </p>
                  {business?.contractSignedAt && (
                    <p className="text-xs text-muted-foreground">
                      {t("business.dashboard.contract.signedAt")}{" "}
                      {new Date(business.contractSignedAt).toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  )}
                </div>
              </div>

              <Button
                variant={contractStatusKey === "signed" ? "outline" : "default"}
                className="w-full gap-2"
                onClick={() => navigate(BUSINESS_ROUTES.PROFILE_CONTRACT)}
              >
                {contractStatusKey === "signed"
                  ? t("business.dashboard.contract.viewContract")
                  : t("business.dashboard.contract.completeContract")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </SectionCard>
        )}
      </div>

      {!isLoading && (
        <SectionCard title={t("business.dashboard.section.p2Operations")} titleIcon={BarChart3}>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">{t("business.dashboard.operations.pendingToday")}</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {overview?.pendingBookingsToday ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">{t("business.dashboard.operations.bookingsThisWeek")}</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {overview?.newBookingsThisWeek ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 p-3 md:col-span-2">
              <p className="text-xs text-muted-foreground">{t("business.dashboard.operations.statsPeriod")}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {period
                  ? `${period.from} → ${period.to}${period.preset ? ` (${period.preset})` : ""}`
                  : t("business.dashboard.operations.default")}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-foreground">{t("business.dashboard.operations.topServices")}</p>
            {topServices.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t("business.dashboard.operations.noServicesInPeriod")}
              </p>
            ) : (
              <div className="space-y-1.5">
                {topServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                  >
                    <p className="text-sm text-foreground truncate pr-3">
                      {service.name}
                    </p>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {t("business.dashboard.operations.serviceStats", { count: service.bookingCount, revenue: formatVND(service.revenue) })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
};

export default BusinessDashboardPage;
