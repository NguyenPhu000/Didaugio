import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Store,
  FileCheck2,
  FileWarning,
  ClipboardCheck,
  Search,
  Pause,
  RotateCcw,
  MapPin,
  RefreshCw,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileSignature,
  XCircle,
  Download,
  Mail,
  ArrowUpRight,
  Phone,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  Ticket,
  ExternalLink,
  ChevronDown,
  Sparkles,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useBusinesses,
  useApproveBusiness,
  useRejectBusiness,
  useSuspendBusiness,
  useReactivateBusiness,
  useTerminateBusiness,
} from "@/hooks/queries/useBusinessQueries";
import { exportToCsv, slugifyFilename } from "@/utils/csvExport";
import BusinessReviewApproveModal from "@/components/admin/BusinessReviewApproveModal";
import BusinessDetailModal from "@/components/admin/BusinessDetailModal";
import {
  BUSINESS_STATUS,
  BUSINESS_TYPE_LABELS,
} from "@/constants/businessConstants";
import { getTableSerialNumber } from "@/utils/tableSerial";

/*
 * Soft Neumorphic Master-Detail UI (70% White / 20% Black / 10% Yellow)
 * Inspired by Homely / Warm Minimalist Proptech Dashboard
 */

const STATUS_CONFIG = {
  [BUSINESS_STATUS.PENDING]: {
    label: "Chờ thẩm định",
    badge: "bg-[#FFFDE6] text-slate-900 border-[#F3E600]/80",
    dot: "bg-[#F3E600] animate-pulse shadow-[0_0_6px_#F3E600]",
  },
  [BUSINESS_STATUS.APPROVED]: {
    label: "Đang hoạt động",
    badge: "bg-slate-950 text-white border-slate-950",
    dot: "bg-[#F3E600]",
  },
  [BUSINESS_STATUS.REJECTED]: {
    label: "Đã từ chối",
    badge: "bg-[#F4F2EC] text-slate-600 border-black/[0.06]",
    dot: "bg-slate-400",
  },
  [BUSINESS_STATUS.SUSPENDED]: {
    label: "Tạm ngưng",
    badge: "bg-[#F4F2EC] text-slate-800 border-black/[0.08]",
    dot: "bg-slate-500",
  },
  [BUSINESS_STATUS.TERMINATED]: {
    label: "Chấm dứt",
    badge: "bg-slate-100 text-slate-900 border-slate-300 line-through",
    dot: "bg-slate-900",
  },
  [BUSINESS_STATUS.SUSPICIOUS]: {
    label: "Đáng ngờ",
    badge: "bg-[#FFFDE6] text-slate-900 border-[#F3E600]",
    dot: "bg-[#F3E600] animate-ping",
  },
};

const getStatusBadge = (status) => {
  const conf = STATUS_CONFIG[status] || {
    label: String(status),
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-full border shadow-2xs transition-all",
        conf.badge
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", conf.dot)} />
      <span>{conf.label}</span>
    </div>
  );
};

