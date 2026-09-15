import { memo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Loader2,
  MapPin,
} from "lucide-react";
import { formatMoney } from "@/utils/formatters";
import { formatDate } from "@/components/business/dashboardWidgetHelpers";
import { BOOKING_STATUS } from "@/constants/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Helper phân biệt Sáng / Chiều / Tối ───
export const getTimeOfDay = (timeStr, dateStr) => {
  if (!timeStr && !dateStr) return null;
  let hour = null;

  if (timeStr && typeof timeStr === "string") {
    const match = timeStr.match(/^(\d{1,2}):/);
    if (match) {
      hour = parseInt(match[1], 10);
    }
  }

  if (hour === null && dateStr) {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        hour = d.getHours();
      }
    } catch {
      // ignore
    }
  }

  if (hour === null) return null;

  if (hour >= 5 && hour < 12) {
    return {
      key: "morning",
      label: "Sáng",
      fullLabel: "Buổi Sáng (5h-12h)",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60",
      dotClass: "bg-amber-500",
    };
  } else if (hour >= 12 && hour < 18) {
    return {
      key: "afternoon",
      label: "Chiều",
      fullLabel: "Buổi Chiều (12h-18h)",
      badgeClass: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60",
      dotClass: "bg-blue-500",
    };
  } else {
    return {
      key: "evening",
      label: "Tối",
      fullLabel: "Buổi Tối (18h-23h)",
      badgeClass: "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/60",
      dotClass: "bg-purple-500",
    };
  }
};

/**
 * Xác định trạng thái thời gian của đơn đặt chỗ:
 * - isUpcoming: Chưa tới ngày hẹn (ví dụ hôm nay 15/09, hẹn 18/09)
 * - isOverdue: Đã quá hạn (đã qua ngày từ hôm trước, hoặc quá giờ hẹn + 60 phút)
 * - isReady: Đúng ngày và trong khung giờ sử dụng
 */
export function getBookingTimingState(booking) {
  if (!booking) {
    return { isUpcoming: false, isToday: false, isPast: false, isOverdue: false, isReady: true, label: "" };
  }

  const now = new Date();
  const todayVnStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  let useDateStr = null;
  const rawDate = booking.useDate || booking.bookingDate || booking.bookingAt;
  if (rawDate) {
    if (typeof rawDate === "string") {
      useDateStr = rawDate.slice(0, 10);
    } else if (rawDate instanceof Date) {
      useDateStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(rawDate);
    }
  }

  if (!useDateStr) {
    return { isUpcoming: false, isToday: true, isPast: false, isOverdue: false, isReady: true, label: "" };
  }

  // 1. Chưa tới ngày hẹn
  if (todayVnStr < useDateStr) {
    return {
      isUpcoming: true,
      isToday: false,
      isPast: false,
      isOverdue: false,
      isReady: false,
      label: "Chưa tới ngày hẹn",
    };
  }

  // 2. Đã qua ngày hẹn từ hôm trước
  if (todayVnStr > useDateStr) {
    return {
      isUpcoming: false,
      isToday: false,
      isPast: true,
      isOverdue: true,
      isReady: false,
      label: "Đã quá hạn",
    };
  }

  // 3. Hôm nay là ngày hẹn (todayVnStr === useDateStr)
  if (booking.useTime) {
    const timeMatch = /^(\d{1,2}):(\d{2})/.exec(booking.useTime);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);

      const currentVnHour = parseInt(
        new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Ho_Chi_Minh", hour: "numeric", hour12: false }).format(now),
        10
      );
      const currentVnMinute = parseInt(
        new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Ho_Chi_Minh", minute: "numeric" }).format(now),
        10
      );
      const currentTotalMin = currentVnHour * 60 + currentVnMinute;
      const slotTotalMin = hours * 60 + minutes;

      // Cho phép check-in trong ngày, quá giờ hẹn + 60 phút thì coi là quá giờ
      const gracePeriodMin = 60;
      if (currentTotalMin > slotTotalMin + gracePeriodMin) {
        return {
          isUpcoming: false,
          isToday: true,
          isPast: false,
          isOverdue: true,
          isReady: false,
          label: "Đã quá giờ hẹn",
        };
      }
    }
  }

  return {
    isUpcoming: false,
    isToday: true,
    isPast: false,
    isOverdue: false,
    isReady: true,
    label: "Sẵn sàng phục vụ",
  };
}

