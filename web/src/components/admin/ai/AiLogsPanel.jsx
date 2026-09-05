import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  CircleX,
  Clock3,
  FilterX,
  MessageSquareWarning,
  Minus,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminAiLogs } from "@/hooks/queries/useAdminAiQueries";
import AiEmptyState from "./AiEmptyState";

const PAGE_SIZE = 25;
const AI_TIME_ZONE = "Asia/Ho_Chi_Minh";
const AI_TIME_ZONE_OFFSET_MINUTES = 7 * 60;
const LOG_COLUMNS = [
  "Thời gian",
  "Tính năng",
  "Provider / Model",
  "Token",
  "Latency",
  "Trạng thái",
  "Safety",
  "Feedback",
];
const EMPTY_FILTERS = {
  fromDate: "",
  toDate: "",
  feature: "",
  status: "",
  safetyBlocked: "",
  feedback: "",
};
const featureLabels = {
  chat: "Chat",
  planner: "Planner",
  voice: "Voice",
  voice_stt: "Voice / STT",
  voice_tts: "Voice / TTS",
  "voice-stt": "Voice / STT",
  "voice-tts": "Voice / TTS",
};
const statusViews = {
  started: {
    label: "Đang xử lý",
    Icon: CircleDashed,
    className: "border-foreground/40 bg-muted text-foreground",
  },
  success: {
    label: "Thành công",
    Icon: CircleCheck,
    className: "border-foreground/40 bg-primary/15 text-foreground",
  },
  error: {
    label: "Lỗi",
    Icon: CircleX,
    className: "border-destructive/60 bg-destructive/10 text-destructive",
  },
  blocked: {
    label: "Bị chặn",
    Icon: ShieldAlert,
    className: "border-destructive/60 bg-destructive/10 text-destructive",
  },
};
const numberFormatter = new Intl.NumberFormat("vi-VN");
const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: AI_TIME_ZONE,
});

function unwrapResponse(value) {
  return value?.success === true && value?.data !== undefined
    ? value.data
    : value;
}

function dateParam(value, endOfDay = false) {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const utcDay = new Date(Date.UTC(year, month - 1, day));
  if (
    utcDay.getUTCFullYear() !== year ||
    utcDay.getUTCMonth() !== month - 1 ||
    utcDay.getUTCDate() !== day
  ) {
    return undefined;
  }

  const localBoundary = Date.UTC(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  );
  return new Date(
    localBoundary - AI_TIME_ZONE_OFFSET_MINUTES * 60_000,
  ).toISOString();
}

