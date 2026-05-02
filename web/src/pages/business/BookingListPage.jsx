import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import {
  CalendarCheck,
  Check,
  X,
  CheckCircle2,
  AlertTriangle,
  Search,
  Eye,
  CalendarClock,
  Clock,
  CheckCheck,
  XCircle,
  UserX,
  ChevronRight,
  ChevronDown,
  Phone,
  Mail,
  MessageSquare,
  Zap,
  Calendar,
  MapPin,
  Layers,
  Filter,
  Sunrise,
  Sun,
  Sunset,
  CalendarDays,
  Users,
  CircleDollarSign,
  Loader2,
} from "lucide-react";
import * as bookingApi from "@/apis/bookingService";
import { getMyPlaces } from "@/apis/businessApi";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { BOOKING_STATUS } from "@/constants/constants";
import {
  PageHeader,
  EmptyState,
  PageNav,
  StatCardSkeleton,
} from "@/components/business/DashboardWidgets";
import { formatDate, formatVND } from "@/components/business/dashboardWidgetHelpers";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/Tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils";
import BulkActionBar from "@/components/business/BulkActionBar";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── Time Slot Config ───────────────────────────────────────────────────────────

const TIME_SLOTS = {
  morning: { id: "morning", label: "Buổi sáng", icon: Sunrise, range: "06:00 - 12:00", color: "amber" },
  afternoon: { id: "afternoon", label: "Buổi chiều", icon: Sun, range: "12:00 - 18:00", color: "orange" },
  evening: { id: "evening", label: "Buổi tối", icon: Sunset, range: "18:00 - 22:00", color: "indigo" },
};

const getTimeSlot = (time) => {
  if (!time) return null;
  const hour = parseInt(time.split(":")[0], 10);
  if (hour >= 6 && hour < 12) return TIME_SLOTS.morning;
  if (hour >= 12 && hour < 18) return TIME_SLOTS.afternoon;
  if (hour >= 18 && hour < 22) return TIME_SLOTS.evening;
  return null;
};

// ─── Preset Reasons ─────────────────────────────────────────────────────────────

const PRESET_REJECTION_REASONS = [
  { id: "full_slot", label: "Khung giờ này đã kín chỗ" },
  { id: "closed", label: "Địa điểm đang đóng cửa" },
  { id: "maintenance", label: "Đang bảo trì, không nhận khách" },
  { id: "price_changed", label: "Giá dịch vụ đã thay đổi" },
  { id: "holiday", label: "Không hoạt động vào ngày lễ" },
  { id: "other", label: "Lý do khác" },
];

const PRESET_CANCEL_REASONS = [
  { id: "customer_request", label: "Khách hàng yêu cầu hủy" },
  { id: "double_booking", label: "Trùng lịch đặt khác" },
  { id: "service_unavailable", label: "Dịch vụ không khả dụng" },
  { id: "weather", label: "Ảnh hưởng thời tiết" },
  { id: "other", label: "Lý do khác" },
];

