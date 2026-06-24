import { useDashboardHealth } from "@/hooks/queries/useDashboardQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import Clock from "lucide-react/dist/esm/icons/clock";

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
};

export default function RecentErrorsCard() {
  const { data, isLoading } = useDashboardHealth();

  const payload = data?.success === true ? data.data : data;
  const errors = payload?.errors?.recent ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Lỗi gần đây
        </CardTitle>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          {errors.length}
        </Badge>
      </CardHeader>
      <CardContent>
        {errors.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Không có lỗi nào gần đây
          </p>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {errors.map((err) => (
                <div
                  key={err.id}
                  className="flex items-start gap-3 rounded-md border p-3"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{err.action}</p>
                    {err.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {err.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(err.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
