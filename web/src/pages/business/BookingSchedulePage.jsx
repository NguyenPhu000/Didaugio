import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import {
  ArrowLeft,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Users,
  Phone,
  Eye,
  LayoutGrid,
  LayoutList,
  AlertCircle,
  CircleCheck,
  CircleX,
  Lock,
} from "lucide-react";
import * as bookingApi from "@/apis/bookingService";
import { getMyPlaces } from "@/apis/businessApi";
import { blockedDateApi } from "@/apis/blockedDateApi";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { BOOKING_STATUS } from "@/constants/constants";
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

// ─── Booking Models ───────────────────────────────────────────────────────────────

const BOOKING_MODELS = {
  CAPACITY: "capacity",  // Vé/Tour - theo số lượng
  RESOURCE: "resource", // Bàn/Phòng - theo tài nguyên cụ thể
  SLOT: "slot",         // Khung giờ cố định
};

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
  [BOOKING_STATUS.PENDING]: { bg: "bg-amber-50", border: "border-l-amber-500", text: "text-amber-700", dot: "bg-amber-500" },
  [BOOKING_STATUS.CONFIRMED]: { bg: "bg-blue-50", border: "border-l-blue-500", text: "text-blue-700", dot: "bg-blue-500" },
  [BOOKING_STATUS.COMPLETED]: { bg: "bg-emerald-50", border: "border-l-emerald-500", text: "text-emerald-700", dot: "bg-emerald-500" },
  [BOOKING_STATUS.CANCELLED]: { bg: "bg-slate-100", border: "border-l-slate-300", text: "text-slate-500", dot: "bg-slate-400" },
  [BOOKING_STATUS.REJECTED]: { bg: "bg-rose-50", border: "border-l-rose-500", text: "text-rose-700", dot: "bg-rose-500" },
  [BOOKING_STATUS.EXPIRED]: { bg: "bg-orange-50", border: "border-l-orange-500", text: "text-orange-700", dot: "bg-orange-500" },
  [BOOKING_STATUS.NO_SHOW]: { bg: "bg-purple-50", border: "border-l-purple-500", text: "text-purple-700", dot: "bg-purple-500" },
};

const STATUS_LABELS = {
  [BOOKING_STATUS.PENDING]: "Chờ xác nhận",
  [BOOKING_STATUS.CONFIRMED]: "Đã xác nhận",
  [BOOKING_STATUS.COMPLETED]: "Hoàn thành",
  [BOOKING_STATUS.CANCELLED]: "Đã hủy",
  [BOOKING_STATUS.REJECTED]: "Bị từ chối",
  [BOOKING_STATUS.EXPIRED]: "Hết hạn",
  [BOOKING_STATUS.NO_SHOW]: "Không đến",
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

// API returns nested: { service: { place: { id, name } } }
const getPlaceFromBooking = (booking) => {
  return booking.service?.place || booking.place || null;
};

const getServiceFromBooking = (booking) => {
  return booking.service || null;
};

// ─── Capacity Indicator ─────────────────────────────────────────────────────────

function CapacityIndicator({ used, capacity, className }) {
  if (capacity === null || capacity === undefined) return null;

  const percentage = Math.min((used / capacity) * 100, 100);
  const isFull = used >= capacity;
  const isWarning = percentage >= 80 && !isFull;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isFull ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn(
        "text-[10px] font-medium tabular-nums",
        isFull ? "text-red-600" : isWarning ? "text-amber-600" : "text-gray-500"
      )}>
        {used}/{capacity}
      </span>
    </div>
  );
}

// ─── Booking Card ───────────────────────────────────────────────────────────────

function BookingCard({ booking, onClick, compact = false }) {
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
          {booking.user?.fullName || booking.guestName || "Khách"}
        </span>
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-1", colors.dot)} />
      </div>
      {booking.service?.name && (
        <p className="text-[10px] text-gray-500 truncate mt-0.5">{booking.service.name}</p>
      )}
      {booking.resource && (
        <p className="text-[10px] text-primary font-medium flex items-center gap-0.5 mt-0.5">
          <MapPin className="h-2.5 w-2.5" />
          {booking.resource.name}
        </p>
      )}
      {!compact && (
        <>
          {booking.partySize && (
            <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
              <Users className="h-2.5 w-2.5" />
              {booking.partySize} khách
            </p>
          )}
          {booking.user?.phone && (
            <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
              <Phone className="h-2.5 w-2.5" />
              {booking.user.phone}
            </p>
          )}
        </>
      )}
    </button>
  );
}

// ─── Resource Timeline Card (for RESOURCE model) ─────────────────────────────────

