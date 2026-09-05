import { memo } from "react";
import { Loader2, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SettingsSaveBar — fixed bottom action bar for explicit settings save.
 * Apple Minimalist Design.
 */
const SettingsSaveBar = memo(({
  isDirty,
  isSaving,
  onSave,
  onUndo,
  labels,
}) => {
  if (!isDirty) return null;

  return (
    <div
      role="region"
      aria-label={labels.unsaved}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center justify-between gap-4 px-6 py-3 rounded-full bg-slate-900/90 text-white backdrop-blur-xl shadow-2xl border border-white/10 max-w-xl w-[92%] transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
        </span>
        <span className="text-xs font-medium text-slate-200 truncate">
          {labels.unsaved || "Có thay đổi chưa lưu"}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onUndo}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {labels.undo || "Hoàn tác"}
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-slate-100 active:scale-95 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          {isSaving ? labels.saving || "Đang lưu..." : labels.save || "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
});

SettingsSaveBar.displayName = "SettingsSaveBar";

export default SettingsSaveBar;