const BusinessListPage = ({ initialStatus = "all" }) => {
  const { t } = useTranslation();

  const STATUS_TABS = [
    { value: "all", label: "Tất cả" },
    { value: "pending", label: "Chờ thẩm định" },
    { value: "approved", label: "Đang hoạt động" },
    { value: "suspended", label: "Tạm ngưng" },
    { value: "rejected", label: "Đã từ chối" },
    { value: "terminated", label: "Chấm dứt" },
  ];

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);
  const [reviewBusinessId, setReviewBusinessId] = useState(null);
  const [detailBusinessId, setDetailBusinessId] = useState(null);
  const searchDebounceRef = useRef(null);

  const queryParams = useMemo(
    () => ({ search: debouncedSearch, status, page }),
    [debouncedSearch, status, page]
  );

  const { data: queryResult, isLoading, isFetching, refetch } = useBusinesses(queryParams);
  const approveMutation = useApproveBusiness();
  const rejectMutation = useRejectBusiness();
  const suspendMutation = useSuspendBusiness();
  const reactivateMutation = useReactivateBusiness();
  const terminateMutation = useTerminateBusiness();

  const businesses = queryResult?.data ?? [];
  const pagination = queryResult?.pagination ?? { page: 1, totalPages: 1, total: 0 };
  const summary = queryResult?.summary ?? null;

  // Auto-select first business on load or list change
  useEffect(() => {
    if (businesses.length > 0) {
      if (!selectedBusinessId || !businesses.some((b) => b.id === selectedBusinessId)) {
        setSelectedBusinessId(businesses[0].id);
      }
    } else {
      setSelectedBusinessId(null);
    }
  }, [businesses, selectedBusinessId]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const handleRefresh = async () => {
    await refetch();
    toast.success("Đã đồng bộ danh sách đối tác");
  };

  const handleSuspend = async (businessId) => {
    const reason = window.prompt(
      "Nhập lý do tạm khóa doanh nghiệp (tối thiểu 10 ký tự):\n\nLưu ý: Tất cả địa điểm sẽ bị ẩn, các đặt chỗ chưa hoàn thành sẽ tự động hủy và hoàn tiền."
    );
    if (!reason || reason.trim().length < 10) {
      if (reason !== null) toast.error("Lý do phải có ít nhất 10 ký tự");
      return;
    }
    try {
      await suspendMutation.mutateAsync({ id: businessId, reason: reason.trim() });
      toast.success("Đã tạm khóa đối tác kinh doanh");
    } catch (error) {
      toast.error(error.message || "Không thể tạm khóa");
    }
  };

  const handleReactivate = async (businessId) => {
    if (!window.confirm("Kích hoạt lại doanh nghiệp này? Các địa điểm và dịch vụ sẽ được khôi phục.")) {
      return;
    }
    try {
      await reactivateMutation.mutateAsync(businessId);
      toast.success("Đã khôi phục hoạt động doanh nghiệp");
    } catch (error) {
      toast.error(error.message || "Không thể kích hoạt");
    }
  };

  const handleTerminate = async (businessId) => {
    const step1 = window.confirm(
      "Bạn có chắc muốn CHẤM DỨT HỢP ĐỒNG doanh nghiệp này?\n\nHành động này sẽ:\n- Ẩn toàn bộ địa điểm vĩnh viễn\n- Hủy tất cả đặt chỗ đang hoạt động và hoàn tiền\n- Vô hiệu hóa voucher & dịch vụ liên quan\n- Hạ phân quyền tài khoản chủ sở hữu\n\nNhấn OK để tiếp tục."
    );
    if (!step1) return;

    const confirmText = window.prompt("Gõ \"CONFIRM\" để xác nhận chấm dứt hợp đồng vĩnh viễn:");
    if (confirmText !== "CONFIRM") {
      toast.error("Xác nhận không khớp. Thao tác bị hủy bỏ.");
      return;
    }

    const reason = window.prompt("Nhập lý do chấm dứt hợp đồng (tối thiểu 10 ký tự):");
    if (!reason || reason.trim().length < 10) {
      if (reason !== null) toast.error("Lý do phải có ít nhất 10 ký tự");
      return;
    }

    try {
      await terminateMutation.mutateAsync({ id: businessId, reason: reason.trim() });
      toast.success("Đã chấm dứt hợp đồng đối tác");
    } catch (error) {
      toast.error(error.message || "Không thể chấm dứt hợp đồng");
    }
  };

  const handleExportCsv = () => {
    if (!businesses.length) {
      toast.error("Không có dữ liệu đối tác để xuất");
      return;
    }

    exportToCsv({
      columns: [
        { key: "businessName", label: "Tên doanh nghiệp" },
        { key: (row) => BUSINESS_TYPE_LABELS[row.businessType] || row.businessType, label: "Loại hình" },
        { key: "status", label: "Trạng thái" },
        { key: (row) => row.owner?.email || "", label: "Email chủ sở hữu" },
        { key: (row) => row.owner?.profile?.fullName || "", label: "Họ tên người đại diện" },
        { key: (row) => row.taxCode || "", label: "Mã số thuế" },
        { key: (row) => (row.contractSigned ? "Đã ký" : "Chưa ký"), label: "Hợp đồng pháp lý" },
        { key: (row) => row._count?.places ?? 0, label: "Số địa điểm" },
        { key: (row) => row._count?.services ?? 0, label: "Số dịch vụ" },
        { key: (row) => row._count?.vouchers ?? 0, label: "Voucher phát hành" },
        { key: (row) => row._count?.bookings ?? 0, label: "Lượt đặt chỗ" },
      ],
      data: businesses,
      filename: slugifyFilename("danh_sach_doi_tac_doanh_nghiep"),
    });

    toast.success(`Đã xuất ${businesses.length} đối tác ra tệp CSV`);
  };

  const s = summary || {
    totalBusinesses: 0,
    pending: 0,
    approved: 0,
    approvedWithoutContract: 0,
    totalPlaces: 0,
  };

  const getKycDetails = (biz) => {
    const checks = [
      { id: "mst", label: "Mã số thuế", ok: Boolean(biz.taxCode || biz.taxCodeMasked) },
      { id: "cccd", label: "CCCD/Hộ chiếu", ok: Boolean(biz.idCardFront || biz.idCardBack || biz.hasIdCardFront || biz.hasIdCardBack) },
      { id: "gpl", label: "Giấy phép KD", ok: Boolean(biz.businessLicense || biz.hasBusinessLicense) },
      { id: "nh", label: "Tài khoản ngân hàng", ok: Boolean(biz.bankName && (biz.bankAccountNumber || biz.bankAccountNumberMasked || biz.bankAccount)) },
      { id: "hd", label: "Hợp đồng điện tử", ok: Boolean(biz.contractSigned) },
      { id: "ck", label: "Tỷ lệ chiết khấu", ok: Boolean(biz.commissionRate != null) },
    ];
    const completedCount = checks.filter((c) => c.ok).length;
    return { checks, completedCount, total: checks.length, isComplete: completedCount === checks.length };
  };

  const selectedBusiness = businesses.find((b) => b.id === selectedBusinessId) || businesses[0] || null;
  const selectedKyc = selectedBusiness ? getKycDetails(selectedBusiness) : null;

  return (
    <div className="min-h-screen bg-[#ECEAE4] p-3 sm:p-6 lg:p-8 font-sans text-slate-900 antialiased selection:bg-[#F3E600] selection:text-slate-950">
      {/* Outer Floating Canvas (70% White / Warm Minimalist Shell) */}
      <div className="max-w-[1560px] mx-auto bg-[#FAF9F6] rounded-[32px] shadow-[0_24px_70px_rgba(0,0,0,0.06)] border border-black/[0.04] p-5 sm:p-8 space-y-6">
        {/* Top App Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-black/[0.04]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#F3E600] shadow-[0_0_6px_#F3E600]" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Hệ thống Quản trị Đối tác
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
              Đối tác doanh nghiệp
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Thẩm định hồ sơ pháp lý, giám sát quy mô điểm kinh doanh và quản lý hợp đồng liên kết.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Pill */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm doanh nghiệp, email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-white rounded-full text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F3E600] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] placeholder:text-slate-400 transition-all"
              />
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              className="h-10 px-4 rounded-full text-xs font-semibold bg-white text-slate-900 hover:bg-[#F4F2EC] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] transition-all flex items-center gap-2 shrink-0 active:scale-95"
            >
              <Download className="h-3.5 w-3.5 text-slate-700" />
              <span className="hidden sm:inline">Xuất CSV</span>
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              className="h-10 w-10 rounded-full bg-white text-slate-900 hover:bg-[#F4F2EC] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] transition-all flex items-center justify-center shrink-0 active:scale-95"
              title="Đồng bộ lại"
            >
              <RefreshCw className={cn("h-4 w-4 text-slate-800", (isLoading || isFetching) && "animate-spin")} />
            </button>
          </div>
        </header>

        {/* Filter Pills Bar */}
        <section className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-2 shrink-0">
            {STATUS_TABS.map((tab) => {
              const active = status === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatus(tab.value)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 shadow-2xs border",
                    active
                      ? "bg-slate-950 text-white border-slate-950 shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
                      : "bg-white text-slate-700 border-black/[0.04] hover:bg-[#F4F2EC] hover:text-slate-950"
                  )}
                >
                  {tab.label}
                  {tab.value === "pending" && s.pending > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-[#F3E600] text-slate-950 text-[10px] font-bold font-mono tabular-nums">
                      {s.pending}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-xs font-medium text-slate-500 shrink-0 hidden md:block">
            Hiển thị <span className="font-bold text-slate-950 font-mono tabular-nums">{pagination.total}</span> doanh nghiệp
          </div>
        </section>

        {/* Master-Detail 2-Column Dashboard View */}
        {(() => {
          if (isLoading) {
            return (
              <div className="py-32 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-slate-950 border-t-[#F3E600] rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-500">Đang tải dữ liệu đối tác...</p>
              </div>
            );
          }

          if (!businesses.length) {
            return (
              <div className="rounded-3xl bg-white border border-black/[0.04] p-20 text-center shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
                <Store className="h-12 w-12 mx-auto text-slate-300 mb-3 stroke-[1.5]" />
                <h3 className="font-bold text-base text-slate-900">
                  Không tìm thấy hồ sơ đối tác nào
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc trạng thái.
                </p>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (Master List - 5 cols, Independent Scroll Container) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Danh sách (<span className="font-mono tabular-nums">{businesses.length}</span>)
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">
                    Trang <span className="font-mono tabular-nums">{page}</span>/<span className="font-mono tabular-nums">{pagination.totalPages}</span>
                  </span>
                </div>

                {/* Independent Scrollable List View (Does not scroll page) */}
                <div className="space-y-3 h-[calc(100vh-290px)] min-h-[580px] max-h-[820px] overflow-y-auto pr-1.5 scrollbar-thin">
                  {businesses.map((biz, idx) => {
                    const isSelected = selectedBusiness?.id === biz.id;
                    return (
                      <article
                        key={biz.id}
                        onClick={() => setSelectedBusinessId(biz.id)}
                        className={cn(
                          "p-4 rounded-2xl cursor-pointer transition-all duration-300 flex items-center gap-3.5 border relative overflow-hidden group",
                          isSelected
                            ? "bg-white border-slate-950 shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-950/10 -translate-y-0.5"
                            : "bg-white/80 hover:bg-white border-black/[0.04] shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.04)]"
                        )}
                      >
                        {/* Selected Indicator Pill */}
                        {isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-950" />
                        )}

                        {/* Thumbnail / Monogram */}
                        <div className="w-16 h-16 rounded-xl bg-slate-950 text-[#F3E600] flex items-center justify-center font-extrabold text-xl shadow-xs shrink-0 border border-slate-800">
                          {biz.businessName ? biz.businessName.charAt(0).toUpperCase() : <Store className="h-6 w-6" />}
                        </div>

                        {/* Business Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-[11px] font-medium text-slate-500 truncate">
                              {BUSINESS_TYPE_LABELS[biz.businessType] || biz.businessType}
                            </span>
                            {getStatusBadge(biz.status)}
                          </div>

                          <h3
                            className="font-bold text-sm text-slate-950 truncate group-hover:text-slate-800 transition-colors"
                            title={biz.businessName}
                          >
                            {biz.businessName}
                          </h3>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
                            <span>{biz._count?.places ?? 0} địa điểm</span>
                            <span>•</span>
                            <span>{biz._count?.services ?? 0} dịch vụ</span>
                            <span>•</span>
                            <span>{biz._count?.bookings ?? 0} đặt chỗ</span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2 px-1 text-xs">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-full bg-white border border-black/[0.05] shadow-2xs font-semibold text-slate-800 disabled:opacity-40 hover:bg-[#F4F2EC]"
                    >
                      ← Trước
                    </button>
                    <span className="text-slate-500 font-medium">
                      Trang <span className="font-mono tabular-nums">{page}</span> / <span className="font-mono tabular-nums">{pagination.totalPages}</span>
                    </span>
                    <button
                      type="button"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      className="px-3 py-1.5 rounded-full bg-white border border-black/[0.05] shadow-2xs font-semibold text-slate-800 disabled:opacity-40 hover:bg-[#F4F2EC]"
                    >
                      Sau →
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column (Detail Inspector - 7 cols, Sticky) */}
              {selectedBusiness ? (
                <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.04)] border border-black/[0.04] space-y-6 lg:sticky lg:top-6">
                  {/* Inspection Header & Action */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-black/[0.04]">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-16 h-16 rounded-2xl bg-slate-950 text-[#F3E600] flex items-center justify-center font-black text-2xl shadow-sm shrink-0 border border-slate-800">
                        {selectedBusiness.businessName ? selectedBusiness.businessName.charAt(0).toUpperCase() : <Store className="h-7 w-7" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F4F2EC] text-slate-800">
                            {BUSINESS_TYPE_LABELS[selectedBusiness.businessType] || selectedBusiness.businessType}
                          </span>
                          {getStatusBadge(selectedBusiness.status)}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight leading-tight">
                          {selectedBusiness.businessName}
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-1">
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{selectedBusiness.owner?.email || "Chưa có email"}</span>
                          {selectedBusiness.taxCode && (
                            <>
                              <span>•</span>
                              <span className="tabular-nums">MST: {selectedBusiness.taxCode}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Primary Top Action */}
                    <div className="flex items-center gap-2 shrink-0">
                      {selectedBusiness.status === BUSINESS_STATUS.PENDING ? (
                        <button
                          type="button"
                          onClick={() => setReviewBusinessId(selectedBusiness.id)}
                          className="h-10 px-5 rounded-full bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95"
                        >
                          <ClipboardCheck className="h-4 w-4 text-[#F3E600]" />
                          Thẩm định hồ sơ
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDetailBusinessId(selectedBusiness.id)}
                          className="h-10 px-5 rounded-full bg-white hover:bg-[#F4F2EC] text-slate-900 font-bold text-xs border border-black/[0.08] shadow-2xs transition-all flex items-center gap-2 active:scale-95"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-700" />
                          Xem chi tiết địa điểm
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 4 Soft Metric Attributes (Homely Style, tabular-nums) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-[#F8F7F3] border border-black/[0.03] text-center">
                      <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 mb-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span>Địa điểm</span>
                      </div>
                      <div className="text-2xl font-black text-slate-950 font-mono tabular-nums">
                        {selectedBusiness._count?.places ?? 0}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#F8F7F3] border border-black/[0.03] text-center">
                      <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 mb-1">
                        <Layers className="h-3.5 w-3.5 text-slate-400" />
                        <span>Dịch vụ</span>
                      </div>
                      <div className="text-2xl font-black text-slate-950 font-mono tabular-nums">
                        {selectedBusiness._count?.services ?? 0}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#F8F7F3] border border-black/[0.03] text-center">
                      <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 mb-1">
                        <Ticket className="h-3.5 w-3.5 text-slate-400" />
                        <span>Voucher</span>
                      </div>
                      <div className="text-2xl font-black text-slate-950 font-mono tabular-nums">
                        {selectedBusiness._count?.vouchers ?? 0}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#F8F7F3] border border-black/[0.03] text-center">
                      <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 mb-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>Đặt chỗ</span>
                      </div>
                      <div className="text-2xl font-black text-slate-950 font-mono tabular-nums">
                        {selectedBusiness._count?.bookings ?? 0}
                      </div>
                    </div>
                  </div>

                  {/* KYC Compliance Checklist & Legal Status Card */}
                  {selectedKyc && (
                    <div className="p-5 rounded-2xl bg-[#F8F7F3] border border-black/[0.03] space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Tiến độ thẩm định hồ sơ (KYC)
                          </h4>
                          <p className="text-xs text-slate-800 font-semibold mt-0.5">
                            Hoàn thành <span className="font-mono tabular-nums">{selectedKyc.completedCount}</span> / <span className="font-mono tabular-nums">{selectedKyc.total}</span> hạng mục
                          </p>
                        </div>

                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border shadow-2xs",
                            selectedBusiness.contractSigned
                              ? "bg-white text-slate-950 border-black/[0.08]"
                              : "bg-[#FFFDE6] text-slate-900 border-[#F3E600]"
                          )}
                        >
                          {selectedBusiness.contractSigned ? (
                            <>
                              <FileCheck2 className="h-3.5 w-3.5 text-slate-950" />
                              <span>Hợp đồng: Đã ký</span>
                            </>
                          ) : (
                            <>
                              <FileWarning className="h-3.5 w-3.5 text-slate-800" />
                              <span>Hợp đồng: Chưa ký</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-black/[0.03]">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            selectedKyc.isComplete
                              ? "bg-slate-950"
                              : selectedKyc.completedCount >= 3
                              ? "bg-[#F3E600]"
                              : "bg-slate-300"
                          )}
                          style={{ width: `${(selectedKyc.completedCount / selectedKyc.total) * 100}%` }}
                        />
                      </div>

                      {/* 6 Micro Badges */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                        {selectedKyc.checks.map((item) => (
                          <div
                            key={item.id}
                            className={cn(
                              "p-2 rounded-xl text-[11px] font-medium flex items-center gap-2 border",
                              item.ok
                                ? "bg-white text-slate-900 border-black/[0.04]"
                                : "bg-white/50 text-slate-400 border-dashed border-black/[0.08]"
                            )}
                          >
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full",
                                item.ok ? "bg-[#F3E600] shadow-[0_0_4px_#F3E600]" : "bg-slate-300"
                              )}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Representative Info */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Người đại diện pháp luật
                    </h4>
                    <div className="p-4 rounded-2xl bg-white border border-black/[0.04] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">
                          {selectedBusiness.owner?.profile?.fullName || "Chưa cập nhật họ tên"}
                        </div>
                        <div className="text-slate-500 font-mono mt-0.5">
                          {selectedBusiness.owner?.email || "—"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDetailBusinessId(selectedBusiness.id)}
                        className="px-3.5 py-1.5 rounded-full bg-[#F4F2EC] hover:bg-slate-200 text-slate-900 font-semibold text-xs transition-all"
                      >
                        Xem hồ sơ
                      </button>
                    </div>
                  </div>

                  {/* Operational Controls Bottom Strip (Full Text Labels & Hierarchy) */}
                  <div className="pt-4 border-t border-black/[0.04] flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {selectedBusiness.status === BUSINESS_STATUS.PENDING && (
                        <>
                          <button
                            type="button"
                            onClick={() => setReviewBusinessId(selectedBusiness.id)}
                            className="px-4 py-2.5 rounded-full bg-slate-950 hover:bg-black text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs"
                          >
                            <ClipboardCheck className="h-3.5 w-3.5 text-[#F3E600]" />
                            Bắt đầu đối chiếu & Thẩm định
                          </button>
                          <button
                            type="button"
                            onClick={() => setDetailBusinessId(selectedBusiness.id)}
                            className="px-4 py-2.5 rounded-full bg-white hover:bg-[#F4F2EC] text-slate-800 font-semibold text-xs transition-all flex items-center gap-1.5 border border-black/[0.06]"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Xem hồ sơ gốc
                          </button>
                        </>
                      )}

                      {selectedBusiness.status === BUSINESS_STATUS.APPROVED && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSuspend(selectedBusiness.id)}
                            className="px-4 py-2.5 rounded-full bg-[#F4F2EC] hover:bg-amber-50 hover:text-amber-900 text-slate-800 font-semibold text-xs transition-all flex items-center gap-1.5 border border-black/[0.04]"
                          >
                            <Pause className="h-3.5 w-3.5 text-amber-600" />
                            Tạm ngưng hoạt động
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTerminate(selectedBusiness.id)}
                            className="px-4 py-2.5 rounded-full bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-semibold text-xs transition-all flex items-center gap-1.5 border border-black/[0.06]"
                          >
                            <XCircle className="h-3.5 w-3.5 text-rose-500" />
                            Chấm dứt hợp đồng
                          </button>
                        </>
                      )}

                      {selectedBusiness.status === BUSINESS_STATUS.SUSPENDED && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReactivate(selectedBusiness.id)}
                            className="px-4 py-2.5 rounded-full bg-slate-950 hover:bg-black text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <RotateCcw className="h-3.5 w-3.5 text-[#F3E600]" />
                            Kích hoạt lại đối tác
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTerminate(selectedBusiness.id)}
                            className="px-4 py-2.5 rounded-full bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-semibold text-xs transition-all flex items-center gap-1.5 border border-black/[0.06]"
                          >
                            <XCircle className="h-3.5 w-3.5 text-rose-500" />
                            Chấm dứt hợp đồng
                          </button>
                        </>
                      )}

                      {selectedBusiness.status === BUSINESS_STATUS.TERMINATED && (
                        <div className="inline-flex items-center gap-1.5 text-xs text-rose-600 font-semibold bg-rose-50 px-3 py-1.5 rounded-full">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Hợp đồng đối tác đã bị chấm dứt
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                      Mã đối tác: #{selectedBusiness.id}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })()}
      </div>

      {/* Modals */}
      <BusinessDetailModal
        open={detailBusinessId != null}
        onOpenChange={(open) => {
          if (!open) setDetailBusinessId(null);
        }}
        businessId={detailBusinessId}
      />

      <BusinessReviewApproveModal
        open={reviewBusinessId != null}
        onOpenChange={(open) => {
          if (!open) setReviewBusinessId(null);
        }}
        businessId={reviewBusinessId}
        onApproved={(id, payload) => approveMutation.mutateAsync({ id, data: payload })}
        onRejected={(id, reason) => rejectMutation.mutateAsync({ id, reason })}
      />
    </div>
  );
};

export default BusinessListPage;
