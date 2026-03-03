import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  CalendarCheck,
  Check,
  X,
  CheckCircle,
  AlertTriangle,
  Search,
  Eye,
} from "lucide-react";
import { Button, Input, Card, CardContent } from "@/components/ui";
import * as bookingApi from "@/apis/bookingService";
import { BOOKING_STATUS } from "@/constants/constants";
import { BUSINESS_ROUTES } from "@/constants/routes";

const STATUS_CONFIG = {
  pending: { label: "Chờ xác nhận", bg: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Đã xác nhận", bg: "bg-blue-100 text-blue-800" },
  completed: { label: "Hoàn thành", bg: "bg-green-100 text-green-800" },
  cancelled: { label: "Đã hủy", bg: "bg-red-100 text-red-800" },
  no_show: { label: "Không đến", bg: "bg-gray-100 text-gray-800" },
};

const STATUS_TABS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

const BookingListPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState([]);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await bookingApi.getAll({ search, status, page: 1, limit: 20 });
      setBookings(response.data || []);
    } catch {
      toast.error("Không thể tải danh sách");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  const loadStats = async () => {
    try {
      const response = await bookingApi.getStats();
      setStats(response.data);
    } catch {}
  };

  useEffect(() => { loadBookings(); }, [loadBookings]);
  useEffect(() => { loadStats(); }, []);

  const handleConfirm = async (id) => {
    try {
      await bookingApi.confirm(id);
      toast.success("Xác nhận thành công");
      loadBookings();
      loadStats();
    } catch (error) {
      toast.error(error.message || "Không thể xác nhận");
    }
  };

  const handleCancel = async () => {
    if (cancelReason.length < 5) {
      toast.error("Lý do hủy phải có ít nhất 5 ký tự");
      return;
    }
    try {
      await bookingApi.cancel(cancelModal, cancelReason);
      toast.success("Hủy booking thành công");
      setCancelModal(null);
      setCancelReason("");
      loadBookings();
      loadStats();
    } catch (error) {
      toast.error(error.message || "Không thể hủy");
    }
  };

  const handleComplete = async (id) => {
    try {
      await bookingApi.complete(id);
      toast.success("Hoàn thành booking");
      loadBookings();
      loadStats();
    } catch (error) {
      toast.error(error.message || "Không thể hoàn thành");
    }
  };

  const handleNoShow = async (id) => {
    try {
      await bookingApi.markNoShow(id);
      toast.success("Đánh dấu không đến");
      loadBookings();
      loadStats();
    } catch (error) {
      toast.error(error.message || "Không thể đánh dấu");
    }
  };

  const handleBulkConfirm = async () => {
    if (selected.length === 0) return;
    try {
      await bookingApi.bulkConfirm(selected);
      toast.success(`Đã xác nhận ${selected.length} booking`);
      setSelected([]);
      loadBookings();
      loadStats();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const formatPrice = (price) =>
    price ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price) : "—";

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarCheck className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Quản lý đặt chỗ</h1>
        </div>
        {selected.length > 0 && status === "pending" && (
          <Button onClick={handleBulkConfirm}>
            <Check className="h-4 w-4 mr-2" /> Xác nhận {selected.length} booking
          </Button>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <Card key={key}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{stats.byStatus?.[key] || 0}</p>
                <p className="text-sm text-gray-500">{config.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm mã booking / tên khách..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.value}
              variant={status === tab.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatus(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Không có booking nào</div>
      ) : (
        <div className="space-y-3">
          {bookings.map((bk) => {
            const cfg = STATUS_CONFIG[bk.status] || {};
            return (
              <Card key={bk.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    {bk.status === "pending" && (
                      <input
                        type="checkbox"
                        checked={selected.includes(bk.id)}
                        onChange={() => toggleSelect(bk.id)}
                      />
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{bk.bookingCode}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {bk.user?.fullName} — {bk.service?.name} — {formatPrice(bk.finalPrice)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Ngày: {formatDate(bk.bookingDate)} | Tạo: {formatDate(bk.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(BUSINESS_ROUTES.BOOKING_DETAIL(bk.id))}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {bk.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => handleConfirm(bk.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setCancelModal(bk.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {bk.status === "confirmed" && (
                      <>
                        <Button size="sm" onClick={() => handleComplete(bk.id)}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleNoShow(bk.id)}
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-bold">Hủy booking</h3>
            <textarea
              className="w-full border rounded-md p-3 min-h-[80px]"
              placeholder="Lý do hủy (ít nhất 5 ký tự)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setCancelModal(null); setCancelReason(""); }}>
                Quay lại
              </Button>
              <Button variant="destructive" onClick={handleCancel}>
                Xác nhận hủy
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingListPage;