// ─── Status Config ───────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: { label: "Chờ xác nhận", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
  confirmed: { label: "Đã xác nhận", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200" },
  completed: { label: "Hoàn thành", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  cancelled: { label: "Đã hủy", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", border: "border-slate-200" },
  rejected: { label: "Bị từ chối", bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", border: "border-rose-200" },
  expired: { label: "Hết hạn", bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500", border: "border-orange-200" },
  no_show: { label: "Không đến", bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500", border: "border-purple-200" },
};

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

// ─── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", config.bg, config.text, config.border)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

// ─── Place Section Header ────────────────────────────────────────────────────────

function PlaceSectionHeader({ place, count, isExpanded, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 border-b border-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      aria-expanded={isExpanded}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>
        <div className="text-left">
          <h3 className="text-sm font-semibold text-gray-900">{place.name}</h3>
          <p className="text-xs text-gray-500">{place.address || "Chưa có địa chỉ"}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold tabular-nums">
          {count} đặt chỗ
        </span>
        <ChevronDown className={cn("h-5 w-5 text-gray-400 transition-transform", isExpanded && "rotate-180")} aria-hidden="true" />
      </div>
    </button>
  );
}

// ─── Time Slot Header ───────────────────────────────────────────────────────────

function TimeSlotHeader({ slot, count, isExpanded, onToggle }) {
  if (!slot) return null;
  const Icon = slot.icon || Clock;
  const colors = COLOR_MAP[slot.color] || COLOR_MAP.slate;

  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 border-b border-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      aria-expanded={isExpanded}
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-xl", colors.bg)}>
          <Icon className={cn("h-5 w-5", colors.icon)} aria-hidden="true" />
        </div>
        <div className="text-left">
          <span className="block text-sm font-bold text-gray-900">{slot.label}</span>
          <span className="block text-xs text-gray-500 font-medium">{slot.range}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold tabular-nums", colors.bg, colors.text)}>
          {count} đặt chỗ
        </span>
        <ChevronDown className={cn("h-5 w-5 text-gray-400 transition-transform", isExpanded && "rotate-180")} aria-hidden="true" />
      </div>
    </button>
  );
}

// ─── Booking Card ───────────────────────────────────────────────────────────────

function BookingCard({
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
  compact = false,
}) {
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
        "bg-white rounded-xl border transition-all hover:shadow-sm",
        isPending && "border-amber-200 bg-amber-50/20",
        isConfirmed && "border-blue-200 bg-blue-50/10",
        !isPending && !isConfirmed && "border-gray-200"
      )}
    >
      <div className="flex items-start gap-3 p-3">
        {/* Selection Checkbox */}
        {isPending && (
          <div className="pt-1">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onSelect(booking.id)}
              className="h-4 w-4 rounded border-gray-300 cursor-pointer accent-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Chọn đặt chỗ này"
            />
          </div>
        )}

        {/* Status Indicator */}
        <div className={cn("w-1 self-stretch rounded-full", colors.bg.replace("50", "500"))} />

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-sm text-gray-900 tracking-tight">
                  {booking.bookingCode}
                </span>
                <StatusBadge status={booking.status} />
              </div>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {booking.user?.fullName || booking.guestName || "Khách vãng lai"}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className={cn("text-lg font-bold tabular-nums", colors.text)}>
                {formatVND(booking.finalPrice)}
              </span>
            </div>
          </div>

          {/* Info Row */}
          <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="tabular-nums">
                {formatDate(booking.useDate || booking.bookingAt)}
              </span>
            </div>
            {booking.useTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="tabular-nums font-medium text-gray-700">{booking.useTime}</span>
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
                <span>{booking.partySize} khách</span>
              </div>
            )}
          </div>

          {/* Contact Row */}
          <div className="flex items-center gap-3 flex-wrap">
            {(booking.user?.phone || booking.guestPhone) && (
              <a
                href={`tel:${booking.user?.phone || booking.guestPhone}`}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
              >
                <Phone className="h-3 w-3" aria-hidden="true" />
                <span>{booking.user?.phone || booking.guestPhone}</span>
              </a>
            )}
            {(booking.user?.email || booking.guestEmail) && (
              <a
                href={`mailto:${booking.user?.email || booking.guestEmail}`}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors max-w-[200px]"
              >
                <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{booking.user?.email || booking.guestEmail}</span>
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            {isPending && (
              <>
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => onConfirm(booking.id)}
                  disabled={actionLoading}
                  className="h-8 text-xs gap-1.5"
                >
                  {actionLoading === `confirm-${booking.id}` ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  Xác nhận
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReschedule(booking)}
                  disabled={actionLoading}
                  className="h-8 text-xs gap-1.5"
                >
                  <CalendarClock className="h-3 w-3" aria-hidden="true" />
                  Đổi lịch
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onReject(booking.id)}
                  disabled={actionLoading}
                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                  Từ chối
                </Button>
              </>
            )}
            {isConfirmed && (
              <>
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => onComplete(booking.id)}
                  disabled={actionLoading}
                  className="h-8 text-xs gap-1.5"
                >
                  {actionLoading === `complete-${booking.id}` ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  Hoàn thành
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCancel(booking.id)}
                  disabled={actionLoading}
                  className="h-8 text-xs gap-1.5"
                >
                  <XCircle className="h-3 w-3" aria-hidden="true" />
                  Hủy
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onNoShow(booking.id)}
                  disabled={actionLoading}
                  className="h-8 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 gap-1.5"
                >
                  <UserX className="h-3 w-3" aria-hidden="true" />
                  Không đến
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onView(booking.id)}
              className="h-8 text-xs gap-1.5 ml-auto"
            >
              <Eye className="h-3 w-3" aria-hidden="true" />
              Chi tiết
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Reject Modal ──────────────────────────────────────────────────────────────

