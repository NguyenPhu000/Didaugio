import React from "react";
import { useTranslation } from "react-i18next";
import { Check, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SLOT_OPTIONS } from "./quickProcessConstants";

export const RuleConfigModal = ({
  open,
  onOpenChange,
  ruleForm,
  setRuleForm,
  guestMode,
  setGuestMode,
  onSaveRule,
}) => {
  const { t } = useTranslation();

  const toggleTimeSlot = (slotKey) => {
    setRuleForm((prev) => {
      const exists = prev.timeSlots.includes(slotKey);
      const nextSlots = exists
        ? prev.timeSlots.filter((s) => s !== slotKey)
        : [...prev.timeSlots, slotKey];
      return { ...prev, timeSlots: nextSlots };
    });
  };

  const handleSelectAllSlots = () => {
    setRuleForm((prev) => {
      if (prev.timeSlots.length === SLOT_OPTIONS.length) {
        return { ...prev, timeSlots: [] };
      }
      return { ...prev, timeSlots: SLOT_OPTIONS.map((s) => s.key) };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-[40px] p-7 sm:p-8 border border-slate-200/80 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <DialogTitle className="font-black text-xl text-slate-900 dark:text-white tracking-tight">
              Thiết Lập Quy Tắc Tự Động Duyệt
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Đơn đặt chỗ mới khớp với các điều kiện dưới đây sẽ được hệ thống tự động xác nhận tức thì.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSaveRule} className="space-y-5 py-2 text-xs">
          {/* 1. Khung giờ áp dụng */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-extrabold text-slate-900 dark:text-white">
                1. Khung giờ áp dụng
              </Label>
              <button
                type="button"
                onClick={handleSelectAllSlots}
                className="text-[11px] font-bold text-amber-600 hover:text-amber-700 underline"
              >
                {ruleForm.timeSlots.length === SLOT_OPTIONS.length
                  ? "Bỏ chọn tất cả"
                  : "Chọn tất cả khung giờ"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {SLOT_OPTIONS.map((slot) => {
                const isChecked = ruleForm.timeSlots.includes(slot.key);
                return (
                  <div
                    key={slot.key}
                    onClick={() => toggleTimeSlot(slot.key)}
                    className={cn(
                      "p-3.5 rounded-[24px] border text-left cursor-pointer transition-all duration-200 select-none flex items-center justify-between",
                      isChecked
                        ? "bg-[#FEE8D3] dark:bg-amber-950/40 border-[#FCD4AF] dark:border-amber-800 shadow-xs ring-1 ring-amber-500"
                        : "bg-slate-50 dark:bg-muted/40 border-slate-200/80 hover:bg-slate-100"
                    )}
                  >
                    <div>
                      <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {slot.label}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{slot.desc}</p>
                    </div>
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center transition-colors",
                        isChecked ? "bg-amber-500 text-white" : "border border-slate-300"
                      )}
                    >
                      {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Quy mô số khách */}
          <div className="space-y-2.5">
            <Label className="text-xs font-extrabold text-slate-900 dark:text-white">
              2. Giới hạn quy mô số khách
            </Label>

            {/* Segmented Guest Mode */}
            <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-[22px] bg-slate-100 dark:bg-muted text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  setGuestMode("any");
                  setRuleForm({ ...ruleForm, minQuantity: "", maxQuantity: "" });
                }}
                className={cn(
                  "py-2 rounded-2xl transition-all",
                  guestMode === "any"
                    ? "bg-white dark:bg-card text-slate-950 shadow-xs"
                    : "text-slate-500"
                )}
              >
                Mọi số lượng
              </button>
              <button
                type="button"
                onClick={() => setGuestMode("max")}
                className={cn(
                  "py-2 rounded-2xl transition-all",
                  guestMode === "max"
                    ? "bg-white dark:bg-card text-slate-950 shadow-xs"
                    : "text-slate-500"
                )}
              >
                Tối đa (Đoàn nhỏ)
              </button>
              <button
                type="button"
                onClick={() => setGuestMode("range")}
                className={cn(
                  "py-2 rounded-2xl transition-all",
                  guestMode === "range"
                    ? "bg-white dark:bg-card text-slate-950 shadow-xs"
                    : "text-slate-500"
                )}
              >
                Khoảng Min - Max
              </button>
            </div>

            {guestMode === "max" && (
              <div className="pt-1">
                <Input
                  type="number"
                  placeholder="VD: Chỉ auto-duyệt đoàn dưới 6 khách"
                  value={ruleForm.maxQuantity}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, maxQuantity: e.target.value })
                  }
                  className="rounded-2xl text-xs h-10"
                />
              </div>
            )}

            {guestMode === "range" && (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Input
                  type="number"
                  placeholder="Tối thiểu (VD: 2)"
                  value={ruleForm.minQuantity}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, minQuantity: e.target.value })
                  }
                  className="rounded-2xl text-xs h-10"
                />
                <Input
                  type="number"
                  placeholder="Tối đa (VD: 10)"
                  value={ruleForm.maxQuantity}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, maxQuantity: e.target.value })
                  }
                  className="rounded-2xl text-xs h-10"
                />
              </div>
            )}
          </div>

          {/* 3. Mức độ ưu tiên */}
          <div className="space-y-2.5">
            <Label className="text-xs font-extrabold text-slate-900 dark:text-white">
              3. Mức độ ưu tiên xử lý
            </Label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { value: 1, label: "Tiêu chuẩn", desc: "Cấp độ 1" },
                { value: 5, label: "Ưu tiên cao", desc: "Cấp độ 5" },
                { value: 10, label: "Cao nhất", desc: "Cấp độ 10" },
              ].map((lvl) => {
                const isSelected = Number(ruleForm.priority) === lvl.value;
                return (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => setRuleForm({ ...ruleForm, priority: lvl.value })}
                    className={cn(
                      "p-3 rounded-[24px] border text-left transition-all",
                      isSelected
                        ? "bg-slate-950 text-white dark:bg-primary dark:text-primary-foreground border-slate-950 shadow-xs"
                        : "bg-slate-50 dark:bg-muted border-slate-200/80 text-slate-700"
                    )}
                  >
                    <p className="font-extrabold text-xs">{lvl.label}</p>
                    <p className="text-[10px] opacity-70 mt-0.5">{lvl.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Active Switch Container */}
          <div className="flex items-center justify-between p-4 rounded-[26px] bg-slate-50 dark:bg-muted/40 border border-slate-200/80">
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-white">
                Kích hoạt quy tắc ngay sau khi lưu
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Áp dụng tức thì cho các lượt đặt chỗ tiếp theo
              </p>
            </div>
            <Switch
              checked={ruleForm.isActive}
              onCheckedChange={(c) => setRuleForm({ ...ruleForm, isActive: !!c })}
            />
          </div>

          <DialogFooter className="gap-2.5 pt-3 border-t border-slate-100 dark:border-border/60">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl text-xs font-bold px-5"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="rounded-2xl text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground px-6"
            >
              Kích hoạt quy tắc
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RuleConfigModal;
