import { memo } from "react";
import { Loader2, Save, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SettingsSaveBar — fixed bottom action bar for explicit settings save.
 * Renders nothing when there are no unsaved changes.
 */
const SettingsSaveBar = memo(({
  variant = "business",
  isDirty,
  isSaving,
  onSave,
  onUndo,
  labels,
}) => {
  if (!isDirty) return null;
  const admin = variant === "admin";

  return (
    <div
      role="region"
      aria-label={labels.unsaved}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 flex items-center justify-end gap-3 px-4 py-3 sm:px-6",
        admin
          ? "border-t-2 border-black bg-white/95 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur"
          : "border-t border-zinc-200/80 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95"
      )}
    >
      <span
        className={cn(
          "mr-auto flex items-center gap-2",
          admin
            ? "font-mono text-xs font-bold uppercase tracking-wider text-black"
            : "text-sm font-medium text-amber-600 dark:text-amber-400"
        )}
      >
        <span
          className={cn(
            "inline-block h-2 w-2 rounded-full",
            admin ? "bg-[#F3E600]" : "bg-amber-500"
          )}
        />
        {labels.unsaved}
      </span>

      <button
        type="button"
        onClick={onUndo}
        disabled={isSaving}
        className={cn(
          "inline-flex whitespace-nowrap items-center gap-2 disabled:opacity-50",
          admin
            ? "h-10 rounded-xl border border-black/30 bg-white px-4 font-mono text-xs font-bold uppercase tracking-wider hover:bg-gray-50"
            : "h-9 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        )}
      >
        <Undo2 className="h-4 w-4" />
        {labels.undo}
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className={cn(
          "inline-flex whitespace-nowrap items-center gap-2 disabled:opacity-60",
          admin
            ? "h-10 rounded-xl border-2 border-black bg-black px-5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-gray-900"
            : "h-9 rounded-lg bg-zinc-950 px-5 text-sm font-medium text-white hover:bg-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        )}
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {isSaving ? labels.saving : labels.save}
      </button>
    </div>
  );
});

SettingsSaveBar.displayName = "SettingsSaveBar";

export default SettingsSaveBar;
