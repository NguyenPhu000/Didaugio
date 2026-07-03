import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Upload,
  Trash2,
  CheckCircle2,
  CreditCard,
  Building2,
  Award,
  Loader2,
  FileText,
  Plus,
  Eye,
} from "lucide-react";
import {
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  uploadDocument,
  getDocumentStatus,
  deleteDocument,
  downloadDocument,
} from "@/apis/documentApi";
import { DOCUMENT_SAMPLE_IMAGES } from "@/components/business/documentImageConstants";

const DOC_TYPES = [
  {
    type: "id_card_front",
    icon: CreditCard,
    labelKey: "business.documents.idCardFront",
    hintKey: "business.documents.idCardFrontHint",
    accept: "image/png,image/jpeg,image/jpg,image/webp",
  },
  {
    type: "id_card_back",
    icon: CreditCard,
    labelKey: "business.documents.idCardBack",
    hintKey: "business.documents.idCardBackHint",
    accept: "image/png,image/jpeg,image/jpg,image/webp",
  },
  {
    type: "business_license",
    icon: Building2,
    labelKey: "business.documents.businessLicense",
    hintKey: "business.documents.businessLicenseHint",
    accept: "image/png,image/jpeg,image/jpg,image/webp,application/pdf",
  },
  {
    type: "certificate",
    icon: Award,
    labelKey: "business.documents.certificate",
    hintKey: "business.documents.certificateHint",
    accept: "image/png,image/jpeg,image/jpg,image/webp,application/pdf",
  },
];

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Component lấy file nhị phân từ API bảo mật và hiển thị an toàn
const SecureFilePreview = ({ documentId, mimeType, alt, className }) => {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!documentId) return;
    let active = true;
    setLoading(true);
    setError(false);

    downloadDocument(documentId)
      .then((res) => {
        if (!active) return;
        const blob = res instanceof Blob ? res : new Blob([res], { type: mimeType });
        const objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      active = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [documentId, mimeType]);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-lg", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !url) {
    return (
      <div className={cn("flex items-center justify-center bg-red-50 dark:bg-red-950/20 text-red-500 text-[10px] rounded-lg p-2 text-center leading-tight", className)}>
        Lỗi tải tệp
      </div>
    );
  }

  const isPdf = mimeType === "application/pdf" || mimeType?.includes("pdf");

  if (isPdf) {
    return (
      <iframe src={url} className={cn("w-full h-full border-0 rounded-lg", className)} title={alt} />
    );
  }

  return (
    <img src={url} alt={alt} className={cn("object-cover w-full h-full rounded-lg", className)} />
  );
};

const DocumentFileItem = memo(
  ({ doc, labels, deleting, onDelete, onView }) => (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-background px-3 py-2">
      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground truncate font-medium">
          {doc.originalName || `Tài liệu #${doc.id}`}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(doc.fileSize)}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1 border-slate-200 hover:bg-slate-50 dark:border-slate-800"
          onClick={() => onView(doc)}
        >
          <Eye className="h-3 w-3" />
          Xem
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/20"
          onClick={() => onDelete(doc.id)}
          disabled={deleting}
          title={labels.delete}
        >
          {deleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  ),
);

DocumentFileItem.displayName = "DocumentFileItem";

