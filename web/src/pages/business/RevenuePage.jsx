import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BarChart3, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Input, Button } from "@/components/ui";
import * as businessService from "@/apis/businessService";

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price || 0);

const RevenuePage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await businessService.getDashboard();
        setStats(response.data);
      } catch {
        toast.error("Không thể tải dữ liệu");
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
        <h1 className="text-2xl font-bold">Doanh thu & Thống kê</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tổng doanh thu</p>
                <p className="text-xl font-bold">{formatPrice(stats?.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Hoa hồng</p>
                <p className="text-xl font-bold text-red-600">{formatPrice(stats?.totalCommission)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Doanh thu ròng</p>
                <p className="text-xl font-bold text-green-600">{formatPrice(stats?.netRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết theo trạng thái booking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Trạng thái</th>
                  <th className="text-right py-3 px-4">Số lượng</th>
                  <th className="text-right py-3 px-4">Tỷ lệ</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: "completed", label: "Hoàn thành" },
                  { key: "confirmed", label: "Đã xác nhận" },
                  { key: "pending", label: "Chờ xác nhận" },
                  { key: "cancelled", label: "Đã hủy" },
                  { key: "no_show", label: "Không đến" },
                ].map(({ key, label }) => {
                  const count = stats?.bookingsByStatus?.[key] || 0;
                  const pct = stats?.bookingsCount
                    ? ((count / stats.bookingsCount) * 100).toFixed(1)
                    : "0.0";
                  return (
                    <tr key={key} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{label}</td>
                      <td className="py-3 px-4 text-right font-medium">{count}</td>
                      <td className="py-3 px-4 text-right">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-bold">
                  <td className="py-3 px-4">Tổng</td>
                  <td className="py-3 px-4 text-right">{stats?.bookingsCount || 0}</td>
                  <td className="py-3 px-4 text-right">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenuePage;
