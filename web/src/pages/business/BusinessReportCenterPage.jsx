import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Eye,
  Clock,
  Users,
  MapPin,
  Star,
  Printer,
  Share2,
  ChevronRight,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatVND } from "@/components/business/dashboardWidgetHelpers";
import { getDashboard } from "@/apis/businessApi";
import { exportToCsv, formatCsvDate, slugifyFilename } from "@/utils/csvExport";

// ─── Report Types ─────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  {
    id: "bookings",
    label: "Báo cáo đặt chỗ",
    icon: Calendar,
    description: "Tổng hợp và chi tiết các đặt chỗ theo ngày, tuần, tháng",
    metrics: ["Tổng đặt chỗ", "Tỷ lệ xác nhận", "Tỷ lệ hủy", "Doanh thu"],
  },
  {
    id: "revenue",
    label: "Báo cáo doanh thu",
    icon: TrendingUp,
    description: "Phân tích doanh thu theo dịch vụ, thời gian và xu hướng",
    metrics: ["Tổng doanh thu", "Doanh thu ròng", "Hoa hồng", "Tăng trưởng"],
  },
  {
    id: "reviews",
    label: "Báo cáo đánh giá",
    icon: Star,
    description: "Theo dõi và phân tích đánh giá từ khách hàng",
    metrics: ["Số đánh giá", "Điểm TB", "Tỷ lệ phản hồi", "Đánh giá mới"],
  },
  {
    id: "customers",
    label: "Báo cáo khách hàng",
    icon: Users,
    description: "Phân tích hành vi và lịch sử khách hàng",
    metrics: ["Khách mới", "Khách quay lại", "Tần suất đặt", "Giá trị TB"],
  },
  {
    id: "performance",
    label: "Báo cáo hiệu suất",
    icon: Activity,
    description: "Đánh giá hiệu suất dịch vụ và nhân viên",
    metrics: ["Tỷ lệ phục vụ", "Thời gian chờ", "Satisfaction score", "No-show"],
  },
];

// ─── Stat Card ─────────────────────────────────────────────────────────────────

const ReportStatCard = ({ title, value, subtitle, trend, trendValue, icon: Icon, className }) => (
  <Card className={cn("", className)}>
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trendValue !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend === "up" ? "text-emerald-600" : "text-rose-600"
            )}>
              {trend === "up" ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{trendValue}% so tuần trước</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

// ─── Mini Chart ────────────────────────────────────────────────────────────────

const MiniSparkline = ({ data, color = "#3b82f6" }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-0.5 h-10 w-24">
      {data.map((value, i) => {
        const height = ((value - min) / range) * 100;
        return (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all"
            style={{
              height: `${Math.max(10, height)}%`,
              backgroundColor: color,
              opacity: 0.3 + (i / data.length) * 0.7,
            }}
          />
        );
      })}
    </div>
  );
};

// ─── Report Table ─────────────────────────────────────────────────────────────

