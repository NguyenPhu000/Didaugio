import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/components/business/dashboardWidgetHelpers";
import { SERVICE_TYPE_LABELS } from "./servicesConstants";

export const ServiceBentoCard = memo(({ svc, onEdit, onDelete }) => {
  return (
    <div className="p-4 sm:p-5 rounded-[24px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        {/* Thumbnail / Monogram */}
        <div className="h-16 w-16 rounded-2xl border border-slate-200/60 dark:border-border/60 overflow-hidden bg-slate-100 dark:bg-muted shrink-0 flex items-center justify-center">
          {svc.thumbnail ? (
            <img src={svc.thumbnail} alt={svc.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-black text-slate-400">
              {svc.name?.charAt(0)?.toUpperCase() || "S"}
            </span>
          )}
        </div>

        <div className="min-w-0 space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-tight truncate">
              {svc.name}
            </h4>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-muted text-slate-600 dark:text-slate-300">
              {SERVICE_TYPE_LABELS[svc.serviceType] || svc.serviceType}
            </span>
            {!svc.isActive ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40">
                Tạm dừng
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Mở bán
              </span>
            )}
          </div>

          {/* Meta specs */}
          <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-muted-foreground flex-wrap font-medium">
            <span className="font-black text-slate-950 dark:text-white text-sm">
              {svc.discountPrice ? (
                <>
                  <span className="text-emerald-600 mr-1.5">{formatVND(svc.discountPrice)}</span>
                  <span className="line-through text-xs text-slate-400">{formatVND(svc.price)}</span>
                </>
              ) : (
                formatVND(svc.price)
              )}
            </span>
            {svc.duration && (
              <>
                <span className="text-slate-300">•</span>
                <span>{svc.duration} phút</span>
              </>
            )}
            {svc.maxCapacity && (
              <>
                <span className="text-slate-300">•</span>
                <span>Tối đa {svc.maxCapacity} khách</span>
              </>
            )}
            {svc.place && (
              <>
                <span className="text-slate-300">•</span>
                <span className="truncate max-w-[140px] text-slate-700 dark:text-slate-300">
                  {svc.place.name}
                </span>
              </>
            )}
          </div>

          {svc.description && (
            <p className="text-xs text-slate-500 dark:text-muted-foreground line-clamp-1">
              {svc.description}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(svc)}
          className="rounded-2xl h-9 px-3.5 text-xs font-bold border-slate-200 dark:border-border/80"
        >
          <Edit2 className="w-3.5 h-3.5 mr-1" /> Chỉnh sửa
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(svc)}
          className="rounded-2xl h-9 px-3 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
});

ServiceBentoCard.displayName = "ServiceBentoCard";
export default ServiceBentoCard;
