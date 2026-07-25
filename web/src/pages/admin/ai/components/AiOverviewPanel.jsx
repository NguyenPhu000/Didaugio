import {
  Activity,
  Ban,
  Gauge,
  MessageSquareWarning,
  Percent,
  Timer,
  TimerReset,
  WholeWord,
} from "lucide-react";
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
import AiMetricCard from "./AiMetricCard";

const numberFormatter = new Intl.NumberFormat("vi-VN");

function formatNumber(value) {
  return numberFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatLatency(value) {
  return `${formatNumber(value)} ms`;
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
    <div aria-label="Đang tải tổng quan AI" className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 7 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-none" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-none" />
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
    (Number.isFinite(totals.inputTokens) ? totals.inputTokens : 0) +
    (Number.isFinite(totals.outputTokens) ? totals.outputTokens : 0);

  const metrics = [
    {
      label: "Yêu cầu",
      value: formatNumber(totals.requests),
      detail: "Production requests",
      icon: WholeWord,
    },
    {
      label: "Tổng token",
      value: formatNumber(totalTokens),
      detail: `${formatNumber(totals.inputTokens)} vào · ${formatNumber(totals.outputTokens)} ra`,
      icon: Gauge,
    },
    {
      label: "Tỷ lệ thành công",
      value: `${formatNumber(totals.successRate)}%`,
      detail: "Kết quả status=success",
      icon: Percent,
    },
    {
      label: "Latency trung bình",
      value: formatLatency(latency.averageMs),
      detail: "Thời gian phản hồi trung bình",
      icon: Timer,
    },
    {
      label: "Latency P95",
      value: formatLatency(latency.p95Ms),
      detail: "Phân vị thứ 95",
      icon: TimerReset,
    },
    {
      label: "Safety blocks",
      value: formatNumber(totals.safetyBlocks),
      detail: "Input hoặc output bị chặn",
      icon: Ban,
    },
    {
      label: "Feedback tiêu cực",
      value: formatNumber(totals.negativeFeedback),
      detail: "Feedback đánh dấu không hữu ích",
      icon: MessageSquareWarning,
    },
  ];

  return (
    <div className="min-w-0 space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <AiMetricCard key={metric.label} {...metric} />
        ))}
      </div>

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