function ResourceTimelineCard({ booking, onClick }) {
  const colors = STATUS_COLORS[booking.status] || STATUS_COLORS[BOOKING_STATUS.PENDING];
  const service = getServiceFromBooking(booking);

  // Calculate width based on duration (default 60 minutes)
  const duration = service?.durationMinutes || 60;
  const widthPercent = (duration / 60) * (100 / 6); // 6 hours = 100%

  return (
    <button
      type="button"
      onClick={() => onClick(booking)}
      className={cn(
        "absolute top-1 rounded-lg border border-l-4 p-1.5 min-w-[80px] max-w-[200px] transition-all",
        "hover:shadow-lg hover:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        colors.bg,
        colors.border
      )}
      style={{ width: `${Math.max(widthPercent, 25)}%` }}
    >
      <p className="text-[10px] font-semibold text-gray-900 truncate">
        {booking.user?.fullName || booking.guestName || "Khách"}
      </p>
      <p className="text-[9px] text-gray-500 truncate">
        {booking.useTime} {booking.endTimeStr && `- ${booking.endTimeStr}`}
      </p>
      {booking.partySize && (
        <p className="text-[9px] text-gray-400">{booking.partySize} khách</p>
      )}
    </button>
  );
}

// ─── Empty Cell ────────────────────────────────────────────────────────────────

function EmptyCell({ showCapacity }) {
  return (
    <div className="w-full h-full flex items-center justify-center opacity-30">
      <div className="w-4 h-4 rounded-full border-2 border-dashed border-gray-300" />
    </div>
  );
}

// ─── Day Column (Grid View) ─────────────────────────────────────────────────────

