import { Activity, MessageSquareWarning } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import AiEmptyState from "./AiEmptyState";

const numberFormatter = new Intl.NumberFormat("vi-VN");

function formatNumber(value) {
  return Number.isFinite(value) ? numberFormatter.format(value) : "—";
}

function formatLatency(value) {
  return Number.isFinite(value) ? `${formatNumber(value)} ms` : "—";
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${formatNumber(value)}%` : "—";
}

function formatBucket(value) {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

const chartConfig = {
  requests: {
    label: "Yêu cầu",
    color: "hsl(var(--primary))",
  },
  errors: {
    label: "Lỗi",
    color: "hsl(var(--destructive))",
  },
};

function OverviewLoading() {
  return (
    <div
      role="status"
      aria-label="Đang tải tổng quan AI"
      aria-live="polite"
      aria-busy="true"
      className="space-y-5"
    >
      <Card className="rounded-none border-black/20 shadow-none dark:border-white/20">
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-[1.4fr_1fr]">
            <Skeleton className="h-40 rounded-none" />
            <Skeleton className="h-40 rounded-none" />
          </div>
          <div className="grid border-t border-black/10 lg:grid-cols-[1fr_18rem] dark:border-white/10">
            <div className="space-y-px p-4">
              <Skeleton className="h-11 rounded-none" />
              <Skeleton className="h-11 rounded-none" />
              <Skeleton className="h-11 rounded-none" />
            </div>
            <Skeleton className="min-h-32 rounded-none" />
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-72 rounded-none" />
    </div>
  );
}

function RuledMetric({ label, value, detail }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[minmax(10rem,1fr)_auto] sm:items-center sm:gap-5">
      <div>
        <dt className="text-sm font-semibold">{label}</dt>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      <dd className="font-mono text-base font-bold tabular-nums">{value}</dd>
    </div>
  );
}

function ExceptionMetric({ label, value, detail }) {
  return (
    <div className="min-w-0 border-t border-black/10 py-4 first:border-t-0 dark:border-white/10">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-black tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

export default function AiOverviewPanel({
  data,
  isLoading,
  isError,
  onRetry,
}) {
  if (isLoading) return <OverviewLoading />;
  if (isError) {
    return (
      <AiEmptyState
        isError
        icon={MessageSquareWarning}
        eyebrow="Overview unavailable"
        title="Không tải được dữ liệu vận hành"
        description="Dữ liệu tổng quan bị cô lập ở panel này. Bạn có thể thử tải lại mà không ảnh hưởng các khu vực khác."
        actionLabel="Thử lại"
        onAction={onRetry}
      />
    );
  }
  if (!data?.runtime || !data?.totals || !data?.latency) {
    return (
      <AiEmptyState
        icon={Activity}
        title="Chưa có dữ liệu tổng quan"
        description="Cockpit sẽ hiển thị số liệu sau khi runtime trả về snapshot vận hành đầu tiên."
      />
    );
  }

  const { totals, latency } = data;
  const timeline = Array.isArray(data.timeline) ? data.timeline : [];
  const totalTokens =
    Number.isFinite(totals.inputTokens) &&
    Number.isFinite(totals.outputTokens)
      ? totals.inputTokens + totals.outputTokens
      : null;

  return (
    <div className="min-w-0 space-y-5">
      <Card className="min-w-0 rounded-none border-black/20 shadow-none dark:border-white/20">
        <CardContent className="p-0">
          <div
            role="group"
            aria-label="Tín hiệu vận hành chính"
            className="grid lg:grid-cols-[1.4fr_1fr]"
          >
            <div className="border-b border-black/10 bg-primary/10 p-6 lg:border-b-0 lg:border-r dark:border-white/10">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Yêu cầu
              </p>
              <p className="mt-3 font-mono text-5xl font-black tracking-tight tabular-nums sm:text-6xl">
                {formatNumber(totals.requests)}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Production requests trong cửa sổ quan sát
              </p>
            </div>
            <div className="flex flex-col justify-center p-6">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Tỷ lệ thành công
              </p>
              <p className="mt-3 font-mono text-4xl font-black tracking-tight tabular-nums">
                {formatPercent(totals.successRate)}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Kết quả status=success
              </p>
            </div>
          </div>

          <div className="grid border-t border-black/10 lg:grid-cols-[minmax(0,1fr)_18rem] dark:border-white/10">
            <dl
              role="group"
              aria-label="Mức sử dụng và hiệu năng"
              className="divide-y divide-black/10 px-5 dark:divide-white/10"
            >
              <RuledMetric
                label="Tổng token"
                value={formatNumber(totalTokens)}
                detail={`${formatNumber(totals.inputTokens)} vào · ${formatNumber(totals.outputTokens)} ra`}
              />
              <RuledMetric
                label="Latency trung bình"
                value={formatLatency(latency.averageMs)}
                detail="Thời gian phản hồi trung bình"
              />
              <RuledMetric
                label="Latency P95"
                value={formatLatency(latency.p95Ms)}
                detail="Phân vị thứ 95"
              />
            </dl>

            <div
              role="group"
              aria-label="Ngoại lệ cần theo dõi"
              className="border-t border-black/10 px-5 lg:border-l lg:border-t-0 dark:border-white/10"
            >
              <ExceptionMetric
                label="Safety blocks"
                value={formatNumber(totals.safetyBlocks)}
                detail="Input hoặc output bị chặn"
              />
              <ExceptionMetric
                label="Feedback tiêu cực"
                value={formatNumber(totals.negativeFeedback)}
                detail="Đánh dấu không hữu ích"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {timeline.length > 0 && (
        <Card className="min-w-0 rounded-none border-black/20 shadow-none dark:border-white/20">
          <CardHeader className="border-b border-black/10 pb-4 dark:border-white/10">
            <CardTitle className="flex items-center gap-2 text-base font-bold uppercase tracking-wide">
              <Activity aria-hidden="true" className="size-4" />
              Lưu lượng theo ngày
            </CardTitle>
            <CardDescription>
              Production requests và lỗi thực tế theo bucket do server trả về.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 pt-5 sm:px-5">
            <div
              role="img"
              aria-label="Biểu đồ yêu cầu và lỗi AI theo ngày"
              className="min-w-0"
            >
              <ChartContainer
                config={chartConfig}
                className="h-64 w-full min-w-0"
              >
                <BarChart data={timeline} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="bucket"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={formatBucket}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="requests"
                    fill="var(--color-requests)"
                    radius={0}
                  />
                  <Bar dataKey="errors" fill="var(--color-errors)" radius={0} />
                </BarChart>
              </ChartContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 font-mono text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-2 bg-primary outline outline-1 outline-black/30"
                />
                Yêu cầu
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-2 bg-destructive"
                />
                Lỗi
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
