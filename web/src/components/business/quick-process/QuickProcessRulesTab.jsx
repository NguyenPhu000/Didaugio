import React, { memo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TIME_SLOT_LABELS } from "@/constants/bookingSchedule";
import { cn } from "@/lib/utils";

const getTimeSlotLabel = (slotKey) => TIME_SLOT_LABELS[slotKey] || slotKey;

export const QuickProcessRulesTab = memo(
  ({
    rules,
    rulesLoading,
    onOpenCreateRule,
    onToggleRuleActive,
    onDeleteRule,
  }) => {
    return (
      <div className="p-6 sm:p-7 rounded-[36px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Chính Sách Tự Động Duyệt (Auto-Approve Policies)
            </h3>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
              Khi khách đặt chỗ khớp với các tiêu chí dưới đây, hệ thống sẽ tự động xác nhận đơn ngay tức thì.
            </p>
          </div>

          <Button
            size="sm"
            onClick={onOpenCreateRule}
            className="rounded-2xl px-4 text-xs font-bold bg-slate-950 text-white self-start sm:self-auto gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm quy tắc
          </Button>
        </div>

        {rulesLoading ? (
          <div className="py-10 text-center text-xs text-muted-foreground">
            Đang tải danh sách quy tắc...
          </div>
        ) : rules.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Chưa có quy tắc tự động duyệt nào được kích hoạt. Hãy tạo quy tắc đầu tiên để tiết kiệm thời gian vận hành!
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {rules.map((rule) => {
              const cond = rule.conditions || {};
              return (
                <div
                  key={rule.id}
                  className={cn(
                    "p-5 rounded-[26px] border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                    rule.isActive
                      ? "bg-slate-50/90 dark:bg-muted/40 border-slate-200/80 dark:border-border/60"
                      : "bg-slate-100/50 dark:bg-muted/20 border-slate-200/40 opacity-70"
                  )}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-slate-900 dark:text-white">
                        Tự động xác nhận đơn đặt
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-muted text-slate-700 dark:text-slate-300">
                        Ưu tiên cấp {rule.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-muted-foreground flex-wrap font-medium">
                      {cond.timeSlots?.length > 0 && (
                        <>
                          <span>
                            Khung giờ:{" "}
                            <strong className="text-slate-800 dark:text-slate-200">
                              {cond.timeSlots.map(getTimeSlotLabel).join(", ")}
                            </strong>
                          </span>
                          <span className="text-slate-300">•</span>
                        </>
                      )}
                      {cond.minQuantity && <span>Tối thiểu: {cond.minQuantity} khách • </span>}
                      {cond.maxQuantity && <span>Tối đa: {cond.maxQuantity} khách • </span>}
                      {!cond.timeSlots?.length && !cond.minQuantity && !cond.maxQuantity && (
                        <span>Áp dụng cho mọi đơn đặt chỗ</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        {rule.isActive ? "Đang bật" : "Đã tắt"}
                      </span>
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => onToggleRuleActive(rule)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteRule(rule)}
                      className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

QuickProcessRulesTab.displayName = "QuickProcessRulesTab";
export default QuickProcessRulesTab;
