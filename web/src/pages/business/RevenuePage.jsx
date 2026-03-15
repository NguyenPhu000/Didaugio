import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BarChart3, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import * as businessApi from "@/apis/businessApi";

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    price || 0,
  );

const STATUS_ROWS = [
  { key: "completed", label: "HOÀN THÀNH", color: "bg-emerald-500" },
  { key: "confirmed", label: "ĐÃ XÁC NHẬN", color: "bg-blue-500" },
  { key: "pending", label: "CHỜ XÁC NHẬN", color: "bg-yellow-400" },
  { key: "cancelled", label: "ĐÃ HỦY", color: "bg-red-500" },
  { key: "no_show", label: "KHÔNG ĐẾN", color: "bg-gray-400" },
];

const RevenuePage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await businessApi.getDashboard();
        setStats(response.data);
      } catch {
        toast.error("Không thể tải dữ liệu doanh thu");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-background relative">
      <div className="absolute inset-0 bg-grid-dots opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-[1200px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between border-b-4 border-black pb-6">
          <div className="flex items-center gap-6">
            <div className="accent-bar h-16" />
            <div>
              <h1 className="tim-title">DOANH THU</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="tim-system bg-black text-white px-3 py-1 text-xs uppercase">
                  PORTAL // REVENUE
                </span>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center bg-white border-2 border-black border-dashed">
            <div className="w-16 h-16 border-4 border-black border-t-primary rounded-none animate-spin mb-4" />
            <span className="tim-system bg-black text-white px-4 py-2 animate-pulse">
              ĐANG TẢI DỮ LIỆU [ _ ]
            </span>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border-4 border-black p-6 relative group hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary" />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="tim-meta text-muted-foreground">
                      TỔNG DOANH THU
                    </p>
                    <p className="tim-stats text-foreground mt-1">
                      {formatPrice(stats?.totalRevenue)}
                    </p>
                    <p className="text-[10px] font-mono mt-2 text-gray-500">
                      Từ tất cả booking hoàn thành
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-200 group-hover:bg-primary group-hover:text-black transition-colors">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="bg-white border-4 border-black p-6 relative group hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500" />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="tim-meta text-muted-foreground">
                      HOA HỒNG HỆ THỐNG
                    </p>
                    <p className="tim-stats text-red-600 mt-1">
                      -{formatPrice(stats?.totalCommission)}
                    </p>
                    <p className="text-[10px] font-mono mt-2 text-gray-500">
                      Phí nền tảng tính trên doanh thu
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-200 group-hover:bg-red-100 transition-colors">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white border-4 border-black p-6 relative group hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-500" />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="tim-meta text-muted-foreground">
                      DOANH THU RÒNG
                    </p>
                    <p className="tim-stats text-emerald-600 mt-1">
                      {formatPrice(stats?.netRevenue)}
                    </p>
                    <p className="text-[10px] font-mono mt-2 text-gray-500">
                      Sau khi trừ hoa hồng
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-200 group-hover:bg-emerald-100 transition-colors">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown Table */}
            <div className="bg-white border-4 border-black">
              <div className="px-6 py-4 border-b-4 border-black bg-gray-50 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <h3 className="font-black text-sm uppercase tracking-widest">
                  CHI TIẾT THEO TRẠNG THÁI BOOKING
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {STATUS_ROWS.map(({ key, label, color }) => {
                  const count = stats?.bookingsByStatus?.[key] || 0;
                  const pct = stats?.bookingsCount
                    ? (count / stats.bookingsCount) * 100
                    : 0;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between font-mono text-xs font-bold">
                        <span>{label}</span>
                        <span>
                          {count}{" "}
                          <span className="text-gray-400 font-normal">
                            ({pct.toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-3 border-2 border-black bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full ${color} transition-all duration-500`}
                          style={{ width: `${Math.max(pct, 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-6 py-4 border-t-4 border-black bg-gray-50 flex items-center justify-between font-mono text-sm font-black">
                <span>TỔNG CỘNG</span>
                <span>{stats?.bookingsCount || 0} BOOKING</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RevenuePage;
