import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Check,
  X,
  CheckCircle,
  AlertTriangle,
  QrCode,
} from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import * as bookingApi from "@/apis/bookingService";
import { BUSINESS_ROUTES } from "@/constants/routes";

const STATUS_CONFIG = {
  pending: { label: "Chờ xác nhận", bg: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Đã xác nhận", bg: "bg-blue-100 text-blue-800" },
  completed: { label: "Hoàn thành", bg: "bg-green-100 text-green-800" },
  cancelled: { label: "Đã hủy", bg: "bg-red-100 text-red-800" },
  no_show: { label: "Không đến", bg: "bg-gray-100 text-gray-800" },
};

const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const loadBooking = async () => {
    setLoading(true);
    try {
      const response = await bookingApi.getById(id);
      setBooking(response.data);
    } catch (error) {
      toast.error("Không thể tải thông tin booking");
    } finally {
      setLoading(false);
    }
  };

  const loadQR = async () => {
    try {
      const response = await bookingApi.getQR(id);
      setQrCode(response.data?.qrCode);
    } catch {}
  };

  useEffect(() => {
    loadBooking();
    loadQR();
  }, [id]);

  const handleConfirm = async () => {
    try {
      await bookingApi.confirm(id);
      toast.success("Xác nhận thành công");
      loadBooking();
      loadQR();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCancel = async () => {
    if (cancelReason.length < 5) {
      toast.error("Lý do hủy phải có ít nhất 5 ký tự");
      return;
    }
    try {
      await bookingApi.cancel(id, cancelReason);
      toast.success("Hủy thành công");
      setCancelModal(false);
      loadBooking();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleComplete = async () => {
    try {
      await bookingApi.complete(id);
      toast.success("Hoàn thành booking");
      loadBooking();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleNoShow = async () => {
    try {
      await bookingApi.markNoShow(id);
      toast.success("Đánh dấu không đến");
      loadBooking();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const formatPrice = (price) =>
    price ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price) : "—";

  const formatDate = (date) =>
    date ? new Date(date).toLocaleString("vi-VN") : "—";

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

  if (!booking) {
    return <div className="text-center py-12 text-gray-500">Booking không tồn tại</div>;
  }

  const cfg = STATUS_CONFIG[booking.status] || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(BUSINESS_ROUTES.BOOKINGS)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Booking #{booking.bookingCode}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${cfg.bg}`}>
            {cfg.label}
          </span>
        </div>
        <div className="flex gap-2">
          {booking.status === "pending" && (
            <>
              <Button onClick={handleConfirm}>
                <Check className="h-4 w-4 mr-2" /> Xác nhận
              </Button>
              <Button variant="destructive" onClick={() => setCancelModal(true)}>
                <X className="h-4 w-4 mr-2" /> Hủy
              </Button>
            </>
          )}
          {booking.status === "confirmed" && (
            <>
              <Button onClick={handleComplete}>
                <CheckCircle className="h-4 w-4 mr-2" /> Hoàn thành
              </Button>
              <Button variant="outline" onClick={handleNoShow}>
                <AlertTriangle className="h-4 w-4 mr-2" /> Không đến
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Thông tin khách hàng</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Tên:</strong> {booking.user?.fullName || "—"}</p>
            <p><strong>Email:</strong> {booking.user?.email || "—"}</p>
            <p><strong>SĐT:</strong> {booking.user?.phone || "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Chi tiết booking</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Dịch vụ:</strong> {booking.service?.name || "—"}</p>
            <p><strong>Ngày đặt:</strong> {formatDate(booking.bookingDate)}</p>
            <p><strong>Số lượng:</strong> {booking.quantity || 1}</p>
            <p><strong>Tổng tiền:</strong> {formatPrice(booking.finalPrice)}</p>
            {booking.commissionAmount > 0 && (
              <p><strong>Hoa hồng:</strong> {formatPrice(booking.commissionAmount)}</p>
            )}
            {booking.cancelReason && (
              <p className="text-red-600"><strong>Lý do hủy:</strong> {booking.cancelReason}</p>
            )}
          </CardContent>
        </Card>

        {qrCode && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" /> QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            </CardContent>
          </Card>
        )}

        {booking.voucher && (
          <Card>
            <CardHeader><CardTitle>Voucher áp dụng</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Mã:</strong> {booking.voucher.code}</p>
              <p>
                <strong>Giảm:</strong>{" "}
                {booking.voucher.discountType === "percentage"
                  ? `${booking.voucher.discountValue}%`
                  : formatPrice(booking.voucher.discountValue)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-bold">Hủy booking</h3>
            <textarea
              className="w-full border rounded-md p-3 min-h-[80px]"
              placeholder="Lý do hủy..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCancelModal(false)}>Quay lại</Button>
              <Button variant="destructive" onClick={handleCancel}>Xác nhận hủy</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetailPage;