function DayColumnGrid({ date, bookings, servicesMap, onViewBooking }) {
  const isToday = isSameDay(date, new Date());
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  // Group bookings by time slot
  const getBookingsForSlot = (timeId) => {
    const slotHour = parseInt(timeId.split(":")[0], 10);
    return bookings.filter((b) => {
      if (!b.useTime) return false;
      const bookingHour = parseInt(b.useTime.split(":")[0], 10);
      return bookingHour === slotHour;
    });
  };

  // Calculate capacity for a slot
  const getSlotCapacity = (timeId) => {
    const slotBookings = getBookingsForSlot(timeId);
    const totalUsed = slotBookings.reduce((sum, b) => sum + (b.quantity || 1), 0);

    // Get max capacity from services (simplified - take first service's capacity)
    const firstBooking = slotBookings[0];
    const maxCapacity = firstBooking?.service?.maxCapacity || null;

    return { used: totalUsed, capacity: maxCapacity };
  };

  return (
    <div className={cn("flex-1 min-w-[120px] border-r border-gray-100 last:border-r-0", isToday && "bg-primary/5")}>
      {/* Time Grid */}
      {TIME_SLOTS.map((slot) => {
        const slotBookings = getBookingsForSlot(slot.id);
        const capacity = getSlotCapacity(slot.id);

        return (
          <div
            key={slot.id}
            className={cn(
              "h-20 border-b border-gray-100 p-1 transition-colors",
              slotBookings.length > 0 && "bg-gray-50/50"
            )}
          >
            {slotBookings.length > 0 ? (
              <div className="h-full flex flex-col gap-1">
                {slotBookings.slice(0, 2).map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onClick={onViewBooking}
                    compact
                  />
                ))}
                {slotBookings.length > 2 && (
                  <p className="text-[10px] text-gray-500 text-center">
                    +{slotBookings.length - 2} more
                  </p>
                )}
              </div>
            ) : (
              <EmptyCell />
            )}
            {/* Capacity Indicator */}
            {capacity.capacity && (
              <CapacityIndicator
                used={capacity.used}
                capacity={capacity.capacity}
                className="mt-auto"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Day Column (Timeline View for RESOURCE model) ───────────────────────────────

function DayColumnTimeline({ date, bookings, onViewBooking }) {
  const isToday = isSameDay(date, new Date());
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  // Group by resource
  const bookingsByResource = useMemo(() => {
    const groups = {};
    bookings.forEach((b) => {
      const resourceId = b.resource?.id || "unassigned";
      if (!groups[resourceId]) {
        groups[resourceId] = [];
      }
      groups[resourceId].push(b);
    });
    return groups;
  }, [bookings]);

  // Get unique resources
  const resources = useMemo(() => {
    const seen = new Set();
    const result = [];
    bookings.forEach((b) => {
      if (b.resource && !seen.has(b.resource.id)) {
        seen.add(b.resource.id);
        result.push(b.resource);
      }
    });
    return result;
  }, [bookings]);

  return (
    <div className={cn("flex-1 min-w-[120px] border-r border-gray-100 last:border-r-0", isToday && "bg-primary/5")}>
      {/* Timeline Grid */}
      <div className="relative h-[calc(16*5rem)] border-b border-gray-100">
        {/* Time labels */}
        {TIME_SLOTS.map((slot, idx) => (
          <div
            key={slot.id}
            className={cn(
              "absolute left-0 w-full h-20 border-b border-gray-100",
              idx % 2 === 1 && "bg-gray-50/30"
            )}
            style={{ top: `${idx * 5}rem` }}
          >
            <span className="absolute -top-3 left-1 text-[10px] text-gray-400">
              {slot.label}
            </span>
          </div>
        ))}

        {/* Bookings */}
        {bookings.map((booking) => {
          const startHour = parseInt(booking.useTime?.split(":")[0] || "9", 10);
          const topPercent = ((startHour - 6) / 15) * 100;

          return (
            <div
              key={booking.id}
              className="absolute left-1 right-1"
              style={{ top: `${topPercent}%` }}
            >
              <ResourceTimelineCard
                booking={booking}
                onClick={onViewBooking}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Booking Detail Modal ───────────────────────────────────────────────────────

function BookingDetailModal({ booking, open, onClose }) {
  if (!booking) return null;

  const colors = STATUS_COLORS[booking.status] || STATUS_COLORS[BOOKING_STATUS.PENDING];
  const useDate = booking.useDate ? new Date(booking.useDate) : new Date(booking.bookingAt);
  const service = getServiceFromBooking(booking);
  const place = getPlaceFromBooking(booking);

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center", !open && "pointer-events-none")}>
      <div
        className={cn("fixed inset-0 bg-black/50 transition-opacity duration-200", open ? "opacity-100" : "opacity-0")}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto transition-all duration-200",
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
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
                {STATUS_LABELS[booking.status] || booking.status}
              </span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Khách hàng</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Tên</p>
                <p className="font-medium">{booking.user?.fullName || booking.guestName || "Khách"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Số điện thoại</p>
                <p className="font-medium">{booking.user?.phone || booking.guestPhone || "-"}</p>
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
                <p className="font-medium">
                  {booking.useTime || "-"}
                  {booking.endTimeStr && ` - ${booking.endTimeStr}`}
                </p>
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
          {(service || place) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Dịch vụ & Địa điểm</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                {place && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">{place.name}</p>
                      {place.address && (
                        <p className="text-xs text-gray-500">{place.address}</p>
                      )}
                    </div>
                  </div>
                )}
                {service && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">{service.name}</p>
                      {service.durationMinutes && (
                        <p className="text-xs text-gray-500">{service.durationMinutes} phút</p>
                      )}
                      {service.maxCapacity && (
                        <p className="text-xs text-gray-500">Sức chứa: {service.maxCapacity}</p>
                      )}
                    </div>
                  </div>
                )}
                {booking.resource && (
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-primary">{booking.resource.name}</p>
                      <p className="text-xs text-gray-500">
                        {booking.resource.resourceType} {booking.resource.code && `(${booking.resource.code})`}
                      </p>
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
  const [blockedDates, setBlockedDates] = useState([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "timeline"

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

  // Load bookings for the week
  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const fromDate = toDateString(weekStart);
      const toDate = toDateString(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000));

      const [bookingRes, blockedRes] = await Promise.all([
        bookingApi.getAll({ fromDate, toDate, limit: 500 }),
        blockedDateApi.getAll({ fromDate, toDate }).catch(() => ({ data: [] })),
      ]);

      setAllBookings(bookingRes.data || []);
      setBlockedDates(blockedRes?.data || []);
    } catch (e) {
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
    return allBookings.filter((b) => getPlaceFromBooking(b)?.id === Number(selectedPlaceId));
  }, [allBookings, selectedPlaceId]);

  // Get bookings for a specific day
  const getBookingsForDay = useCallback((date) => {
    return filteredBookings.filter((b) => {
      const bookingDate = b.useDate ? new Date(b.useDate) : new Date(b.bookingAt);
      return isSameDay(bookingDate, date);
    });
  }, [filteredBookings]);

  // Check if a date is blocked
  const getBlockedForDay = useCallback((date) => {
    return blockedDates.filter((bd) => {
      const bdDate = new Date(bd.date);
      return isSameDay(bdDate, date);
    });
  }, [blockedDates]);

  // Stats
  const stats = useMemo(() => ({
    total: filteredBookings.length,
    pending: filteredBookings.filter((b) => b.status === BOOKING_STATUS.PENDING).length,
    confirmed: filteredBookings.filter((b) => b.status === BOOKING_STATUS.CONFIRMED).length,
    completed: filteredBookings.filter((b) => b.status === BOOKING_STATUS.COMPLETED).length,
  }), [filteredBookings]);

  // Determine view mode based on booking model
  const activeBookingModel = useMemo(() => {
    // Get unique booking models from filtered bookings
    const models = new Set();
    filteredBookings.forEach((b) => {
      const model = b.service?.bookingModel || BOOKING_MODELS.CAPACITY;
      models.add(model);
    });

    // If any booking uses RESOURCE model, use timeline view
    if (models.has(BOOKING_MODELS.RESOURCE)) {
      return BOOKING_MODELS.RESOURCE;
    }
    return BOOKING_MODELS.CAPACITY;
  }, [filteredBookings]);

  // Auto-switch view mode based on booking model
  useEffect(() => {
    if (activeBookingModel === BOOKING_MODELS.RESOURCE) {
      setViewMode("timeline");
    }
  }, [activeBookingModel]);

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
                <p className="text-sm text-gray-500">
                  {activeBookingModel === BOOKING_MODELS.RESOURCE
                    ? "Quản lý theo tài nguyên (bàn/phòng)"
                    : "Quản lý theo sức chứa"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              {activeBookingModel === BOOKING_MODELS.RESOURCE && (
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      viewMode === "grid"
                        ? "bg-white shadow-sm text-primary"
                        : "text-gray-500 hover:text-gray-700"
                    )}
                    aria-label="Xem dạng lưới"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("timeline")}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      viewMode === "timeline"
                        ? "bg-white shadow-sm text-primary"
                        : "text-gray-500 hover:text-gray-700"
                    )}
                    aria-label="Xem dạng timeline"
                  >
                    <LayoutList className="h-4 w-4" />
                  </button>
                </div>
              )}
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

          {/* Model indicator */}
          <div className={cn(
            "ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium",
            activeBookingModel === BOOKING_MODELS.RESOURCE
              ? "bg-purple-50 text-purple-700 border border-purple-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          )}>
            {activeBookingModel === BOOKING_MODELS.RESOURCE ? (
              <>
                <Users className="h-3.5 w-3.5" />
                Mô hình: Tài nguyên
              </>
            ) : (
              <>
                <CircleCheck className="h-3.5 w-3.5" />
                Mô hình: Sức chứa
              </>
            )}
          </div>
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
                const dayBlocked = getBlockedForDay(day);
                const isBlocked = dayBlocked.length > 0;

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "flex-1 min-w-[120px] py-3 text-center border-r border-gray-100 last:border-r-0 relative",
                      isToday && "bg-primary/5",
                      isBlocked && "bg-red-50"
                    )}
                  >
                    {isBlocked && (
                      <div className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{ background: "repeating-linear-gradient(45deg, transparent, transparent 4px, #ef4444 4px, #ef4444 5px)" }}
                      />
                    )}
                    <p className={cn(
                      "text-[10px] uppercase tracking-wide",
                      isBlocked ? "text-red-500" : (day.getDay() === 0 || day.getDay() === 6) ? "text-red-500" : "text-gray-500"
                    )}>
                      {day.toLocaleDateString("vi-VN", { weekday: "short" })}
                    </p>
                    <p className={cn(
                      "text-xl font-bold mt-0.5",
                      isBlocked ? "text-red-500 line-through" : isToday ? "text-primary" : "text-gray-900"
                    )}>
                      {day.getDate()}
                    </p>
                    {isBlocked ? (
                      <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-red-100 text-[10px] font-medium text-red-700 rounded-full">
                        <Lock className="h-2.5 w-2.5" />
                        {dayBlocked[0].reason || "Chặn"}
                      </span>
                    ) : dayBookings.length > 0 ? (
                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-gray-100 text-[10px] font-medium text-gray-600 rounded-full tabular-nums">
                        {dayBookings.length} đặt
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Time Grid */}
            <div className="flex max-h-[700px] overflow-y-auto">
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

              {/* Day columns */}
              {weekDays.map((day) => (
                viewMode === "timeline" ? (
                  <DayColumnTimeline
                    key={day.toISOString()}
                    date={day}
                    bookings={getBookingsForDay(day)}
                    onViewBooking={handleViewBooking}
                  />
                ) : (
                  <DayColumnGrid
                    key={day.toISOString()}
                    date={day}
                    bookings={getBookingsForDay(day)}
                    onViewBooking={handleViewBooking}
                  />
                )
              ))}
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
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3 w-3 text-amber-500" />
            <span>≥80% sức chứa</span>
          </div>
          <div className="flex items-center gap-2">
            <CircleX className="h-3 w-3 text-red-500" />
            <span>Đầy sức chứa</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-3 w-3 text-red-500" />
            <span>Ngày chặn</span>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          // Clear after animation completes
          setTimeout(() => setSelectedBooking(null), 300);
        }}
      />
    </div>
  );
};

export default BookingSchedulePage;
