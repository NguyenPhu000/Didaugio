import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import * as businessApi from "@/apis/businessApi";
import * as auditLogService from "@/apis/auditLogService";
import { ADMIN_ROUTES } from "@/constants/routes";
import {
  BUSINESS_STATUS,
  BUSINESS_STATUS_LABELS,
} from "@/constants/businessConstants";
import {
  Building2,
  ExternalLink,
  FileSignature,
  Loader2,
  Mail,
  MapPin,
  ShieldAlert,
  Wallet,
  Phone,
  Eye,
  AlertOctagon,
  BellRing,
  Ticket,
  Clock,
  User,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PLACE_STATUS_LABEL = {
  draft: "Nháp",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  hidden: "Ẩn",
};

const formatCurrency = (value) => {
  const n = Number(value || 0);
  return n.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
};

const ChecklistItem = ({ label, checked, previewUrl, onPreview }) => (
  <div className="flex items-center justify-between border-b border-border/50 py-2 text-sm last:border-0">
    <div className="flex items-center gap-2">
      <span>{label}</span>
      {previewUrl && (
        <button 
          onClick={() => onPreview?.(previewUrl, label)} 
          className="text-muted-foreground hover:text-black" 
          title="Xem tài liệu"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
    <span
      className={cn(
        "font-mono text-[10px] uppercase px-2 py-1 border rounded-none",
        checked
          ? "bg-emerald-50 border-emerald-500 text-emerald-800"
          : "bg-red-50 border-red-500 text-red-700",
      )}
    >
      {checked ? "Đạt" : "Thiếu"}
    </span>
  </div>
);

export default function BusinessDetailModal({
  open,
  onOpenChange,
  businessId,
}) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [activeTab, setActiveTab] = useState("detail");
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    if (!open || !businessId) return;
    let cancelled = false;
    setDetail(null);
    setActiveTab("detail");

    (async () => {
      setLoading(true);
      try {
        const res = await businessApi.getById(businessId);
        if (!cancelled) setDetail(res.data);
      } catch (e) {
        if (!cancelled) {
          toast.error(e.message || "Không tải được doanh nghiệp");
          onOpenChange?.(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, businessId, onOpenChange]);

  useEffect(() => {
    if (!open || !businessId || activeTab !== "audit") return;
    let cancelled = false;
    setAuditLoading(true);

    (async () => {
      try {
        const res = await auditLogService.getAll({
          tableName: "businesses",
          recordId: businessId,
          page: 1,
          limit: 50,
        });
        if (!cancelled) setAuditLogs(res.data || []);
      } catch {
        if (!cancelled) setAuditLogs([]);
      } finally {
        if (!cancelled) setAuditLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, businessId, activeTab]);

  const statusLabel =
    detail?.status != null
      ? BUSINESS_STATUS_LABELS[detail.status] || detail.status
      : "—";

  const places = Array.isArray(detail?.places) ? detail.places : [];
  const insights = detail?.adminInsights || {};
  const financial = insights.financialSummary || {};
  const contract = insights.contractSummary || {};
  const operations = insights.operationsSummary || {};
  const compliance = insights.complianceChecklist || {};
  const risks = Array.isArray(insights.riskFlags) ? insights.riskFlags : [];
  const placeStatusCounts = operations.placeStatusCounts || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92vh,940px)] max-w-5xl overflow-hidden flex flex-col gap-0 rounded-none border-2 border-black p-0 sm:rounded-none">
        <DialogHeader className="shrink-0 border-b-2 border-black bg-[#F4F4F4] px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 font-black uppercase tracking-tight text-base">
            <Building2 className="h-5 w-5 shrink-0" aria-hidden />
            Chi tiết doanh nghiệp · kiểm kê quản trị
          </DialogTitle>
          <DialogDescription className="font-mono text-[11px] uppercase text-muted-foreground">
            Hồ sơ · doanh thu · hợp đồng · tuân thủ · địa điểm trực thuộc
          </DialogDescription>
          <div className="flex gap-1 mt-2 border-2 border-black bg-white">
            <button onClick={() => setActiveTab("detail")} className={cn("px-4 py-1.5 font-mono text-[11px] uppercase font-bold transition-colors", activeTab === "detail" ? "bg-black text-white" : "bg-white text-black hover:bg-muted")}>Chi tiết</button>
            <button onClick={() => setActiveTab("audit")} className={cn("px-4 py-1.5 font-mono text-[11px] uppercase font-bold transition-colors flex items-center gap-1.5", activeTab === "audit" ? "bg-black text-white" : "bg-white text-black hover:bg-muted")}><Clock className="h-3 w-3" />Nhật ký kiểm toán</button>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {(() => {
            if (loading) {
              return (
                <div className="flex justify-center py-16 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
                </div>
              );
            }

            if (!detail) return null;

            if (activeTab === "audit") {
              return (
                <div className="border border-black bg-white">
                  <div className="border-b border-black bg-[#F4F4F4] px-4 py-2">
                    <p className="font-mono text-[10px] uppercase font-bold text-muted-foreground">
                      Lịch sử hành động quản trị — Doanh nghiệp #{businessId}
                    </p>
                  </div>
                  {auditLoading ? (
                    <div className="flex justify-center py-12 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-6 text-center">
                      Chưa có nhật ký kiểm toán cho doanh nghiệp này.
                    </p>
                  ) : (
                    <div className="divide-y divide-black/10">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={cn("font-mono text-[10px] uppercase px-2 py-0.5 border", log.action === "APPROVE" && "bg-emerald-50 border-emerald-500 text-emerald-800", log.action === "REJECT" && "bg-red-50 border-red-500 text-red-700", log.action === "SUSPEND" && "bg-gray-100 border-gray-500 text-gray-800", log.action === "REACTIVATE" && "bg-blue-50 border-blue-500 text-blue-800", log.action === "TERMINATE" && "bg-red-100 border-red-700 text-red-900", !["APPROVE","REJECT","SUSPEND","REACTIVATE","TERMINATE"].includes(log.action) && "bg-yellow-50 border-yellow-500 text-yellow-800")}>{log.action}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />{log.user?.email || `User #${log.userId}`}</span>
                            </div>
                            <span className="text-[11px] text-muted-foreground font-mono whitespace-nowrap">{log.createdAt ? new Date(log.createdAt).toLocaleString("vi-VN") : "—"}</span>
                          </div>
                          {(log.newData || log.oldData) && (
                            <div className="mt-2 text-xs space-y-1">
                              {log.newData?.status && <p>Trạng thái: <strong>{log.oldData?.status || "—"}</strong> → <strong>{log.newData.status}</strong></p>}
                              {log.newData?.suspensionReason && <p className="text-red-700">Lý do tạm khóa: {log.newData.suspensionReason}</p>}
                              {log.newData?.terminationReason && <p className="text-red-900">Lý do chấm dứt: {log.newData.terminationReason}</p>}
                              {log.newData?.rejectionReason && <p className="text-red-700">Lý do từ chối: {log.newData.rejectionReason}</p>}
                            </div>
                          )}
                          <p className="text-[10px] text-muted-foreground font-mono mt-1">IP: {log.ipAddress || "—"} · {log.userAgent?.substring(0, 60) || "—"}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <>
                <div className="border border-black bg-white p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-[10px] uppercase text-muted-foreground">
                        Tên doanh nghiệp
                      </p>
                      <p className="font-black text-lg uppercase tracking-tight">
                        {detail.businessName || "—"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "font-mono text-[10px] uppercase px-2 py-1 border border-black",
                        detail.status === BUSINESS_STATUS.APPROVED &&
                          "bg-[#F3E600] text-black",
                        detail.status === BUSINESS_STATUS.PENDING &&
                          "bg-amber-100 text-amber-900",
                        detail.status === BUSINESS_STATUS.SUSPENDED &&
                          "bg-neutral-200 text-neutral-800",
                        detail.status === BUSINESS_STATUS.REJECTED &&
                          "bg-red-100 text-red-800",
                        detail.status === BUSINESS_STATUS.TERMINATED &&
                          "bg-red-200 text-red-900",
                        detail.status === BUSINESS_STATUS.SUSPICIOUS &&
                          "bg-amber-200 text-amber-900",
                      )}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate" title={detail.owner?.email}>
                        {detail.owner?.email || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {detail.owner?.phone || "Chưa có SĐT"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground min-w-0 lg:col-span-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate" title={detail.owner?.address}>
                        {detail.owner?.address || "Chưa có địa chỉ HQ"}
                      </span>
                    </div>
                    <div className="col-span-full font-mono text-xs mt-2 border-t border-dashed border-border/50 pt-2 flex flex-wrap gap-4">
                      <span>CCCD: <strong>{detail.idCardNumberMasked || "—"}</strong></span>
                      <span>TK NH: <strong>{detail.bankAccountNumberMasked || "—"}</strong></span>
                      <span>Chủ TK: <strong>{detail.bankAccountOwnerMasked || "—"}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="border border-black bg-white p-4 space-y-1">
                    <p className="font-mono text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                      <Wallet className="h-3.5 w-3.5" /> Tài chính tổng quan
                    </p>
                    <p className="text-sm">
                      Doanh thu hoàn tất:{" "}
                      <strong>
                        {formatCurrency(financial.completedRevenue)}
                      </strong>
                    </p>
                    <p className="text-sm">
                      Hoa hồng nền tảng:{" "}
                      <strong>
                        {formatCurrency(financial.completedCommission)}
                      </strong>
                    </p>
                    <p className="text-sm">
                      Doanh thu ròng DN:{" "}
                      <strong>
                        {formatCurrency(financial.completedNetRevenue)}
                      </strong>
                    </p>
                    <p className="text-sm font-mono">
                      Tỷ lệ thực tế:{" "}
                      {financial.completedCommissionSharePct ?? 0}%
                    </p>
                  </div>

                  <div className="border border-black bg-white p-4 space-y-1">
                    <p className="font-mono text-[10px] uppercase text-muted-foreground">
                      Vận hành booking
                    </p>
                    <p className="text-sm">
                      Tổng booking:{" "}
                      <strong>{financial.totalBookings ?? 0}</strong>
                    </p>
                    <p className="text-sm">
                      Đã hoàn tất:{" "}
                      <strong>{financial.completedBookings ?? 0}</strong>
                    </p>
                    <p className="text-sm">
                      Đang xử lý:{" "}
                      <strong>
                        {insights.bookingStatusCounts?.pending ?? 0}
                      </strong>
                    </p>
                    <p className="text-sm">
                      Chưa thanh toán:{" "}
                      <strong>
                        {insights.paymentStatusCounts?.unpaid ?? 0}
                      </strong>
                    </p>
                  </div>

                  <div className="border border-black bg-white p-4 space-y-1">
                    <p className="font-mono text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                      <FileSignature className="h-3.5 w-3.5" /> Hợp đồng
                    </p>
                    <p className="text-sm">
                      Trạng thái:{" "}
                      <strong>
                        {contract.contractSigned ? "Đã ký" : "Chưa ký"}
                      </strong>
                    </p>
                    <p className="text-sm">
                      Phiên bản:{" "}
                      <strong>{contract.contractVersion || "—"}</strong>
                    </p>
                    <p className="text-sm">
                      Ký lúc:{" "}
                      <strong>
                        {contract.contractSignedAt
                          ? new Date(contract.contractSignedAt).toLocaleString(
                              "vi-VN",
                            )
                          : "—"}
                      </strong>
                    </p>
                    <p className="text-sm">
                      Hoa hồng cấu hình:{" "}
                      <strong>
                        {contract.commissionRate ?? detail.commissionRate ?? 0}%
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="border border-black bg-white p-4">
                    <p className="font-mono text-[10px] uppercase text-muted-foreground mb-2">
                      Checklist tuân thủ
                    </p>
                    <ChecklistItem
                      label="Mã số thuế"
                      checked={Boolean(compliance.hasTaxCode)}
                    />
                    <ChecklistItem
                      label="CCCD mặt trước"
                      checked={Boolean(compliance.hasIdCardFront)}
                      previewUrl={compliance.idCardFrontUrl}
                      onPreview={(url, label) => setPreviewData({ url, title: label })}
                    />
                    <ChecklistItem
                      label="CCCD mặt sau"
                      checked={Boolean(compliance.hasIdCardBack)}
                      previewUrl={compliance.idCardBackUrl}
                      onPreview={(url, label) => setPreviewData({ url, title: label })}
                    />
                    <ChecklistItem
                      label="Giấy phép kinh doanh"
                      checked={Boolean(compliance.hasBusinessLicense)}
                      previewUrl={compliance.businessLicenseUrl}
                      onPreview={(url, label) => setPreviewData({ url, title: label })}
                    />
                    <ChecklistItem
                      label="Thông tin ngân hàng"
                      checked={Boolean(compliance.hasBankInfo)}
                    />
                    <ChecklistItem
                      label="Đã ký hợp đồng"
                      checked={Boolean(compliance.hasSignedContract)}
                    />
                  </div>

                  <div className="border border-black bg-white p-4 space-y-2">
                    <p className="font-mono text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5" /> Rủi ro cần rà soát
                    </p>
                    {risks.length === 0 ? (
                      <p className="text-sm text-emerald-700">
                        Không phát hiện rủi ro nổi bật.
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {risks.map((risk) => (
                          <li
                            key={risk}
                            className="text-sm border border-red-200 bg-red-50 text-red-800 px-2 py-1"
                          >
                            {risk}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="pt-2 border-t border-black/20 text-sm space-y-1">
                      <p>
                        Dịch vụ active/inactive:{" "}
                        <strong>{operations.activeServiceCount ?? 0}</strong> /{" "}
                        <strong>{operations.inactiveServiceCount ?? 0}</strong>
                      </p>
                      <p>
                        Voucher active/hết hạn:{" "}
                        <strong>{operations.activeVoucherCount ?? 0}</strong> /{" "}
                        <strong>{operations.expiredVoucherCount ?? 0}</strong>
                      </p>
                      <p>
                        Địa điểm đã duyệt:{" "}
                        <strong>{placeStatusCounts.approved ?? 0}</strong> · chờ
                        duyệt: <strong>{placeStatusCounts.pending ?? 0}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Admin Actions — dynamic by status */}
                <div className="border border-black bg-[#F4F4F4] p-4 flex flex-wrap gap-3 items-center justify-between">
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Admin Actions</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Trạng thái: <span className={cn("font-mono text-[10px] uppercase px-1.5 py-0.5 border", detail.status === BUSINESS_STATUS.APPROVED && "bg-[#F3E600] text-black border-black", detail.status === BUSINESS_STATUS.PENDING && "bg-amber-100 text-amber-900 border-amber-400", detail.status === BUSINESS_STATUS.SUSPENDED && "bg-neutral-200 text-neutral-800 border-neutral-400", detail.status === BUSINESS_STATUS.REJECTED && "bg-red-100 text-red-800 border-red-400", detail.status === BUSINESS_STATUS.TERMINATED && "bg-red-200 text-red-900 border-red-600", detail.status === BUSINESS_STATUS.SUSPICIOUS && "bg-amber-200 text-amber-900 border-amber-600")}>{statusLabel}</span>
                      {detail.suspensionReason && <span className="ml-2 text-red-700 text-[11px]">Lý do tạm khóa: {detail.suspensionReason}</span>}
                      {detail.terminationReason && <span className="ml-2 text-red-900 text-[11px]">Lý do chấm dứt: {detail.terminationReason}</span>}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" className="rounded-none border-black font-mono text-[10px] uppercase gap-1" onClick={() => toast.success("Đã gửi yêu cầu bổ sung giấy tờ")}>
                      <BellRing className="h-3 w-3" /> Yêu cầu bổ sung
                    </Button>
                    {(detail.status === BUSINESS_STATUS.APPROVED || detail.status === BUSINESS_STATUS.SUSPICIOUS) && (
                      <Button variant="outline" size="sm" className="rounded-none border-amber-600 text-amber-900 hover:bg-amber-50 font-mono text-[10px] uppercase gap-1" onClick={async () => {
                        const reason = window.prompt("Nhập lý do tạm khóa (tối thiểu 10 ký tự):");
                        if (!reason || reason.trim().length < 10) { if (reason !== null) toast.error("Lý do phải có ít nhất 10 ký tự"); return; }
                        try { await businessApi.suspend(businessId, reason.trim()); toast.success("Đã tạm khóa"); onOpenChange?.(false); } catch (e) { toast.error(e.message || "Lỗi"); }
                      }}>
                        <AlertOctagon className="h-3 w-3" /> Tạm khóa
                      </Button>
                    )}
                    {detail.status === BUSINESS_STATUS.SUSPENDED && (
                      <Button variant="outline" size="sm" className="rounded-none border-emerald-600 text-emerald-900 hover:bg-emerald-50 font-mono text-[10px] uppercase gap-1" onClick={async () => {
                        if (!window.confirm("Kích hoạt lại doanh nghiệp?")) return;
                        try { await businessApi.reactivate(businessId); toast.success("Đã kích hoạt lại"); onOpenChange?.(false); } catch (e) { toast.error(e.message || "Lỗi"); }
                      }}>
                        <RotateCcw className="h-3 w-3" /> Kích hoạt lại
                      </Button>
                    )}
                    {(detail.status === BUSINESS_STATUS.APPROVED || detail.status === BUSINESS_STATUS.SUSPENDED) && (
                      <Button variant="destructive" size="sm" className="rounded-none font-mono text-[10px] uppercase gap-1" onClick={async () => {
                        const step1 = window.confirm('⚠️ BƯỚC 1/2: Chấm dứt hợp đồng? Nhấn OK để tiếp tục.');
                        if (!step1) return;
                        const confirm = window.prompt('BƯỚC 2/2: Gõ "CONFIRM" để xác nhận:');
                        if (confirm !== "CONFIRM") { toast.error("Xác nhận không khớp"); return; }
                        const reason = window.prompt("Nhập lý do chấm dứt (tối thiểu 10 ký tự):");
                        if (!reason || reason.trim().length < 10) { if (reason !== null) toast.error("Lý do phải có ít nhất 10 ký tự"); return; }
                        try { await businessApi.terminate(businessId, reason.trim()); toast.success("Đã chấm dứt hợp đồng"); onOpenChange?.(false); } catch (e) { toast.error(e.message || "Lỗi"); }
                      }}>
                        <XCircle className="h-3 w-3" /> Chấm dứt HĐ
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    Địa điểm ({places.length})
                  </p>
                  {places.length === 0 ? (
                    <p className="text-sm text-muted-foreground border border-dashed border-black/30 p-6 text-center">
                      Chưa có địa điểm nào gắn với doanh nghiệp này.
                    </p>
                  ) : (
                    <div className="border border-black divide-y divide-black">
                      {places.map((p) => (
                        <div
                          key={p.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-white hover:bg-muted/40 transition-colors"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <p className="font-semibold text-sm truncate">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {[p.category?.name, p.district?.name]
                                .filter(Boolean)
                                .join(" · ") ||
                                p.address ||
                                "—"}
                            </p>
                            <span className="inline-block font-mono text-[10px] uppercase border border-black/20 px-1.5 py-0.5">
                              {PLACE_STATUS_LABEL[p.status] || p.status}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="rounded-none border-black shrink-0 font-mono text-[10px] uppercase"
                          >
                            <Link
                              to={ADMIN_ROUTES.PLACES_EDIT(p.id)}
                              onClick={() => onOpenChange?.(false)}
                            >
                              Sửa địa điểm
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    <Link
                      to={`${ADMIN_ROUTES.PLACES}?businessId=${businessId}`}
                      className="underline font-medium text-foreground hover:text-primary"
                      onClick={() => onOpenChange?.(false)}
                    >
                      Lọc danh sách địa điểm theo doanh nghiệp này
                    </Link>{" "}
                    (nếu trang địa điểm hỗ trợ tham số).
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      </DialogContent>

      <Dialog open={!!previewData} onOpenChange={(open) => !open && setPreviewData(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none flex items-center justify-center">
          <div className="relative bg-white p-4 w-full max-h-[90vh] overflow-auto flex flex-col">
            <h3 className="font-semibold text-lg border-b pb-2 mb-4">{previewData?.title}</h3>
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
              {previewData?.url && (
                <img 
                  src={previewData.url.startsWith("http") || previewData.url.startsWith("data:") ? previewData.url : `data:image/jpeg;base64,${previewData.url}`}
                  alt={previewData.title}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setPreviewData(null)} variant="outline">Đóng</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
