import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImage = (file) => file?.type?.startsWith("image/");

const defaultValidate = (file, { maxFileSize, acceptTypes }) => {
  if (maxFileSize && file.size > maxFileSize) {
    return `Tệp ${file.name} vượt quá ${formatBytes(maxFileSize)}`;
  }

  if (acceptTypes?.length && !acceptTypes.includes(file.type)) {
    return `Tệp ${file.name} không đúng định dạng cho phép`;
  }

  return null;
};

const FileUploader = ({
  label = "Tải tài liệu",
  hint,
  required = false,
  maxFiles = 1,
  maxFileSize = 10 * 1024 * 1024,
  acceptTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  value = [],
  onChange,
  disabled = false,
  className,
}) => {
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState([]);
  const [progressByName, setProgressByName] = useState({});
  const [previewMap, setPreviewMap] = useState({});
  const inputRef = useRef(null);

  const files = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  const accept = useMemo(() => acceptTypes.join(","), [acceptTypes]);

  useEffect(() => {
    const nextMap = {};
    files.forEach((file) => {
      if (isImage(file)) {
        nextMap[file.name] = URL.createObjectURL(file);
      }
    });
    setPreviewMap(nextMap);

    return () => {
      Object.values(nextMap).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const withProgressAnimation = (nextFiles) => {
    const progressMap = {};
    nextFiles.forEach((file) => {
      progressMap[file.name] = 20;
    });
    setProgressByName(progressMap);

    const steps = [45, 70, 100];
    steps.forEach((step, index) => {
      window.setTimeout(
        () => {
          setProgressByName((prev) => {
            const updated = { ...prev };
            nextFiles.forEach((file) => {
              if (updated[file.name] !== undefined) {
                updated[file.name] = step;
              }
            });
            return updated;
          });
        },
        (index + 1) * 120,
      );
    });
  };

  const applySelection = (picked) => {
    if (!picked.length || disabled) return;

    const maxSelectable = Math.max(0, maxFiles - files.length);
    const incoming = picked.slice(0, maxSelectable);

    const localErrors = [];
    const validFiles = incoming.filter((file) => {
      const error = defaultValidate(file, { maxFileSize, acceptTypes });
      if (error) {
        localErrors.push(error);
        return false;
      }
      return true;
    });

    if (picked.length > maxSelectable) {
      localErrors.push(`Chỉ được chọn tối đa ${maxFiles} tệp`);
    }

    setErrors(localErrors);

    if (!validFiles.length) return;

    const nextValue = [...files, ...validFiles];
    onChange?.(nextValue);
    withProgressAnimation(validFiles);
  };

  const removeAt = (index) => {
    if (disabled) return;
    const next = files.filter((_, i) => i !== index);
    onChange?.(next);
  };

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1 text-sm font-medium text-foreground">
        <span>{label}</span>
        {required && <span className="text-destructive">*</span>}
      </div>

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      <div
        className={cn(
          "rounded-2xl border border-dashed p-4 transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border/70 bg-background",
          disabled && "opacity-60 cursor-not-allowed",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          applySelection(Array.from(event.dataTransfer.files || []));
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={accept}
          className="hidden"
          disabled={disabled}
          onChange={(event) => {
            applySelection(Array.from(event.target.files || []));
            event.target.value = "";
          }}
        />

        <button
          type="button"
          onClick={openPicker}
          disabled={disabled}
          className="w-full text-left"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Upload className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Kéo thả tệp hoặc bấm để chọn
              </p>
              <p className="text-xs text-muted-foreground">
                Tối đa {maxFiles} tệp, mỗi tệp không quá{" "}
                {formatBytes(maxFileSize)}
              </p>
            </div>
          </div>
        </button>
      </div>

      {errors.length > 0 && (
        <div className="space-y-1 rounded-xl border border-destructive/30 bg-destructive/5 p-2.5">
          {errors.map((error) => (
            <p key={error} className="text-xs text-destructive">
              {error}
            </p>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => {
            const previewUrl = previewMap[file.name] || null;
            const progress = progressByName[file.name] ?? 100;

            return (
              <div
                key={`${file.name}-${index}`}
                className="rounded-xl border border-border/70 bg-card p-2.5"
              >
                <div className="flex items-start gap-2.5">
                  <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                    {isImage(file) ? (
                      <ImageIcon className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(file.size)}
                    </p>
                    <Progress className="mt-2 h-1.5" value={progress} />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeAt(index)}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt={file.name}
                    className="mt-2 h-24 w-full rounded-lg object-cover"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