const DocumentTypeSection = memo(
  ({
    type,
    icon: Icon,
    label,
    hint,
    accept,
    documents,
    labels,
    uploading,
    deletingId,
    onUpload,
    onDelete,
    onView,
  }) => {
    const inputRef = useRef(null);
    const hasDocs = documents.length > 0;
    const isIdCard = type === "id_card_front" || type === "id_card_back";
    
    const sampleImage = type === "id_card_front"
      ? DOCUMENT_SAMPLE_IMAGES.idCardFront
      : DOCUMENT_SAMPLE_IMAGES.idCardBack;

    return (
      <div
        className={cn(
          "rounded-xl border p-4 transition-all duration-200",
          hasDocs
            ? "border-emerald-100 bg-emerald-50/20 dark:border-emerald-950/30 dark:bg-emerald-950/10"
            : "border-slate-200 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-900/10",
        )}
      >
        {isIdCard ? (
          /* Layout đặc biệt cho CCCD (Có hình ảnh minh họa / preview ở cột phải) */
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0 w-full">
              <div
                className={cn(
                  "rounded-lg p-2.5 shrink-0 mt-0.5 shadow-sm",
                  hasDocs
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                )}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{label}</p>
                  <Badge
                    variant={hasDocs ? "default" : "outline"}
                    className={cn(
                      hasDocs
                        ? "bg-emerald-100 hover:bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/30"
                        : "text-slate-500 border-slate-200 dark:border-slate-700 dark:text-slate-400",
                    )}
                  >
                    {hasDocs ? "Đã tải lên" : "Chưa tải lên"}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">{hint}</p>
                
                <div className="pt-1 flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) onUpload(file);
                    }}
                  />
                  {!hasDocs ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => inputRef.current?.click()}
                      disabled={uploading}
                      className="gap-1.5 h-8.5 rounded-lg text-xs"
                    >
                      {uploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      Thêm tệp
                    </Button>
                  ) : (
                    /* Thông tin file CCCD và nút xóa */
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs max-w-[220px] shadow-sm">
                      <span className="truncate flex-1 font-medium text-slate-600 dark:text-slate-300">
                        {documents[0].originalName}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0"
                        onClick={() => onDelete(documents[0].id)}
                        disabled={deletingId === documents[0].id}
                        title={labels.delete}
                      >
                        {deletingId === documents[0].id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cột phải: Khung ảnh preview hoặc ảnh mẫu */}
            <div className="w-[160px] h-[100px] shrink-0 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 relative shadow-sm group">
              {hasDocs ? (
                <div 
                  className="w-full h-full cursor-pointer relative"
                  onClick={() => onView(documents[0])}
                  title="Click để xem phóng to"
                >
                  <SecureFilePreview
                    documentId={documents[0].id}
                    mimeType={documents[0].mimeType}
                    alt={label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                    <span className="text-[10px] text-white font-bold uppercase tracking-wider bg-black/40 px-2 py-1 rounded">Xem</span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full relative">
                  <img
                    src={sampleImage}
                    alt={label}
                    className="w-full h-full object-cover opacity-45 grayscale"
                  />
                  <div className="absolute inset-0 bg-slate-900/5 flex items-center justify-center">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold tracking-wide uppercase bg-white/80 dark:bg-slate-950/80 px-1.5 py-0.5 rounded shadow-sm border border-slate-100 dark:border-slate-800">Ảnh mẫu</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Layout bình thường cho Giấy phép kinh doanh & Chứng nhận khác */
          <div className="space-y-3">
            <div className="flex items-start gap-3 justify-between">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className={cn(
                    "rounded-lg p-2.5 shrink-0 mt-0.5 shadow-sm",
                    hasDocs
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{label}</p>
                    <Badge
                      variant={hasDocs ? "default" : "outline"}
                      className={cn(
                        hasDocs
                          ? "bg-emerald-100 hover:bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/30"
                          : "text-slate-500 border-slate-200 dark:border-slate-700 dark:text-slate-400",
                      )}
                    >
                      {documents.length > 0
                        ? `${documents.length} tệp`
                        : "Chưa tải lên"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">{hint}</p>
                </div>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) onUpload(file);
                }}
              />
              <Button
                variant={hasDocs ? "outline" : "default"}
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="gap-1.5 shrink-0 h-8.5 rounded-lg text-xs"
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Thêm tệp
              </Button>
            </div>

            {hasDocs && (
              <div className="mt-2 space-y-2">
                {documents.map((doc) => (
                  <DocumentFileItem
                    key={doc.id}
                    doc={doc}
                    labels={labels}
                    deleting={deletingId === doc.id}
                    onDelete={onDelete}
                    onView={onView}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

DocumentTypeSection.displayName = "DocumentTypeSection";

const DocumentUploadCard = memo(({ businessId }) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState({
    id_card_front: [],
    id_card_back: [],
    business_license: [],
    certificate: [],
  });
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [uploadingType, setUploadingType] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const labels = {
    files: t("business.documents.files"),
    noFiles: t("business.documents.noFiles"),
    addMore: t("business.documents.addMore"),
    uploading: t("common.submitting"),
    delete: t("common.delete"),
  };

  const fetchStatus = useCallback(async () => {
    if (!businessId) return;
    try {
      const data = await getDocumentStatus(businessId);
      const statusData = data?.data || data;
      setStatus({
        id_card_front: statusData?.id_card_front || [],
        id_card_back: statusData?.id_card_back || [],
        business_license: statusData?.business_license || [],
        certificate: statusData?.certificate || [],
      });
    } catch {
      // silent
    } finally {
      setLoadingStatus(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleUpload = useCallback(
    async (docType, file) => {
      setUploadingType(docType);
      try {
        await uploadDocument(businessId, docType, file);
        toast.success(t("business.documents.uploadSuccess"));
        await fetchStatus();
      } catch (err) {
        toast.error(err?.message || t("business.documents.uploadFailed"));
      } finally {
        setUploadingType(null);
      }
    },
    [businessId, t, fetchStatus],
  );

  const handleDelete = useCallback(
    async (docId) => {
      setDeletingId(docId);
      try {
        await deleteDocument(businessId, docId);
        toast.success(t("business.documents.deleteSuccess"));
        await fetchStatus();
      } catch (err) {
        toast.error(err?.message || t("business.documents.deleteFailed"));
      } finally {
        setDeletingId(null);
      }
    },
    [businessId, t, fetchStatus],
  );

  const handleView = useCallback((doc) => {
    setPreviewDoc(doc);
  }, []);

  if (loadingStatus) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {DOC_TYPES.map(({ type, icon, labelKey, hintKey, accept }) => (
          <DocumentTypeSection
            key={type}
            type={type}
            icon={icon}
            label={t(labelKey)}
            hint={t(hintKey)}
            accept={accept}
            documents={status[type] || []}
            labels={labels}
            uploading={uploadingType === type}
            deletingId={deletingId}
            onUpload={(file) => handleUpload(type, file)}
            onDelete={handleDelete}
            onView={handleView}
          />
        ))}
      </div>

      {/* Modal / Dialog xem tài liệu trực tiếp trên web */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl w-[92vw] h-[85vh] flex flex-col p-0 overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl">
          <DialogHeader className="p-4 border-b shrink-0 bg-slate-50 dark:bg-slate-900">
            <DialogTitle className="text-sm font-bold text-slate-800 dark:text-white truncate pr-6">
              Chi tiết tài liệu: {previewDoc?.originalName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 bg-slate-100 dark:bg-slate-900">
            {previewDoc && (
              <SecureFilePreview
                documentId={previewDoc.id}
                mimeType={previewDoc.mimeType}
                alt={previewDoc.originalName}
                className="w-full h-full"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

DocumentUploadCard.displayName = "DocumentUploadCard";

export default DocumentUploadCard;
