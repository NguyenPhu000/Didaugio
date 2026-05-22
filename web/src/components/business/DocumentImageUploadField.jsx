import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils";

const DOCUMENT_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const DOCUMENT_IMAGE_ACCEPT = "image/png,image/jpeg,image/jpg,image/webp";

const isImageFile = (file) => file?.type?.startsWith("image/");

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
  error,
}) => {
  const files = useMemo(() => (Array.isArray(value) ? value : []), [value]);
  const selectedFile = files[0] ?? null;
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
        accept={DOCUMENT_IMAGE_ACCEPT}
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

          if (!isImageFile(pickedFile)) {
            toast.error("Chỉ hỗ trợ ảnh PNG/JPG/JPEG/WEBP");
            return;
          }

          if (maxFileSize && pickedFile.size > maxFileSize) {
            toast.error("Ảnh vượt quá 10MB, vui lòng chọn ảnh nhỏ hơn");
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
        {activePreview ? (
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
