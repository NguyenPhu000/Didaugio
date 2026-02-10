import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import usePlaceStore from "@/stores/placeStore";
import useCategoryStore from "@/stores/categoryStore";
import { userService } from "@/apis/userService";
import { useNavigate } from "react-router-dom";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Activity from "lucide-react/dist/esm/icons/activity";
import Users from "lucide-react/dist/esm/icons/users";
import Search from "lucide-react/dist/esm/icons/search";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { PAGINATION } from "@/constants/constants";
import { ADMIN_ROUTES } from "@/constants/routes";
import { INTERVALS } from "@/constants/timing";

// Sub-components
import { TimStatsCard } from "./dashboard";
import { DashboardDataStatus } from "./dashboard";
import { DashboardCategories } from "./dashboard";
import { DashboardCharts } from "./dashboard";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

/**
 * DASHBOARD PAGE - T.I.M STYLE WITH ADVANCED CHARTS
 * Refactored: sub-components extracted to pages/dashboard/
 */
const DashboardPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { places, fetchPlaces } = usePlaceStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userCount, setUserCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    featured: 0,
    totalViews: 0,
    avgRating: 0,
    rejected: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchPlaces({ limit: PAGINATION.MAX_LIMIT }),
          fetchCategories(),
        ]);

        try {
          const userRes = await userService.getAll({ limit: 1 });
          if (userRes.data?.total) setUserCount(userRes.data.total);
          else if (userRes.data?.users?.length)
            setUserCount(userRes.data.users.length);
          else if (Array.isArray(userRes.data))
            setUserCount(userRes.data.length);
        } catch (err) {
          console.error("Failed to load user stats", err);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchPlaces, fetchCategories]);

  useEffect(() => {
    if (places.length > 0) {
      const approved = places.filter((p) => p.status === "approved").length;
      const pending = places.filter((p) => p.status === "pending").length;
      const rejected = places.filter((p) => p.status === "rejected").length;
      const featured = places.filter((p) => p.isFeatured).length;
      const totalViews = places.reduce(
        (sum, p) => sum + (p.viewCount || 0),
        0,
      );
      const ratingsSum = places.reduce(
        (sum, p) => sum + (p.averageRating || 0),
        0,
      );
      const avgRating =
        places.length > 0 ? (ratingsSum / places.length).toFixed(1) : 0;

      setStats({
        total: places.length,
        approved,
        pending,
        featured,
        totalViews,
        avgRating,
        rejected,
      });
    }
  }, [places]);

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-16 h-16 border-4 border-black border-t-primary rounded-full animate-spin"></div>
        <div className="tim-meta">ĐANG KHỞI TẠO HỆ THỐNG...</div>
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
        <div className="flex items-end justify-between border-b-2 border-black pb-6">
          <div className="flex items-center gap-6">
            <div className="accent-bar h-16"></div>
            <div>
              <h1 className="tim-title">TỔNG QUAN</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1">
                  DASHBOARD // OVERVIEW
                </span>
                <p className="tim-meta">BẢNG ĐIỀU KHIỂN & THỐNG KÊ</p>
              </div>
            </div>
          </div>
          <div className="corner-tech">
            <div className="flex items-center shadow-hard hover:shadow-hard-subtle transition-all duration-200">
              <div className="h-12 w-12 bg-black flex items-center justify-center text-white hud-element">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="TÌM KIẾM HỆ THỐNG..."
                className="h-12 w-64 px-4 border-y border-r border-black tim-body uppercase focus:outline-none focus:bg-primary/10 placeholder:text-muted-foreground input-technical"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <TimStatsCard
            label="TỔNG ĐỊA ĐIỂM"
            value={stats.total}
            icon={Building2}
            serial="DAT-001"
            subValue={`+${places.filter((p) => new Date(p.createdAt) > new Date(Date.now() - 86400000)).length}`}
            subLabel="MỚI"
            status="positive"
          />
          <TimStatsCard
            label="LƯỢT TRUY CẬP"
            value={(stats.totalViews / 1000).toFixed(1) + "K"}
            icon={Activity}
            serial="ANA-002"
            subValue="--.-%"
            subLabel="TRUNG BÌNH"
            status="neutral"
          />
          <TimStatsCard
            label="ĐÁNH GIÁ TB"
            value={stats.avgRating}
            icon={TrendingUp}
            serial="QOS-003"
            subValue="NGƯỜI DÙNG"
            subLabel="RATING"
            status="positive"
          />
          <TimStatsCard
            label="NGƯỜI DÙNG"
            value={userCount}
            icon={Users}
            serial="USR-004"
            subValue="TỔNG SỐ"
            status="neutral"
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
      </div>
    </div>
  );
};

export default DashboardPage;
