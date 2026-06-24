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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  uploadDocument,
  getDocumentStatus,
  deleteDocument,
} from "@/apis/documentApi";

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

const DocumentFileItem = memo(
  ({ doc, labels, deleting, onDelete }) => (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-background px-3 py-2">
      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground truncate">
          {doc.originalName || `Tài liệu #${doc.id}`}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(doc.fileSize)}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
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
  }) => {
    const inputRef = useRef(null);
    const hasDocs = documents.length > 0;

    return (
      <div
        className={cn(
          "rounded-xl border p-4 transition-colors",
          hasDocs
            ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
            : "border-border/60 bg-muted/20",
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "rounded-lg p-2 shrink-0",
              hasDocs
                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <Badge
                variant={hasDocs ? "default" : "outline"}
                className={cn(
                  hasDocs
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400"
                    : "text-muted-foreground",
                )}
              >
                {documents.length > 0
                  ? `${documents.length} ${labels.files}`
                  : labels.noFiles}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{hint}</p>
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
            className="gap-1.5 shrink-0"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {uploading ? labels.uploading : labels.addMore}
          </Button>
        </div>

        {hasDocs && (
          <div className="mt-3 space-y-1.5">
            {documents.map((doc) => (
              <DocumentFileItem
                key={doc.id}
                doc={doc}
                labels={labels}
                deleting={deletingId === doc.id}
                onDelete={onDelete}
              />
            ))}
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

  if (loadingStatus) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
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
        />
      ))}
    </div>
  );
});

DocumentUploadCard.displayName = "DocumentUploadCard";

export default DocumentUploadCard;
