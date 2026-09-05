import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const getRejectionReasons = (t) => [
  { id: "full_slot", label: t("business.bookings.reasons.timeSlotFull") },
  { id: "closed", label: t("business.bookings.reasons.placeClosed") },
  { id: "maintenance", label: t("business.bookings.reasons.maintenance") },
  { id: "price_changed", label: t("business.bookings.reasons.priceChanged") },
  { id: "holiday", label: t("business.bookings.reasons.noHolidays") },
  { id: "other", label: t("business.bookings.reasons.other") },
];

const getCancelReasons = (t) => [
  { id: "customer_request", label: t("business.bookings.reasons.customerRequest") },
  { id: "double_booking", label: t("business.bookings.reasons.doubleBooking") },
  { id: "service_unavailable", label: t("business.bookings.reasons.serviceUnavailable") },
  { id: "weather", label: t("business.bookings.reasons.weather") },
  { id: "other", label: t("business.bookings.reasons.other") },
];

export function QuickRejectModal({ open, onConfirm, onCancel, loading }) {
  const { t } = useTranslation();
  const [selectedReason, setSelectedReason] = useState(null);
  const [customReason, setCustomReason] = useState("");
  const [businessNote, setBusinessNote] = useState("");

  const reasons = getRejectionReasons(t);

  useEffect(() => {
    if (!open) {
      setSelectedReason(null);
      setCustomReason("");
      setBusinessNote("");
    }
  }, [open]);

  const handleConfirm = () => {
    if (!selectedReason) {
      toast.error(t("business.bookings.cannotReject"));
      return;
    }
    if (selectedReason === "other" && !customReason.trim()) {
      toast.error(t("business.bookings.enterRejectReason"));
      return;
    }
    const reason =
      selectedReason === "other"
        ? customReason.trim()
        : reasons.find((r) => r.id === selectedReason)?.label || "";
    onConfirm(reason, businessNote.trim() || null);
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-md rounded-[36px] p-6 sm:p-7 border border-slate-200/80 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-black text-lg text-destructive tracking-tight">
            {t("business.bookings.rejectRequest")}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-0.5">
            {t("business.bookings.quickRejectReasons")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-2 text-xs">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {t("business.bookings.rejectReason")}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {reasons.map((reason) => (
                <button
                  key={reason.id}
                  type="button"
                  onClick={() => setSelectedReason(reason.id)}
                  className={cn(
                    "px-3 py-2.5 rounded-2xl border text-xs font-bold text-left transition-all",
                    selectedReason === reason.id
                      ? "bg-slate-950 text-white dark:bg-primary dark:text-primary-foreground border-slate-950 shadow-xs"
                      : "bg-slate-50 dark:bg-muted/40 border-slate-200/80 text-slate-700 hover:bg-slate-100"
                  )}
                >
                  {reason.label}
                </button>
              ))}
            </div>
          </div>

          {selectedReason === "other" && (
            <Textarea
              placeholder={t("business.bookings.enterRejectReason")}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="rounded-2xl text-xs min-h-[70px]"
            />
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500">
              {t("business.bookings.internalNote")} ({t("common.optional")})
            </Label>
            <Textarea
              placeholder={t("business.bookings.noteExample")}
              value={businessNote}
              onChange={(e) => setBusinessNote(e.target.value)}
              className="rounded-2xl text-xs min-h-[60px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-slate-100 dark:border-border/60">
          <Button variant="outline" onClick={onCancel} className="rounded-2xl text-xs font-bold px-4">
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-2xl text-xs font-bold px-5"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            {t("business.bookings.reject")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function QuickCancelModal({ open, onConfirm, onCancel, loading }) {
  const { t } = useTranslation();
  const [selectedReason, setSelectedReason] = useState(null);
  const [customReason, setCustomReason] = useState("");

  const reasons = getCancelReasons(t);

  useEffect(() => {
    if (!open) {
      setSelectedReason(null);
      setCustomReason("");
    }
  }, [open]);

  const handleConfirm = () => {
    if (!selectedReason) {
      toast.error(t("business.bookings.cannotCancel"));
      return;
    }
    if (selectedReason === "other" && !customReason.trim()) {
      toast.error(t("business.bookings.enterCancelReason"));
      return;
    }
    const reason =
      selectedReason === "other"
        ? customReason.trim()
        : reasons.find((r) => r.id === selectedReason)?.label || "";
    onConfirm(reason);
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-md rounded-[36px] p-6 sm:p-7 border border-slate-200/80 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-black text-lg text-destructive tracking-tight">
            {t("business.bookings.cancelBooking")}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-0.5">
            {t("business.bookings.quickCancelReasons")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-2 text-xs">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {t("business.bookings.cancelReason")}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {reasons.map((reason) => (
                <button
                  key={reason.id}
                  type="button"
                  onClick={() => setSelectedReason(reason.id)}
                  className={cn(
                    "px-3 py-2.5 rounded-2xl border text-xs font-bold text-left transition-all",
                    selectedReason === reason.id
                      ? "bg-slate-950 text-white dark:bg-primary dark:text-primary-foreground border-slate-950 shadow-xs"
                      : "bg-slate-50 dark:bg-muted/40 border-slate-200/80 text-slate-700 hover:bg-slate-100"
                  )}
                >
                  {reason.label}
                </button>
              ))}
            </div>
          </div>

          {selectedReason === "other" && (
            <Textarea
              placeholder={t("business.bookings.enterCancelReason")}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="rounded-2xl text-xs min-h-[70px]"
            />
          )}
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-slate-100 dark:border-border/60">
          <Button variant="outline" onClick={onCancel} className="rounded-2xl text-xs font-bold px-4">
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-2xl text-xs font-bold px-5"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            {t("business.bookings.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function QuickRescheduleModal({ open, booking, onConfirm, onCancel, loading }) {
  const { t } = useTranslation();
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
      toast.error(t("business.bookings.cannotComplete"));
      return;
    }
    const bookingTime = new Date(`${date}T${time}:00`).toISOString();
    onConfirm(bookingTime, businessNote.trim() || null);
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-md rounded-[36px] p-6 sm:p-7 border border-slate-200/80 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-black text-lg text-slate-900 dark:text-white tracking-tight">
            {t("business.bookings.rescheduleBooking")}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-0.5">
            {t("business.bookings.confirmReschedule")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">{t("business.bookings.newDate")}</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-2xl text-xs h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">{t("business.bookings.newTime")}</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-2xl text-xs h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500">
              {t("business.bookings.internalNote")} ({t("common.optional")})
            </Label>
            <Textarea
              placeholder={t("business.bookings.noteExample")}
              value={businessNote}
              onChange={(e) => setBusinessNote(e.target.value)}
              className="rounded-2xl text-xs min-h-[70px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-slate-100 dark:border-border/60">
          <Button variant="outline" onClick={onCancel} className="rounded-2xl text-xs font-bold px-4">
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-2xl text-xs font-bold bg-slate-950 text-white px-5"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            {t("business.bookings.reschedule")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
