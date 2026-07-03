import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils";

const DOCUMENT_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const IMAGE_ACCEPT = "image/png,image/jpeg,image/jpg,image/webp";
const IMAGE_AND_PDF_ACCEPT = "image/png,image/jpeg,image/jpg,image/webp,application/pdf";

const isImageFile = (file) => file?.type?.startsWith("image/");
const isPdfFile = (file) => file?.type === "application/pdf";
const isAllowedFile = (file, allowPdf) =>
  isImageFile(file) || (allowPdf && isPdfFile(file));

const formatImageSize = (bytes) => {
  if (!bytes && bytes !== 0) return "0 MB";
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const DocumentImageUploadField = ({
  label,
  hint,
  value = [],
  onChange,
  fallbackPreview,
  previewAlt,
  required = false,
  disabled = false,
  previewClassName,
  maxFileSize = DOCUMENT_IMAGE_MAX_BYTES,
  acceptPdf = false,
  error,
}) => {
  const { t } = useTranslation();
  const accept = acceptPdf ? IMAGE_AND_PDF_ACCEPT : IMAGE_ACCEPT;
  const files = useMemo(() => (Array.isArray(value) ? value : []), [value]);
  const selectedFile = files[0] ?? null;
  const isPdf = selectedFile && isPdfFile(selectedFile);
  const localPreviewUrl = useMemo(() => {
    if (!selectedFile || !isImageFile(selectedFile)) {
      return null;
    }
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const activePreview = localPreviewUrl || fallbackPreview || null;

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>

      <input
        type="file"
        accept={accept}
        disabled={disabled}
        className={cn(
          "block w-full rounded-md border border-input bg-background text-sm",
          "file:mr-3 file:border-0 file:border-r file:border-input file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
        onChange={(event) => {
          const pickedFile = event.target.files?.[0];
          event.target.value = "";

          if (!pickedFile) return;

          if (!isAllowedFile(pickedFile, acceptPdf)) {
            toast.error(acceptPdf ? t("common.invalidFileFormat") : t("common.invalidImageFormat"));
            return;
          }

          if (maxFileSize && pickedFile.size > maxFileSize) {
            toast.error(t("common.fileTooLarge"));
            return;
          }

          onChange?.([pickedFile]);
        }}
      />

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      <div
        className={cn(
          "overflow-hidden rounded-lg border border-border/60 bg-muted/30",
          previewClassName,
        )}
      >
        {isPdf ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center">
            <svg className="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <p className="text-xs text-muted-foreground font-medium">PDF</p>
          </div>
        ) : activePreview ? (
          <img
            src={activePreview}
            alt={previewAlt}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
            Chưa có ảnh để hiển thị
          </div>
        )}
      </div>

      {selectedFile ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2">
          <p className="min-w-0 truncate text-xs text-foreground">
            {selectedFile.name}
          </p>
          <button
            type="button"
            className="text-xs font-medium text-primary hover:underline"
            disabled={disabled}
            onClick={() => onChange?.([])}
          >
            Xóa
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Ảnh tối đa {formatImageSize(maxFileSize)}
        </p>
      )}

      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
};

export default DocumentImageUploadField;
