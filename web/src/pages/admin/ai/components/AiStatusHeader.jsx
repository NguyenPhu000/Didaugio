import { useTranslation } from "react-i18next";
import {
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Power,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_VIEW = {
  active: {
    i18nKey: "adminAi.status.active",
    label: "AI đang hoạt động",
    Icon: CircleCheck,
    className: "border-black bg-primary text-black",
  },
  disabled: {
    i18nKey: "adminAi.status.disabled",
    label: "AI đang tạm dừng",
    Icon: Power,
    className:
      "border-destructive bg-destructive/10 text-destructive dark:border-destructive",
  },
  maintenance: {
    i18nKey: "adminAi.status.maintenance",
    label: "AI đang bảo trì",
    Icon: Wrench,
    className: "border-foreground bg-muted text-foreground",
  },
};

function TechnicalField({ label, value }) {
  return (
    <div className="min-w-0 border-l border-black/15 pl-3 dark:border-white/15">
      <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd
        className="mt-1 break-all font-mono text-xs font-medium sm:text-sm"
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

export default function AiStatusHeader({ data, isLoading, isError }) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card
        aria-label="Đang tải trạng thái AI"
        aria-busy="true"
        aria-live="polite"
        role="status"
        className="rounded-none border-black/20 shadow-none dark:border-white/20"
      >
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[auto_1fr] lg:items-center">
          <Skeleton className="h-9 w-48 rounded-none" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-10 rounded-none" />
            <Skeleton className="h-10 rounded-none" />
            <Skeleton className="h-10 rounded-none" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const view = isError
    ? {
        i18nKey: "adminAi.status.error",
        label: "Không đọc được trạng thái AI",
        Icon: CircleAlert,
        className:
          "border-destructive bg-destructive/10 text-destructive dark:border-destructive",
      }
    : STATUS_VIEW[data?.status] ?? {
        i18nKey: "adminAi.status.unknown",
        label: "Trạng thái AI chưa xác định",
        Icon: CircleHelp,
        className: "border-foreground bg-muted text-foreground",
      };
  const StatusIcon = view.Icon;

  return (
    <Card className="rounded-none border-black/20 shadow-none dark:border-white/20">
      <CardContent className="grid gap-4 p-4 lg:grid-cols-[auto_1fr] lg:items-center">
        <Badge
          role="status"
          variant="outline"
          className={`w-fit gap-2 rounded-none px-3 py-2 font-mono text-xs uppercase tracking-wide ${view.className}`}
        >
          <StatusIcon aria-hidden="true" className="size-4" />
          {t(view.i18nKey, view.label)}
        </Badge>
        <dl className="grid min-w-0 gap-3 sm:grid-cols-3">
          <TechnicalField
            label={t("adminAi.technical.provider", "Provider")}
            value={data?.provider ? String(data.provider).toUpperCase() : "—"}
          />
          <TechnicalField
            label={t("adminAi.technical.model", "Model")}
            value={data?.model || "—"}
          />
          <TechnicalField
            label={t("adminAi.technical.version", "Phiên bản")}
            value={
              Number.isFinite(data?.version)
                ? `v${data.version}`
                : t("adminAi.technical.notPublished", "Chưa phát hành")
            }
          />
        </dl>
      </CardContent>
    </Card>
  );
}
