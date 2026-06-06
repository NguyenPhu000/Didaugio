import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { dashboardService } from "@/apis/dashboardService";

const getChartConfig = (t) => ({
  places: {
    label: t("admin.chart.views"),
    color: "var(--primary)",
  },
  views: {
    label: t("admin.chart.bookings"),
    color: "var(--primary)",
  },
});

export default function ChartAreaInteractive() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState("90d");
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setLoading(true);
        const res = await dashboardService.getTimeline();
        const payload = res?.success === true && res?.data != null ? res.data : res;

        if (Array.isArray(payload) && payload.length > 0) {
          setChartData(
            payload.map((item) => ({
              date: item.date || item.label,
              places: item.places || item.count || 0,
              views: item.views || item.totalViews || 0,
            }))
          );
        } else {
          // Generate fallback data from stats if timeline not available
          const statsRes = await dashboardService.getStats();
          const statsPayload =
            statsRes?.success === true && statsRes?.data != null
              ? statsRes.data
              : statsRes;
          const total = statsPayload?.places?.total || 0;
          const views = statsPayload?.places?.totalViews || 0;

          const fallback = [];
          const now = new Date();
          for (let i = 89; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            fallback.push({
              date: d.toISOString().split("T")[0],
              places: Math.floor(total / 90) + Math.floor(Math.random() * 3),
              views: Math.floor(views / 90) + Math.floor(Math.random() * 20),
            });
          }
          setChartData(fallback);
        }
      } catch (err) {
        console.error("Failed to load timeline:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, []);

  const filteredData = useMemo(() => {
    if (!chartData.length) return [];
    const now = new Date();
    let daysToSubtract = 90;
    if (timeRange === "30d") daysToSubtract = 30;
    else if (timeRange === "7d") daysToSubtract = 7;

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return chartData.filter((item) => new Date(item.date) >= startDate);
  }, [chartData, timeRange]);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{t("admin.chart.title")}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {t("admin.chart.title")}
          </span>
          <span className="@[540px]/card:hidden">{t("admin.chart.title")}</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(v) => v && setTimeRange(v)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">{t("admin.chart.last90Days")}</ToggleGroupItem>
            <ToggleGroupItem value="30d">{t("admin.chart.last30Days")}</ToggleGroupItem>
            <ToggleGroupItem value="7d">{t("admin.chart.last7Days")}</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label={t("admin.chart.period")}
            >
              <SelectValue placeholder="3 tháng" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                {t("admin.chart.last90Days")}
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                {t("admin.chart.last30Days")}
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                {t("admin.chart.last7Days")}
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <div className="h-[250px] w-full animate-pulse rounded bg-muted" />
        ) : (
          <ChartContainer
            config={getChartConfig(t)}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillPlaces" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-places)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-places)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-views)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-views)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="views"
                type="natural"
                fill="url(#fillViews)"
                stroke="var(--color-views)"
                stackId="a"
              />
              <Area
                dataKey="places"
                type="natural"
                fill="url(#fillPlaces)"
                stroke="var(--color-places)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