function QuickRejectModal({ open, onConfirm, onCancel, loading }) {
  const [selectedReason, setSelectedReason] = useState(null);
  const [customReason, setCustomReason] = useState("");
  const [businessNote, setBusinessNote] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedReason(null);
      setCustomReason("");
      setBusinessNote("");
    }
  }, [open]);

  const handleConfirm = () => {
    if (!selectedReason) {
      toast.error("Vui lòng chọn lý do từ chối");
      return;
    }
    if (selectedReason === "other" && !customReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }
    const reason = selectedReason === "other"
      ? customReason.trim()
      : PRESET_REJECTION_REASONS.find(r => r.id === selectedReason)?.label || "";
    onConfirm(reason, businessNote.trim() || null);
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" aria-hidden="true" />
            Từ chối yêu cầu
          </DialogTitle>
          <DialogDescription>
            Chọn nhanh lý do từ chối. Khách sẽ nhận thông báo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label>Lý do từ chối</Label>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_REJECTION_REASONS.map((reason) => (
              <button
                key={reason.id}
                type="button"
                onClick={() => setSelectedReason(reason.id)}
                className={cn(
                  "px-3 py-2.5 rounded-xl border text-xs font-medium text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  selectedReason === reason.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                )}
              >
                {reason.label}
              </button>
            ))}
          </div>

          {selectedReason === "other" && (
            <Textarea
              placeholder="Nhập lý do từ chối…"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="min-h-[80px]"
            />
          )}

          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Ghi chú nội bộ (tuỳ chọn)</Label>
            <Textarea
              placeholder="Ghi chú chỉ hiển thị cho bạn…"
              value={businessNote}
              onChange={(e) => setBusinessNote(e.target.value)}
              className="min-h-[60px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            className="gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Xác nhận từ chối
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Cancel Modal ──────────────────────────────────────────────────────────────

function QuickCancelModal({ open, onConfirm, onCancel, loading }) {
  const [selectedReason, setSelectedReason] = useState(null);
  const [customReason, setCustomReason] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedReason(null);
      setCustomReason("");
    }
  }, [open]);

  const handleConfirm = () => {
    if (!selectedReason) {
      toast.error("Vui lòng chọn lý do hủy");
      return;
    }
    if (selectedReason === "other" && !customReason.trim()) {
      toast.error("Vui lòng nhập lý do hủy");
      return;
    }
    const reason = selectedReason === "other"
      ? customReason.trim()
      : PRESET_CANCEL_REASONS.find(r => r.id === selectedReason)?.label || "";
    onConfirm(reason);
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" aria-hidden="true" />
            Hủy đặt chỗ
          </DialogTitle>
          <DialogDescription>
            Chọn nhanh lý do hủy để thông báo cho khách.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label>Lý do hủy</Label>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_CANCEL_REASONS.map((reason) => (
              <button
                key={reason.id}
                type="button"
                onClick={() => setSelectedReason(reason.id)}
                className={cn(
                  "px-3 py-2.5 rounded-xl border text-xs font-medium text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  selectedReason === reason.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                )}
              >
                {reason.label}
              </button>
            ))}
          </div>

          {selectedReason === "other" && (
            <Textarea
              placeholder="Nhập lý do hủy…"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="min-h-[80px]"
            />
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Xác nhận hủy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reschedule Modal ──────────────────────────────────────────────────────────

function QuickRescheduleModal({ open, booking, onConfirm, onCancel, loading }) {
  const initialDate = String(booking?.useDate || booking?.bookingAt || "").slice(0, 10);
  const initialTime = booking?.useTime || "09:00";
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [businessNote, setBusinessNote] = useState("");

  useEffect(() => {
    if (open) {
      setDate(initialDate);
      setTime(initialTime);
      setBusinessNote("");
    }
  }, [open, initialDate, initialTime]);

  const handleConfirm = () => {
    if (!date || !time) {
      toast.error("Vui lòng chọn ngày và giờ");
      return;
    }
    const bookingTime = new Date(`${date}T${time}:00`).toISOString();
    onConfirm(bookingTime, businessNote.trim() || null);
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" aria-hidden="true" />
            Đổi lịch booking
          </DialogTitle>
          <DialogDescription>
            Chọn ngày giờ mới. Hệ thống sẽ kiểm tra khả năng đặt trước khi xác nhận.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Ngày mới</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Giờ mới</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Ghi chú (tuỳ chọn)</Label>
            <Textarea
              placeholder="VD: Đổi lịch theo yêu cầu khách…"
              value={businessNote}
              onChange={(e) => setBusinessNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={loading} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Xác nhận đổi lịch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Stat Cards Config ─────────────────────────────────────────────────────────

const STAT_CARDS_CONFIG = [
  { key: BOOKING_STATUS.PENDING, label: "Chờ xác nhận", icon: Clock, color: "amber" },
  { key: BOOKING_STATUS.CONFIRMED, label: "Đã xác nhận", icon: CheckCheck, color: "blue" },
  { key: BOOKING_STATUS.COMPLETED, label: "Hoàn thành", icon: CheckCircle2, color: "emerald" },
  { key: BOOKING_STATUS.CANCELLED, label: "Đã hủy", icon: XCircle, color: "slate" },
  { key: BOOKING_STATUS.REJECTED, label: "Bị từ chối", icon: XCircle, color: "rose" },
  { key: BOOKING_STATUS.EXPIRED, label: "Hết hạn", icon: AlertTriangle, color: "orange" },
  { key: BOOKING_STATUS.NO_SHOW, label: "Không đến", icon: UserX, color: "purple" },
];

const STATUS_TABS = [
  { value: "all", label: "Tất cả" },
  { value: BOOKING_STATUS.PENDING, label: "Chờ xác nhận" },
  { value: BOOKING_STATUS.CONFIRMED, label: "Đã xác nhận" },
  { value: BOOKING_STATUS.COMPLETED, label: "Hoàn thành" },
  { value: BOOKING_STATUS.CANCELLED, label: "Đã hủy" },
];

const PAGE_SIZE = 20;

// ─── Main Page ────────────────────────────────────────────────────────────────

const BookingListPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedPlaceId, setSelectedPlaceId] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState([]);
  const [cancelModal, setCancelModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Expanded states for sections
  const [expandedPlaces, setExpandedPlaces] = useState({});
  const [expandedSlots, setExpandedSlots] = useState({});

  // Toggle place expansion
  const togglePlace = (placeId) => {
    setExpandedPlaces(prev => ({ ...prev, [placeId]: !prev[placeId] }));
  };

  // Toggle time slot expansion
  const toggleSlot = (key) => {
    setExpandedSlots(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Expand all by default when filtering
  useEffect(() => {
    if (selectedPlaceId !== "all") {
      setExpandedPlaces({ [selectedPlaceId]: true });
    }
  }, [selectedPlaceId]);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await bookingApi.getAll({
        search,
        status,
        page,
        limit: PAGE_SIZE,
        ...(selectedPlaceId !== "all" && { placeId: selectedPlaceId }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
      });
      setBookings(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotal(response.pagination?.total || 0);

      // Expand all places by default
      const uniquePlaces = [...new Set(response.data?.map(b => b.place?.id).filter(Boolean))];
      if (uniquePlaces.length > 0) {
        setExpandedPlaces(prev => {
          const updated = { ...prev };
          uniquePlaces.forEach(id => { updated[id] = true; });
          return updated;
        });
      }
    } catch {
      toast.error("Không thể tải danh sách đặt chỗ");
    } finally {
      setLoading(false);
    }
  }, [search, status, page, fromDate, toDate, selectedPlaceId]);

  const loadStats = useCallback(async () => {
    try {
      const response = await bookingApi.getStats();
      setStats(response.data);
    } catch {
      // Keep UI usable
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    getMyPlaces()
      .then((res) => setPlaces(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, status, fromDate, toDate, selectedPlaceId]);

  const refresh = useCallback(() => {
    loadBookings();
    loadStats();
  }, [loadBookings, loadStats]);

  // ─── Action Handlers ───────────────────────────────────────────────────────

  const handleConfirm = async (id) => {
    setActionLoading(`confirm-${id}`);
    try {
      await bookingApi.confirm(id);
      toast.success("Đã xác nhận đặt chỗ");
      refresh();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể xác nhận");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirmed = async (reason, businessNote) => {
    setActionLoading(`reject-${rejectModal}`);
    try {
      await bookingApi.quickReject(rejectModal, reason, { businessNote });
      toast.success("Đã từ chối yêu cầu đặt chỗ");
      setRejectModal(null);
      refresh();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể từ chối");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRescheduleConfirmed = async (bookingTime, businessNote) => {
    setActionLoading("reschedule");
    try {
      await bookingApi.reschedule(rescheduleModal.id, bookingTime, { businessNote });
      toast.success("Đã đổi lịch booking");
      setRescheduleModal(null);
      refresh();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể đổi lịch");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelConfirmed = async (reason) => {
    setActionLoading(`cancel-${cancelModal}`);
    try {
      await bookingApi.cancel(cancelModal, reason);
      toast.success("Đã hủy đặt chỗ");
      setCancelModal(null);
      refresh();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể hủy");
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (id) => {
    setActionLoading(`complete-${id}`);
    try {
      await bookingApi.complete(id);
      toast.success("Đã hoàn thành đặt chỗ");
      refresh();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể hoàn thành");
    } finally {
      setActionLoading(null);
    }
  };

  const handleNoShow = async (id) => {
    setActionLoading(`noshow-${id}`);
    try {
      await bookingApi.markNoShow(id);
      toast.success("Đã đánh dấu không đến");
      refresh();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể đánh dấu");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkConfirm = async () => {
    if (pendingSelected.length === 0) return;
    setBulkLoading(true);
    try {
      await bookingApi.bulkConfirm(pendingSelected);
      toast.success(`Đã xác nhận ${pendingSelected.length} đặt chỗ`);
      setSelected([]);
      refresh();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể xác nhận hàng loạt");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkCancel = async (reason) => {
    if (pendingSelected.length === 0) return;
    setBulkLoading(true);
    try {
      const response = await bookingApi.bulkCancel(pendingSelected, reason);
      const result = response?.data || {};
      const successCount = Array.isArray(result.success) ? result.success.length : pendingSelected.length;
      const failedCount = Array.isArray(result.failed) ? result.failed.length : 0;
      toast.success(`Đã hủy ${successCount} đặt chỗ${failedCount > 0 ? `, thất bại ${failedCount}` : ""}`);
      setSelected([]);
      refresh();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể hủy hàng loạt");
    } finally {
      setBulkLoading(false);
    }
  };

  const pendingSelected = selected.filter((id) => {
    const bk = bookings.find((b) => b.id === id);
    return bk?.status === BOOKING_STATUS.PENDING;
  });

  // ─── Grouped Bookings ───────────────────────────────────────────────────────

  // Group by place
  const groupedByPlace = useMemo(() => {
    const groups = {};
    bookings.forEach((booking) => {
      const placeId = booking.place?.id || "no-place";
      const placeName = booking.place?.name || "Không xác định";
      if (!groups[placeId]) {
        groups[placeId] = {
          place: booking.place || { id: placeId, name: placeName },
          bookings: [],
        };
      }
      groups[placeId].bookings.push(booking);
    });
    return Object.values(groups).sort((a, b) => b.bookings.length - a.bookings.length);
  }, [bookings]);

  // Group by time slot within each place
  const groupByTimeSlot = (placeBookings) => {
    const groups = { morning: [], afternoon: [], evening: [], other: [] };
    placeBookings.forEach((booking) => {
      const slot = getTimeSlot(booking.useTime);
      if (slot) {
        groups[slot.id].push(booking);
      } else {
        groups.other.push(booking);
      }
    });
    return groups;
  };

  const toggleSelect = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý đặt chỗ</h1>
              <p className="text-sm text-gray-500 mt-0.5">Xử lý nhanh chóng các yêu cầu đặt chỗ</p>
            </div>
            {pendingSelected.length > 0 && (
              <Button onClick={handleBulkConfirm} disabled={bulkLoading} className="gap-2">
                {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Xác nhận {pendingSelected.length} đặt chỗ
              </Button>
            )}
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-4">
            {STAT_CARDS_CONFIG.map(({ key, label, icon: Icon, color }) => {
              const colors = COLOR_MAP[color];
              const count = stats?.byStatus?.[key] || 0;
              const isActive = status === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatus(isActive ? "all" : key)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-all hover:shadow-sm",
                    isActive ? `ring-2 ${colors.ring} border-transparent bg-white` : "bg-gray-50 border-gray-200"
                  )}
                >
                  {loading ? (
                    <StatCardSkeleton />
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xl font-bold text-gray-900 tabular-nums">{count}</span>
                        <div className={cn("p-1.5 rounded-lg", colors.bg)}>
                          <Icon className={cn("h-3.5 w-3.5", colors.text)} />
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate">{label}</p>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-t border-gray-100">
          <Tabs value={status} onValueChange={setStatus}>
            <TabsList className="h-10 bg-transparent gap-1 p-0 border-b-0 rounded-none w-auto">
              {STATUS_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "relative h-10 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shrink-0",
                    "data-[state=active]:text-foreground data-[state=active]:shadow-none",
                    "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                  {tab.value !== "all" && stats?.byStatus?.[tab.value] !== undefined && (
                    <span className="ml-1.5 text-xs opacity-60 tabular-nums">
                      ({stats.byStatus[tab.value]})
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Place Filter */}
          <Select value={selectedPlaceId} onValueChange={setSelectedPlaceId}>
            <SelectTrigger className="h-9 w-52 text-sm">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-gray-400" aria-hidden="true" />
                <SelectValue placeholder="Tất cả địa điểm" />
              </div>
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

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gray-400" aria-hidden="true" />
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 w-36 text-sm"
            />
            <span className="text-gray-400">—</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 w-36 text-sm"
            />
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
            <Input
              type="search"
              placeholder="Tìm mã, tên khách…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
              aria-label="Tìm kiếm đặt chỗ"
            />
          </div>

          {/* Total count */}
          <div className="flex items-center gap-2 text-sm text-gray-500 ml-auto">
            <span className="tabular-nums font-semibold text-gray-900">{total}</span>
            <span>đặt chỗ</span>
          </div>
        </div>

        {/* Grouped Bookings by Place */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <Skeleton className="h-6 w-48" />
                </div>
                <div className="p-4 space-y-3">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState icon={CalendarCheck} message="Không có đặt chỗ nào" />
        ) : (
          <div className="space-y-4">
            <Tabs defaultValue={String(groupedByPlace[0]?.place?.id || "no-place")} className="w-full">
              <div className="overflow-x-auto pb-2 mb-2 scrollbar-hide">
                <TabsList className="inline-flex h-12 items-center justify-start rounded-xl bg-gray-100/80 p-1">
                  {groupedByPlace.map(({ place, bookings }) => (
                    <TabsTrigger
                      key={place.id}
                      value={String(place.id)}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      {place.name}
                      <Badge variant="secondary" className="ml-2 bg-gray-200/50 text-gray-700 hover:bg-gray-200/50">
                        {bookings.length}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {groupedByPlace.map(({ place, bookings: placeBookings }) => {
                const slotGroups = groupByTimeSlot(placeBookings);
                return (
                  <TabsContent key={place.id} value={String(place.id)} className="space-y-4 mt-0 outline-none">
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                      {Object.entries(TIME_SLOTS).map(([slotId, slot]) => {
                        const slotBookings = slotGroups[slotId] || [];
                        if (slotBookings.length === 0) return null;
                        const isSlotExpanded = expandedSlots[`${place.id}-${slotId}`] !== false;

                        return (
                          <div key={slotId} className="border-b border-gray-100 last:border-b-0">
                            <TimeSlotHeader
                              slot={slot}
                              count={slotBookings.length}
                              isExpanded={isSlotExpanded}
                              onToggle={() => toggleSlot(`${place.id}-${slotId}`)}
                            />
                            <AnimatePresence>
                              {isSlotExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-4 space-y-3 bg-gray-50/50">
                                    <AnimatePresence mode="popLayout">
                                      {slotBookings.map((booking) => (
                                        <BookingCard
                                          key={booking.id}
                                          booking={booking}
                                          selected={selected.includes(booking.id)}
                                          onSelect={toggleSelect}
                                          onConfirm={handleConfirm}
                                          onCancel={(id) => setCancelModal(id)}
                                          onReject={(id) => setRejectModal(id)}
                                          onReschedule={(b) => setRescheduleModal(b)}
                                          onComplete={handleComplete}
                                          onNoShow={handleNoShow}
                                          onView={(id) => navigate(BUSINESS_ROUTES.BOOKING_DETAIL(id))}
                                          actionLoading={actionLoading}
                                        />
                                      ))}
                                    </AnimatePresence>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}

                      {/* Other bookings (no time slot) */}
                      {slotGroups.other.length > 0 && (
                        <div className="border-b border-gray-100 last:border-b-0">
                          <TimeSlotHeader
                            slot={{ id: "other", label: "Khung giờ khác", icon: Clock, range: "Không xác định", color: "slate" }}
                            count={slotGroups.other.length}
                            isExpanded={expandedSlots[`${place.id}-other`] !== false}
                            onToggle={() => toggleSlot(`${place.id}-other`)}
                          />
                          <AnimatePresence>
                            {expandedSlots[`${place.id}-other`] !== false && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 space-y-3 bg-gray-50/50">
                                  {slotGroups.other.map((booking) => (
                                    <BookingCard
                                      key={booking.id}
                                      booking={booking}
                                      selected={selected.includes(booking.id)}
                                      onSelect={toggleSelect}
                                      onConfirm={handleConfirm}
                                      onCancel={(id) => setCancelModal(id)}
                                      onReject={(id) => setRejectModal(id)}
                                      onReschedule={(b) => setRescheduleModal(b)}
                                      onComplete={handleComplete}
                                      onNoShow={handleNoShow}
                                      onView={(id) => navigate(BUSINESS_ROUTES.BOOKING_DETAIL(id))}
                                      actionLoading={actionLoading}
                                    />
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center pt-4">
            <PageNav page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Modals */}
      <QuickCancelModal
        open={!!cancelModal}
        onConfirm={handleCancelConfirmed}
        onCancel={() => setCancelModal(null)}
        loading={actionLoading?.startsWith("cancel")}
      />
      <QuickRejectModal
        open={!!rejectModal}
        onConfirm={handleRejectConfirmed}
        onCancel={() => setRejectModal(null)}
        loading={actionLoading?.startsWith("reject")}
      />
      <QuickRescheduleModal
        open={!!rescheduleModal}
        booking={rescheduleModal}
        onConfirm={handleRescheduleConfirmed}
        onCancel={() => setRescheduleModal(null)}
        loading={actionLoading === "reschedule"}
      />

      <BulkActionBar
        selectedCount={pendingSelected.length}
        onBulkConfirm={handleBulkConfirm}
        onBulkCancel={handleBulkCancel}
        onClearSelection={() => setSelected([])}
        loading={bulkLoading}
      />
    </div>
  );
};

export default BookingListPage;