function formatNumber(value) {
  return numberFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatTimestamp(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Không xác định" : dateFormatter.format(parsed);
}

function metadataParams(filters, page) {
  return {
    page,
    limit: PAGE_SIZE,
    ...(filters.fromDate ? { from: dateParam(filters.fromDate) } : {}),
    ...(filters.toDate ? { to: dateParam(filters.toDate, true) } : {}),
    ...(filters.feature ? { feature: filters.feature } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.safetyBlocked
      ? { safetyBlocked: filters.safetyBlocked === "true" }
      : {}),
    ...(filters.feedback ? { feedback: filters.feedback } : {}),
  };
}

function FilterField({ label, children }) {
  return (
    <label className="min-w-0 space-y-1.5">
      <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function FilterSelect({ label, value, onChange, disabled, children }) {
  return (
    <FilterField label={label}>
      <select
        aria-label={label}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="h-10 w-full rounded-none border border-input bg-background px-3 font-mono text-xs text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {children}
      </select>
    </FilterField>
  );
}

function StatusBadge({ status }) {
  const view = statusViews[status] ?? {
    label: "Không xác định",
    Icon: Clock3,
    className: "border-foreground/40 bg-muted text-foreground",
  };
  const Icon = view.Icon;
  return (
    <Badge
      variant="outline"
      className={`gap-1 rounded-none font-mono text-[10px] uppercase ${view.className}`}
    >
      <Icon aria-hidden="true" className="size-3" />
      {view.label}
    </Badge>
  );
}

function SafetyValue({ blocked }) {
  const Icon = blocked ? ShieldAlert : ShieldCheck;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <Icon aria-hidden="true" className="size-3.5" />
      {blocked ? "Đã chặn" : "Không chặn"}
    </span>
  );
}

function FeedbackValue({ feedback }) {
  const view =
    feedback === "up"
      ? { label: "Tích cực", Icon: ThumbsUp }
      : feedback === "down"
        ? { label: "Tiêu cực", Icon: ThumbsDown }
        : { label: "Chưa có", Icon: Minus };
  const Icon = view.Icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <Icon aria-hidden="true" className="size-3.5" />
      {view.label}
    </span>
  );
}

function TokenValue({ item }) {
  const hasInput = Number.isFinite(item.inputTokens);
  const hasOutput = Number.isFinite(item.outputTokens);
  const input = hasInput ? formatNumber(item.inputTokens) : "—";
  const output = hasOutput ? formatNumber(item.outputTokens) : "—";
  const total =
    hasInput && hasOutput
      ? formatNumber(item.inputTokens + item.outputTokens)
      : "—";
  return (
    <div className="font-mono tabular-nums">
      <p className="text-xs font-semibold">{total}</p>
      <p className="text-[10px] text-muted-foreground">
        {input} in / {output} out
      </p>
    </div>
  );
}

function ProviderModel({ item }) {
  return (
    <div className="min-w-0 font-mono">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">
        {item.provider || "—"}
      </p>
      <p className="break-all text-xs" title={item.model || undefined}>
        {item.model || "—"}
      </p>
      {Number.isFinite(item.configVersion) && (
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          config v{item.configVersion}
        </p>
      )}
    </div>
  );
}

function LogMobileCard({ item }) {
  return (
    <article
      className="min-w-0 py-4"
      aria-label={`Log ${featureLabels[item.feature] || item.feature || "AI"} lúc ${formatTimestamp(item.createdAt)}`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            {formatTimestamp(item.createdAt)}
          </p>
          <p className="mt-1 text-sm font-semibold">
            {featureLabels[item.feature] || item.feature || "Không xác định"}
          </p>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-4 grid min-w-0 grid-cols-2 gap-4 border-t border-black/10 pt-4 dark:border-white/10">
        <div className="min-w-0">
          <p className="mb-1 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
            Provider / Model
          </p>
          <ProviderModel item={item} />
        </div>
        <div>
          <p className="mb-1 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
            Token / Latency
          </p>
          <TokenValue item={item} />
          <p className="mt-1 font-mono text-xs tabular-nums">
            {Number.isFinite(item.latencyMs)
              ? `${formatNumber(item.latencyMs)} ms`
              : "—"}
          </p>
        </div>
        <SafetyValue blocked={item.safetyBlocked === true} />
        <FeedbackValue feedback={item.feedback} />
      </div>
    </article>
  );
}

function LogsLoading() {
  return (
    <div
      role="status"
      aria-label="Đang tải metadata logs"
      aria-live="polite"
      className="space-y-2 p-4"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-14 rounded-none" />
      ))}
    </div>
  );
}

