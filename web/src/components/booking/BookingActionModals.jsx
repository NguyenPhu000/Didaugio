import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { XCircle, CalendarClock, Loader2 } from "lucide-react";
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
    const reason = selectedReason === "other"
      ? customReason.trim()
      : reasons.find(r => r.id === selectedReason)?.label || "";
    onConfirm(reason, businessNote.trim() || null);
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-md border-zinc-200/80 dark:bg-zinc-950 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <XCircle className="h-5 w-5" aria-hidden="true" />
            {t("business.bookings.rejectRequest")}
          </DialogTitle>
          <DialogDescription>
            {t("business.bookings.quickRejectReasons")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label>{t("business.bookings.rejectReason")}</Label>
          <div className="grid grid-cols-2 gap-2">
            {reasons.map((reason) => (
              <button
                key={reason.id}
                type="button"
                onClick={() => setSelectedReason(reason.id)}
                className={cn(
                  "px-3 py-2.5 rounded-xl border text-xs font-medium text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
                  selectedReason === reason.id
                    ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                    : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                )}
              >
                {reason.label}
              </button>
            ))}
          </div>

          {selectedReason === "other" && (
            <Textarea
              placeholder={t("business.bookings.enterRejectReason")}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="min-h-[80px] border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900"
            />
          )}

          <div className="space-y-1.5">
            <Label className="text-zinc-500 dark:text-zinc-400">{t("business.bookings.internalNote")} ({t("common.optional")})</Label>
            <Textarea
              placeholder={t("business.bookings.noteExample")}
              value={businessNote}
              onChange={(e) => setBusinessNote(e.target.value)}
              className="min-h-[60px] border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} className="border-zinc-200 dark:border-zinc-800 dark:hover:bg-zinc-900">
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            className="gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
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
    const reason = selectedReason === "other"
      ? customReason.trim()
      : reasons.find(r => r.id === selectedReason)?.label || "";
    onConfirm(reason);
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-md border-zinc-200/80 dark:bg-zinc-950 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <XCircle className="h-5 w-5" aria-hidden="true" />
            {t("business.bookings.cancelBooking")}
          </DialogTitle>
          <DialogDescription>
            {t("business.bookings.quickCancelReasons")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label>{t("business.bookings.cancelReason")}</Label>
          <div className="grid grid-cols-2 gap-2">
            {reasons.map((reason) => (
              <button
                key={reason.id}
                type="button"
                onClick={() => setSelectedReason(reason.id)}
                className={cn(
                  "px-3 py-2.5 rounded-xl border text-xs font-medium text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
                  selectedReason === reason.id
                    ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                    : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                )}
              >
                {reason.label}
              </button>
            ))}
          </div>

          {selectedReason === "other" && (
            <Textarea
              placeholder={t("business.bookings.enterCancelReason")}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="min-h-[80px] border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900"
            />
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} className="border-zinc-200 dark:border-zinc-800 dark:hover:bg-zinc-900">
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
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
      <DialogContent className="max-w-md border-zinc-200/80 dark:bg-zinc-950 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-950 dark:text-zinc-100">
            <CalendarClock className="h-5 w-5 text-zinc-500" aria-hidden="true" />
            {t("business.bookings.rescheduleBooking")}
          </DialogTitle>
          <DialogDescription>
            {t("business.bookings.confirmReschedule")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("business.bookings.newDate")}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("business.bookings.newTime")}</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-zinc-500 dark:text-zinc-400">{t("business.bookings.internalNote")} ({t("common.optional")})</Label>
            <Textarea
              placeholder={t("business.bookings.noteExample")}
              value={businessNote}
              onChange={(e) => setBusinessNote(e.target.value)}
              className="border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} className="border-zinc-200 dark:border-zinc-800 dark:hover:bg-zinc-900">
            {t("common.cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={loading} className="gap-2 bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("business.bookings.reschedule")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
