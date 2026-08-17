// MAP: BookingQuickProcessPage
// ├── UI: @/components/business/quick-process/{QuickProcessPendingTab, QuickProcessRulesTab, QuickProcessPendingCard, RuleConfigModal}
// └── API: @/apis/bookingService, @/apis/bookingAutoRuleApi, @/apis/businessApi

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Clock,
  Sparkles,
} from "lucide-react";
import * as bookingApi from "@/apis/bookingService";
import * as ruleApi from "@/apis/bookingAutoRuleApi";
import { getMyPlaces } from "@/apis/businessApi";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { BOOKING_STATUS } from "@/constants/constants";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import AetherBentoCard from "@/components/business/AetherBentoCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Extracted Sub-Components
import QuickProcessPendingTab from "@/components/business/quick-process/QuickProcessPendingTab";
import QuickProcessRulesTab from "@/components/business/quick-process/QuickProcessRulesTab";
import RuleConfigModal from "@/components/business/quick-process/RuleConfigModal";

const BookingQuickProcessPage = memo(() => {
  const { t } = useTranslation();
  const [tab, setTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    priority: 1,
    timeSlots: [],
    minQuantity: "",
    maxQuantity: "",
    isActive: true,
  });
  const [guestMode, setGuestMode] = useState("any");
  const [places, setPlaces] = useState([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState("all");
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [confirmDeleteRule, setConfirmDeleteRule] = useState(null);

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingApi.getAll({
        status: BOOKING_STATUS.PENDING,
        limit: 100,
        page: 1,
      });
      if (res?.success) setPending(res.data || []);
      else toast.error(res?.message || t("business.quickProcess.loadListFailed"));
    } catch (e) {
      toastApiErrorIfNeeded(e);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadRules = useCallback(async () => {
    setRulesLoading(true);
    try {
      const res = await ruleApi.list();
      if (res?.success) setRules(res.data || []);
      else toast.error(res?.message || t("business.quickProcess.loadRuleFailed"));
    } catch (e) {
      toastApiErrorIfNeeded(e);
    } finally {
      setRulesLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  useEffect(() => {
    if (tab === "rules") loadRules();
  }, [tab, loadRules]);

  useEffect(() => {
    getMyPlaces()
      .then((res) => {
        setPlaces(res?.data || []);
      })
      .catch((err) => console.error("Failed to load places in quick process page:", err));
  }, []);

  const filteredPending = useMemo(() => {
    if (selectedPlaceId === "all") return pending;
    return pending.filter((b) => {
      const place = b.service?.place || b.place;
      return place && String(place.id) === selectedPlaceId;
    });
  }, [pending, selectedPlaceId]);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selected.length === filteredPending.length) {
      setSelected([]);
    } else {
      setSelected(filteredPending.map((b) => b.id));
    }
  };

  // 1-Click Decisions
  const handleApproveOne = async (id) => {
    setBusyId(`approve-${id}`);
    try {
      const res = await bookingApi.quickApprove(id);
      if (res?.success) {
        toast.success(t("business.bookings.confirmedSuccess"));
        setPending((prev) => prev.filter((b) => b.id !== id));
        setSelected((prev) => prev.filter((i) => i !== id));
      } else {
        toast.error(res?.message || "Không thể xác nhận đơn đặt chỗ");
      }
    } catch (e) {
      toastApiErrorIfNeeded(e);
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectOne = async (id) => {
    setBusyId(`reject-${id}`);
    try {
      const res = await bookingApi.quickReject(id, "Cơ sở quá tải hoặc khách yêu cầu hủy");
      if (res?.success) {
        toast.success(t("business.bookings.rejectedSuccess"));
        setPending((prev) => prev.filter((b) => b.id !== id));
        setSelected((prev) => prev.filter((i) => i !== id));
      } else {
        toast.error(res?.message || "Không thể từ chối đơn đặt chỗ");
      }
    } catch (e) {
      toastApiErrorIfNeeded(e);
    } finally {
      setBusyId(null);
    }
  };

  // Bulk Decisions
  const bulkApprove = async () => {
    if (!selected.length) return;
    setBulkActionLoading(true);
    let successCount = 0;
    for (const id of selected) {
      try {
        const res = await bookingApi.quickApprove(id);
        if (res?.success) successCount++;
      } catch (e) {
        console.error(e);
      }
    }
    toast.success(`Đã xác nhận nhanh ${successCount}/${selected.length} đơn đặt chỗ`);
    setSelected([]);
    setBulkActionLoading(false);
    loadPending();
  };

  const bulkReject = async () => {
    if (!selected.length) return;
    setBulkActionLoading(true);
    let successCount = 0;
    for (const id of selected) {
      try {
        const res = await bookingApi.quickReject(id, "Từ chối hàng loạt do hết chỗ");
        if (res?.success) successCount++;
      } catch (e) {
        console.error(e);
      }
    }
    toast.success(`Đã từ chối ${successCount}/${selected.length} đơn đặt chỗ`);
    setSelected([]);
    setBulkActionLoading(false);
    loadPending();
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    const conditions = {};
    if (ruleForm.timeSlots.length > 0) conditions.timeSlots = ruleForm.timeSlots;
    if (guestMode === "range") {
      if (ruleForm.minQuantity) conditions.minQuantity = Number(ruleForm.minQuantity);
      if (ruleForm.maxQuantity) conditions.maxQuantity = Number(ruleForm.maxQuantity);
    } else if (guestMode === "max" && ruleForm.maxQuantity) {
      conditions.maxQuantity = Number(ruleForm.maxQuantity);
    }

    try {
      const res = await ruleApi.create({
        action: "APPROVE",
        priority: Number(ruleForm.priority) || 1,
        conditions,
        isActive: ruleForm.isActive,
      });
      if (res?.success) {
        toast.success("Đã kích hoạt quy tắc tự động duyệt thành công");
        setRuleOpen(false);
        setRuleForm({
          priority: 1,
          timeSlots: [],
          minQuantity: "",
          maxQuantity: "",
          isActive: true,
        });
        setGuestMode("any");
        await loadRules();
      } else toast.error(res?.message || "Lỗi tạo quy tắc");
    } catch (e) {
      toastApiErrorIfNeeded(e);
    }
  };

  const toggleRuleActive = async (rule) => {
    try {
      const res = await ruleApi.update(rule.id, { isActive: !rule.isActive });
      if (res?.success) {
        await loadRules();
        toast.success(rule.isActive ? "Đã tắt quy tắc" : "Đã bật quy tắc");
      }
    } catch (e) {
      toastApiErrorIfNeeded(e);
    }
  };

  const handleConfirmDeleteRule = async () => {
    const rule = confirmDeleteRule;
    setConfirmDeleteRule(null);
    if (!rule) return;
    try {
      const res = await ruleApi.remove(rule.id);
      if (res?.success) {
        toast.success("Đã xóa quy tắc tự động hóa");
        await loadRules();
      }
    } catch (e) {
      toastApiErrorIfNeeded(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto font-sans transition-colors duration-200">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={BUSINESS_ROUTES.BOOKINGS}
            className="h-10 w-10 rounded-2xl border border-slate-200 dark:border-border/80 bg-white dark:bg-card flex items-center justify-center text-slate-600 hover:text-slate-950 transition-colors shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t("business.quickProcess.title")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-muted-foreground mt-0.5">
              Xác thực nhanh các đơn chờ duyệt & thiết lập chính sách tự động duyệt thông minh
            </p>
          </div>
        </div>

        {tab === "rules" && (
          <Button
            onClick={() => setRuleOpen(true)}
            className="w-full sm:w-auto justify-center rounded-[22px] px-5 text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground shadow-sm gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Tạo quy tắc tự động
          </Button>
        )}
      </div>

      {/* ── Top Bento Summary KPIs ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        <AetherBentoCard
          title="Đơn chờ duyệt ngay"
          subtitle="Cần phản hồi hoặc phê duyệt thủ công"
          value={pending.length}
          variant="peach"
          onClick={() => setTab("pending")}
        />

        <AetherBentoCard
          title="Quy tắc tự động bật"
          subtitle="Đang kích hoạt cơ chế tự động duyệt"
          value={`${rules.filter((r) => r.isActive).length} / ${rules.length}`}
          variant="blue"
          onClick={() => setTab("rules")}
        />

        <AetherBentoCard
          title="Cơ sở áp dụng"
          subtitle="Toàn bộ chi nhánh trong hệ thống"
          value={places.length}
          variant="gray"
        />
      </div>

      {/* ── Main Navigation Tabs ── */}
      <Tabs value={tab} onValueChange={setTab} className="w-full space-y-6">
        <TabsList className="bg-white dark:bg-card p-1.5 rounded-[24px] border border-slate-200/80 dark:border-border/80 shadow-sm flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <TabsTrigger
            value="pending"
            className="flex-1 sm:flex-initial rounded-2xl px-5 py-2 text-xs font-bold uppercase transition-all data-[state=active]:bg-slate-950 data-[state=active]:text-white dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground gap-2 cursor-pointer whitespace-nowrap"
          >
            <Clock className="w-3.5 h-3.5" />
            Hàng chờ duyệt
            {pending.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="rules"
            className="flex-1 sm:flex-initial rounded-2xl px-5 py-2 text-xs font-bold uppercase transition-all data-[state=active]:bg-slate-950 data-[state=active]:text-white dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground gap-2 cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Quy tắc tự động duyệt ({rules.length})
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: HÀNG CHỜ DUYỆT NHANH ── */}
        <TabsContent value="pending" className="focus-visible:ring-0">
          <QuickProcessPendingTab
            places={places}
            pending={pending}
            filteredPending={filteredPending}
            selectedPlaceId={selectedPlaceId}
            setSelectedPlaceId={setSelectedPlaceId}
            selected={selected}
            setSelected={setSelected}
            toggleSelect={toggleSelect}
            selectAll={selectAll}
            bulkApprove={bulkApprove}
            bulkReject={bulkReject}
            bulkActionLoading={bulkActionLoading}
            loading={loading}
            busyId={busyId}
            handleApproveOne={handleApproveOne}
            handleRejectOne={handleRejectOne}
          />
        </TabsContent>

        {/* ── TAB 2: QUY TẮC TỰ ĐỘNG HÓA ── */}
        <TabsContent value="rules" className="space-y-4 focus-visible:ring-0">
          <QuickProcessRulesTab
            rules={rules}
            rulesLoading={rulesLoading}
            onOpenCreateRule={() => setRuleOpen(true)}
            onToggleRuleActive={toggleRuleActive}
            onDeleteRule={(rule) => setConfirmDeleteRule(rule)}
          />
        </TabsContent>
      </Tabs>

      {/* ── Create Rule Modal ── */}
      <RuleConfigModal
        open={ruleOpen}
        onOpenChange={setRuleOpen}
        ruleForm={ruleForm}
        setRuleForm={setRuleForm}
        guestMode={guestMode}
        setGuestMode={setGuestMode}
        onSaveRule={handleSaveRule}
      />

      {/* ── Confirm Delete Rule Modal ── */}
      <Dialog open={!!confirmDeleteRule} onOpenChange={() => setConfirmDeleteRule(null)}>
        <DialogContent className="max-w-sm rounded-[36px] p-6 border border-slate-200/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive font-black text-lg">
              Xóa quy tắc tự động
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Bạn có chắc chắn muốn xóa quy tắc này khỏi hệ thống?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-3">
            <Button variant="outline" onClick={() => setConfirmDeleteRule(null)} className="rounded-2xl text-xs font-bold cursor-pointer">
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteRule} className="rounded-2xl text-xs font-bold cursor-pointer">
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

BookingQuickProcessPage.displayName = "BookingQuickProcessPage";
export default BookingQuickProcessPage;
