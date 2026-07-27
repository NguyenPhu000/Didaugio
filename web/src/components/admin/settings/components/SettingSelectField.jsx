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
          className="block font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
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
          className="h-10 w-full rounded-none border-black bg-white font-mono text-xs normal-case focus:ring-0"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="rounded-none border-black max-h-[min(320px,50vh)]">
          {mergedOptions.map((o) => (
            <SelectItem
              key={o.value}
              value={o.value}
              className="font-mono text-xs normal-case"
            >
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
