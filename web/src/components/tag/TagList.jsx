import { Edit, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * TAG LIST - T.I.M Style Refactor (Vietnamese)
 */

const TAG_TYPE_COLORS = {
  general: "bg-gray-200 text-gray-800",
  food: "bg-orange-100 text-orange-800",
  travel: "bg-blue-100 text-blue-800",
  service: "bg-purple-100 text-purple-800",
  activity: "bg-green-100 text-green-800",
  ambience: "bg-pink-100 text-pink-800",
  price: "bg-yellow-100 text-yellow-800",
  time: "bg-indigo-100 text-indigo-800",
  ai_signal: "bg-zinc-800 text-zinc-100",
};

// TAG_TYPES_LABEL removed to use i18n

export default function TagList({ tags, onEdit, onDelete, loading }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
        <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="font-mono text-xs uppercase tracking-widest">
          {t("common.loading", { defaultValue: "ĐANG TẢI DỮ LIỆU HỆ THỐNG..." })}
        </div>
      </div>
    );
  }

  if (!tags || tags.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-border rounded-[20px] bg-white/50">
        <p className="font-mono text-lg text-muted-foreground uppercase">
          {t("common.noData", { defaultValue: "KHÔNG TÌM THẤY DỮ LIỆU" })}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {t("tags.emptyDesc", { defaultValue: "Khởi tạo thẻ mới để bắt đầu." })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-mono text-sm">
      {/* Table Header - Industrial Style */}
      <div className="grid grid-cols-12 gap-4 px-6 py-2 border-b border-black text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        <div className="col-span-4 pl-8">{t("tags.table.identity", { defaultValue: "ĐỊNH DANH" })}</div>
        <div className="col-span-2">{t("tags.table.type", { defaultValue: "DANH MỤC" })}</div>
        <div className="col-span-2">{t("tags.table.usage", { defaultValue: "SỐ LƯỢNG" })}</div>
        <div className="col-span-2">{t("tags.table.status", { defaultValue: "TRẠNG THÁI" })}</div>
        <div className="col-span-2 text-right">{t("tags.table.actions", { defaultValue: "THAO TÁC" })}</div>
      </div>

      {/* Table Body - Modular Style */}
      <div className="space-y-2">
        {tags.map((tag, index) => (
          <div
            key={tag.id}
            className="group relative grid grid-cols-12 gap-4 items-center bg-white border border-border px-6 py-4 rounded-[4px] hover:border-black/30 transition-all duration-200"
          >
            {/* Hover Effect - Left Accent */}
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center"></div>

            {/* Barcode/Index */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/30 -rotate-90 hidden sm:block w-4">
              {String(index + 1).padStart(3, "0")}
            </div>

            {/* Name */}
            <div className="col-span-4 pl-8 flex items-center gap-4">
              <div
                className="w-2 h-8 flex-shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              <div className="min-w-0 flex flex-col">
                <div className="font-black text-base uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {tag.name}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono truncate uppercase tracking-wider">
                  ID: {tag.slug}
                </div>
              </div>
            </div>

            {/* Type */}
            <div className="col-span-2">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-[2px] text-[10px] font-bold uppercase tracking-wider border ${TAG_TYPE_COLORS[tag.tagType] || "border-gray-200 bg-gray-50 text-gray-600"}`}
              >
                {t(`tags.types.${tag.tagType}`, { defaultValue: tag.tagType })}
              </span>
            </div>

            {/* Usage Count */}
            <div className="col-span-2 font-technical text-xl font-bold text-gray-600 pl-4">
              {tag.usageCount || 0}
            </div>

            {/* Status Badge */}
            <div className="col-span-2">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-none ${tag.isActive ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}></div>
                <span className="text-[10px] font-mono uppercase text-gray-500">
                  {tag.isActive 
                    ? t("tags.status.active", { defaultValue: "HOẠT ĐỘNG" }) 
                    : t("tags.status.inactive", { defaultValue: "KHÔNG HOẠT ĐỘNG" })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="col-span-2 flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none hover:bg-black hover:text-white transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 rounded-none border border-black p-0"
                >
                  <DropdownMenuItem
                    onClick={() => onEdit(tag)}
                    className="cursor-pointer font-mono text-xs uppercase hover:bg-primary rounded-none p-3"
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    {t("common.edit", { defaultValue: "CHỈNH SỬA" })}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(tag)}
                    className="cursor-pointer font-mono text-xs uppercase text-red-600 hover:bg-red-50 rounded-none p-3"
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    {t("common.delete", { defaultValue: "XÓA" })}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
