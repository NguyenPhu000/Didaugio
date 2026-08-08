import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Trash2, Plus, Lock, Loader2 } from "lucide-react";
import {
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { BusinessSectionCard } from "@/components/business/ui/BusinessSectionCard";
import { BUSINESS_TOKENS } from "@/components/business/tokens/businessTokens";
import { formatDate } from "@/components/business/dashboardWidgetHelpers";
import { blockedDateApi } from "@/apis/blockedDateApi";

const BlockedDatesTab = () => {
  const { t } = useTranslation();
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchBlockedDates = async () => {
    setLoading(true);
    try {
      const response = await blockedDateApi.getAll();
      setBlockedDates(response?.data || []);
    } catch {
      toast.error(t("business.settings.blockedDates.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedDates();
  }, []);

  const handleAdd = async () => {
    if (!newDate) {
      toast.error(t("business.settings.blockedDates.selectDate"));
      return;
    }
    setSubmitting(true);
    try {
      await blockedDateApi.create({
        date: new Date(newDate).toISOString(),
        reason: newReason || undefined,
      });
      toast.success(t("business.settings.blockedDates.blockSuccess"));
      setDialogOpen(false);
      setNewDate("");
      setNewReason("");
      fetchBlockedDates();
    } catch (error) {
      toast.error(error.message || t("business.settings.blockedDates.blockFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await blockedDateApi.remove(id);
      toast.success(t("business.settings.blockedDates.unblockSuccess"));
      setBlockedDates((prev) => prev.filter((d) => d.id !== id));
    } catch {
      toast.error(t("business.settings.blockedDates.unblockFailed"));
    }
  };

  return (
    <BusinessSectionCard
      title={t("business.settings.blockedDates.title")}
      description={t("business.settings.blockedDates.description")}
      action={
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className={cn(BUSINESS_TOKENS.buttonPrimary, "inline-flex items-center gap-2")}
        >
          <Plus className="h-4 w-4" />
          {t("business.settings.blockedDates.addDate")}
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
        </div>
      ) : blockedDates.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-200 py-10 dark:border-zinc-800">
          <Lock className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            {t("business.settings.blockedDates.noBlockedDates")}
          </p>
        </div>
      ) : (
        <div className="max-h-[400px] space-y-2 overflow-y-auto">
          {blockedDates.map((bd) => (
            <div
              key={bd.id}
              className="flex flex-col justify-between gap-2 rounded-lg border border-rose-200/70 bg-rose-50/50 px-3 py-2.5 sm:flex-row sm:items-center dark:border-rose-900/50 dark:bg-rose-950/20"
            >
              <div className="min-w-0">
                <span className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                  {formatDate(bd.date)}
                </span>
                {bd.reason && (
                  <span className="ml-0 block text-xs text-zinc-500 sm:ml-2 sm:inline dark:text-zinc-400">
                    — {bd.reason}
                  </span>
                )}
                {bd.service && (
                  <span className="ml-0 block text-xs text-zinc-400 sm:ml-2 sm:inline">
                    ({bd.service.name})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(bd.id)}
                aria-label={t("business.settings.blockedDates.unblockSuccess")}
                className="flex h-9 w-9 items-center justify-center self-end rounded-lg text-rose-500 transition-colors hover:bg-rose-100 hover:text-rose-700 sm:self-center dark:hover:bg-rose-950/40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {t("business.settings.blockedDates.dialogTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("business.settings.blockedDates.dateLabel")}
              </Label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className={BUSINESS_TOKENS.inputBusiness}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("business.settings.blockedDates.reasonLabel")}
              </Label>
              <Input
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder={t("business.settings.blockedDates.reasonPlaceholder")}
                className={BUSINESS_TOKENS.inputBusiness}
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className={BUSINESS_TOKENS.buttonSecondary}
            >
              {t("business.settings.blockedDates.cancel")}
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={submitting}
              className={cn(BUSINESS_TOKENS.buttonPrimary, "inline-flex items-center gap-2 disabled:opacity-50")}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("business.settings.blockedDates.blockDate")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BusinessSectionCard>
  );
};

export default BlockedDatesTab;
