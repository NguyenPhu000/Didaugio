import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Check,
  X,
  CheckCircle2,
  CalendarClock,
  Clock,
  XCircle,
  Phone,
  Mail,
  MessageSquare,
  Users,
  CalendarDays,
  Loader2,
  UserX,
  Eye,
} from "lucide-react";
import { formatVND, formatDate } from "@/components/business/dashboardWidgetHelpers";
import { BOOKING_STATUS } from "@/constants/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const getStatusConfig = (t) => ({
  pending: { label: t("business.bookings.pending"), bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
  confirmed: { label: t("business.bookings.confirmed"), bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200" },
  completed: { label: t("business.bookings.completed"), bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  cancelled: { label: t("business.bookings.cancelled"), bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", border: "border-slate-200" },
  rejected: { label: t("business.bookings.rejected"), bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", border: "border-rose-200" },
  expired: { label: t("business.bookings.expired"), bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500", border: "border-orange-200" },
  no_show: { label: t("business.bookings.noShow"), bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500", border: "border-purple-200" },
});

const STATUS_COLORS = {
  pending: "amber",
  confirmed: "blue",
  completed: "emerald",
  cancelled: "slate",
  rejected: "rose",
  expired: "orange",
  no_show: "purple",
};

const COLOR_MAP = {
  amber: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-200", icon: "text-amber-500" },
  blue: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-200", icon: "text-blue-500" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-200", icon: "text-emerald-500" },
  slate: { bg: "bg-slate-100", text: "text-slate-600", ring: "ring-slate-200", icon: "text-slate-500" },
  rose: { bg: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-200", icon: "text-rose-500" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", ring: "ring-orange-200", icon: "text-orange-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", ring: "ring-purple-200", icon: "text-purple-500" },
};

export const StatusBadge = memo(({ status }) => {
  const { t } = useTranslation();
  const statusConfig = getStatusConfig(t);
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", config.bg, config.text, config.border)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
});

export const PaymentMethodBadge = memo(({ payment }) => {
  const { t } = useTranslation();
  if (!payment) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200/60 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800">
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
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border",
        configs[payment.paymentMethod] || "bg-zinc-50 text-zinc-700 border-zinc-200/60 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800"
      )}
    >
      {payment.paymentMethod}
    </span>
  );
});

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
}) => {
  const { t } = useTranslation();
  const isPending = booking.status === BOOKING_STATUS.PENDING;
  const isConfirmed = booking.status === BOOKING_STATUS.CONFIRMED;
  const statusColor = STATUS_COLORS[booking.status] || "slate";
  const colors = COLOR_MAP[statusColor];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "bg-white rounded-xl border transition-all hover:shadow-sm dark:bg-zinc-950 dark:border-zinc-800",
        isPending && "border-amber-200 bg-amber-50/20 dark:border-amber-900/40",
        isConfirmed && "border-blue-200 bg-blue-50/10 dark:border-blue-900/40",
        !isPending && !isConfirmed && "border-zinc-200 dark:border-zinc-800"
      )}
    >
      <div className="flex items-start gap-3 p-3">
        {isPending && (
          <div className="pt-1">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onSelect(booking.id)}
              className="h-4 w-4 rounded border-zinc-300 cursor-pointer accent-zinc-950 focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:border-zinc-600"
              aria-label={t("business.bookings.confirm")}
            />
          </div>
        )}

        <div className={cn("w-1 self-stretch rounded-full", colors.bg.replace("50", "500"))} />

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-sm text-zinc-950 dark:text-zinc-100 tracking-tight">
                  {booking.bookingCode}
                </span>
                <StatusBadge status={booking.status} />
                <PaymentMethodBadge payment={booking.payment} />
              </div>
              <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-100 truncate">
                {booking.user?.fullName || booking.guestName || t("business.bookings.walkIn")}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className={cn("text-lg font-bold tabular-nums", colors.text)}>
                {formatVND(booking.finalPrice)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-500 flex-wrap dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="tabular-nums">
                {formatDate(booking.useDate || booking.bookingAt)}
              </span>
            </div>
            {booking.useTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="tabular-nums font-medium text-zinc-700 dark:text-zinc-300">{booking.useTime}</span>
              </div>
            )}
            {booking.service?.name && (
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate max-w-[150px]">{booking.service.name}</span>
              </div>
            )}
            {booking.partySize && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{booking.partySize} {t("business.bookings.guests")}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {(booking.user?.phone || booking.guestPhone) && (
              <a
                href={`tel:${booking.user?.phone || booking.guestPhone}`}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-100 text-xs text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200 transition-colors dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <Phone className="h-3 w-3" aria-hidden="true" />
                <span>{booking.user?.phone || booking.guestPhone}</span>
              </a>
            )}
            {(booking.user?.email || booking.guestEmail) && (
              <a
                href={`mailto:${booking.user?.email || booking.guestEmail}`}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-100 text-xs text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200 transition-colors max-w-[200px] dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{booking.user?.email || booking.guestEmail}</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            {isPending && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onConfirm(booking.id)}
                  disabled={actionLoading}
                  className="h-8 text-xs gap-1.5 bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  {actionLoading === `confirm-${booking.id}` ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  {t("business.bookings.confirm")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReschedule(booking)}
                  disabled={actionLoading}
                  className="h-8 text-xs gap-1.5 border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  <CalendarClock className="h-3 w-3" aria-hidden="true" />
                  {t("business.bookings.reschedule")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onReject(booking.id)}
                  disabled={actionLoading}
                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5 dark:text-red-400 dark:hover:bg-red-950"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                  {t("business.bookings.reject")}
                </Button>
              </>
            )}
            {isConfirmed && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onComplete(booking.id)}
                  disabled={actionLoading}
                  className="h-8 text-xs gap-1.5 bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  {actionLoading === `complete-${booking.id}` ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  {t("business.bookings.complete")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCancel(booking.id)}
                  disabled={actionLoading}
                  className="h-8 text-xs gap-1.5 border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  <XCircle className="h-3 w-3" aria-hidden="true" />
                  {t("business.bookings.cancel")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onNoShow(booking.id)}
                  disabled={actionLoading}
                  className="h-8 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 gap-1.5 dark:text-purple-400 dark:hover:bg-purple-950"
                >
                  <UserX className="h-3 w-3" aria-hidden="true" />
                  {t("business.bookings.noShow")}
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onView(booking)}
              className="h-8 text-xs gap-1.5 ml-auto text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <Eye className="h-3 w-3" aria-hidden="true" />
              {t("business.bookings.viewDetail")}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
