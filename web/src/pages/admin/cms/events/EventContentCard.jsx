import { useTranslation } from "react-i18next";
import {
  Calendar,
  CheckCircle,
  Edit,
  Eye,
  EyeOff,
  Link,
  MapPin,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

function EventStatusBadge({ status }) {
  const { t } = useTranslation();
  const config = {
    active: {
      label: t("admin.cms.ongoing"),
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    inactive: {
      label: t("admin.cms.hiddenTemp"),
      className: "border-slate-200 bg-slate-50 text-slate-500",
    },
    completed: {
      label: t("admin.cms.ended"),
      className: "border-blue-200 bg-blue-50 text-blue-600",
    },
  };
  const current = config[status] || config.inactive;

  return (
    <Badge variant="outline" className={cn("gap-1 text-xs", current.className)}>
      <CheckCircle className="h-3 w-3" />
      {current.label}
    </Badge>
  );
}

export function EventContentCard({ item, onEdit, onToggle, onDelete }) {
  const { t } = useTranslation();
  const isActive = item.status === "active";
  const startDate = item.startDate ? new Date(item.startDate) : null;
  const endDate = item.endDate ? new Date(item.endDate) : null;

  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:shadow-lg">
      <div className="flex">
        <div className="relative h-full w-32 shrink-0 overflow-hidden bg-gradient-to-br from-rose-100 to-pink-200">
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="h-full w-full object-cover"
              style={{ minHeight: "120px" }}
            />
          ) : (
            <div className="flex w-full items-center justify-center" style={{ minHeight: "120px" }}>
              <Calendar className="h-10 w-10 text-rose-300" />
            </div>
          )}
          {item.isFeaturedBanner ? (
            <div className="absolute left-2 top-2">
              <span className="rounded bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-yellow-900">
                BANNER
              </span>
            </div>
          ) : null}
        </div>

        <CardContent className="min-w-0 flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="truncate text-base font-semibold">{item.title}</h3>
                <EventStatusBadge status={item.status} />
              </div>
              {item.description ? (
                <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {item.location ? <span className="flex items-center gap-1 text-rose-600"><MapPin className="h-3 w-3" />{item.location}</span> : null}
                {startDate ? <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{startDate.toLocaleDateString("vi-VN")}{endDate ? ` - ${endDate.toLocaleDateString("vi-VN")}` : ""}</span> : null}
                {item._count?.participants !== undefined ? <span className="flex items-center gap-1 text-blue-600"><Users className="h-3 w-3" />{t("admin.cms.participating", { count: item._count.participants, max: item.maxParticipants || "" })}</span> : null}
                {item.totalCheckIns > 0 ? <span className="flex items-center gap-1 text-emerald-600"><Zap className="h-3 w-3" />{item.totalCheckIns} check-in</span> : null}
                {item.tripId ? <span className="flex items-center gap-1 text-purple-600"><Link className="h-3 w-3" />{t("admin.cms.sampleTripItinerary")}</span> : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)} title={t("common.edit")}><Edit className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggle(item)} title={isActive ? t("admin.cms.temporaryHide") : t("admin.cms.activate")}>{isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(item)} title={t("common.delete")}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
