import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  MapPin,
  Clock,
  Users,
  Phone,
  Eye,
  Loader2,
} from "lucide-react";
import * as bookingApi from "@/apis/bookingService";
import { getMyPlaces } from "@/apis/businessApi";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { BOOKING_STATUS } from "@/constants/constants";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Time Slots ─────────────────────────────────────────────────────────────────

const TIME_SLOTS = [
  { id: "06:00", label: "06:00" },
  { id: "07:00", label: "07:00" },
  { id: "08:00", label: "08:00" },
  { id: "09:00", label: "09:00" },
  { id: "10:00", label: "10:00" },
  { id: "11:00", label: "11:00" },
  { id: "12:00", label: "12:00" },
  { id: "13:00", label: "13:00" },
  { id: "14:00", label: "14:00" },
  { id: "15:00", label: "15:00" },
  { id: "16:00", label: "16:00" },
  { id: "17:00", label: "17:00" },
  { id: "18:00", label: "18:00" },
  { id: "19:00", label: "19:00" },
  { id: "20:00", label: "20:00" },
  { id: "21:00", label: "21:00" },
];

// ─── Status Colors ───────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  [BOOKING_STATUS.PENDING]: { bg: "bg-amber-50", border: "border-l-amber-500", text: "text-amber-700", dot: "bg-amber-500", ring: "ring-amber-200" },
  [BOOKING_STATUS.CONFIRMED]: { bg: "bg-blue-50", border: "border-l-blue-500", text: "text-blue-700", dot: "bg-blue-500", ring: "ring-blue-200" },
  [BOOKING_STATUS.COMPLETED]: { bg: "bg-emerald-50", border: "border-l-emerald-500", text: "text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  [BOOKING_STATUS.CANCELLED]: { bg: "bg-slate-100", border: "border-l-slate-400", text: "text-slate-600", dot: "bg-slate-400", ring: "ring-slate-200" },
};

// ─── Helper Functions ────────────────────────────────────────────────────────────

const isSameDay = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const getWeekDays = (startDate) => {
  const days = [];
  const start = new Date(startDate);
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    days.push(date);
  }
  return days;
};

const toDateString = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ─── Booking Card ───────────────────────────────────────────────────────────────

