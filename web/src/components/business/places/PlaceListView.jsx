import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, MapPinOff, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STATUS_CONFIGS, getImageSrc } from "./placesConstants";

export const BentoPlaceRow = memo(({ place, onView, onEdit, onFly }) => {
  const { t } = useTranslation();
  const config = STATUS_CONFIGS[place.status] || STATUS_CONFIGS.draft;
  const imgSrc = getImageSrc(place);
  const rating = Number(place.ratingAvg ?? 0);

  return (
    <article
      onClick={() => onView(place)}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[28px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 hover:shadow-md hover:border-slate-300 dark:hover:border-border transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-20 h-20 rounded-[20px] overflow-hidden bg-slate-100 dark:bg-muted shrink-0">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPinOff className="h-6 w-6 text-slate-300" />
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {place.category?.name || "Địa điểm"}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border",
                config.badgeClass
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", config.dotClass)} />
              {config.label}
            </span>
          </div>

          <h4 className="font-extrabold text-base text-slate-900 dark:text-white truncate">
            {place.name || t("business.places.noName")}
          </h4>

          <p className="text-xs text-slate-500 dark:text-muted-foreground truncate">
            {place.address || "Chưa cập nhật địa chỉ"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-border/60">
        <div className="text-left sm:text-right text-xs font-semibold text-slate-500">
          <p>{place.viewCount ? `${place.viewCount.toLocaleString()} lượt xem` : "0 xem"}</p>
          {rating > 0 && <p className="text-amber-500 font-bold">{rating.toFixed(1)} ★</p>}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onFly(place);
            }}
            className="rounded-2xl h-9 px-3 text-xs font-bold border-slate-200 dark:border-border/80"
          >
            <MapPin className="w-3.5 h-3.5 mr-1" /> Bản đồ
          </Button>

          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(place);
            }}
            className="rounded-2xl h-9 px-3.5 text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1" /> Sửa
          </Button>
        </div>
      </div>
    </article>
  );
});

BentoPlaceRow.displayName = "BentoPlaceRow";

export const PlaceListView = memo(({ places, onView, onEdit, onFly }) => {
  return (
    <div className="space-y-3">
      {places.map((place) => (
        <BentoPlaceRow
          key={place.id}
          place={place}
          onView={onView}
          onEdit={onEdit}
          onFly={onFly}
        />
      ))}
    </div>
  );
});

PlaceListView.displayName = "PlaceListView";
export default PlaceListView;
