import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
import TimStatsCard from "@/components/admin/TimStatsCard";
import {
  BUSINESS_STATUS,
  BUSINESS_TYPE_LABELS,
} from "@/constants/businessConstants";
import { getTableSerialNumber } from "@/utils/tableSerial";

const getBusinessStatusBadge = (status) => {
  const config = {
    [BUSINESS_STATUS.PENDING]: {
      label: "PENDING",
      className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50 animate-pulse",
    },
    [BUSINESS_STATUS.APPROVED]: {
      label: "APPROVED",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50",
    },
    [BUSINESS_STATUS.REJECTED]: {
      label: "REJECTED",
      className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50",
    },
    [BUSINESS_STATUS.SUSPENDED]: {
      label: "SUSPENDED",
      className: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    },
    [BUSINESS_STATUS.TERMINATED]: {
      label: "TERMINATED",
      className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/30",
    },
    [BUSINESS_STATUS.SUSPICIOUS]: {
      label: "SUSPICIOUS",
      className: "bg-orange-50 text-orange-700 border-orange-200 animate-pulse dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/50",
    },
  };
  const c = config[status] || {
    label: String(status).toUpperCase(),
    className: "bg-zinc-100 text-zinc-700 border-zinc-200",
  };
  return (
    <div className={cn("px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full border shadow-sm backdrop-blur-sm", c.className)}>
      {c.label}
    </div>
  );
};

