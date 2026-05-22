import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  ClipboardCheck,
  Search,
  Pause,
  RotateCcw,
  MapPin,
  Layers,
  Ticket,
  CalendarCheck,
  RefreshCw,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileSignature,
  XCircle,
  AlertTriangle,
  LayoutGrid,
  Table2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import useBusinessStore from "@/stores/businessStore";
import { exportToCsv, slugifyFilename } from "@/utils/csvExport";
import BusinessReviewApproveModal from "@/components/admin/BusinessReviewApproveModal";
import BusinessDetailModal from "@/components/admin/BusinessDetailModal";
import TimStatsCard from "@/components/admin/TimStatsCard";
import {
  BUSINESS_STATUS,
  BUSINESS_TYPE_LABELS,
} from "@/constants/businessConstants";

const STATUS_OPTIONS = [
  { value: "all", label: "TẤT CẢ" },
  { value: "pending", label: "CHỜ DUYỆT" },
  { value: "approved", label: "ĐÃ DUYỆT" },
  { value: "rejected", label: "TỪ CHỐI" },
  { value: "suspended", label: "TẠM NGƯNG" },
  { value: "terminated", label: "CHẤM DỨT" },
  { value: "suspicious", label: "ĐÁNG NGỜ" },
];

const getBusinessStatusBadge = (status) => {
  const config = {
    [BUSINESS_STATUS.PENDING]: {
      label: "PENDING",
      className:
        "bg-yellow-400 text-black border-2 border-yellow-600 animate-pulse font-black",
    },
    [BUSINESS_STATUS.APPROVED]: {
      label: "APPROVED",
      className: "bg-[#F3E600] text-black border-2 border-black font-black",
    },
    [BUSINESS_STATUS.REJECTED]: {
      label: "REJECTED",
      className: "bg-red-500 text-white border-2 border-red-700 font-black",
    },
    [BUSINESS_STATUS.SUSPENDED]: {
      label: "SUSPENDED",
      className:
        "bg-gray-800 text-gray-300 border-2 border-gray-600 font-black",
    },
    [BUSINESS_STATUS.TERMINATED]: {
      label: "TERMINATED",
      className:
        "bg-red-900 text-red-200 border-2 border-red-700 font-black",
    },
    [BUSINESS_STATUS.SUSPICIOUS]: {
      label: "SUSPICIOUS",
      className:
        "bg-amber-600 text-white border-2 border-amber-800 font-black animate-pulse",
    },
  };
  const c = config[status] || {
    label: String(status).toUpperCase(),
    className: "bg-gray-200 text-gray-800 border-2 border-gray-400",
  };
  return (
    <div
      className={`px-3 py-1.5 text-[10px] uppercase font-mono ${c.className} backdrop-blur-sm shadow-sm`}
    >
      {c.label}
    </div>
  );
};

