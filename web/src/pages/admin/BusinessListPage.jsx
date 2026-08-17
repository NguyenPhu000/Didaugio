// MAP: BusinessListPage
// ├── UI: @/components/admin/businesses/{BusinessHeaderFilters, BusinessMasterList, BusinessDetailInspector}
// └── API: @/hooks/queries/useBusinessAdminQueries

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Store } from "lucide-react";
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
import { BUSINESS_TYPE_LABELS } from "@/constants/businessConstants";

// Extracted Sub-Components
import { getKycDetails } from "@/components/admin/businesses/businessAdminConstants";
import BusinessHeaderFilters from "@/components/admin/businesses/BusinessHeaderFilters";
import BusinessMasterList from "@/components/admin/businesses/BusinessMasterList";
import BusinessDetailInspector from "@/components/admin/businesses/BusinessDetailInspector";

const BusinessListPage = ({ initialStatus = "all" }) => {
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

  const {
    data: queryResult,
    isLoading,
    isFetching,
    refetch,
  } = useBusinesses(queryParams);
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
      if (
        !selectedBusinessId ||
        !businesses.some((b) => b.id === selectedBusinessId)
      ) {
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
    if (
      !window.confirm(
        "Kích hoạt lại doanh nghiệp này? Các địa điểm và dịch vụ sẽ được khôi phục."
      )
    ) {
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

    const confirmText = window.prompt(
      'Gõ "CONFIRM" để xác nhận chấm dứt hợp đồng vĩnh viễn:'
    );
    if (confirmText !== "CONFIRM") {
      toast.error("Xác nhận không khớp. Thao tác bị hủy bỏ.");
      return;
    }

    const reason = window.prompt(
      "Nhập lý do chấm dứt hợp đồng (tối thiểu 10 ký tự):"
    );
    if (!reason || reason.trim().length < 10) {
      if (reason !== null) toast.error("Lý do phải có ít nhất 10 ký tự");
      return;
    }

    try {
      await terminateMutation.mutateAsync({
        id: businessId,
        reason: reason.trim(),
      });
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
        {
          key: (row) =>
            BUSINESS_TYPE_LABELS[row.businessType] || row.businessType,
          label: "Loại hình",
        },
        { key: "status", label: "Trạng thái" },
        { key: (row) => row.owner?.email || "", label: "Email chủ sở hữu" },
        {
          key: (row) => row.owner?.profile?.fullName || "",
          label: "Họ tên người đại diện",
        },
        { key: (row) => row.taxCode || "", label: "Mã số thuế" },
        {
          key: (row) => (row.contractSigned ? "Đã ký" : "Chưa ký"),
          label: "Hợp đồng pháp lý",
        },
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

  const selectedBusiness =
    businesses.find((b) => b.id === selectedBusinessId) ||
    businesses[0] ||
    null;
  const selectedKyc = selectedBusiness ? getKycDetails(selectedBusiness) : null;

  return (
    <div className="min-h-screen bg-[#ECEAE4] p-3 sm:p-6 lg:p-8 font-sans text-slate-900 antialiased selection:bg-[#F3E600] selection:text-slate-950">
      {/* Outer Floating Canvas */}
      <div className="max-w-[1560px] mx-auto bg-[#FAF9F6] rounded-[32px] shadow-[0_24px_70px_rgba(0,0,0,0.06)] border border-black/[0.04] p-5 sm:p-8 space-y-6">
        {/* Header & Status Filters */}
        <BusinessHeaderFilters
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          handleExportCsv={handleExportCsv}
          handleRefresh={handleRefresh}
          isLoading={isLoading}
          isFetching={isFetching}
          status={status}
          setStatus={setStatus}
          statusTabs={STATUS_TABS}
          pendingCount={s.pending}
          totalCount={pagination.total}
        />

        {/* Master-Detail 2-Column Dashboard View */}
        {isLoading ? (
          <div className="py-32 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-slate-950 border-t-[#F3E600] rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">
              Đang tải dữ liệu đối tác...
            </p>
          </div>
        ) : !businesses.length ? (
          <div className="rounded-3xl bg-white border border-black/[0.04] p-20 text-center shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
            <Store className="h-12 w-12 mx-auto text-slate-300 mb-3 stroke-[1.5]" />
            <h3 className="font-bold text-base text-slate-900">
              Không tìm thấy hồ sơ đối tác nào
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc trạng thái.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Master List (5 cols) */}
            <BusinessMasterList
              businesses={businesses}
              selectedBusinessId={selectedBusinessId}
              setSelectedBusinessId={setSelectedBusinessId}
              page={page}
              setPage={setPage}
              pagination={pagination}
            />

            {/* Detail Inspector (7 cols) */}
            <BusinessDetailInspector
              selectedBusiness={selectedBusiness}
              selectedKyc={selectedKyc}
              setReviewBusinessId={setReviewBusinessId}
              setDetailBusinessId={setDetailBusinessId}
              handleSuspend={handleSuspend}
              handleReactivate={handleReactivate}
              handleTerminate={handleTerminate}
            />
          </div>
        )}
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
        onApproved={(id, payload) =>
          approveMutation.mutateAsync({ id, data: payload })
        }
        onRejected={(id, reason) => rejectMutation.mutateAsync({ id, reason })}
      />
    </div>
  );
};

export default BusinessListPage;
