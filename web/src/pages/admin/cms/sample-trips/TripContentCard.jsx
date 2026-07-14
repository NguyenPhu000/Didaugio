import { useTranslation } from "react-i18next";
import { Calendar, Compass, Edit, Link, MapPin, RefreshCw, Route, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { getPlaceImage } from "./sampleTripUtils";

export function TripContentCard({ item, onEdit, onManageDestinations, onDelete }) {
  const { t } = useTranslation();
  const startDate = item.startDate ? new Date(item.startDate) : null;
  const endDate = item.endDate ? new Date(item.endDate) : null;
  const destinations = item.destinations || [];
  const firstStops = destinations
    .map((destination) => destination?.place?.name)
    .filter(Boolean)
    .slice(0, 3);
  const previewImage =
    item.thumbnail ||
    destinations.map((destination) => getPlaceImage(destination?.place)).find(Boolean);

  return (
    <Card className="group overflow-hidden border-violet-100 transition-all duration-200 hover:border-violet-200 hover:shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-violet-50">
            {previewImage ? (
              <img src={previewImage} alt={item.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Compass className="h-8 w-8 text-violet-400" />
              </div>
            )}
            <div className="absolute bottom-1 left-1 rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 shadow-sm">
              {item.totalDays || 1}D
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold transition-colors group-hover:text-violet-700">
                  {item.title}
                </h3>
                {item.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)} title={t("common.edit")}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-violet-700 hover:text-violet-800"
                  onClick={() => onManageDestinations(item)}
                  title={t("admin.cms.itineraryDetails")}
                >
                  <Route className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete(item)}
                  title={t("common.delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {startDate ? (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {startDate.toLocaleDateString("vi-VN")}
                  {endDate ? ` - ${endDate.toLocaleDateString("vi-VN")}` : ""}
                </span>
              ) : null}
              <span className="flex items-center gap-1 text-violet-700">
                <MapPin className="h-3.5 w-3.5" />
                {destinations.length} diem
              </span>
              {item.travelStyle ? (
                <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
                  {item.travelStyle}
                </Badge>
              ) : null}
              {item.groupSize ? (
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {item.groupSize}
                </span>
              ) : null}
              <span className="flex items-center gap-1 text-emerald-600">
                <RefreshCw className="h-3.5 w-3.5" />
                {item.cloneCount || 0}
              </span>
              {item.isPublic ? (
                <span className="flex items-center gap-1 text-blue-600">
                  <Link className="h-3.5 w-3.5" />
                  Public
                </span>
              ) : null}
            </div>

            {firstStops.length ? (
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                <Route className="h-3.5 w-3.5 text-violet-500" />
                <span className="truncate">{firstStops.join(" -> ")}</span>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