function BookingCard({ booking, onClick }) {
  const colors = STATUS_COLORS[booking.status] || STATUS_COLORS[BOOKING_STATUS.PENDING];

  return (
    <button
      type="button"
      onClick={() => onClick(booking)}
      className={cn(
        "w-full text-left p-2 rounded-lg border border-gray-200 border-l-4 transition-all",
        "hover:shadow-md hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        colors.bg,
        colors.border
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="font-semibold text-xs text-gray-900 truncate line-clamp-1">
          {booking.user?.profile?.fullName || booking.guestName || booking.user?.fullName || "Khách"}
        </span>
      </div>
      {booking.service?.name && (
        <p className="text-[10px] text-gray-500 truncate mt-0.5">{booking.service.name}</p>
      )}
      {booking.partySize && (
        <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
          <Users className="h-2.5 w-2.5" />
          {booking.partySize} khách
        </p>
      )}
      {booking.user?.profile?.phone && (
        <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
          <Phone className="h-2.5 w-2.5" />
          {booking.user.profile.phone}
        </p>
      )}
    </button>
  );
}

// ─── Empty Cell ────────────────────────────────────────────────────────────────

function EmptyCell() {
  return (
    <div className="w-full h-full flex items-center justify-center opacity-30">
      <div className="w-4 h-4 rounded-full border-2 border-dashed border-gray-300" />
    </div>
  );
}

// ─── Booking Detail Modal ───────────────────────────────────────────────────────

function BookingDetailModal({ booking, open, onClose }) {
  if (!booking) return null;

  const colors = STATUS_COLORS[booking.status] || STATUS_COLORS[BOOKING_STATUS.PENDING];
  const useDate = booking.useDate ? new Date(booking.useDate) : new Date(booking.bookingAt);

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center", !open && "pointer-events-none")}>
      <div
        className={cn("fixed inset-0 bg-black/50 transition-opacity", !open && "opacity-0")}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto transition-transform",
          open ? "scale-100" : "scale-95"
        )}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Chi tiết đặt chỗ</h2>
            <p className="text-sm text-gray-500 font-mono">{booking.bookingCode}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Đóng"
          >
            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Status */}
          <div className={cn("p-4 rounded-xl border", colors.bg, colors.border)}>
            <div className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", colors.dot)} />
              <span className={cn("font-semibold", colors.text)}>
                {booking.status === BOOKING_STATUS.PENDING && "Chờ xác nhận"}
                {booking.status === BOOKING_STATUS.CONFIRMED && "Đã xác nhận"}
                {booking.status === BOOKING_STATUS.COMPLETED && "Hoàn thành"}
                {booking.status === BOOKING_STATUS.CANCELLED && "Đã hủy"}
              </span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Khách hàng</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Tên</p>
                <p className="font-medium">{booking.user?.profile?.fullName || booking.guestName || "Khách"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Số điện thoại</p>
                <p className="font-medium">{booking.user?.profile?.phone || booking.guestPhone || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium">{booking.user?.email || booking.guestEmail || "-"}</p>
              </div>
            </div>
          </div>

          {/* Booking Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Đặt chỗ</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Ngày</p>
                <p className="font-medium">
                  {useDate.toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Giờ</p>
                <p className="font-medium">{booking.useTime || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Số khách</p>
                <p className="font-medium">{booking.partySize || booking.quantity || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tổng tiền</p>
                <p className="font-bold text-lg">
                  {(booking.finalPrice || 0).toLocaleString("vi-VN")} đ
                </p>
              </div>
            </div>
          </div>

          {/* Service & Place */}
          {(booking.service || booking.place) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Dịch vụ & Địa điểm</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                {booking.place && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">{booking.place.name}</p>
                      {booking.place.address && (
                        <p className="text-xs text-gray-500">{booking.place.address}</p>
                      )}
                    </div>
                  </div>
                )}
                {booking.service && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">{booking.service.name}</p>
                      {booking.service.price && (
                        <p className="text-xs text-gray-500">
                          {booking.service.price.toLocaleString("vi-VN")} đ
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {booking.note && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Ghi chú</h3>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{booking.note}</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Link to={BUSINESS_ROUTES.BOOKING_DETAIL(booking.id)}>
            <Button>
              <Eye className="h-4 w-4 mr-2" />
              Xem chi tiết
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

const BookingSchedulePage = () => {
  // Week start (Monday)
  const [weekStart, setWeekStart] = useState(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [places, setPlaces] = useState([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  // Load places
  useEffect(() => {
    getMyPlaces()
      .then((res) => {
        setPlaces(res.data || []);
        if (res.data?.length === 1) {
          setSelectedPlaceId(String(res.data[0].id));
        }
      })
      .catch(() => {});
  }, []);

  // Load bookings for the week using getAll API with date range
  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const fromDate = toDateString(weekStart);
      const toDate = toDateString(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000));

      const res = await bookingApi.getAll({
        fromDate,
        toDate,
        limit: 500, // Get up to 500 bookings for the week
      });

      console.log("[BookingSchedule] API Response:", res.data);
      setAllBookings(res.data || []);
    } catch (e) {
      console.error("[BookingSchedule] Load error:", e);
      toastApiErrorIfNeeded(e);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Filter bookings by place
  const filteredBookings = useMemo(() => {
    if (selectedPlaceId === "all") return allBookings;
    return allBookings.filter((b) => b.place?.id === Number(selectedPlaceId));
  }, [allBookings, selectedPlaceId]);

  // Get bookings for a specific day
  const getBookingsForDay = useCallback((date) => {
    return filteredBookings.filter((b) => {
      const bookingDate = b.useDate ? new Date(b.useDate) : new Date(b.bookingAt);
      return isSameDay(bookingDate, date);
    });
  }, [filteredBookings]);

  // Get bookings for a specific time slot on a specific day
  const getBookingsForSlot = useCallback((date, timeId) => {
    const dayBookings = getBookingsForDay(date);
    const slotHour = parseInt(timeId.split(":")[0], 10);

    return dayBookings.filter((b) => {
      if (!b.useTime) return false;
      const bookingHour = parseInt(b.useTime.split(":")[0], 10);
      return bookingHour === slotHour;
    });
  }, [getBookingsForDay]);

  // Stats
  const stats = useMemo(() => ({
    total: filteredBookings.length,
    pending: filteredBookings.filter((b) => b.status === BOOKING_STATUS.PENDING).length,
    confirmed: filteredBookings.filter((b) => b.status === BOOKING_STATUS.CONFIRMED).length,
    completed: filteredBookings.filter((b) => b.status === BOOKING_STATUS.COMPLETED).length,
  }), [filteredBookings]);

  // Navigation
  const goToPrevWeek = () => {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    setWeekStart(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    setWeekStart(next);
  };

  const goToToday = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setWeekStart(monday);
  };

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setDetailOpen(true);
  };

  const selectedPlace = places.find((p) => String(p.id) === selectedPlaceId);

  // Week range label
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekLabel = `${weekStart.toLocaleDateString("vi-VN", { day: "numeric", month: "short" })} - ${weekEnd.toLocaleDateString("vi-VN", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to={BUSINESS_ROUTES.BOOKINGS}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Danh sách đặt chỗ</span>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Lịch đặt chỗ</h1>
                <p className="text-sm text-gray-500">Xem và quản lý lịch theo tuần</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadBookings}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              <span className="hidden sm:inline">Làm mới</span>
            </Button>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPrevWeek} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday} className="h-8">
                Hôm nay
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextWeek} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="ml-4 text-sm font-semibold text-gray-900">{weekLabel}</span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-amber-500 rounded-full" />
                <span className="text-gray-600">
                  <span className="font-semibold tabular-nums">{stats.pending}</span> chờ
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-gray-600">
                  <span className="font-semibold tabular-nums">{stats.confirmed}</span> xác nhận
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-gray-600">
                  <span className="font-semibold tabular-nums">{stats.completed}</span> hoàn thành
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <Select value={selectedPlaceId} onValueChange={setSelectedPlaceId}>
              <SelectTrigger className="w-56 h-9 text-sm">
                <SelectValue placeholder="Tất cả địa điểm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả địa điểm</SelectItem>
                {places.map((place) => (
                  <SelectItem key={place.id} value={String(place.id)}>
                    {place.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPlace && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/10">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{selectedPlace.name}</span>
              <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full tabular-nums">
                {filteredBookings.length} đặt
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex">
              {/* Time column */}
              <div className="w-16 bg-gray-50 border-r border-gray-200 shrink-0">
                <div className="h-14 border-b border-gray-200" />
                {TIME_SLOTS.slice(0, 8).map((slot) => (
                  <div key={slot.id} className="h-20 border-b border-gray-100 flex items-center justify-center">
                    <Skeleton className="h-4 w-10" />
                  </div>
                ))}
              </div>
              {/* Day columns */}
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="flex-1 min-w-[120px]">
                  <div className="h-14 border-b border-gray-200" />
                  {TIME_SLOTS.slice(0, 8).map((slot) => (
                    <div key={slot.id} className="h-20 border-b border-gray-100 p-1.5">
                      <Skeleton className="h-full w-full rounded-lg" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Day Headers */}
            <div className="flex border-b border-gray-200">
              <div className="w-16 bg-gray-50 border-r border-gray-200 shrink-0" />
              {weekDays.map((day) => {
                const isToday = isSameDay(day, new Date());
                const dayBookings = getBookingsForDay(day);
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "flex-1 min-w-[120px] py-3 text-center border-r border-gray-100 last:border-r-0",
                      isToday && "bg-primary/5"
                    )}
                  >
                    <p className={cn(
                      "text-[10px] uppercase tracking-wide",
                      isWeekend ? "text-red-500" : "text-gray-500"
                    )}>
                      {day.toLocaleDateString("vi-VN", { weekday: "short" })}
                    </p>
                    <p className={cn(
                      "text-xl font-bold mt-0.5",
                      isToday ? "text-primary" : "text-gray-900"
                    )}>
                      {day.getDate()}
                    </p>
                    {dayBookings.length > 0 && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-gray-100 text-[10px] font-medium text-gray-600 rounded-full tabular-nums">
                        {dayBookings.length} đặt
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Time Grid */}
            <div className="flex max-h-[600px] overflow-y-auto">
              {/* Time labels */}
              <div className="w-16 bg-gray-50 border-r border-gray-200 shrink-0">
                {TIME_SLOTS.map((slot) => (
                  <div
                    key={slot.id}
                    className="h-20 border-b border-gray-100 flex items-center justify-center"
                  >
                    <span className="text-[10px] font-medium text-gray-500">{slot.label}</span>
                  </div>
                ))}
              </div>

              {/* Day columns with bookings */}
              {weekDays.map((day) => {
                const isToday = isSameDay(day, new Date());
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "flex-1 min-w-[120px] border-r border-gray-100 last:border-r-0",
                      isToday && "bg-primary/[0.02]"
                    )}
                  >
                    {TIME_SLOTS.map((slot) => {
                      const slotBookings = getBookingsForSlot(day, slot.id);

                      return (
                        <div
                          key={slot.id}
                          className={cn(
                            "h-20 border-b border-gray-100 p-1 transition-colors",
                            slotBookings.length > 0 && "bg-gray-50/50"
                          )}
                        >
                          {slotBookings.length > 0 ? (
                            <div className="h-full space-y-1 overflow-y-auto">
                              {slotBookings.map((booking) => (
                                <BookingCard
                                  key={booking.id}
                                  booking={booking}
                                  onClick={handleViewBooking}
                                />
                              ))}
                            </div>
                          ) : (
                            <EmptyCell />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-50 border-l-2 border-l-amber-500 rounded" />
            <span>Chờ xác nhận</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-50 border-l-2 border-l-blue-500 rounded" />
            <span>Đã xác nhận</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-50 border-l-2 border-l-emerald-500 rounded" />
            <span>Hoàn thành</span>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
};

export default BookingSchedulePage;
