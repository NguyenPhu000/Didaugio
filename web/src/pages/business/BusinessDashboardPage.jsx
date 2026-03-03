import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BarChart3,
  MapPin,
  Ticket,
  CalendarCheck,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import * as businessService from "@/apis/businessService";
import { BUSINESS_ROUTES } from "@/constants/routes";

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price || 0);

const StatCard = ({ title, value, icon: Icon, href, description }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {description && <p className="text-xs text-gray-400">{description}</p>}
        </div>
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          <Icon className="h-6 w-6 text-gray-600" />
        </div>
      </div>
      {href && (
        <Link to={href} className="text-sm text-blue-600 hover:underline mt-2 inline-block">
          Xem chi tiết
        </Link>
      )}
    </CardContent>
  </Card>
);

const BusinessDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await businessService.getDashboard();
        setStats(response.data);
      } catch (error) {
        toast.error("Không thể tải thống kê");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Dashboard doanh nghiệp</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Địa điểm"
          value={stats?.placesCount || 0}
          icon={MapPin}
          href="/admin/places"
        />
        <StatCard
          title="Dịch vụ"
          value={stats?.servicesCount || 0}
          icon={Ticket}
          href={BUSINESS_ROUTES.SERVICES}
        />
        <StatCard
          title="Tổng booking"
          value={stats?.bookingsCount || 0}
          icon={CalendarCheck}
          href={BUSINESS_ROUTES.BOOKINGS}
        />
        <StatCard
          title="Doanh thu ròng"
          value={formatPrice(stats?.netRevenue)}
          icon={DollarSign}
          href={BUSINESS_ROUTES.REVENUE}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking theo trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { key: "pending", label: "Chờ xác nhận", color: "bg-yellow-500" },
                { key: "confirmed", label: "Đã xác nhận", color: "bg-blue-500" },
                { key: "completed", label: "Hoàn thành", color: "bg-green-500" },
                { key: "cancelled", label: "Đã hủy", color: "bg-red-500" },
                { key: "no_show", label: "Không đến", color: "bg-gray-500" },
              ].map(({ key, label, color }) => {
                const count = stats?.bookingsByStatus?.[key] || 0;
                const pct = stats?.bookingsCount ? (count / stats.bookingsCount) * 100 : 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-gray-600">{label}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${color}`}
                        style={{ width: `${Math.max(pct, 1)}%` }}
                      />
                    </div>
                    <div className="w-10 text-right text-sm font-medium">{count}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tóm tắt doanh thu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tổng doanh thu</span>
              <span className="font-bold">{formatPrice(stats?.totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Hoa hồng</span>
              <span className="font-bold text-red-600">-{formatPrice(stats?.totalCommission)}</span>
            </div>
            <hr />
            <div className="flex justify-between items-center">
              <span className="font-semibold">Doanh thu ròng</span>
              <span className="font-bold text-green-600">{formatPrice(stats?.netRevenue)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessDashboardPage;
