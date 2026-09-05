import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2, Plus, CalendarOff, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
} from "@/components/ui";
import SettingsSection from "@/components/settings/SettingsSection";
import { blockedDateApi } from "@/apis/blockedDateApi";

const BlockedDatesTab = () => {
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
      toast.error("Không thể tải danh sách ngày tạm ngưng nhận khách.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedDates();
  }, []);

  const handleAdd = async () => {
    if (!newDate) {
      toast.error("Vui lòng chọn ngày tạm ngưng phục vụ.");
      return;
    }
    setSubmitting(true);
    try {
      await blockedDateApi.create({
        date: new Date(newDate).toISOString(),
        reason: newReason || undefined,
      });
      toast.success("Đã thêm ngày tạm ngưng nhận khách.");
      setDialogOpen(false);
      setNewDate("");
      setNewReason("");
      fetchBlockedDates();
    } catch (error) {
      toast.error(error.message || "Không thể lưu ngày tạm ngưng.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await blockedDateApi.remove(id);
      toast.success("Đã mở lại nhận khách cho ngày này.");
      setBlockedDates((prev) => prev.filter((d) => d.id !== id));
    } catch {
      toast.error("Không thể xóa ngày tạm ngưng.");
    }
  };

  return (
    <div className="flex flex-col justify-between h-full space-y-8">
      <div className="space-y-6">
        <SettingsSection
          title="Lịch tạm ngưng nhận khách"
          description="Chặn các ngày nghỉ lễ, bảo trì quán hoặc tổ chức sự kiện nội bộ để du khách không thể đặt chỗ."
        >
          <div className="flex justify-end pb-1">
            <Button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 h-9 shadow-sm cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Thêm ngày ngưng phục vụ
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : blockedDates.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#F9F9FB] border border-black/[0.02] py-14 px-4 text-center">
              <CalendarOff className="h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">Chưa có ngày ngưng phục vụ nào</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Quán của bạn hiện đang mở nhận đặt chỗ liên tục cho tất cả các ngày trong tuần.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {blockedDates.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-[#F9F9FB] hover:bg-[#F2F2F7]/80 p-4 border border-black/[0.02] transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date(item.date).toLocaleDateString("vi-VN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-slate-500 font-normal truncate">
                      {item.reason || "Tạm ngưng phục vụ"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="rounded-full p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                    title="Mở lại nhận khách"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </SettingsSection>
      </div>

      <div className="pt-4 flex items-center justify-between text-xs text-slate-400">
        <span>Tự động cập nhật vào lịch khả dụng trên ứng dụng di động</span>
        <span>Quản lý ngày ngưng phục vụ</span>
      </div>

      {/* Dialog thêm ngày ngưng phục vụ chuẩn Apple */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl border border-black/[0.04] bg-white p-6 sm:max-w-[420px] shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base font-bold text-slate-900">
              Thêm ngày tạm ngưng nhận khách
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Chọn ngày ngưng phục vụ
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Lý do tạm ngưng (Tùy chọn)
              </label>
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="VD: Nghỉ lễ Tết, sửa chữa quán, tiệc riêng..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium px-4 h-9 cursor-pointer"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleAdd}
              disabled={submitting}
              className="rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 h-9 shadow-sm cursor-pointer"
            >
              {submitting ? "Đang lưu..." : "Xác nhận thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlockedDatesTab;
