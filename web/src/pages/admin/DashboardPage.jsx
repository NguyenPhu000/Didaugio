import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useDashboardStats } from "@/hooks/queries/useDashboardQuery";
import { useCategories } from "@/hooks/queries/useCategoryQueries";
import { usePlaces } from "@/hooks/queries/usePlaceQueries";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";

// Admin components
import SectionCards from "@/components/admin/SectionCards";
import ChartAreaInteractive from "@/components/admin/ChartAreaInteractive";
import RecentPlacesTable from "@/components/admin/RecentPlacesTable";
import OnlineUsersCard from "@/components/admin/OnlineUsersCard";
import ServerHealthCard from "@/components/admin/ServerHealthCard";
import RecentErrorsCard from "@/components/admin/RecentErrorsCard";

// Legacy sub-components
import {
  DashboardDataStatus,
  DashboardCategories,
  DashboardSearch,
} from "@/components/admin/dashboard";

/**
 * DASHBOARD PAGE
 * Soft Neumorphic-Minimal SaaS (70% Trắng ngà, 20% Đen, 10% Vàng)
 */
const DashboardPage = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { data: statsRes, isLoading: statsLoading } = useDashboardStats();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: placesRes, isLoading: placesLoading } = usePlaces({ limit: 50 });

  const loading = statsLoading || categoriesLoading || placesLoading;

  // Extract stats from response
  const statsPayload =
    statsRes?.success === true && statsRes?.data != null
      ? statsRes.data
      : statsRes;

  const stats = statsPayload?.places
    ? {
        total: statsPayload.places?.total || 0,
        approved: statsPayload.places?.approved || 0,
        pending: statsPayload.places?.pending || 0,
        rejected: statsPayload.places?.rejected || 0,
        featured: statsPayload.places?.featured || 0,
        totalViews: statsPayload.places?.totalViews || 0,
        avgRating: statsPayload.places?.averageRating || 0,
      }
    : { total: 0, approved: 0, pending: 0, featured: 0, totalViews: 0, avgRating: 0, rejected: 0 };

  const userCount = statsPayload?.users?.total || 0;
  const places = placesRes?.data || placesRes || [];

  if (loading) {
    return (
      <div className="space-y-7 max-w-[1560px] mx-auto text-slate-900 antialiased" aria-busy="true">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/[0.04]">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-32 rounded-md" />
            <Skeleton className="h-8 w-64 rounded-xl" />
            <Skeleton className="h-3.5 w-48 rounded-md" />
          </div>
          <Skeleton className="h-10 w-full sm:w-72 rounded-full" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>

        {/* Interactive Chart Skeleton */}
        <div className="rounded-2xl sm:rounded-3xl bg-white border border-black/[0.04] p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40 rounded-lg" />
              <Skeleton className="h-3 w-56 rounded-md" />
            </div>
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>

        {/* Monitoring 3-col Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-3xl" />
          ))}
        </div>

        {/* Recent Places Table Skeleton */}
        <div className="rounded-2xl sm:rounded-3xl border border-black/[0.04] bg-white p-6 space-y-4">
          <Skeleton className="h-5 w-48 rounded-lg" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 max-w-[1560px] mx-auto text-slate-900 antialiased">
      {/* Editorial Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 sm:gap-4 pb-4 border-b border-black/[0.04]">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tổng quan Hệ thống
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            {t("dashboard.greeting", { name: user?.fullName || user?.username || "Admin" })}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {t("dashboard.subtitle")}
          </p>
        </div>

        <DashboardSearch places={places} />
      </header>

      {/* Stats Cards Strip */}
      <SectionCards stats={stats} userCount={userCount} />

      {/* Interactive Chart */}
      <div className="rounded-2xl sm:rounded-3xl bg-white border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-3.5 sm:p-6 overflow-hidden">
        <ChartAreaInteractive />
      </div>

      {/* Monitoring Section */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <OnlineUsersCard />
        <ServerHealthCard />
        <RecentErrorsCard />
      </div>

      {/* Data Status + Categories */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <DashboardDataStatus stats={stats} />
        <DashboardCategories categories={categories} places={places} />
      </div>

      {/* Recent Places Table */}
      <div className="rounded-2xl sm:rounded-3xl border border-black/[0.04] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="border-b border-black/[0.04] px-4 sm:px-6 py-3.5 sm:py-5 bg-[#FAF9F5]">
          <h3 className="text-base font-extrabold text-slate-950">{t("dashboard.recentPlaces.title")}</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {t("dashboard.latestPlaces")}
          </p>
        </div>
        <div className="p-3.5 sm:p-6 overflow-x-auto">
          <RecentPlacesTable places={places} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
