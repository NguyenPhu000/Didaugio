import { useState, useCallback, memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Search,
  Download,
  Filter,
  User,
  FileText,
  Activity,
  Calendar,
} from "lucide-react";
import { auditLogService } from "@/apis/auditLogService";

const ACTION_COLORS = {
  CREATE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  UPDATE: "bg-blue-100 text-blue-800 border-blue-200",
  DELETE: "bg-red-100 text-red-800 border-red-200",
  LOGIN: "bg-purple-100 text-purple-800 border-purple-200",
  APPROVE: "bg-green-100 text-green-800 border-green-200",
  REJECT: "bg-orange-100 text-orange-800 border-orange-200",
  LOCK: "bg-red-100 text-red-800 border-red-200",
  UNLOCK: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const formatTimestamp = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * TimelineEntry — single audit log entry in timeline style.
 */
const TimelineEntry = memo(function TimelineEntry({ entry, isLast }) {
  const actionColor =
    ACTION_COLORS[entry.action] || "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <div className="flex gap-4">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background",
            entry.action === "DELETE"
              ? "border-red-300"
              : entry.action === "CREATE"
                ? "border-emerald-300"
                : "border-primary/30",
          )}
        >
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-border min-h-[24px]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/20">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {entry.userName || entry.user?.username || "Hệ thống"}
              </span>
              <Badge
                variant="outline"
                className={cn("text-[10px] font-mono", actionColor)}
              >
                {entry.action}
              </Badge>
              {entry.tableName && (
                <Badge variant="secondary" className="text-[10px]">
                  {entry.tableName}
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimestamp(entry.createdAt)}
            </span>
          </div>

          {/* Description */}
          {entry.description && (
            <p className="mt-2 text-sm text-muted-foreground">
              {entry.description}
            </p>
          )}

          {/* Metadata */}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {entry.recordId && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                ID: {entry.recordId}
              </span>
            )}
            {entry.ipAddress && (
              <span>IP: {entry.ipAddress}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * AuditLog — timeline-style audit log display with filters and CSV export.
 *
 * @param {Object} props
 * @param {Array} props.entries — Audit log entries
 * @param {boolean} props.loading — Loading state
 * @param {Object} props.pagination — Pagination object { page, totalPages, total }
 * @param {(page: number) => void} props.onPageChange — Page change handler
 * @param {Object} props.filters — Current filter state
 * @param {(filters: Object) => void} props.onFilterChange — Filter change handler
 * @param {boolean} props.showFilters — Show filter bar (default true)
 * @param {string} props.exportFilename — CSV export filename
 */
export default function AuditLog({
  entries = [],
  loading = false,
  pagination,
  onPageChange,
  filters = {},
  onFilterChange,
  showFilters = true,
  exportFilename = "audit_log",
}) {
  const [search, setSearch] = useState(filters.search || "");
  const [actionFilter, setActionFilter] = useState(filters.action || "all");
  const [dateRange, setDateRange] = useState(filters.dateRange || "all");

  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSearch(value);
      onFilterChange?.({ ...filters, search: value, page: 1 });
    },
    [filters, onFilterChange],
  );

  const handleActionChange = useCallback(
    (value) => {
      setActionFilter(value);
      onFilterChange?.({ ...filters, action: value === "all" ? undefined : value, page: 1 });
    },
    [filters, onFilterChange],
  );

  const handleDateRangeChange = useCallback(
    (value) => {
      setDateRange(value);
      onFilterChange?.({ ...filters, dateRange: value === "all" ? undefined : value, page: 1 });
    },
    [filters, onFilterChange],
  );

  const handleExportCsv = useCallback(() => {
    if (!entries.length) return;

    const headers = ["Thời gian", "Người thực hiện", "Hành động", "Đối tượng", "Mô tả", "IP"];
    const rows = entries.map((e) => [
      e.createdAt ? new Date(e.createdAt).toLocaleString("vi-VN") : "",
      e.userName || e.user?.username || "",
      e.action || "",
      e.tableName || "",
      e.description || "",
      e.ipAddress || "",
    ]);

    const escapeCsv = (val) => {
      const str = String(val ?? "");
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };

    const csv = [headers.map(escapeCsv).join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportFilename}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [entries, exportFilename]);

  const actionTypes = useMemo(() => auditLogService.getActionTypes(), []);

  if (loading && entries.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      {showFilters && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm hoạt động..."
              value={search}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>

          <Select value={actionFilter} onValueChange={handleActionChange}>
            <SelectTrigger className="w-[160px]">
              <Filter className="mr-2 h-3.5 w-3.5" />
              <SelectValue placeholder="Hành động" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {actionTypes.slice(0, 10).map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={handleDateRangeChange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-3.5 w-3.5" />
              <SelectValue placeholder="Thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="today">Hôm nay</SelectItem>
              <SelectItem value="week">7 ngày qua</SelectItem>
              <SelectItem value="month">30 ngày qua</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="mr-2 h-3.5 w-3.5" />
            Xuất CSV
          </Button>
        </div>
      )}

      {/* Timeline */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Activity className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            Chưa có hoạt động nào
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Các hoạt động của nhân viên sẽ được ghi nhận tại đây
          </p>
        </div>
      ) : (
        <div className="relative">
          {entries.map((entry, index) => (
            <TimelineEntry
              key={entry.id || index}
              entry={entry}
              isLast={index === entries.length - 1}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            {pagination.total} hoạt động
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
            >
              Trước
            </Button>
            <span className="text-xs">
              Trang {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange?.(pagination.page + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