const BusinessListPage = ({ initialStatus = "all" }) => {
  const { t } = useTranslation();

  const STATUS_OPTIONS = [
    { value: "all", label: t("admin.business.all") },
    { value: "pending", label: t("admin.business.pendingApproval") },
    { value: "approved", label: t("admin.business.approved") },
    { value: "rejected", label: t("admin.business.rejected") },
    { value: "suspended", label: t("admin.business.suspended") },
    { value: "terminated", label: t("admin.business.terminated") },
    { value: "suspicious", label: t("admin.business.suspicious") },
  ];

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("card");
  const [reviewBusinessId, setReviewBusinessId] = useState(null);
  const [detailBusinessId, setDetailBusinessId] = useState(null);
  const searchDebounceRef = useRef(null);

  const queryParams = useMemo(
    () => ({ search: debouncedSearch, status, page }),
    [debouncedSearch, status, page],
  );

  const { data: queryResult, isLoading, refetch } = useBusinesses(queryParams);
  const approveMutation = useApproveBusiness();
  const rejectMutation = useRejectBusiness();
  const suspendMutation = useSuspendBusiness();
  const reactivateMutation = useReactivateBusiness();
  const terminateMutation = useTerminateBusiness();

  const businesses = queryResult?.data ?? [];
  const pagination = queryResult?.pagination ?? { page: 1, totalPages: 1, total: 0 };
  const summary = queryResult?.summary ?? null;
  const loading = isLoading;

const KYCProgress = ({ biz }) => {
  const items = [
    { label: "MST", ok: Boolean(biz.taxCode || biz.taxCodeMasked) },
    { label: "CCCD", ok: Boolean(biz.idCardFront || biz.idCardBack || biz.hasIdCardFront || biz.hasIdCardBack) },
    { label: "GPL", ok: Boolean(biz.businessLicense || biz.hasBusinessLicense) },
    { label: "NH", ok: Boolean(biz.bankName && (biz.bankAccountNumber || biz.bankAccountNumberMasked || biz.bankAccount)) },
    { label: "HĐ", ok: Boolean(biz.contractSigned) },
    { label: "CK", ok: Boolean(biz.commissionRate != null) },
  ];
  const done = items.filter((i) => i.ok).length;
  const percentage = Math.round((done / items.length) * 100);
  return (
    <div className="flex items-center gap-2" title={`KYC: ${done}/6`}>
      <div className="w-24 h-1.5 bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800 border border-zinc-200/50">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            done === 6 ? "bg-emerald-500" : done >= 3 ? "bg-amber-500" : "bg-red-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="font-mono text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">{done}/6</span>
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

  const handleRefresh = () => {
    refetch();
    toast.success(t("admin.business.refreshList"));
  };

  const handleSuspend = async (id) => {
    const reason = window.prompt(t("admin.business.suspendPrompt"));
    if (!reason || reason.trim().length < 10) {
      if (reason !== null) toast.error(t("admin.business.reasonMinLength"));
      return;
    }
    try {
      await suspendMutation.mutateAsync({ id, reason: reason.trim() });
      toast.success(t("admin.business.businessSuspended"));
    } catch (error) {
      toast.error(error.message || t("admin.business.suspendFailed"));
    }
  };

  const handleReactivate = async (id) => {
    if (!window.confirm(t("admin.business.reactivateConfirm"))) {
      return;
    }
    try {
      await reactivateMutation.mutateAsync(id);
      toast.success(t("admin.business.businessReactivated"));
    } catch (error) {
      toast.error(error.message || t("admin.business.reactivateFailed"));
    }
  };

  const handleTerminate = async (id) => {
    const step1 = window.confirm(t("admin.business.terminateStep1Confirm"));
    if (!step1) return;

    const confirmText = window.prompt(t("admin.business.terminateStep2Prompt"));
    if (confirmText !== "CONFIRM") {
      toast.error(t("admin.business.confirmMismatch"));
      return;
    }

    const reason = window.prompt(t("admin.business.terminateReasonPrompt"));
    if (!reason || reason.trim().length < 10) {
      if (reason !== null) toast.error(t("admin.business.reasonMinLength"));
      return;
    }

    try {
      await terminateMutation.mutateAsync({ id, reason: reason.trim() });
      toast.success(t("admin.business.businessTerminated"));
    } catch (error) {
      toast.error(error.message || t("admin.business.terminateFailed"));
    }
  };

  const handleExportCsv = () => {
    if (!businesses || businesses.length === 0) {
      toast.error(t("admin.business.noDataToExport"));
      return;
    }

    exportToCsv({
      columns: [
        { key: "id", label: "ID" },
        { key: "businessName", label: t("admin.business.csvColumns.businessName") },
        { key: (row) => BUSINESS_TYPE_LABELS[row.businessType] || row.businessType, label: t("admin.business.csvColumns.type") },
        { key: "status", label: t("admin.business.status") },
        { key: (row) => row.owner?.email || "", label: t("admin.business.ownerEmail") },
        { key: (row) => row.owner?.profile?.fullName || "", label: t("admin.business.csvColumns.ownerName") },
        { key: (row) => row.taxCode || "", label: t("admin.business.csvColumns.taxCode") },
        { key: (row) => (row.contractSigned ? t("admin.business.csvColumns.signed") : t("admin.business.csvColumns.unsigned")), label: t("admin.business.contract") },
        { key: (row) => row._count?.places ?? 0, label: t("admin.business.places") },
        { key: (row) => row._count?.services ?? 0, label: t("admin.business.services") },
        { key: (row) => row._count?.vouchers ?? 0, label: t("admin.business.vouchers") },
        { key: (row) => row._count?.bookings ?? 0, label: t("admin.business.bookings") },
      ],
      data: businesses,
      filename: slugifyFilename("danh_sach_doanh_nghiep"),
    });

    toast.success(t("admin.business.exportSuccess", { count: businesses.length }));
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
            <div className="accent-bar h-16 shrink-0" />
            <div>
              <h1 className="tim-title">{t("admin.business.title")}</h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1 shrink-0">
                  {t("admin.business.system")}
                </span>
                <p className="tim-meta">{t("admin.business.subtitle")}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex-1 md:flex-initial h-12 px-4 flex items-center justify-center border border-black bg-white hover:bg-black hover:text-white transition-colors shrink-0 font-mono text-xs uppercase font-bold gap-2"
              title={t("admin.business.csvExport")}
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              className="h-12 w-12 flex items-center justify-center border border-black bg-white hover:bg-gray-100 transition-colors shrink-0"
              title={t("common.refresh")}
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
            title={t("admin.business.totalProfiles")}
            value={s.totalBusinesses}
            icon={Briefcase}
            serial="BIZ-001"
          />
          <TimStatsCard
            title={t("admin.business.pendingApproval")}
            value={s.pending}
            icon={Clock}
            serial="BIZ-002"
            textColor="text-amber-600"
          />
          <TimStatsCard
            title={t("admin.business.approved")}
            value={s.approved}
            icon={CheckCircle2}
            serial="BIZ-003"
            textColor="text-emerald-600"
          />
          <TimStatsCard
            title={t("admin.business.totalPartnerPlaces")}
            value={s.totalPlaces}
            icon={MapPin}
            serial="BIZ-004"
            color="bg-yellow-50"
          />
          <TimStatsCard
            title={t("admin.business.approvedNoContract")}
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
              placeholder={t("admin.business.searchPlaceholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 bg-zinc-50 px-4 font-mono text-sm uppercase focus:outline-none focus:bg-yellow-50 placeholder:text-gray-400 transition-colors"
            />
          </div>
          <div className="hidden lg:flex flex-wrap gap-0">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`flex-1 min-w-[100px] px-3 py-3 font-mono text-[11px] font-bold uppercase tracking-wider border-b lg:border-b-0 lg:border-r border-black last:border-r-0 transition-colors ${
                  status === opt.value
                    ? "bg-black text-white"
                    : "bg-white hover:bg-muted/60 text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Mobile Status Selector */}
          <div className="flex lg:hidden border-b lg:border-b-0 border-black w-full bg-white">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-12 px-4 font-mono text-xs uppercase focus:outline-none bg-white"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {/* View toggle */}
          <div className="flex border-l border-black ml-auto lg:ml-0">
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
                  {t("admin.business.loading")}
                </div>
              </div>
            );
          }

          if (!businesses || businesses.length === 0) {
            return (
              <div className="border-2 border-dashed border-black bg-white/80 p-16 text-center">
                <Briefcase className="h-14 w-14 mx-auto text-muted-foreground mb-4" />
                <p className="font-semibold text-lg uppercase tracking-tight">
                  {t("admin.business.noBusinesses")}
                </p>
                <p className="text-sm text-muted-foreground mt-2 font-mono">
                  {t("admin.business.noBusinessesHint")}
                </p>
              </div>
            );
          }

          return (
            <>
              {viewMode === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {(businesses || []).map((biz, index) => (
                  <div
                    key={biz.id}
                    className="relative group bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 overflow-hidden flex flex-col"
                  >
                    <div className="absolute inset-0 bg-grid-dots opacity-25 pointer-events-none" />

                    <div className="h-32 bg-gradient-to-br from-zinc-800 to-zinc-950 relative border-b border-zinc-100 dark:border-zinc-800 overflow-hidden shrink-0 rounded-t-2xl">
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Briefcase className="h-10 w-10 text-white/20 group-hover:text-[#F3E600]/80 transition-colors" />
                        <span className="font-sans text-[10px] text-white/40 uppercase tracking-widest font-semibold mt-2">
                          PARTNER
                        </span>
                      </div>
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-0.5 rounded-full">
                        <span className="font-mono text-[10px] text-white font-semibold">
                          {getTableSerialNumber(
                            pagination.total || businesses.length,
                            index,
                            page,
                            pagination.limit || businesses.length,
                          )}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        {getBusinessStatusBadge(biz.status)}
                      </div>
                      <div className="absolute bottom-0 left-0 w-1 h-full bg-[#F3E600] group-hover:w-1.5 transition-all" />
                    </div>

                    <div className="p-5 relative bg-white dark:bg-zinc-900 flex-1 flex flex-col">
                      <h3
                        className="font-bold text-base text-zinc-900 dark:text-zinc-100 leading-tight uppercase mb-2 tracking-tight line-clamp-2 min-h-[2.5rem]"
                        title={biz.businessName}
                      >
                        {biz.businessName}
                      </h3>

                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400 mb-4 flex-wrap">
                        <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-medium">
                          {BUSINESS_TYPE_LABELS[biz.businessType] ||
                            biz.businessType}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full font-medium border",
                            biz.contractSigned
                              ? "bg-emerald-50/50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400"
                              : "bg-red-50/50 border-red-100 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400"
                          )}
                        >
                          {biz.contractSigned ? t("admin.business.contractSigned") : t("admin.business.contractUnsigned")}
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span
                          className="truncate max-w-[150px] font-mono text-zinc-400"
                          title={biz.owner?.email}
                        >
                          {biz.owner?.email || "—"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 border-t border-zinc-100 dark:border-zinc-800 pt-4 mb-4">
                        <div className="text-center bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-xl p-2.5 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900">
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400" /> {t("admin.business.places")}
                          </div>
                          <div className="font-bold text-lg text-zinc-800 dark:text-zinc-200">
                            {biz._count?.places ?? 0}
                          </div>
                        </div>
                        <div className="text-center bg-amber-50/30 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-950/30 rounded-xl p-2.5 transition-all hover:bg-amber-50/50">
                          <div className="text-[10px] text-amber-600/80 dark:text-amber-500 font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-amber-500" /> {t("admin.business.services")}
                          </div>
                          <div className="font-bold text-lg text-amber-700 dark:text-amber-400">
                            {biz._count?.services ?? 0}
                          </div>
                        </div>
                        <div className="text-center bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-xl p-2.5 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900">
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                            <Ticket className="w-3.5 h-3.5 text-zinc-400" /> {t("admin.business.vouchers")}
                          </div>
                          <div className="font-bold text-lg text-zinc-800 dark:text-zinc-200">
                            {biz._count?.vouchers ?? 0}
                          </div>
                        </div>
                        <div className="text-center bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-xl p-2.5 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900">
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                            <CalendarCheck className="w-3.5 h-3.5 text-zinc-400" /> {t("admin.business.bookings")}
                          </div>
                          <div className="font-bold text-lg text-zinc-800 dark:text-zinc-200">
                            {biz._count?.bookings ?? 0}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3 pb-4">
                        <KYCProgress biz={biz} />
                        <span className={cn("text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border", biz.contractSigned ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400" : "bg-red-50 border-red-100 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400")}>
                          {biz.contractSigned ? t("admin.business.contractSigned") : t("admin.business.contractUnsigned")}
                        </span>
                      </div>

                      <div className="mt-auto flex flex-wrap gap-2 justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => setDetailBusinessId(biz.id)}
                          className="rounded-xl border-zinc-200 dark:border-zinc-800 font-semibold text-[11px] gap-1.5 h-9"
                        >
                          <MapPin className="h-4 w-4" />
                          {t("admin.business.detailsAndPlaces")}
                        </Button>
                        {biz.status === BUSINESS_STATUS.PENDING && (
                          <Button
                            size="sm"
                            onClick={() => setReviewBusinessId(biz.id)}
                            className="rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 text-white font-semibold text-[11px] gap-1.5 h-9 shadow-sm"
                          >
                            <ClipboardCheck className="h-4 w-4" />
                            {t("admin.business.crossCheckApprove")}
                          </Button>
                        )}
                        {biz.status === BUSINESS_STATUS.APPROVED && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSuspend(biz.id)}
                            className="rounded-xl border-amber-200 text-amber-700 dark:border-amber-900/30 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 font-semibold text-[11px] h-9 gap-1.5"
                          >
                            <Pause className="h-4 w-4" />
                            {t("admin.business.suspend")}
                          </Button>
                        )}
                        {biz.status === BUSINESS_STATUS.SUSPENDED && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReactivate(biz.id)}
                            className="rounded-xl border-emerald-200 text-emerald-700 dark:border-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 font-semibold text-[11px] h-9 gap-1.5"
                          >
                            <RotateCcw className="h-4 w-4" />
                            {t("admin.business.reactivate")}
                          </Button>
                        )}
                        {(biz.status === BUSINESS_STATUS.APPROVED || biz.status === BUSINESS_STATUS.SUSPENDED) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTerminate(biz.id)}
                            className="rounded-xl border-red-200 text-red-700 dark:border-red-900/30 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-semibold text-[11px] h-9 gap-1.5"
                          >
                            <XCircle className="h-4 w-4" />
                            {t("admin.business.terminateContract")}
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
                      <th className="px-3 py-3 text-left border-r border-white/20 hidden sm:table-cell">STT</th>
                      <th className="px-3 py-3 text-left border-r border-white/20">{t("admin.business.businessName")}</th>
                      <th className="px-3 py-3 text-left border-r border-white/20">{t("admin.business.type")}</th>
                      <th className="px-3 py-3 text-left border-r border-white/20">{t("admin.business.status")}</th>
                      <th className="px-3 py-3 text-left border-r border-white/20 hidden md:table-cell">{t("admin.business.kyc")}</th>
                      <th className="px-3 py-3 text-left border-r border-white/20">{t("admin.business.contract")}</th>
                      <th className="px-3 py-3 text-left border-r border-white/20 hidden lg:table-cell">{t("admin.business.ownerEmail")}</th>
                      <th className="px-3 py-3 text-center border-r border-white/20 hidden md:table-cell">{t("admin.business.places")}</th>
                      <th className="px-3 py-3 text-center border-r border-white/20 hidden md:table-cell">{t("admin.business.services")}</th>
                      <th className="px-3 py-3 text-center border-r border-white/20 hidden md:table-cell">{t("admin.business.vouchers")}</th>
                      <th className="px-3 py-3 text-center border-r border-white/20 hidden md:table-cell">{t("admin.business.bookings")}</th>
                      <th className="px-3 py-3 text-right">{t("admin.business.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    {(businesses || []).map((biz, index) => (
                      <tr key={biz.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground hidden sm:table-cell">
                          {getTableSerialNumber(
                            pagination.total || businesses.length,
                            index,
                            page,
                            pagination.limit || businesses.length,
                          )}
                        </td>
                        <td className="px-3 py-2 font-semibold text-xs uppercase max-w-[200px] truncate" title={biz.businessName}>
                          {biz.businessName}
                          <div className="lg:hidden text-[10px] text-muted-foreground font-mono font-normal mt-1 truncate max-w-[160px]" title={biz.owner?.email}>
                            {biz.owner?.email || "—"}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-[11px]">{BUSINESS_TYPE_LABELS[biz.businessType] || biz.businessType}</td>
                        <td className="px-3 py-2">{getBusinessStatusBadge(biz.status)}</td>
                        <td className="px-3 py-2 hidden md:table-cell"><KYCProgress biz={biz} /></td>
                        <td className="px-3 py-2">
                          <span className={cn("font-mono text-[10px] uppercase px-1.5 py-0.5 border", biz.contractSigned ? "bg-emerald-50 border-emerald-400 text-emerald-700" : "bg-red-50 border-red-400 text-red-700")}>
                            {biz.contractSigned ? t("admin.business.contractSignedShort") : t("admin.business.contractUnsignedShort")}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[11px] text-muted-foreground truncate max-w-[160px] hidden lg:table-cell" title={biz.owner?.email}>{biz.owner?.email || "—"}</td>
                        <td className="px-3 py-2 text-center font-mono text-xs hidden md:table-cell">{biz._count?.places ?? 0}</td>
                        <td className="px-3 py-2 text-center font-mono text-xs hidden md:table-cell">{biz._count?.services ?? 0}</td>
                        <td className="px-3 py-2 text-center font-mono text-xs hidden md:table-cell">{biz._count?.vouchers ?? 0}</td>
                        <td className="px-3 py-2 text-center font-mono text-xs hidden md:table-cell">{biz._count?.bookings ?? 0}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="outline" onClick={() => setDetailBusinessId(biz.id)} className="rounded-none border-black font-mono text-[10px] uppercase h-7 px-2">{t("admin.business.details")}</Button>
                            {biz.status === BUSINESS_STATUS.PENDING && (
                              <Button size="sm" onClick={() => setReviewBusinessId(biz.id)} className="rounded-none bg-black text-white hover:bg-[#F3E600] hover:text-black font-mono text-[10px] uppercase h-7 px-2">{t("admin.business.approve")}</Button>
                            )}
                            {biz.status === BUSINESS_STATUS.APPROVED && (
                              <Button size="sm" variant="outline" onClick={() => handleSuspend(biz.id)} className="rounded-none border-amber-600 text-amber-900 hover:bg-amber-50 font-mono text-[10px] uppercase h-7 px-2">{t("admin.business.lock")}</Button>
                            )}
                            {biz.status === BUSINESS_STATUS.SUSPENDED && (
                              <Button size="sm" variant="outline" onClick={() => handleReactivate(biz.id)} className="rounded-none border-emerald-600 text-emerald-900 hover:bg-emerald-50 font-mono text-[10px] uppercase h-7 px-2">{t("admin.business.reactivate")}</Button>
                            )}
                            {(biz.status === BUSINESS_STATUS.APPROVED || biz.status === BUSINESS_STATUS.SUSPENDED) && (
                              <Button size="sm" variant="outline" onClick={() => handleTerminate(biz.id)} className="rounded-none border-red-700 text-red-800 hover:bg-red-50 font-mono text-[10px] uppercase h-7 px-2">{t("admin.business.terminateContract")}</Button>
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
                    {t("admin.business.prevPage")}
                  </Button>
                  <span className="font-mono text-xs text-muted-foreground">
                    {t("admin.business.pagination", { page, totalPages: pagination.totalPages, total: pagination.total })}
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
                    {t("admin.business.nextPage")}
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
        onApproved={(id, payload) => approveMutation.mutateAsync({ id, data: payload })}
        onRejected={(id, reason) => rejectMutation.mutateAsync({ id, reason })}
      />
    </div>
  );
};

export default BusinessListPage;
