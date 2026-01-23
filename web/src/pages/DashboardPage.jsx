import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Button,
  Skeleton,
  Input,
  Progress,
} from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import usePlaceStore from "@/stores/placeStore";
import useCategoryStore from "@/stores/categoryStore";
import { ROLE_NAMES } from "@/constants/constants";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  MapPin,
  Star,
  Building2,
  TrendingUp,
  Clock,
  Eye,
  CheckCircle,
  AlertCircle,
  Activity,
  BarChart3,
  Map,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  TrendingDown,
  Award,
  Target,
  Zap,
  Filter,
} from "lucide-react";
import AnimatedIcon from "@/components/ui/animated-icon";

const DashboardPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { places, fetchPlaces } = usePlaceStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    featured: 0,
    totalViews: 0,
    avgRating: 0,
    draft: 0,
    rejected: 0,
    hidden: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchPlaces({ limit: 100 }), fetchCategories()]);
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
      const draft = places.filter((p) => p.status === "draft").length;
      const rejected = places.filter((p) => p.status === "rejected").length;
      const hidden = places.filter((p) => p.status === "hidden").length;
      const featured = places.filter((p) => p.isFeatured).length;
      const totalViews = places.reduce((sum, p) => sum + (p.viewCount || 0), 0);
      const ratingsSum = places.reduce(
        (sum, p) => sum + (p.averageRating || 0),
        0
      );
      const avgRating = places.length > 0 ? ratingsSum / places.length : 0;

      setStats({
        total: places.length,
        approved,
        pending,
        featured,
        totalViews,
        avgRating,
        draft,
        rejected,
        hidden,
      });
    }
  }, [places]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/admin/places?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const topPlaces = places
    .filter((p) => p.status === "approved")
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 5);

  const topRatedPlaces = places
    .filter((p) => p.status === "approved" && p.averageRating > 0)
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 5);

  const categoryStats = categories
    .map((cat) => ({
      ...cat,
      count: places.filter((p) => p.categoryId === cat.id).length,
    }))
    .sort((a, b) => b.count - a.count);

  const StatCard = ({
    label,
    value,
    icon: Icon,
    trend,
    trendValue,
    variant = "primary",
    link,
  }) => {
    const variants = {
      primary: {
        border: "border-primary/20 hover:border-primary/50",
        iconBg: "bg-primary/10",
        iconText: "text-primary",
        trendUp: "text-green-600",
        trendDown: "text-red-600",
      },
      success: {
        border: "border-green-200 hover:border-green-400",
        iconBg: "bg-green-100",
        iconText: "text-green-600",
        trendUp: "text-green-700",
        trendDown: "text-red-600",
      },
      warning: {
        border: "border-amber-200 hover:border-amber-400",
        iconBg: "bg-amber-100",
        iconText: "text-amber-600",
        trendUp: "text-green-600",
        trendDown: "text-red-600",
      },
      secondary: {
        border: "border-accent/40 hover:border-accent",
        iconBg: "bg-accent/20",
        iconText: "text-primary",
        trendUp: "text-green-600",
        trendDown: "text-red-600",
      },
    };

    const style = variants[variant] || variants.primary;

    return (
      <Link to={link || "#"}>
        <Card
          className={`group hover:shadow-lg transition-all duration-200 ${style.border}`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {label}
                </p>
                <div className="flex items-baseline gap-2">
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-foreground">
                        {value}
                      </p>
                      {trend && (
                        <div
                          className={`flex items-center text-xs font-medium ${
                            trend === "up" ? style.trendUp : style.trendDown
                          }`}
                        >
                          {trend === "up" ? (
                            <AnimatedIcon icon={ArrowUpRight} className="h-3 w-3" type="pulse" />
                          ) : (
                            <AnimatedIcon icon={ArrowDownRight} className="h-3 w-3" type="pulse" />
                          )}
                          {trendValue}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div
                className={`p-3 rounded-full group-hover:scale-110 transition-transform ${style.iconBg}`}
              >
                <AnimatedIcon icon={Icon} className={`h-6 w-6 ${style.iconText}`} type="pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="space-y-6 p-1">
      {/* Header with Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Dashboard
          </h1>
          <div className="text-muted-foreground mt-1">
            Chào mừng trở lại,{" "}
            <span className="font-semibold text-primary">
              {user?.fullName || user?.email}
            </span>
            <Badge
              variant="outline"
              className="ml-2 border-primary/30 text-primary"
            >
              {ROLE_NAMES[user?.roleId]}
            </Badge>
          </div>
        </div>
        <div className="flex gap-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm địa điểm..."
              className="pl-9 w-64 border-input focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          <Link to="/admin/map">
            <Button className="bg-primary hover:bg-primary/90">
              <Map className="h-4 w-4 mr-2" />
              Bản đồ
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Tổng địa điểm"
          value={stats.total}
          icon={MapPin}
          variant="primary"
          link="/admin/places"
        />
        <StatCard
          label="Đã duyệt"
          value={stats.approved}
          icon={CheckCircle}
          variant="success"
          link="/admin/places?status=approved"
        />
        <StatCard
          label="Chờ duyệt"
          value={stats.pending}
          icon={AlertCircle}
          variant="warning"
          link="/admin/places?status=pending"
        />
        <StatCard
          label="Danh mục"
          value={categories.length}
          icon={Building2}
          variant="secondary"
          link="/categories"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-primary/20 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Tổng lượt xem
                </p>
                {loading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <p className="text-2xl font-bold text-primary">
                    {stats.totalViews.toLocaleString()}
                  </p>
                )}
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <Eye className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-100 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Đánh giá TB
                </p>
                {loading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <div className="flex items-center gap-1">
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.avgRating.toFixed(1)}
                    </p>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                )}
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Nổi bật</p>
                {loading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-purple-700">
                    {stats.featured}
                  </p>
                )}
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Bản nháp</p>
                {loading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-slate-700">
                    {stats.draft}
                  </p>
                )}
              </div>
              <div className="p-2 bg-slate-100 rounded-full">
                <Clock className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <Card className="border-primary/20 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Target className="h-5 w-5 mr-2 text-primary" />
              Phân bổ trạng thái
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Đã duyệt
                  </span>
                  <span className="text-sm font-semibold text-green-600">
                    {stats.approved}
                  </span>
                </div>
                <Progress
                  value={
                    stats.total > 0 ? (stats.approved / stats.total) * 100 : 0
                  }
                  className="h-2 bg-green-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Chờ duyệt
                  </span>
                  <span className="text-sm font-semibold text-amber-600">
                    {stats.pending}
                  </span>
                </div>
                <Progress
                  value={
                    stats.total > 0 ? (stats.pending / stats.total) * 100 : 0
                  }
                  className="h-2 bg-amber-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Bản nháp
                  </span>
                  <span className="text-sm font-semibold text-slate-600">
                    {stats.draft}
                  </span>
                </div>
                <Progress
                  value={
                    stats.total > 0 ? (stats.draft / stats.total) * 100 : 0
                  }
                  className="h-2 bg-slate-100"
                />
              </div>

              {stats.rejected > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Từ chối
                    </span>
                    <span className="text-sm font-semibold text-red-600">
                      {stats.rejected}
                    </span>
                  </div>
                  <Progress
                    value={
                      stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0
                    }
                    className="h-2 bg-red-100"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card className="border-accent/40 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                Danh mục phổ biến
              </CardTitle>
              <Link to="/categories">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  Xem tất cả
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : categoryStats.length > 0 ? (
              <div className="space-y-3">
                {categoryStats.slice(0, 5).map((cat, idx) => (
                  <div key={cat.id} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{cat.name}</span>
                        <span className="text-xs font-semibold text-primary">
                          {cat.count} địa điểm
                        </span>
                      </div>
                      <Progress
                        value={
                          stats.total > 0 ? (cat.count / stats.total) * 100 : 0
                        }
                        className="h-1.5 bg-accent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Chưa có danh mục
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Viewed Places */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Xem nhiều nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-2">
                    <Skeleton className="h-14 w-14 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topPlaces.length > 0 ? (
              <div className="space-y-3">
                {topPlaces.map((place, idx) => (
                  <Link key={place.id} to={`/admin/places/edit/${place.id}`}>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/10 transition-colors group">
                        <div className="relative">
                          <div className="h-14 w-14 rounded-md bg-accent/20 flex items-center justify-center overflow-hidden">
                            {place.images?.[0]?.url ? (
                              <img
                                src={place.images[0].url}
                                alt={place.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <MapPin className="h-6 w-6 text-primary" />
                            )}
                        </div>
                        <div className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                          {idx + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-emerald-700">
                          {place.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          <span>{place.viewCount || 0} lượt xem</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4 text-sm">
                Chưa có dữ liệu
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Rated Places */}
        <Card className="border-yellow-100">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Award className="h-5 w-5 mr-2 text-yellow-600" />
              Đánh giá cao
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-2">
                    <Skeleton className="h-14 w-14 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topRatedPlaces.length > 0 ? (
              <div className="space-y-3">
                {topRatedPlaces.map((place, idx) => (
                  <Link key={place.id} to={`/admin/places/edit/${place.id}`}>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-yellow-50 transition-colors group">
                      <div className="relative">
                        <div className="h-14 w-14 rounded-md bg-yellow-100 flex items-center justify-center overflow-hidden">
                          {place.images?.[0]?.url ? (
                            <img
                              src={place.images[0].url}
                              alt={place.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <MapPin className="h-6 w-6 text-yellow-600" />
                          )}
                        </div>
                        <div className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                          {idx + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-yellow-700">
                          {place.name}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-yellow-600">
                          <Star className="h-3 w-3 fill-current" />
                          <span>{place.averageRating?.toFixed(1) || 0}</span>
                          <span className="text-muted-foreground ml-1">
                            ({place.reviewCount || 0} đánh giá)
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4 text-sm">
                Chưa có đánh giá
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Stats */}
        <Card className="border-accent/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Zap className="h-5 w-5 mr-2 text-primary" />
              Thao tác nhanh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link to="/admin/places/new">
                <Button className="w-full bg-primary hover:bg-primary/90">
                  <MapPin className="h-4 w-4 mr-2" />
                  Thêm địa điểm mới
                </Button>
              </Link>

              <Link to="/admin/places?status=pending">
                <Button
                  variant="outline"
                  className="w-full border-amber-200 hover:bg-amber-50 text-amber-700"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Duyệt địa điểm ({stats.pending})
                </Button>
              </Link>

              <Link to="/categories">
                <Button
                  variant="outline"
                  className="w-full border-accent hover:bg-accent/20 text-primary"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Quản lý danh mục
                </Button>
              </Link>

              <Link to="/admin/map">
                <Button
                  variant="outline"
                  className="w-full border-primary/20 hover:bg-primary/5 text-primary"
                >
                  <Map className="h-4 w-4 mr-2" />
                  Xem bản đồ
                </Button>
              </Link>

              <div className="pt-4 mt-4 border-t space-y-3">
                <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                  <span className="text-xs text-muted-foreground">Ẩn</span>
                  <Badge variant="secondary" className="text-xs">
                    {stats.hidden}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-red-50">
                  <span className="text-xs text-muted-foreground">Từ chối</span>
                  <Badge variant="destructive" className="text-xs">
                    {stats.rejected}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