const getStatusConfig = (t) => ({
  pending: {
    label: t("business.bookings.pending"),
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    border: "border-amber-200/80 dark:border-amber-800/60",
  },
  confirmed: {
    label: t("business.bookings.confirmed"),
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
    border: "border-blue-200/80 dark:border-blue-800/60",
  },
  completed: {
    label: t("business.bookings.completed"),
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    border: "border-emerald-200/80 dark:border-emerald-800/60",
  },
  cancelled: {
    label: t("business.bookings.cancelled"),
    bg: "bg-slate-100 dark:bg-muted",
    text: "text-slate-600 dark:text-slate-400",
    dot: "bg-slate-400",
    border: "border-slate-200 dark:border-border/60",
  },
  rejected: {
    label: t("business.bookings.rejected"),
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-400",
    dot: "bg-rose-500",
    border: "border-rose-200/80 dark:border-rose-800/60",
  },
  expired: {
    label: t("business.bookings.expired"),
    bg: "bg-orange-50 dark:bg-orange-950/40",
    text: "text-orange-700 dark:text-orange-400",
    dot: "bg-orange-500",
    border: "border-orange-200/80 dark:border-orange-800/60",
  },
  no_show: {
    label: t("business.bookings.noShow"),
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-400",
    dot: "bg-purple-500",
    border: "border-purple-200/80 dark:border-purple-800/60",
  },
});

export const StatusBadge = memo(({ status }) => {
  const { t } = useTranslation();
  const statusConfig = getStatusConfig(t);
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs",
        config.bg,
        config.text,
        config.border
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
});

StatusBadge.displayName = "StatusBadge";

export const PaymentMethodBadge = memo(({ payment }) => {
  const { t } = useTranslation();
  if (!payment) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-muted text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-border/60">
        {t("business.common.counterPayment")}
      </span>
    );
  }

  const configs = {
    VNPAY: "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
    MOMO: "bg-pink-50 text-pink-700 border-pink-200/60 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-800",
    SEPAY: "bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
        configs[payment.paymentMethod] ||
          "bg-slate-100 text-slate-700 border-slate-200 dark:bg-muted dark:text-slate-300 dark:border-border/60"
      )}
    >
      {payment.paymentMethod}
    </span>
  );
});

PaymentMethodBadge.displayName = "PaymentMethodBadge";