export default function AiLogsPanel() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const params = useMemo(() => metadataParams(filters, page), [filters, page]);
  const logsQuery = useAdminAiLogs(params);
  const payload = unwrapResponse(logsQuery.data);
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const pagination = payload?.pagination ?? {
    page,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  };
  const busy = logsQuery.isLoading || logsQuery.isFetching;
  const hasFilters = Object.values(filters).some(Boolean);
  const updateFilter = (name) => (event) => {
    setFilters((current) => ({ ...current, [name]: event.target.value }));
    setPage(1);
  };
  const canGoBack = !busy && pagination.page > 1;
  const canGoForward =
    !busy &&
    pagination.totalPages > 0 &&
    pagination.page < pagination.totalPages;

  return (
    <Card
      role="region"
      aria-label="Metadata yêu cầu"
      aria-busy={busy}
      className="min-w-0 overflow-hidden rounded-none border-black/20 shadow-none dark:border-white/20"
    >
      <CardHeader className="border-b border-black/10 pb-4 dark:border-white/10">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-bold uppercase tracking-wide">
              <ScrollText aria-hidden="true" className="size-4" />
              Metadata yêu cầu
            </CardTitle>
            <CardDescription className="mt-1 max-w-3xl">
              Chỉ hiển thị metadata vận hành. Prompt, phản hồi, vị trí chính
              xác và thông tin định danh không được tải vào bảng này.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="w-fit rounded-none font-mono text-[10px] uppercase"
          >
            Production + Test
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="min-w-0 p-0">
        <div className="grid min-w-0 gap-3 border-b border-black/10 p-4 sm:grid-cols-2 xl:grid-cols-6 dark:border-white/10">
          <FilterField label="Từ ngày">
            <Input
              aria-label="Từ ngày"
              type="date"
              value={filters.fromDate}
              max={filters.toDate || undefined}
              onChange={updateFilter("fromDate")}
              disabled={busy}
              className="rounded-none font-mono text-xs"
            />
          </FilterField>
          <FilterField label="Đến ngày">
            <Input
              aria-label="Đến ngày"
              type="date"
              value={filters.toDate}
              min={filters.fromDate || undefined}
              onChange={updateFilter("toDate")}
              disabled={busy}
              className="rounded-none font-mono text-xs"
            />
          </FilterField>
          <FilterSelect
            label="Tính năng"
            value={filters.feature}
            onChange={updateFilter("feature")}
            disabled={busy}
          >
            <option value="">Tất cả</option>
            <option value="chat">Chat</option>
            <option value="planner">Planner</option>
            <option value="voice">Voice</option>
          </FilterSelect>
          <FilterSelect
            label="Trạng thái"
            value={filters.status}
            onChange={updateFilter("status")}
            disabled={busy}
          >
            <option value="">Tất cả</option>
            <option value="started">Đang xử lý</option>
            <option value="success">Thành công</option>
            <option value="error">Lỗi</option>
            <option value="blocked">Bị chặn</option>
          </FilterSelect>
          <FilterSelect
            label="Safety"
            value={filters.safetyBlocked}
            onChange={updateFilter("safetyBlocked")}
            disabled={busy}
          >
            <option value="">Tất cả</option>
            <option value="true">Đã chặn</option>
            <option value="false">Không chặn</option>
          </FilterSelect>
          <FilterSelect
            label="Feedback"
            value={filters.feedback}
            onChange={updateFilter("feedback")}
            disabled={busy}
          >
            <option value="">Tất cả</option>
            <option value="up">Tích cực</option>
            <option value="down">Tiêu cực</option>
          </FilterSelect>
          <div className="sm:col-span-2 xl:col-span-6 xl:flex xl:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasFilters || busy}
              onClick={() => {
                setFilters(EMPTY_FILTERS);
                setPage(1);
              }}
              className="w-full rounded-none sm:w-auto"
            >
              <FilterX aria-hidden="true" className="size-4" />
              Xóa bộ lọc
            </Button>
          </div>
        </div>

        {busy ? (
          <LogsLoading />
        ) : logsQuery.isError ? (
          <div className="p-4">
            <AiEmptyState
              isError
              variant="inline"
              icon={MessageSquareWarning}
              eyebrow="Logs unavailable"
              title="Không tải được metadata logs"
              description="Lỗi được cô lập trong khu vực logs; dữ liệu overview vẫn giữ nguyên."
              actionLabel="Tải lại logs"
              onAction={logsQuery.refetch}
            />
          </div>
        ) : items.length === 0 ? (
          <div className="p-4">
            <AiEmptyState
              variant="inline"
              icon={ScrollText}
              title="Chưa có metadata log"
              description={
                hasFilters
                  ? "Không có log nào khớp bộ lọc hiện tại."
                  : "Log metadata sẽ xuất hiện khi runtime xử lý yêu cầu."
              }
            />
          </div>
        ) : (
          <>
            <div className="min-w-0 divide-y divide-black/10 px-4 xl:hidden dark:divide-white/10">
              {items.map((item) => (
                <LogMobileCard key={item.requestId} item={item} />
              ))}
            </div>
            <div className="hidden min-w-0 max-w-full overflow-hidden xl:block">
              <Table className="w-full table-fixed">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {LOG_COLUMNS.map((column) => (
                      <TableHead
                        key={column}
                        className="h-11 px-3 font-mono text-[10px] font-semibold uppercase tracking-wide"
                      >
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.requestId}>
                      <TableCell className="px-3 py-3 font-mono text-[11px] tabular-nums">
                        {formatTimestamp(item.createdAt)}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-xs font-semibold">
                        {featureLabels[item.feature] ||
                          item.feature ||
                          "Không xác định"}
                      </TableCell>
                      <TableCell className="min-w-0 px-3 py-3">
                        <ProviderModel item={item} />
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <TokenValue item={item} />
                      </TableCell>
                      <TableCell className="px-3 py-3 font-mono text-xs tabular-nums">
                        {Number.isFinite(item.latencyMs)
                          ? `${formatNumber(item.latencyMs)} ms`
                          : "—"}
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <SafetyValue blocked={item.safetyBlocked === true} />
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <FeedbackValue feedback={item.feedback} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 border-t border-black/10 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
          <p
            className="font-mono text-[11px] text-muted-foreground"
            aria-live="polite"
          >
            Trang {pagination.page || page} / {pagination.totalPages || 0} ·{" "}
            {formatNumber(pagination.total)} log
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Trang trước"
              disabled={!canGoBack}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="flex-1 rounded-none sm:flex-none"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
              Trước
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Trang sau"
              disabled={!canGoForward}
              onClick={() => setPage((current) => current + 1)}
              className="flex-1 rounded-none sm:flex-none"
            >
              Sau
              <ChevronRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
