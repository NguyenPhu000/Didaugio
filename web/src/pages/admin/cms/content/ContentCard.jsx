import { useTranslation } from "react-i18next";
import { Calendar, Edit, Eye, EyeOff, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { StatusBadge } from "../shared/StatusBadge";

export function ContentCard({ item, onEdit, onToggle, onDelete }) {
  const { t } = useTranslation();
  const Icon = item.icon || FileText;
  const image = item.image || item.thumbnail || item.imageUrl || item.imageData;
  const isActive = item.active ?? item.isActive ?? item.status === "active";
  return (
    <Card className="group transition-all hover:shadow-md"><CardContent className="p-4"><div className="flex items-start gap-4">
      {image ? <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted"><img src={image} alt={item.title} className="h-full w-full object-cover" /></div> : <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-lg text-white", item.color || "bg-muted")}><Icon className="h-8 w-8" /></div>}
      <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="truncate font-semibold">{item.title}</h3>{item.subtitle ? <p className="truncate text-sm text-muted-foreground">{item.subtitle}</p> : null}</div><StatusBadge active={isActive} /></div>
      {item.description ? <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">{item.startDate ? <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{Number.isNaN(Date.parse(item.startDate)) ? item.startDate : new Date(item.startDate).toLocaleDateString("vi-VN")}</span> : null}{(item.views ?? item.viewCount) !== undefined ? <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{item.views ?? item.viewCount}</span> : null}{(item.order ?? item.priority) !== undefined ? <span>#{item.order ?? item.priority}</span> : null}</div></div>
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)} title={t("common.edit")}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggle(item)} title={isActive ? t("admin.cms.temporaryHide") : t("admin.cms.activate")}>{isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(item)} title={t("common.delete")}><Trash2 className="h-4 w-4" /></Button></div>
    </div></CardContent></Card>
  );
}
