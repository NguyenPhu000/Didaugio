import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import useCategoryStore from "@/stores/categoryStore";
import usePlaceStore from "@/stores/placeStore";
import { dashboardService } from "@/apis/dashboardService";
import { useNavigate } from "react-router-dom";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Activity from "lucide-react/dist/esm/icons/activity";
import Users from "lucide-react/dist/esm/icons/users";
import Search from "lucide-react/dist/esm/icons/search";
import "@/lib/chartSetup";
import { ROLES } from "@/constants/constants";
import { ADMIN_ROUTES } from "@/constants/routes";

// Sub-components
import TimStatsCard from "@/components/admin/TimStatsCard";
import {
  DashboardDataStatus,
  DashboardCategories,
  DashboardCharts,
  DashboardRecentPlaces,
} from "./dashboard";

/**
 * DASHBOARD PAGE - T.I.M STYLE WITH ADVANCED CHARTS
 * Refactored: uses server-side /api/dashboard/stats for aggregate data
 */
const DashboardPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { categories, fetchCategories } = useCategoryStore();
  const { places, fetchPlaces } = usePlaceStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    featured: 0,
    totalViews: 0,
    avgRating: 0,
    rejected: 0,
  });
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch server-side aggregate stats + categories in parallel
        const [statsRes] = await Promise.all([
          dashboardService.getStats(),
          fetchCategories(),
          fetchPlaces({ limit: 10 }),
        ]);

        if (statsRes?.success && statsRes.data) {
          const { places: placeStats, users: userStats } = statsRes.data;
          setStats({
            total: placeStats?.total || 0,
            approved: placeStats?.approved || 0,
            pending: placeStats?.pending || 0,
            rejected: placeStats?.rejected || 0,
            featured: placeStats?.featured || 0,
            totalViews: placeStats?.totalViews || 0,
            avgRating: placeStats?.averageRating || 0,
          });
          setUserCount(userStats?.total || 0);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchCategories, fetchPlaces]);

  const handleSearch = useCallback(
    (e) => {
      if (e.key === "Enter" || e.type === "click") {
        if (searchQuery.trim()) {
          navigate(
            `${ADMIN_ROUTES.PLACES}?search=${encodeURIComponent(searchQuery)}`,
          );
        }
      }
    },
    [navigate, searchQuery],
  );

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-background relative">
        <div className="absolute inset-0 bg-grid-dots opacity-40 pointer-events-none" />
        <div className="relative z-10 space-y-12 max-w-[1600px] mx-auto">
          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-black pb-6 gap-4">
            <div className="flex items-center gap-6">
              <div className="w-1 h-16 bg-primary animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-32 bg-muted animate-pulse" />
                <div className="h-8 w-48 bg-muted animate-pulse" />
                <div className="h-4 w-64 bg-muted animate-pulse" />
              </div>
            </div>
          </div>

          {/* Stats cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border-2 border-black p-6 space-y-3">
                <div className="h-3 w-24 bg-muted animate-pulse" />
                <div className="h-10 w-20 bg-muted animate-pulse" />
                <div className="h-3 w-16 bg-muted animate-pulse" />
              </div>
            ))}
          </div>

          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="border-2 border-black p-6 h-64 animate-pulse bg-muted/20" />
            <div className="lg:col-span-2 border-2 border-black p-6 h-64 animate-pulse bg-muted/20" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-background relative">
      {/* Multi-layer Background */}
      <div className="absolute inset-0 bg-grid-dots opacity-40 pointer-events-none"></div>
      <div className="absolute inset-0 bg-grid-lines opacity-15 pointer-events-none"></div>

      <div className="relative z-10 space-y-12 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-black pb-6 gap-4">
          <div className="flex items-center gap-6">
            <div className="accent-bar h-16" />
            <div>
              <div className="tim-meta mb-1 opacity-60">
                XIN CHÀO,{" "}
                {user?.fullName?.toUpperCase() ||
                  user?.username?.toUpperCase() ||
                  "ADMIN"}
              </div>
              <h1 className="tim-title">TỔNG QUAN</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1">
                  BẢNG ĐIỀU KHIỂN // TỔNG QUAN
                </span>
                <p className="tim-meta">BẢNG ĐIỀU KHIỂN & THỐNG KÊ</p>
              </div>
            </div>
          </div>
          <div className="corner-tech">
            <div className="flex items-center shadow-hard hover:shadow-hard-subtle transition-all duration-200">
              <div
                className="h-12 w-12 bg-black flex items-center justify-center text-white hud-element cursor-pointer"
                onClick={handleSearch}
                role="button"
                aria-label="Tìm kiếm"
              >
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                name="search"
                aria-label="Tìm kiếm hệ thống"
                placeholder="TÌM KIẾ́M HỆ THỐNG…"
                className="h-12 w-64 px-4 border-y border-r border-black tim-body uppercase focus:outline-none focus:bg-primary/10 placeholder:text-muted-foreground input-technical"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
          </div>
        </div>

        {/* Thống kê nhanh — đồng bộ kiểu danh mục */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TimStatsCard
            title="TỔNG ĐỊA ĐIỂM"
            value={stats.total}
            icon={Building2}
            serial="DAT-001"
          />
          <TimStatsCard
            title="LƯỢT XEM (ƯỚC LƯỢNG)"
            value={`${(stats.totalViews / 1000).toFixed(1)}K`}
            icon={Activity}
            serial="ANA-002"
            textColor="text-emerald-600"
          />
          <TimStatsCard
            title="ĐÁNH GIÁ TB"
            value={stats.avgRating}
            icon={TrendingUp}
            serial="QOS-003"
            textColor="text-amber-600"
          />
          <TimStatsCard
            title="NGƯỜI DÙNG"
            value={userCount}
            icon={Users}
            serial="USR-004"
            color="bg-yellow-50"
          />
        </div>

        {/* Data Status + Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <DashboardDataStatus stats={stats} />
          <DashboardCategories categories={categories} places={places} />
        </div>

        {/* Charts Section */}
        <DashboardCharts
          stats={stats}
          categories={categories}
          places={places}
        />

        {/* Recent Places */}
        <DashboardRecentPlaces places={places} />
      </div>
    </div>
  );
};

export default DashboardPage;
