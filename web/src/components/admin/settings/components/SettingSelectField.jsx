import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Select thống nhất cho trang cài đặt (viền đen, chữ mono nhỏ).
 * Giá trị đã lưu không nằm trong preset vẫn hiển thị được (không ép về mục đầu).
 */
export default function SettingSelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  className = "",
}) {
  const safeValue = value != null ? String(value) : "";
  const mergedOptions = useMemo(() => {
    const preset = new Set(options.map((o) => o.value));
    if (!safeValue || preset.has(safeValue)) return options;
    return [
      { value: safeValue, label: `${safeValue} (đã lưu)` },
      ...options,
    ];
  }, [options, safeValue]);

  return (
    <div className={`space-y-1 ${className}`}>
      {label ? (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-zinc-600"
        >
          {label}
        >
          {label}
        </label>
      ) : null}
      <Select
        value={safeValue || (mergedOptions[0]?.value ?? "")}
        onValueChange={(v) => onChange(v)}
      >
        <SelectTrigger
          id={id}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 hover:border-slate-300 transition-all"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-[min(320px,50vh)] rounded-xl border border-slate-200 shadow-lg">
          {mergedOptions.map((o) => (
            <SelectItem
              key={o.value}
              value={o.value}
              className="text-sm normal-case"
            >
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
