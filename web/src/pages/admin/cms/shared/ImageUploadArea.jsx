import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Upload } from "lucide-react";
import { Label } from "@/components/ui/Label";

export function ImageUploadArea({ value, onChange, label, hint }) {
  const { t } = useTranslation();
  const inputId = useId();
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/20 transition-colors hover:border-primary/50">
        {value ? (
          <div className="group relative">
            <img src={value} alt="Preview" className="h-44 w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Label htmlFor={inputId} className="flex h-9 cursor-pointer items-center justify-center rounded-lg bg-white px-4 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50">{t("common.edit")}</Label>
              <button type="button" className="h-9 rounded-lg bg-destructive px-4 text-sm font-medium text-white transition-colors hover:bg-destructive/90" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onChange(""); }}>{t("common.delete")}</button>
            </div>
            <input id={inputId} type="file" accept="image/*" onChange={onChange} className="hidden" />
          </div>
        ) : (
          <label htmlFor={inputId} className="block cursor-pointer p-6 text-center">
            <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">{t("common.upload")}</p>
            {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
            <input id={inputId} type="file" accept="image/*" onChange={onChange} className="hidden" />
          </label>
        )}
      </div>
    </div>
  );
}
