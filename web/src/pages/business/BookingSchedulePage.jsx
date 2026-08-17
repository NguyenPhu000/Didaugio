// MAP: BookingSchedulePage
// ├── UI: @/components/business/schedule/{ScheduleCalendarView, ScheduleDayAgenda, ScheduleStatsBar, ScheduleDetailModal}
// └── API: @/apis/bookingService, @/apis/businessApi

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import { ArrowLeft, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import * as bookingApi from "@/apis/bookingService";
import { getMyPlaces } from "@/apis/businessApi";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { BOOKING_STATUS } from "@/constants/constants";
import { Button } from "@/components/ui/button";
import AetherBentoCard from "@/components/business/AetherBentoCard";
import { cn } from "@/lib/utils";

// Extracted Sub-Components & Constants
import {
  TIME_SLOTS,
  isSameDay,
  toDateString,
  getWeekDays,
} from "@/components/business/booking-schedule/scheduleConstants";
import ScheduleDayColumnGrid from "@/components/business/booking-schedule/ScheduleDayColumnGrid";
import ScheduleDetailModal from "@/components/business/booking-schedule/ScheduleDetailModal";

const BookingSchedulePage = memo(() => {
  const { t } = useTranslation();
  const [places, setPlaces] = useState([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState("all");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const fromDate = toDateString(weekDays[0]);
      const toDate = toDateString(weekDays[6]);

      const res = await bookingApi.getAll({
        fromDate,
        toDate,
        limit: 200,
        page: 1,
        ...(selectedPlaceId !== "all" && { placeId: selectedPlaceId }),
      });
      setBookings(res.data || []);
    } catch (e) {
      toastApiErrorIfNeeded(e);
    } finally {
      setLoading(false);
    }
  }, [weekDays, selectedPlaceId]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    getMyPlaces()
      .then((res) => setPlaces(res.data || []))
      .catch(() => {});
  }, []);

  const getBookingsForDay = useCallback(
    (date) => {
      return bookings.filter((b) => {
        const bDate = b.useDate ? new Date(b.useDate) : new Date(b.bookingAt);
        return isSameDay(bDate, date);
      });
    },
    [bookings]
  );

  const stats = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter((b) => b.status === BOOKING_STATUS.PENDING).length,
      confirmed: bookings.filter((b) => b.status === BOOKING_STATUS.CONFIRMED).length,
      completed: bookings.filter((b) => b.status === BOOKING_STATUS.COMPLETED).length,
    }),
    [bookings]
  );

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

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekLabel = `${weekStart.toLocaleDateString("vi-VN", { day: "numeric", month: "short" })} - ${weekEnd.toLocaleDateString("vi-VN", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto font-sans transition-colors duration-200">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={BUSINESS_ROUTES.BOOKINGS}
            className="h-10 w-10 rounded-2xl border border-slate-200 dark:border-border/80 bg-white dark:bg-card flex items-center justify-center text-slate-600 hover:text-slate-950 transition-colors shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t("business.schedule.title")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-muted-foreground mt-0.5">
              Theo dõi lịch đón tiếp theo tuần, phân ca Sáng / Chiều / Tối theo từng cơ sở
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={loadBookings}
            disabled={loading}
            className="w-full sm:w-auto justify-center rounded-2xl h-10 px-4 text-xs font-bold border-slate-200 dark:border-border/80 shadow-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", loading && "animate-spin")} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* ── Top Bento KPI Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <AetherBentoCard
          title="Chờ xác nhận"
          subtitle="Đơn cần duyệt cho tuần này"
          value={stats.pending}
          variant="peach"
        />

        <AetherBentoCard
          title="Đã xác nhận"
          subtitle="Đơn đã vào lịch phục vụ"
          value={stats.confirmed}
          variant="blue"
        />

        <AetherBentoCard
          title="Đã hoàn tất"
          subtitle="Đơn tuần này đã tiếp đón xong"
          value={stats.completed}
          variant="mint"
        />

        <AetherBentoCard
          title="Tổng đơn tuần này"
          subtitle="Toàn bộ lịch đặt trong 7 ngày"
          value={stats.total}
          variant="gray"
        />
      </div>

      {/* ── Section: Interactive Place Gallery Bar ── */}
      {places.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedPlaceId("all")}
            className={cn(
              "px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 border",
              selectedPlaceId === "all"
                ? "bg-slate-950 text-white border-slate-950 shadow-xs dark:bg-primary dark:text-primary-foreground"
                : "bg-white dark:bg-card border-slate-200/80 dark:border-border/80 text-slate-600 hover:text-slate-950"
            )}
          >
            Tất cả cơ sở ({places.length})
          </button>

          {places.map((p) => {
            const isSelected = selectedPlaceId === String(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlaceId(String(p.id))}
                className={cn(
                  "px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 border flex items-center gap-2",
                  isSelected
                    ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                    : "bg-white dark:bg-card border-slate-200/80 dark:border-border/80 text-slate-600 hover:text-slate-950"
                )}
              >
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Navigation Control Bar ── */}
      <div className="p-4 rounded-[28px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Week controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevWeek}
            className="h-9 w-9 rounded-xl border-slate-200 dark:border-border/80"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="h-9 rounded-xl px-4 text-xs font-bold border-slate-200 dark:border-border/80"
          >
            Hôm nay
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextWeek}
            className="h-9 w-9 rounded-xl border-slate-200 dark:border-border/80"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="ml-3 text-sm font-black text-slate-900 dark:text-white">
            {weekLabel}
          </span>
        </div>

        {/* Legend status dots */}
        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Chờ xác nhận</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Đã xác nhận</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Hoàn tất</span>
          </div>
        </div>
      </div>

      {/* ── Desktop Calendar Grid (Ultra-Clean Bento Matrix) ── */}
      <div className="rounded-[32px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 overflow-hidden shadow-sm">
        {/* Day Column Headers */}
        <div className="flex border-b border-slate-100 dark:border-border/60">
          <div className="w-20 bg-slate-50/80 dark:bg-muted/40 border-r border-slate-100 dark:border-border/60 shrink-0 p-3 flex items-center justify-center text-[11px] font-bold text-slate-400">
            Giờ
          </div>

          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date());
            const dayBookings = getBookingsForDay(day);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex-1 min-w-[130px] p-3 text-center border-r border-slate-100 dark:border-border/60 last:border-r-0 transition-colors",
                  isToday && "bg-amber-50/50 dark:bg-amber-950/20"
                )}
              >
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {day.toLocaleDateString("vi-VN", { weekday: "short" })}
                </p>
                <p
                  className={cn(
                    "text-xl font-black mt-0.5",
                    isToday ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"
                  )}
                >
                  {day.getDate()}
                </p>
                {dayBookings.length > 0 && (
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-slate-100 dark:bg-muted text-[10px] font-black text-slate-700 dark:text-slate-300 rounded-full">
                    {dayBookings.length} đơn
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Time Grid Stream */}
        <div className="flex max-h-[720px] overflow-y-auto">
          {/* Time Slot Labels with Sáng / Chiều / Tối tags */}
          <div className="w-20 bg-slate-50/80 dark:bg-muted/40 border-r border-slate-100 dark:border-border/60 shrink-0">
            {TIME_SLOTS.map((slot) => (
              <div
                key={slot.id}
                className="h-20 border-b border-slate-100 dark:border-border/50 flex flex-col items-center justify-center p-1 text-center"
              >
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">{slot.label}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">
                  {slot.period === "morning" ? "Sáng" : slot.period === "afternoon" ? "Chiều" : "Tối"}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => (
            <ScheduleDayColumnGrid
              key={day.toISOString()}
              date={day}
              bookings={getBookingsForDay(day)}
              onViewBooking={(b) => {
                setSelectedBooking(b);
                setDetailOpen(true);
              }}
            />
          ))}
        </div>
      </div>

      {/* Quick Detail Modal */}
      <ScheduleDetailModal
        booking={selectedBooking}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setTimeout(() => setSelectedBooking(null), 300);
        }}
      />
    </div>
  );
});

BookingSchedulePage.displayName = "BookingSchedulePage";
export default BookingSchedulePage;
