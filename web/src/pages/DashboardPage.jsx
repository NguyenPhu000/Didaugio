import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import usePlaceStore from "@/stores/placeStore";
import useCategoryStore from "@/stores/categoryStore";
import { userService } from "@/apis/userService";
import { Link, useNavigate } from "react-router-dom";
import Users from "lucide-react/dist/esm/icons/users";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
import ArrowDownRight from "lucide-react/dist/esm/icons/arrow-down-right";
import Activity from "lucide-react/dist/esm/icons/activity";
import Layers from "lucide-react/dist/esm/icons/layers";
import Search from "lucide-react/dist/esm/icons/search";
import Filter from "lucide-react/dist/esm/icons/filter";
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import Archive from "lucide-react/dist/esm/icons/archive";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import AnimatedIcon from "@/components/ui/animated-icon";

/**
 * DASHBOARD PAGE - T.I.M STYLE OVERHAUL (VIETNAMESE)
 */

// Custom Stats Card - T.I.M Style
const TimStatsCard = ({
  label,
  value,
  icon: Icon,
  subValue,
  subLabel,
  status = "neutral",
  serial,
}) => {
  // Status colors
  const colors = {
    positive: "text-green-600",
    negative: "text-red-500",
    neutral: "text-gray-400",
    warning: "text-yellow-500",
    primary: "text-foreground",
  };

  return (
    <div className="relative bg-white border border-black p-6 group hover:shadow-hard transition-all duration-300">
      {/* Serial Number */}
      <div className="absolute top-2 right-2 tim-meta">{serial}</div>

      {/* Corner Decor */}
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary"></div>
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>

      <div className="flex justify-between items-start mb-4">
        <div className="bg-gray-50 p-2 border border-gray-100 group-hover:bg-primary group-hover:border-black transition-colors">
          <Icon className="w-5 h-5 text-gray-500 group-hover:text-black" />
        </div>
        {/* Trend or Sub-info */}
        <div
          className={`flex items-center gap-1 tim-meta font-bold ${colors[status]}`}
        >
          {subValue}
          {status === "positive" && <ArrowUpRight className="w-3 h-3" />}
          {status === "negative" && <ArrowDownRight className="w-3 h-3" />}
          {subLabel && <span className="text-gray-400 ml-1">/ {subLabel}</span>}
        </div>
      </div>

      <div>
        <h3 className="tim-table-header text-muted-foreground mb-1">{label}</h3>
        <div className="tim-stats text-foreground">{value}</div>
      </div>
    </div>
  );
};

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
        // Fetch max allowed to get stats (100 is limit)
        await Promise.all([fetchPlaces({ limit: 100 }), fetchCategories()]);

        // Fetch User Stats
        try {
          const userRes = await userService.getAll({ limit: 1 });
          // Access depending on API structure
          if (userRes.data?.total) setUserCount(userRes.data.total);
          else if (userRes.data?.users?.length)
            setUserCount(userRes.data.users.length); // Fallback
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
      const totalViews = places.reduce((sum, p) => sum + (p.viewCount || 0), 0);
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
          navigate(`/admin/places?search=${encodeURIComponent(searchQuery)}`);
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
      {/* Enhanced Multi-layer Background */}
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

        {/* Complex Stats / Status Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* System Status Module */}
          <div className="lg:col-span-2 border border-black bg-white p-0 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-black bg-black text-white">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <h3 className="font-bold font-mono text-sm uppercase tracking-widest">
                  TRẠNG THÁI DỮ LIỆU
                </h3>
              </div>
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="p-8 grid grid-cols-3 gap-8">
              <div className="text-center space-y-2 group cursor-pointer hover:bg-gray-50 p-4 border border-transparent hover:border-black/10 transition-all">
                <div className="mx-auto w-12 h-12 flex items-center justify-center bg-green-100 text-green-700 rounded-none border border-green-200 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <Activity className="h-6 w-6" />
                </div>
                <div className="text-3xl font-black font-technical">
                  {stats.approved}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-black">
                  ĐÃ DUYỆT
                </div>
              </div>

              <div className="text-center space-y-2 group cursor-pointer hover:bg-gray-50 p-4 border border-transparent hover:border-black/10 transition-all">
                <div className="mx-auto w-12 h-12 flex items-center justify-center bg-yellow-100 text-yellow-700 rounded-none border border-yellow-200 group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="text-3xl font-black font-technical">
                  {stats.pending}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-black">
                  CHỜ DUYỆT
                </div>
              </div>

              <div className="text-center space-y-2 group cursor-pointer hover:bg-gray-50 p-4 border border-transparent hover:border-black/10 transition-all">
                <div className="mx-auto w-12 h-12 flex items-center justify-center bg-red-100 text-red-700 rounded-none border border-red-200 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <Archive className="h-6 w-6" />
                </div>
                <div className="text-3xl font-black font-technical">
                  {stats.rejected}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-black">
                  ĐÃ HỦY
                </div>
              </div>
            </div>
          </div>

          {/* Categories Module */}
          <div className="border border-black bg-white flex flex-col">
            <div className="p-4 border-b border-black border-dashed flex items-center justify-between">
              <h3 className="font-bold font-mono text-sm uppercase tracking-widest">
                DANH MỤC CƠ SỞ
              </h3>
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <div className="p-0 flex-1 overflow-y-auto max-h-[300px] scrollbar-hide">
              {categories.map((cat, idx) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-yellow-50 transition-colors group"
                >
                  <span className="font-mono text-xs text-gray-400 w-8">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="font-bold text-sm uppercase flex-1">
                    {cat.name}
                  </span>
                  <span className="font-mono text-xs bg-black text-white px-2 py-0.5 rounded-none group-hover:bg-primary group-hover:text-black transition-colors">
                    {places.filter((p) => p.categoryId === cat.id).length}
                  </span>
                </div>
              ))}
            </div>
            <Link
              to="/categories"
              className="p-4 border-t border-black bg-gray-50 text-center font-bold text-xs uppercase hover:bg-black hover:text-white transition-colors"
            >
              QUẢN LÝ DANH MỤC &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