const ReportTable = ({ data, columns, title }) => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Printer className="h-4 w-4" />
            In
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Xuất
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className="font-semibold">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col.key}>{col.render ? col.render(row) : row[col.key]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const BusinessReportCenterPage = () => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState("bookings");
  const [dateRange, setDateRange] = useState("7d");
  const [isExporting, setIsExporting] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const selectedReport = REPORT_TYPES.find((r) => r.id === reportType);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        let preset = "month";
        if (dateRange === "7d") preset = "week";
        if (dateRange === "30d") preset = "month";
        if (dateRange === "ytd") preset = "month"; // Fallback to month since api only supports today|week|month
        
        const res = await getDashboard({ preset });
        setStatsData(res.data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [dateRange]);

  const mappedStats = useMemo(() => {
    if (!statsData?.overview) {
      return {
        bookings: { total: 0, confirmed: 0, cancelled: 0, revenue: 0, growth: 0 },
        revenue: { total: 0, net: 0, commission: 0, growth: 0 },
        reviews: { total: 0, avgRating: 0, new: 0, responseRate: 0, growth: 0 },
        customers: { new: 0, returning: 0, avgValue: 0, frequency: 0, growth: 0 },
        performance: { serviceRate: 0, waitTime: 0, satisfaction: 0, noShow: 0, growth: 0 },
      };
    }

    const {
      bookingsTotal,
      bookingsByStatus,
      totalRevenue,
      totalCommission,
      netRevenue,
      avgRating,
      placesCount,
      conversionRate
    } = statsData.overview;

    return {
      bookings: {
        total: bookingsTotal || 0,
        confirmed: (bookingsByStatus?.confirmed || 0) + (bookingsByStatus?.completed || 0),
        cancelled: bookingsByStatus?.cancelled || 0,
        revenue: totalRevenue || 0,
        growth: 0, // Placeholder
      },
      revenue: {
        total: totalRevenue || 0,
        net: netRevenue || 0,
        commission: totalCommission || 0,
        growth: 0, // Placeholder
      },
      reviews: {
        total: placesCount > 0 ? placesCount * 5 : 0, // Placeholder
        avgRating: avgRating || 0,
        new: 0,
        responseRate: 100,
        growth: 0,
      },
      customers: {
        new: bookingsTotal > 0 ? Math.floor(bookingsTotal * 0.7) : 0, // Placeholder
        returning: bookingsTotal > 0 ? Math.ceil(bookingsTotal * 0.3) : 0, // Placeholder
        avgValue: bookingsTotal > 0 ? Math.round(totalRevenue / bookingsTotal) : 0,
        frequency: 1.2,
        growth: 0,
      },
      performance: {
        serviceRate: conversionRate || 0,
        waitTime: 0,
        satisfaction: avgRating || 0,
        noShow: bookingsByStatus?.cancelled || 0,
        growth: 0,
      },
    };
  }, [statsData]);

  const currentStats = mappedStats[reportType];

  const handleExport = async (format) => {
    if (format !== "csv") {
      toast.error("Chỉ hỗ trợ xuất CSV");
      return;
    }

    setIsExporting(true);
    try {
      const dataToExport = bookingsTableData;
      if (!dataToExport || dataToExport.length === 0) {
        toast.error("Không có dữ liệu để xuất");
        return;
      }

      const reportLabel = REPORT_TYPES.find((r) => r.id === reportType)?.label || reportType;

      exportToCsv({
        columns: [
          { key: "date", label: "Ngày" },
          { key: "total", label: "Tổng đặt chỗ" },
          { key: "confirmed", label: "Xác nhận" },
          { key: "cancelled", label: "Hủy" },
          { key: (row) => row.revenue || 0, label: "Doanh thu (VNĐ)" },
        ],
        data: dataToExport,
        filename: slugifyFilename(`bao_cao_${reportType}`),
      });

      toast.success(`Đã xuất ${dataToExport.length} dòng báo cáo`);
    } catch {
      toast.error("Lỗi khi xuất dữ liệu");
    } finally {
      setIsExporting(false);
    }
  };

  const bookingsTableData = useMemo(() => {
    if (!statsData?.revenueChart) return [];
    return statsData.revenueChart.map(item => ({
      date: item.date,
      total: item.bookings,
      confirmed: item.bookings, // Simple mapping for now
      cancelled: 0,
      revenue: item.revenue
    })).reverse();
  }, [statsData]);

  const tableColumns = [
    { key: "date", label: "Ngày" },
    { key: "total", label: "Tổng đặt", render: (row) => <span className="font-medium">{row.total}</span> },
    { key: "confirmed", label: "Xác nhận", render: (row) => <span className="text-emerald-600 font-medium">{row.confirmed}</span> },
    { key: "cancelled", label: "Hủy", render: (row) => <span className="text-rose-600">{row.cancelled}</span> },
    { key: "revenue", label: "Doanh thu", render: (row) => <span className="font-semibold">{formatVND(row.revenue)}</span> },
  ];

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trung tâm báo cáo</h1>
            <p className="text-muted-foreground mt-1">
              Xem, xuất và phân tích báo cáo kinh doanh chi tiết
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => handleExport("pdf")} disabled={isExporting}>
              <Download className="h-4 w-4" />
              {isExporting ? "Đang xuất..." : "Xuất báo cáo"}
            </Button>
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Chia sẻ
            </Button>
          </div>
        </div>

        {/* Report Type Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {REPORT_TYPES.map((report) => {
            const Icon = report.icon;
            const isSelected = reportType === report.id;
            return (
              <button
                key={report.id}
                onClick={() => setReportType(report.id)}
                className={cn(
                  "flex flex-col items-start p-4 rounded-xl border text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-card hover:bg-muted/50 hover:border-primary/30"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg mb-3",
                  isSelected ? "bg-primary text-white" : "bg-muted"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-semibold text-sm">{report.label}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {report.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 ngày qua</SelectItem>
                    <SelectItem value="30d">30 ngày qua</SelectItem>
                    <SelectItem value="90d">90 ngày qua</SelectItem>
                    <SelectItem value="ytd">Năm nay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Địa điểm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả địa điểm</SelectItem>
                    <SelectItem value="1">Quán cafe Bông</SelectItem>
                    <SelectItem value="2">Nhà hàng Cá</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[124px] w-full rounded-xl" />
            ))
          ) : (
            selectedReport?.metrics.map((metric, i) => {
              const metricConfig = {
                "Tổng đặt chỗ": { value: mappedStats.bookings.total, subtitle: "đặt chỗ", trend: "up", trendValue: mappedStats.bookings.growth, icon: Calendar },
                "Tỷ lệ xác nhận": { value: `${mappedStats.bookings.total > 0 ? Math.round((mappedStats.bookings.confirmed / mappedStats.bookings.total) * 100) : 0}%`, subtitle: "xác nhận/thành công", icon: CheckCircle },
                "Tỷ lệ hủy": { value: `${mappedStats.bookings.total > 0 ? Math.round((mappedStats.bookings.cancelled / mappedStats.bookings.total) * 100) : 0}%`, subtitle: "bị hủy", trend: "down", trendValue: 0, icon: XCircle },
                "Doanh thu": { value: formatVND(mappedStats.bookings.revenue), subtitle: "tổng doanh thu", trend: "up", trendValue: mappedStats.bookings.growth, icon: TrendingUp },
                "Tổng doanh thu": { value: formatVND(mappedStats.revenue.total), subtitle: "trước hoa hồng", trend: "up", trendValue: mappedStats.revenue.growth, icon: TrendingUp },
                "Doanh thu ròng": { value: formatVND(mappedStats.revenue.net), subtitle: "sau hoa hồng", icon: TrendingUp },
                "Hoa hồng": { value: formatVND(mappedStats.revenue.commission), subtitle: "phí nền tảng", trend: "down", trendValue: 0, icon: TrendingDown },
                "Tăng trưởng": { value: `+${mappedStats.revenue.growth}%`, subtitle: "so với kỳ trước", icon: Activity },
                "Số đánh giá": { value: mappedStats.reviews.total, subtitle: "đánh giá", trend: "up", trendValue: mappedStats.reviews.growth, icon: Star },
                "Điểm TB": { value: mappedStats.reviews.avgRating, subtitle: "trên 5 sao", icon: Star },
                "Tỷ lệ phản hồi": { value: `${mappedStats.reviews.responseRate}%`, subtitle: "đã phản hồi", icon: MessageCircle },
                "Đánh giá mới": { value: mappedStats.reviews.new, subtitle: "tuần này", trend: "up", trendValue: 0, icon: Star },
                "Khách mới": { value: mappedStats.customers.new, subtitle: "khách hàng", trend: "up", trendValue: mappedStats.customers.growth, icon: Users },
                "Khách quay lại": { value: mappedStats.customers.returning, subtitle: "khách hàng", icon: Users },
                "Giá trị TB": { value: formatVND(mappedStats.customers.avgValue), subtitle: "mỗi đặt chỗ", icon: TrendingUp },
                "Tần suất đặt": { value: `${mappedStats.customers.frequency}x`, subtitle: "trung bình", icon: Activity },
                "Tỷ lệ phục vụ": { value: `${mappedStats.performance.serviceRate}%`, subtitle: "hoàn thành", trend: "up", trendValue: mappedStats.performance.growth, icon: CheckCircle },
                "Thời gian chờ": { value: `${mappedStats.performance.waitTime} phút`, subtitle: "trung bình", trend: "down", trendValue: 0, icon: Clock },
                "Satisfaction score": { value: mappedStats.performance.satisfaction, subtitle: "trên 5", icon: Star },
                "No-show": { value: `${mappedStats.performance.noShow}`, subtitle: "không đến", trend: "down", trendValue: 0, icon: AlertCircle },
              };
              const config = metricConfig[metric] || {};
              return (
                <ReportStatCard
                  key={metric}
                  title={metric}
                  value={config.value || "—"}
                  subtitle={config.subtitle}
                  trend={config.trend}
                  trendValue={config.trendValue}
                  icon={config.icon}
                />
              );
            })
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Xu hướng {selectedReport?.label.toLowerCase()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">Biểu đồ xu hướng</p>
                  <p className="text-xs text-muted-foreground">Dữ liệu được tải từ API</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Phân bố theo loại
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                <div className="text-center">
                  <PieChart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">Biểu đồ phân bố</p>
                  <p className="text-xs text-muted-foreground">Theo danh mục và dịch vụ</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <ReportTable
          title="Chi tiết theo ngày"
          columns={tableColumns}
          data={bookingsTableData}
        />

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold">Xuất báo cáo tùy chỉnh</p>
                <p className="text-sm text-muted-foreground">
                  Tạo báo cáo với bộ lọc và thời gian tùy chỉnh
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleExport("excel")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button variant="outline" onClick={() => handleExport("pdf")}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button onClick={() => navigate("/business/revenue")}>
                  Xem chi tiết doanh thu
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessReportCenterPage;
