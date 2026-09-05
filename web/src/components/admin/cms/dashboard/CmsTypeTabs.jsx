import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function CmsTypeTabs({ activeTab, contentTypes, getContentCount, onChange }) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {contentTypes.map((type) => {
        const Icon = type.icon;
        const isActive = activeTab === type.id;
        const count = getContentCount(type.id);

        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onChange(type.id)}
            className={cn(
              "flex items-center gap-3 rounded-2xl p-3.5 text-left transition-all duration-200 border",
              isActive
                ? "bg-[#FFFDE6] border-[#F3E600]/80 shadow-[0_4px_16px_rgba(243,230,0,0.15)] ring-1 ring-[#F3E600]/60 -translate-y-0.5"
                : "bg-white border-black/[0.04] hover:bg-[#FAF9F5] shadow-2xs"
            )}
          >
            <div
              className={cn(
                "shrink-0 rounded-xl p-2.5 transition-colors",
                isActive
                  ? "bg-slate-950 text-[#F3E600]"
                  : "bg-[#F8F7F3] text-slate-700"
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-xs font-bold truncate",
                  isActive ? "text-slate-950" : "text-slate-700"
                )}
              >
                {type.label}
              </p>
              <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                {t("admin.cms.items", { count })}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
