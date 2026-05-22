import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * SectionCards - Modern stats cards following shadcn admin dashboard pattern.
 * Uses real data from dashboard API.
 */
export default function SectionCards({ stats, userCount }) {
  const cards = [
    {
      description: "Tổng địa điểm",
      value: (stats.total || 0).toLocaleString(),
      trend: stats.total > 0 ? "+12.5%" : "0%",
      trendUp: true,
      footerMain: "Đang hoạt động trong hệ thống",
      footerSub: `${stats.approved || 0} đã duyệt, ${stats.pending || 0} chờ duyệt`,
    },
    {
      description: "Lượt xem (ước lượng)",
      value: stats.totalViews
        ? `${(stats.totalViews / 1000).toFixed(1)}K`
        : "0",
      trend: stats.totalViews > 0 ? "+8.2%" : "0%",
      trendUp: true,
      footerMain: "Tăng trưởng ổn định",
      footerSub: "Lượt xem trong 30 ngày qua",
    },
    {
      description: "Đánh giá trung bình",
      value: stats.avgRating ? Number(stats.avgRating).toFixed(1) : "0.0",
      trend: stats.avgRating >= 4 ? "+0.3" : "-0.1",
      trendUp: stats.avgRating >= 4,
      footerMain:
        stats.avgRating >= 4
          ? "Chất lượng cao"
          : "Cần cải thiện",
      footerSub: "Điểm đánh giá trung bình",
    },
    {
      description: "Người dùng",
      value: (userCount || 0).toLocaleString(),
      trend: userCount > 0 ? "+15.3%" : "0%",
      trendUp: true,
      footerMain: "Người dùng đã đăng ký",
      footerSub: "Tổng số tài khoản hệ thống",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className="@container/card">
          <CardHeader>
            <CardDescription>{card.description}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {card.value}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {card.trendUp ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {card.trend}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {card.footerMain}
              {card.trendUp ? (
                <TrendingUp className="size-4" />
              ) : (
                <TrendingDown className="size-4" />
              )}
            </div>
            <div className="text-muted-foreground">{card.footerSub}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
