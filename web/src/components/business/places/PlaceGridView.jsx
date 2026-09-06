import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, MapPinOff, Star, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_CONFIGS, getImageSrc } from "./placesConstants";

export const BentoPlaceCardGrid = memo(({ place, onView, onEdit, onFly }) => {
  const { t } = useTranslation();
  const config = STATUS_CONFIGS[place.status] || STATUS_CONFIGS.draft;
  const imgSrc = getImageSrc(place);
  const rating = Number(place.ratingAvg ?? 0);
  const servicesCount = place.services?.length || place.servicesCount || 0;

  return (
    <article
      onClick={() => onView(place)}
      className="group relative rounded-[32px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 p-4 sm:p-5 flex flex-col justify-between hover:shadow-lg hover:border-slate-300 dark:hover:border-border transition-all duration-300 cursor-pointer select-none"
    >
      <div className="space-y-3.5">
        {/* Cover Image Container */}
        <div className="relative h-44 w-full rounded-[24px] overflow-hidden bg-slate-100 dark:bg-muted">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={place.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentElement.classList.add("bg-slate-200");
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
              <MapPinOff className="h-10 w-10 text-slate-300 dark:text-slate-600" />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border shadow-xs backdrop-blur-md bg-white/90 dark:bg-card/90",
                config.badgeClass
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", config.dotClass)} />
              {config.label}
            </span>
          </div>

          {/* Featured Badge */}
          {place.isFeatured && (
            <div className="absolute top-3 left-3 bg-amber-400 text-amber-950 px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm">
              <Star className="h-3 w-3 fill-current" />
              Nổi bật
            </div>
          )}

          {/* Location Chip */}
          {place.district?.name && (
            <div className="absolute bottom-3 left-3 bg-slate-950/80 text-white px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {place.district.name}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {place.category?.name || "Địa điểm du lịch"}
            </span>
            {rating > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-black text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {rating.toFixed(1)}
              </span>
            )}
          </div>

          <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
            {place.name || t("business.places.noName")}
          </h3>

          <p className="text-xs text-slate-500 dark:text-muted-foreground line-clamp-1">
            {place.address || "Chưa cập nhật địa chỉ"}
          </p>
        </div>
      </div>

      {/* Meta Stats & Quick Action Bar */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-border/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500 dark:text-muted-foreground">
          <span>{place.viewCount ? `${place.viewCount.toLocaleString()} lượt xem` : "0 lượt xem"}</span>
          <span>•</span>
          <span>{servicesCount} dịch vụ</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFly(place);
            }}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-muted text-slate-600 dark:text-slate-300 hover:bg-slate-950 hover:text-white dark:hover:bg-white dark:hover:text-slate-950 flex items-center justify-center transition-all shadow-xs"
            title="Xem trên bản đồ"
          >
            <MapPin className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(place);
            }}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-muted text-slate-600 dark:text-slate-300 hover:bg-slate-950 hover:text-white dark:hover:bg-white dark:hover:text-slate-950 flex items-center justify-center transition-all shadow-xs"
            title="Chỉnh sửa cơ sở"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
});

BentoPlaceCardGrid.displayName = "BentoPlaceCardGrid";

export const PlaceGridView = memo(({ places, onView, onEdit, onFly }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {places.map((place) => (
        <BentoPlaceCardGrid
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

PlaceGridView.displayName = "PlaceGridView";
export default PlaceGridView;
