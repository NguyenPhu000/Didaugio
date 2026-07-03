import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Trash2, Plus, Lock, Loader2 } from "lucide-react";
import {
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui";
import SettingsSection from "@/components/settings/SettingsSection";
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
    <SettingsSection
      title={t("business.settings.blockedDates.title")}
      description={t("business.settings.blockedDates.description")}
    >
      <div className="flex justify-end">
        <Button
          onClick={() => setDialogOpen(true)}
          className="rounded-none border-2 border-black bg-[#F3E600] text-black hover:bg-black hover:text-[#F3E600] h-8 px-3 uppercase font-bold text-[10px]"
        >
          <Plus className="h-3 w-3 mr-1" />
          {t("business.settings.blockedDates.addDate")}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : blockedDates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200">
          <Lock className="h-8 w-8 text-gray-300 mb-2" />
          <p className="font-mono text-[10px] text-gray-400 uppercase">
            {t("business.settings.blockedDates.noBlockedDates")}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {blockedDates.map((bd) => (
            <div
              key={bd.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-red-200 bg-red-50 px-3 py-2"
            >
              <div className="min-w-0">
                <span className="font-mono text-xs font-bold text-red-700">
                  {formatDate(bd.date)}
                </span>
                {bd.reason && (
                  <span className="font-mono text-[10px] text-gray-500 ml-0 sm:ml-2 block sm:inline">
                    — {bd.reason}
                  </span>
                )}
                {bd.service && (
                  <span className="font-mono text-[10px] text-gray-400 ml-0 sm:ml-2 block sm:inline">
                    ({bd.service.name})
                  </span>
                )}
              </div>
              <button
                onClick={() => handleRemove(bd.id)}
                className="text-red-500 hover:text-red-700 p-1 self-end sm:self-center min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px] max-w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-sm">
              {t("business.settings.blockedDates.dialogTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase">
                {t("business.settings.blockedDates.dateLabel")}
              </label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="rounded-none border-black"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase">
                {t("business.settings.blockedDates.reasonLabel")}
              </label>
              <Input
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder={t("business.settings.blockedDates.reasonPlaceholder")}
                className="rounded-none border-black"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="rounded-none border-black uppercase font-bold text-xs"
            >
              {t("business.settings.blockedDates.cancel")}
            </Button>
            <Button
              onClick={handleAdd}
              disabled={submitting}
              className="rounded-none border-2 border-black bg-[#F3E600] text-black hover:bg-black hover:text-[#F3E600] uppercase font-bold text-xs"
            >
              {submitting ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : null}
              {t("business.settings.blockedDates.blockDate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
};

export default BlockedDatesTab;
