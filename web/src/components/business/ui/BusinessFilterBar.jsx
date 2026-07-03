import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * @typedef {Object} FilterConfig
 * @property {string} key - Unique filter key
 * @property {'search'|'select'|'dateRange'|'multiselect'} type - Filter input type
 * @property {Array<{value: string, label: string}>} [options] - Options for select/multiselect
 * @property {string} [placeholder] - Input placeholder
 * @property {string} [label] - Display label
 */

/**
 * BusinessFilterBar — standardized filter/toolbar pattern.
 * Supports both declarative filter configs and slot-based children.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.children] - Custom filter controls (slot mode)
 * @param {string} [props.searchPlaceholder] - Search input placeholder
 * @param {(value: string) => void} [props.onSearch] - Search callback
 * @param {string} [props.value] - Search value
 * @param {FilterConfig[]} [props.filters] - Declarative filter configs
 * @param {(key: string, value: any) => void} [props.onFilterChange] - Filter change callback
 * @param {() => void} [props.onReset] - Reset all filters callback
 * @param {Record<string, any>} [props.filterValues] - Current filter values
 * @param {string} [props.className] - Additional classes
 */
export function BusinessFilterBar({
  children,
  searchPlaceholder = "Tìm kiếm...",
  onSearch,
  value,
  filters,
  onFilterChange,
  onReset,
  filterValues = {},
  className,
}) {
  const hasFilters = filters && filters.length > 0;
  const hasActiveFilters = hasFilters && Object.values(filterValues).some(
    (v) => v !== undefined && v !== null && v !== "",
  );

  return (
    <div className={cn(
      "flex flex-col gap-4 rounded-xl border border-zinc-200/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between",
      className,
    )}>
      {/* Search zone */}
      {onSearch && (
        <div className="flex flex-1 items-center gap-2 max-w-sm w-full">
          <Search className="h-4 w-4 text-zinc-400 shrink-0" />
          <Input
            placeholder={searchPlaceholder}
            value={value}
            onChange={(e) => onSearch(e.target.value)}
            className="h-9 border-zinc-200 bg-transparent text-zinc-950 placeholder:text-zinc-400 focus-visible:ring-zinc-400 rounded-lg text-sm"
          />
        </div>
      )}

      {/* Declarative filter zone */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <FilterControl
              key={filter.key}
              config={filter}
              value={filterValues[filter.key]}
              onChange={(val) => onFilterChange?.(filter.key, val)}
            />
          ))}
          {hasActiveFilters && onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-9 gap-1 px-2 text-zinc-500 hover:text-zinc-900"
            >
              <X className="h-3.5 w-3.5" />
              Xóa lọc
            </Button>
          )}
        </div>
      )}

      {/* Slot-based filter / action zone */}
      {children && (
        <div className="flex flex-wrap items-center gap-2 w-full justify-end sm:w-auto">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Individual filter control renderer.
 * @param {{ config: FilterConfig, value: any, onChange: (val: any) => void }} props
 */
function FilterControl({ config, value, onChange }) {
  if (config.type === "search") {
    return (
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-zinc-400" />
        <Input
          placeholder={config.placeholder || "Tìm kiếm..."}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-48 rounded-lg border-zinc-200 text-sm"
        />
      </div>
    );
  }

  if (config.type === "select") {
    return (
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className={cn(
          "h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900",
          "focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2",
          "dark:bg-zinc-950 dark:text-zinc-100 dark:border-zinc-800",
          !value && "text-zinc-400",
        )}
      >
        <option value="">{config.placeholder || config.label || "Chọn..."}</option>
        {config.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (config.type === "dateRange") {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={value?.from || ""}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className="h-9 w-36 rounded-lg border-zinc-200 text-sm"
        />
        <span className="text-xs text-zinc-400">đến</span>
        <Input
          type="date"
          value={value?.to || ""}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className="h-9 w-36 rounded-lg border-zinc-200 text-sm"
        />
      </div>
    );
  }

  return null;
}
FilterControl.displayName = "FilterControl";