export const BookingCard = memo(({
  booking,
  selected,
  onSelect,
  onConfirm,
  onCancel,
  onReject,
  onReschedule,
  onComplete,
  onNoShow,
  onView,
  actionLoading,
  canConfirm,
  canCancel,
  canComplete,
}) => {
  const { t } = useTranslation();
  const isPending = booking.status === BOOKING_STATUS.PENDING;
  const isConfirmed = booking.status === BOOKING_STATUS.CONFIRMED;

  const customerName = booking.user?.fullName || booking.guestName || t("business.bookings.walkIn");
  const phone = booking.user?.phone || booking.guestPhone;
  const email = booking.user?.email || booking.guestEmail;
  const placeName = booking.service?.place?.name || booking.place?.name;
  const timeOfDay = getTimeOfDay(booking.useTime, booking.useDate || booking.bookingAt);
  const timing = getBookingTimingState(booking);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn(
        "p-5 rounded-[28px] border transition-all duration-300 bg-white dark:bg-card shadow-sm hover:shadow-md",
        isPending && "bg-[#FFF9F2] dark:bg-amber-950/20 border-[#FCD4AF] dark:border-amber-900/40",
        isConfirmed && "bg-[#F2F7FF] dark:bg-blue-950/20 border-[#BED6FF] dark:border-blue-900/40",
        !isPending && !isConfirmed && "border-slate-200/80 dark:border-border/80"
      )}
    >
      <div className="flex flex-col gap-3.5">
        {/* ── Top Row: Code + Status + Time of Day + Place | Price ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {isPending && onSelect && (
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onSelect(booking.id)}
                className="h-4 w-4 rounded-md border-slate-300 cursor-pointer accent-slate-950 focus:ring-2 focus:ring-slate-400"
                aria-label={t("business.bookings.confirm")}
              />
            )}
            <span className="font-mono font-bold text-xs text-slate-500 dark:text-muted-foreground">
              #{booking.bookingCode}
            </span>
            <StatusBadge status={booking.status} />

            {/* Phân biệt Sáng / Chiều / Tối */}
            {timeOfDay && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                  timeOfDay.badgeClass
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", timeOfDay.dotClass)} />
                {timeOfDay.label}
              </span>
            )}

            {/* Phân biệt Địa điểm kinh doanh */}
            {placeName && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-muted text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-border/60">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span className="truncate max-w-[140px]">{placeName}</span>
              </span>
            )}

            <PaymentMethodBadge payment={booking.payment} />
          </div>

          <div className="text-right">
            <span className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
              {formatMoney(booking.finalPrice)}
            </span>
          </div>
        </div>

        {/* ── Middle Row: Customer Name & Inline Meta Info ── */}
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            {customerName}
          </h3>

          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 flex-wrap font-medium">
            <span>{formatDate(booking.useDate || booking.bookingAt)}</span>
            {booking.useTime && (
              <>
                <span className="text-slate-300">•</span>
                <span className="font-bold text-slate-900 dark:text-white">{booking.useTime}</span>
              </>
            )}
            {booking.service?.name && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">{booking.service.name}</span>
              </>
            )}
            {booking.partySize && (
              <>
                <span className="text-slate-300">•</span>
                <span>{booking.partySize} {t("business.bookings.guests")}</span>
              </>
            )}
          </div>

          {/* Contact Details */}
          {(phone || email) && (
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-muted-foreground pt-0.5 flex-wrap">
              {phone && (
                <a href={`tel:${phone}`} className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  {phone}
                </a>
              )}
              {phone && email && <span className="text-slate-300">•</span>}
              {email && (
                <a href={`mailto:${email}`} className="hover:text-slate-950 dark:hover:text-white transition-colors truncate max-w-[240px]">
                  {email}
                </a>
              )}
            </div>
          )}
        </div>

        {/* ── Bottom Action Row ── */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-border/60 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {isPending && (
              <>
                {canConfirm && (
                  <Button
                    size="sm"
                    onClick={() => onConfirm(booking.id)}
                    disabled={actionLoading}
                    className="h-8 rounded-xl px-4 text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground shadow-sm"
                  >
                    {actionLoading === `confirm-${booking.id}` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : null}
                    {t("business.bookings.confirm")}
                  </Button>
                )}
                {canConfirm && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReschedule(booking)}
                    disabled={actionLoading}
                    className="h-8 rounded-xl px-3 text-xs font-bold border-slate-200 dark:border-border/80"
                  >
                    {t("business.bookings.reschedule")}
                  </Button>
                )}
                {canCancel && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onReject(booking.id)}
                    disabled={actionLoading}
                    className="h-8 rounded-xl px-3 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    {t("business.bookings.reject")}
                  </Button>
                )}
              </>
            )}

            {isConfirmed && (
              <>
                {timing.isUpcoming ? (
                  /* 1. Chưa tới ngày hẹn: Thay nút Hoàn thành bằng nút thông báo 'Chưa tới ngày', ẩn nút Không đến */
                  <Button
                    size="sm"
                    disabled
                    variant="outline"
                    className="h-8 rounded-xl px-3 text-xs font-semibold bg-slate-100/80 dark:bg-muted text-slate-400 dark:text-muted-foreground border-slate-200 dark:border-border/60 cursor-not-allowed"
                    title="Chưa tới ngày sử dụng dịch vụ của khách"
                  >
                    Chưa tới ngày hẹn
                  </Button>
                ) : timing.isOverdue ? (
                  /* 2. Đã quá giờ / quá hạn: Thay nút Hoàn thành bằng 'Đã quá hạn', hiển thị nút Không đến */
                  <>
                    <Button
                      size="sm"
                      disabled
                      variant="outline"
                      className="h-8 rounded-xl px-3 text-xs font-semibold bg-rose-50 text-rose-500 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40 cursor-not-allowed"
                    >
                      {timing.isPast ? "Đã quá hạn" : "Đã quá giờ hẹn"}
                    </Button>
                    {canComplete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onNoShow(booking.id)}
                        disabled={actionLoading}
                        className="h-8 rounded-xl px-3 text-xs font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                      >
                        {t("business.bookings.noShow", { defaultValue: "Không đến" })}
                      </Button>
                    )}
                  </>
                ) : (
                  /* 3. Đúng ngày hẹn và trong thời gian sử dụng: Nút Hoàn thành hoạt động bình thường */
                  <>
                    {canComplete && (
                      <Button
                        size="sm"
                        onClick={() => onComplete(booking.id)}
                        disabled={actionLoading}
                        className="h-8 rounded-xl px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      >
                        {actionLoading === `complete-${booking.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : null}
                        {t("business.bookings.complete")}
                      </Button>
                    )}
                    {canComplete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onNoShow(booking.id)}
                        disabled={actionLoading}
                        className="h-8 rounded-xl px-3 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        {t("business.bookings.noShow")}
                      </Button>
                    )}
                  </>
                )}

                {/* Nút Hủy: chỉ hiển thị nếu chưa quá hạn */}
                {canCancel && !timing.isOverdue && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onCancel(booking.id)}
                    disabled={actionLoading}
                    className="h-8 rounded-xl px-3 text-xs font-bold border-slate-200 dark:border-border/80"
                  >
                    {t("business.bookings.cancel")}
                  </Button>
                )}
              </>
            )}
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onView(booking)}
            className="h-8 rounded-xl px-3 text-xs font-bold text-slate-600 dark:text-muted-foreground hover:text-slate-950 dark:hover:text-white ml-auto"
          >
            {t("business.bookings.viewDetail")} <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

BookingCard.displayName = "BookingCard";
