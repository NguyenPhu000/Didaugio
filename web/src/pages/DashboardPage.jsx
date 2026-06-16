import { useState, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useDashboardStats } from "@/hooks/queries/useDashboardQuery";
import { useCategories } from "@/hooks/queries/useCategoryQueries";
import { usePlaces } from "@/hooks/queries/usePlaceQueries";
import { useNavigate } from "react-router-dom";
import Search from "lucide-react/dist/esm/icons/search";
import { ADMIN_ROUTES } from "@/constants/routes";
import { useTranslation } from "react-i18next";

// New shadcn admin components
import SectionCards from "@/components/admin/SectionCards";
import ChartAreaInteractive from "@/components/admin/ChartAreaInteractive";
import RecentPlacesTable from "@/components/admin/RecentPlacesTable";

// Legacy sub-components (kept for additional sections)
import { DashboardDataStatus, DashboardCategories } from "./dashboard";

const DashboardPage = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: statsRes, isLoading: statsLoading } = useDashboardStats();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: placesRes, isLoading: placesLoading } = usePlaces({ limit: 50 });

  const [searchQuery, setSearchQuery] = useState("");

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

  const handleSearch = useCallback(
    (e) => {
      if (e.key === "Enter" || e.type === "click") {
        if (searchQuery.trim()) {
          navigate(
            `${ADMIN_ROUTES.PLACES}?search=${encodeURIComponent(searchQuery)}`
          );
        }
      }
    },
    [navigate, searchQuery]
  );

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-64 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[180px] animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <div className="h-[350px] animate-pulse rounded-lg bg-muted" />
        <div className="h-[400px] animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("dashboard.greeting", { name: user?.fullName || user?.username || "Admin" })}
          </h2>
          <p className="text-muted-foreground">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border shadow-sm">
            <div className="flex h-9 items-center pl-3">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder={t("dashboard.searchPlaceholder")}
              className="h-9 w-40 bg-transparent px-3 text-sm focus:outline-none sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <SectionCards stats={stats} userCount={userCount} />

      {/* Interactive Chart */}
      <ChartAreaInteractive />

      {/* Data Status + Categories (legacy sections) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DashboardDataStatus stats={stats} />
        <DashboardCategories categories={categories} places={places} />
      </div>

      {/* Recent Places Table */}
      <div className="rounded-lg border bg-card">
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-semibold">{t("dashboard.recentPlaces.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.latestPlaces")}
          </p>
        </div>
        <div className="p-6 pt-0">
          <RecentPlacesTable places={places} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
