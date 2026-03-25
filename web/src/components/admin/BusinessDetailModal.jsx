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
import { ADMIN_ROUTES } from "@/constants/routes";
import {
  BUSINESS_STATUS,
  BUSINESS_STATUS_LABELS,
} from "@/constants/businessConstants";
import {
  Loader2,
  MapPin,
  Building2,
  ExternalLink,
  Mail,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const PLACE_STATUS_LABEL = {
  draft: "Nháp",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  hidden: "Ẩn",
};

/**
 * Chi tiết doanh nghiệp (admin) + danh sách địa điểm trực thuộc.
 */
export default function BusinessDetailModal({
  open,
  onOpenChange,
  businessId,
}) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !businessId) return;
    let cancelled = false;
    setDetail(null);
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

  const statusLabel =
    detail?.status != null
      ? BUSINESS_STATUS_LABELS[detail.status] || detail.status
      : "—";

  const places = Array.isArray(detail?.places) ? detail.places : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,840px)] max-w-3xl overflow-hidden flex flex-col gap-0 rounded-none border-2 border-black p-0 sm:rounded-none">
        <DialogHeader className="shrink-0 border-b-2 border-black bg-[#F4F4F4] px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 font-black uppercase tracking-tight text-base">
            <Building2 className="h-5 w-5 shrink-0" aria-hidden />
            Doanh nghiệp & địa điểm
          </DialogTitle>
          <DialogDescription className="font-mono text-[11px] uppercase text-muted-foreground">
            Phạm vi hoạt động: các địa điểm gắn với doanh nghiệp này
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
            </div>
          ) : detail ? (
            <>
              <div className="border border-black bg-white p-4 space-y-2">
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
                    )}
                  >
                    {statusLabel}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{detail.owner?.email || "—"}</span>
                  </div>
                  {detail.commissionRate != null && (
                    <p className="font-mono text-xs">
                      Hoa hồng:{" "}
                      <strong>{Number(detail.commissionRate)}%</strong>
                    </p>
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
                              .join(" · ") || p.address || "—"}
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
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