const BusinessListPage = ({ initialStatus = "all" }) => {
  const {
    businesses,
    loading,
    pagination,
    summary,
    fetchAll,
    refetchBusinessList,
    approveBusiness,
    rejectBusiness,
    suspendBusiness,
    reactivateBusiness,
    terminateBusiness,
  } = useBusinessStore();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("card");
  const [reviewBusinessId, setReviewBusinessId] = useState(null);
  const [detailBusinessId, setDetailBusinessId] = useState(null);
  const searchDebounceRef = useRef(null);

const KYCProgress = ({ biz }) => {
  const items = [
    { label: "MST", ok: Boolean(biz.taxCode) },
    { label: "CCCD", ok: Boolean(biz.idCardFront || biz.idCardBack) },
    { label: "GPL", ok: Boolean(biz.businessLicense) },
    { label: "NH", ok: Boolean(biz.bankName && biz.bankAccount) },
    { label: "HĐ", ok: Boolean(biz.contractSigned) },
    { label: "CK", ok: Boolean(biz.commissionRate != null) },
  ];
  const done = items.filter((i) => i.ok).length;
  return (
    <div className="flex items-center gap-1" title={`KYC: ${done}/6`}>
      <div className="flex gap-0.5">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              "w-2 h-2 border",
              item.ok ? "bg-emerald-500 border-emerald-600" : "bg-red-100 border-red-400",
            )}
            title={item.label}
          />
        ))}
      </div>
      <span className="font-mono text-[9px] text-muted-foreground">{done}/6</span>
    </div>
  );
};

  useEffect(() => {
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 350);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setPage(1));
    return () => cancelAnimationFrame(id);
  }, [debouncedSearch, status]);

  useEffect(() => {
    fetchAll({ search: debouncedSearch, status, page });
  }, [debouncedSearch, status, page, fetchAll]);

  const handleRefresh = () => {
    refetchBusinessList();
    toast.success("Đã làm mới danh sách");
  };

  const handleSuspend = async (id) => {
    const reason = window.prompt(
      "Nhập lý do tạm khóa doanh nghiệp (tối thiểu 10 ký tự):\n\nLưu ý: Tất cả địa điểm sẽ bị ẩn, các đặt chỗ chưa hoàn thành sẽ tự động hủy và hoàn tiền.",
    );
    if (!reason || reason.trim().length < 10) {
      if (reason !== null) toast.error("Lý do phải có ít nhất 10 ký tự");
      return;
    }
    try {
      await suspendBusiness(id, reason.trim());
      toast.success("Đã tạm khóa doanh nghiệp");
    } catch (error) {
      toast.error(error.message || "Không thể tạm khóa");
    }
  };

  const handleReactivate = async (id) => {
    if (!window.confirm("Kích hoạt lại doanh nghiệp này? Các địa điểm sẽ được khôi phục.")) {
      return;
    }
    try {
      await reactivateBusiness(id);
      toast.success("Đã kích hoạt lại doanh nghiệp");
    } catch (error) {
      toast.error(error.message || "Không thể kích hoạt lại");
    }
  };

  const handleTerminate = async (id) => {
    const step1 = window.confirm(
      "⚠️ BƯỚC 1/2: Bạn có chắc muốn CHẤM DỨT HỢP ĐỒNG doanh nghiệp này?\n\nHành động này sẽ:\n- Ẩn tất cả địa điểm vĩnh viễn\n- Hủy tất cả đặt chỗ đang hoạt động + hoàn tiền\n- Vô hiệu hóa dịch vụ & voucher\n- Hạ quyền chủ tài khoản về User\n\nNhấn OK để tiếp tục bước 2.",
    );
    if (!step1) return;

    const confirmText = window.prompt(
      'BƯỚC 2/2: Gõ "CONFIRM" để xác nhận chấm dứt hợp đồng:',
    );
    if (confirmText !== "CONFIRM") {
      toast.error("Xác nhận không khớp. Hành động bị hủy.");
      return;
    }

    const reason = window.prompt(
      "Nhập lý do chấm dứt hợp đồng (tối thiểu 10 ký tự):",
    );
    if (!reason || reason.trim().length < 10) {
      if (reason !== null) toast.error("Lý do phải có ít nhất 10 ký tự");
      return;
    }

    try {
      await terminateBusiness(id, reason.trim());
      toast.success("Đã chấm dứt hợp đồng doanh nghiệp");
    } catch (error) {
      toast.error(error.message || "Không thể chấm dứt hợp đồng");
    }
  };

  const handleExportCsv = () => {
    if (!businesses || businesses.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }

    exportToCsv({
      columns: [
        { key: "id", label: "ID" },
        { key: "businessName", label: "Tên doanh nghiệp" },
        { key: (row) => BUSINESS_TYPE_LABELS[row.businessType] || row.businessType, label: "Loại hình" },
        { key: "status", label: "Trạng thái" },
        { key: (row) => row.owner?.email || "", label: "Email chủ" },
        { key: (row) => row.owner?.profile?.fullName || "", label: "Tên chủ" },
        { key: (row) => row.taxCode || "", label: "Mã số thuế" },
        { key: (row) => (row.contractSigned ? "Đã ký" : "Chưa ký"), label: "Hợp đồng" },
        { key: (row) => row._count?.places ?? 0, label: "Địa điểm" },
        { key: (row) => row._count?.services ?? 0, label: "Dịch vụ" },
        { key: (row) => row._count?.vouchers ?? 0, label: "Voucher" },
        { key: (row) => row._count?.bookings ?? 0, label: "Booking" },
      ],
      data: businesses,
      filename: slugifyFilename("danh_sach_doanh_nghiep"),
    });

    toast.success(`Đã xuất ${businesses.length} bản ghi`);
  };

  const s = summary || {
    totalBusinesses: 0,
    pending: 0,
    approved: 0,
    approvedWithoutContract: 0,
    totalPlaces: 0,
  };

  return (
    <div className="min-h-screen p-8 bg-[#F4F4F4] relative font-sans">
      <div className="absolute inset-0 bg-grid-pattern bg-grid-20 opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-grid-dots opacity-40 pointer-events-none" />

      <div className="relative z-10 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-black pb-6 gap-4">
          <div className="flex items-center gap-6">
            <div className="accent-bar h-16" />
            <div>
              <h1 className="tim-title">QUẢN LÝ DOANH NGHIỆP</h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1">
                  DATABASE // BUSINESSES
                </span>
                <p className="tim-meta">DUYỆT HỒ SƠ · VẬN HÀNH ĐỐI TÁC</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={handleExportCsv}
              className="h-12 px-4 flex items-center justify-center border border-black bg-white hover:bg-black hover:text-white transition-colors shrink-0 font-mono text-xs uppercase font-bold gap-2"
              title="Xuất CSV"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              className="h-12 w-12 flex items-center justify-center border border-black bg-white hover:bg-gray-100 transition-colors shrink-0"
              title="Làm mới"
            >
              <RefreshCw
                className={`h-5 w-5 text-black ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Stats — cùng kiểu danh mục */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <TimStatsCard
            title="TỔNG HỒ SƠ"
            value={s.totalBusinesses}
            icon={Briefcase}
            serial="BIZ-001"
          />
          <TimStatsCard
            title="CHỜ DUYỆT"
            value={s.pending}
            icon={Clock}
            serial="BIZ-002"
            textColor="text-amber-600"
          />
          <TimStatsCard
            title="ĐÃ DUYỆT"
            value={s.approved}
            icon={CheckCircle2}
            serial="BIZ-003"
            textColor="text-emerald-600"
          />
          <TimStatsCard
            title="TỔNG ĐỊA ĐIỂM (ĐỐI TÁC)"
            value={s.totalPlaces}
            icon={MapPin}
            serial="BIZ-004"
            color="bg-yellow-50"
          />
          <TimStatsCard
            title="ĐÃ DUYỆT CHƯA KÝ HĐ"
            value={s.approvedWithoutContract}
            icon={FileSignature}
            serial="BIZ-005"
            color="bg-red-50"
            textColor="text-red-700"
          />
        </div>

        {/* Filter bar */}
        <div className="flex flex-col md:flex-row w-full border border-black bg-white min-h-[56px] shadow-sm">
          <div className="flex flex-1 border-b md:border-b-0 md:border-r border-black">
            <div className="h-full min-h-[56px] w-14 bg-black flex items-center justify-center shrink-0">
              <Search className="h-5 w-5 text-white" />
            </div>
            <input
              type="text"
              placeholder="TÌM THEO TÊN DN, EMAIL, HỌ TÊN CHỦ..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 bg-zinc-50 px-4 font-mono text-sm uppercase focus:outline-none focus:bg-yellow-50 placeholder:text-gray-400 transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-0 md:border-l-0">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`flex-1 min-w-[100px] px-3 py-3 font-mono text-[11px] font-bold uppercase tracking-wider border-b md:border-b-0 md:border-r border-black last:border-r-0 transition-colors ${
                  status === opt.value
                    ? "bg-black text-white"
                    : "bg-white hover:bg-muted/60 text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* View toggle */}
          <div className="flex border-l border-black">
            <button
              type="button"
              onClick={() => setViewMode("card")}
              className={cn(
                "px-3 py-3 transition-colors",
                viewMode === "card" ? "bg-black text-white" : "bg-white hover:bg-muted/60 text-foreground",
              )}
              title="Card view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "px-3 py-3 border-l border-black transition-colors",
                viewMode === "table" ? "bg-black text-white" : "bg-white hover:bg-muted/60 text-foreground",
              )}
              title="Table view"
            >
              <Table2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {(() => {
          if (loading) {
            return (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-black border-t-primary rounded-full animate-spin" />
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  LOADING BUSINESS STREAM...
                </div>
              </div>
            );
          }

          if (businesses.length === 0) {
            return (
              <div className="border-2 border-dashed border-black bg-white/80 p-16 text-center">
                <Briefcase className="h-14 w-14 mx-auto text-muted-foreground mb-4" />
                <p className="font-semibold text-lg uppercase tracking-tight">
                  Không có doanh nghiệp nào
                </p>
                <p className="text-sm text-muted-foreground mt-2 font-mono">
                  Thử đổi bộ lọc hoặc từ khóa tìm kiếm.
                </p>
              </div>
            );
          }

          return (
            <>
              {viewMode === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {businesses.map((biz) => (
                  <div
                    key={biz.id}
                    className="relative group bg-white border-2 border-black transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col"
                  >
                    <div className="absolute inset-0 bg-grid-dots opacity-25 pointer-events-none" />

                    <div className="h-36 bg-gradient-to-br from-neutral-800 to-neutral-950 relative border-b-2 border-black overflow-hidden shrink-0">
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Briefcase className="h-14 w-14 text-white/25 group-hover:text-[#F3E600]/60 transition-colors" />
                        <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest mt-2">
                          PARTNER
                        </span>
                      </div>
                      <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-sm border border-white/20 px-2 py-1">
                        <span className="font-mono text-[10px] text-white">
                          #{biz.id}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        {getBusinessStatusBadge(biz.status)}
                      </div>
                      <div className="absolute bottom-0 left-0 w-1 h-full bg-[#F3E600] group-hover:w-2 transition-all" />
                    </div>

                    <div className="p-5 relative bg-white flex-1 flex flex-col">
                      <h3
                        className="font-black text-base leading-tight uppercase mb-2 tracking-tight line-clamp-2 min-h-[2.5rem]"
                        title={biz.businessName}
                      >
                        {biz.businessName}
                      </h3>

                      <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 mb-4 uppercase flex-wrap">
                        <span className="bg-gray-100 px-2 py-0.5 border border-gray-300">
                          {BUSINESS_TYPE_LABELS[biz.businessType] ||
                            biz.businessType}
                        </span>
                        <span
                          className={`px-2 py-0.5 border ${
                            biz.contractSigned
                              ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                              : "bg-red-50 border-red-400 text-red-700"
                          }`}
                        >
                          {biz.contractSigned ? "ĐÃ KÝ HĐ" : "CHƯA KÝ HĐ"}
                        </span>
                        <span className="text-gray-300">//</span>
                        <span
                          className="truncate max-w-[180px]"
                          title={biz.owner?.email}
                        >
                          {biz.owner?.email || "—"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t-2 border-black pt-4 mb-4">
                        <div className="text-center bg-gray-50 border border-gray-200 p-2">
                          <div className="text-[10px] text-gray-400 font-mono uppercase mb-1 flex items-center justify-center gap-1">
                            <MapPin className="w-3 h-3" /> ĐỊA ĐIỂM
                          </div>
                          <div className="font-black text-xl tracking-tighter">
                            {biz._count?.places ?? 0}
                          </div>
                        </div>
                        <div className="text-center bg-yellow-50 border border-yellow-200 p-2">
                          <div className="text-[10px] text-gray-500 font-mono uppercase mb-1 flex items-center justify-center gap-1">
                            <Layers className="w-3 h-3" /> DỊCH VỤ
                          </div>
                          <div className="font-black text-xl tracking-tighter text-yellow-800">
                            {biz._count?.services ?? 0}
                          </div>
                        </div>
                        <div className="text-center bg-gray-50 border border-gray-200 p-2">
                          <div className="text-[10px] text-gray-400 font-mono uppercase mb-1 flex items-center justify-center gap-1">
                            <Ticket className="w-3 h-3" /> VOUCHER
                          </div>
                          <div className="font-black text-xl tracking-tighter">
                            {biz._count?.vouchers ?? 0}
                          </div>
                        </div>
                        <div className="text-center bg-slate-50 border border-slate-200 p-2">
                          <div className="text-[10px] text-gray-500 font-mono uppercase mb-1 flex items-center justify-center gap-1">
                            <CalendarCheck className="w-3 h-3" /> ĐẶT CHỖ
                          </div>
                          <div className="font-black text-xl tracking-tighter">
                            {biz._count?.bookings ?? 0}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-black/10 pt-2">
                        <KYCProgress biz={biz} />
                        <span className={cn("font-mono text-[10px] uppercase px-1.5 py-0.5 border", biz.contractSigned ? "bg-emerald-50 border-emerald-400 text-emerald-700" : "bg-red-50 border-red-400 text-red-700")}>
                          {biz.contractSigned ? "Đã ký HĐ" : "Chưa ký HĐ"}
                        </span>
                      </div>

                      <div className="mt-auto flex flex-wrap gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => setDetailBusinessId(biz.id)}
                          className="rounded-none border-black font-mono text-[11px] uppercase font-bold gap-1.5"
                        >
                          <MapPin className="h-4 w-4" />
                          Chi tiết &amp; địa điểm
                        </Button>
                        {biz.status === BUSINESS_STATUS.PENDING && (
                          <Button
                            size="sm"
                            onClick={() => setReviewBusinessId(biz.id)}
                            className="rounded-none border-black bg-black text-white hover:bg-[#F3E600] hover:text-black font-mono text-[11px] uppercase font-bold gap-1.5"
                          >
                            <ClipboardCheck className="h-4 w-4" />
                            Đối chiếu & duyệt
                          </Button>
                        )}
                        {biz.status === BUSINESS_STATUS.APPROVED && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSuspend(biz.id)}
                            className="rounded-none border-amber-600 text-amber-900 hover:bg-amber-50 font-mono text-[11px] uppercase font-bold"
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Tạm ngưng
                          </Button>
                        )}
                        {biz.status === BUSINESS_STATUS.SUSPENDED && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReactivate(biz.id)}
                            className="rounded-none border-emerald-600 text-emerald-900 hover:bg-emerald-50 font-mono text-[11px] uppercase font-bold"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Kích hoạt lại
                          </Button>
                        )}
                        {(biz.status === BUSINESS_STATUS.APPROVED || biz.status === BUSINESS_STATUS.SUSPENDED) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTerminate(biz.id)}
                            className="rounded-none border-red-700 text-red-800 hover:bg-red-50 font-mono text-[11px] uppercase font-bold"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Chấm dứt HĐ
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              ) : (
              <div className="border-2 border-black bg-white overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black text-white font-mono text-[10px] uppercase tracking-wider">
                      <th className="px-3 py-3 text-left border-r border-white/20">#</th>
                      <th className="px-3 py-3 text-left border-r border-white/20">Tên DN</th>
                      <th className="px-3 py-3 text-left border-r border-white/20">Loại</th>
                      <th className="px-3 py-3 text-left border-r border-white/20">Trạng thái</th>
                      <th className="px-3 py-3 text-left border-r border-white/20">KYC</th>
                      <th className="px-3 py-3 text-left border-r border-white/20">HĐ</th>
                      <th className="px-3 py-3 text-left border-r border-white/20">Email chủ</th>
                      <th className="px-3 py-3 text-center border-r border-white/20">Địa điểm</th>
                      <th className="px-3 py-3 text-center border-r border-white/20">Dịch vụ</th>
                      <th className="px-3 py-3 text-center border-r border-white/20">Voucher</th>
                      <th className="px-3 py-3 text-center border-r border-white/20">Booking</th>
                      <th className="px-3 py-3 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    {businesses.map((biz) => (
                      <tr key={biz.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{biz.id}</td>
                        <td className="px-3 py-2 font-semibold text-xs uppercase max-w-[200px] truncate" title={biz.businessName}>{biz.businessName}</td>
                        <td className="px-3 py-2 text-[11px]">{BUSINESS_TYPE_LABELS[biz.businessType] || biz.businessType}</td>
                        <td className="px-3 py-2">{getBusinessStatusBadge(biz.status)}</td>
                        <td className="px-3 py-2"><KYCProgress biz={biz} /></td>
                        <td className="px-3 py-2">
                          <span className={cn("font-mono text-[10px] uppercase px-1.5 py-0.5 border", biz.contractSigned ? "bg-emerald-50 border-emerald-400 text-emerald-700" : "bg-red-50 border-red-400 text-red-700")}>
                            {biz.contractSigned ? "Đã ký" : "Chưa"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[11px] text-muted-foreground truncate max-w-[160px]" title={biz.owner?.email}>{biz.owner?.email || "—"}</td>
                        <td className="px-3 py-2 text-center font-mono text-xs">{biz._count?.places ?? 0}</td>
                        <td className="px-3 py-2 text-center font-mono text-xs">{biz._count?.services ?? 0}</td>
                        <td className="px-3 py-2 text-center font-mono text-xs">{biz._count?.vouchers ?? 0}</td>
                        <td className="px-3 py-2 text-center font-mono text-xs">{biz._count?.bookings ?? 0}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="outline" onClick={() => setDetailBusinessId(biz.id)} className="rounded-none border-black font-mono text-[10px] uppercase h-7 px-2">Chi tiết</Button>
                            {biz.status === BUSINESS_STATUS.PENDING && (
                              <Button size="sm" onClick={() => setReviewBusinessId(biz.id)} className="rounded-none bg-black text-white hover:bg-[#F3E600] hover:text-black font-mono text-[10px] uppercase h-7 px-2">Duyệt</Button>
                            )}
                            {biz.status === BUSINESS_STATUS.APPROVED && (
                              <Button size="sm" variant="outline" onClick={() => handleSuspend(biz.id)} className="rounded-none border-amber-600 text-amber-900 hover:bg-amber-50 font-mono text-[10px] uppercase h-7 px-2">Tạm khóa</Button>
                            )}
                            {biz.status === BUSINESS_STATUS.SUSPENDED && (
                              <Button size="sm" variant="outline" onClick={() => handleReactivate(biz.id)} className="rounded-none border-emerald-600 text-emerald-900 hover:bg-emerald-50 font-mono text-[10px] uppercase h-7 px-2">Kích hoạt</Button>
                            )}
                            {(biz.status === BUSINESS_STATUS.APPROVED || biz.status === BUSINESS_STATUS.SUSPENDED) && (
                              <Button size="sm" variant="outline" onClick={() => handleTerminate(biz.id)} className="rounded-none border-red-700 text-red-800 hover:bg-red-50 font-mono text-[10px] uppercase h-7 px-2">Chấm dứt</Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}

              {pagination.totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t-2 border-black">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-none border-black font-mono text-xs uppercase"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Trước
                  </Button>
                  <span className="font-mono text-xs text-muted-foreground">
                    TRANG {page} / {pagination.totalPages} · Tổng{" "}
                    {pagination.total} hồ sơ
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() =>
                      setPage((p) => Math.min(pagination.totalPages, p + 1))
                    }
                    className="rounded-none border-black font-mono text-xs uppercase"
                  >
                    Sau
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          );
        })()}
      </div>

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
        onApproved={(id, payload) => approveBusiness(id, payload)}
        onRejected={(id, reason) => rejectBusiness(id, reason)}
      />
    </div>
  );
};

export default BusinessListPage;
