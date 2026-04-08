import { useEffect, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  Search,
  ToggleLeft,
  Calendar,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import * as voucherApi from "@/apis/voucherService";
import { getMyPlaces } from "@/apis/businessApi";
import {
  SectionCard,
  PageHeader,
  EmptyState,
} from "@/components/business/DashboardWidgets";
import {
  DESIGN,
  formatDate,
  formatVND,
} from "@/components/business/dashboardWidgetHelpers";
import { cn } from "@/lib/utils";

// ─── Voucher Form Modal ──────────────────────────────────────────────────────

const VoucherFormModal = ({ open, voucher, places = [], onSave, onClose }) => {
  const [form, setForm] = useState({
    code: voucher?.code || "",
    name: voucher?.name || "",
    description: voucher?.description || "",
    discountType: voucher?.discountType || "percentage",
    discountValue: voucher?.discountValue || 0,
    minOrderValue: voucher?.minOrderValue || 0,
    maxDiscount: voucher?.maxDiscount || "",
    maxUsage: voucher?.maxUsage || 100,
    maxUsagePerUser: voucher?.maxUsagePerUser || 1,
    appliesToPlaceId:
      voucher?.applicableServices?.placeIds?.[0]?.toString?.() || "all",
    startDate: voucher?.startDate ? voucher.startDate.split("T")[0] : "",
    endDate: voucher?.endDate ? voucher.endDate.split("T")[0] : "",
    isActive: voucher?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        maxUsage: Number(form.maxUsage),
        maxUsagePerUser: Number(form.maxUsagePerUser),
        applicableServices:
          form.appliesToPlaceId !== "all"
            ? { placeIds: [Number(form.appliesToPlaceId)] }
            : null,
        startDate: form.startDate
          ? new Date(form.startDate).toISOString()
          : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      };
      await onSave(data);
      onClose();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            {voucher ? "Chỉnh sửa voucher" : "Tạo voucher mới"}
          </DialogTitle>
          <DialogDescription>
            Điền thông tin voucher và nhấn Lưu để hoàn tất.
          </DialogDescription>
        </DialogHeader>

        <form
          id="voucher-form"
          onSubmit={handleSubmit}
          className="space-y-4 overflow-y-auto py-2 pr-1"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vc-code">
                Mã voucher <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vc-code"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                required
                disabled={!!voucher}
                className="uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vc-name">Tên voucher</Label>
              <Input
                id="vc-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Loại giảm</Label>
              <Select
                value={form.discountType}
                onValueChange={(v) => setForm({ ...form, discountType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Phần trăm (%)</SelectItem>
                  <SelectItem value="fixed">Cố định (VND)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vc-val">
                Giá trị giảm <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vc-val"
                type="number"
                value={form.discountValue}
                onChange={(e) =>
                  setForm({ ...form, discountValue: e.target.value })
                }
                min="0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vc-min">Đơn tối thiểu (VND)</Label>
              <Input
                id="vc-min"
                type="number"
                value={form.minOrderValue}
                onChange={(e) =>
                  setForm({ ...form, minOrderValue: e.target.value })
                }
                min="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vc-maxd">Giảm tối đa (VND)</Label>
              <Input
                id="vc-maxd"
                type="number"
                value={form.maxDiscount}
                onChange={(e) =>
                  setForm({ ...form, maxDiscount: e.target.value })
                }
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vc-maxu">Số lần dùng tối đa</Label>
              <Input
                id="vc-maxu"
                type="number"
                value={form.maxUsage}
                onChange={(e) => setForm({ ...form, maxUsage: e.target.value })}
                min="1"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vc-peruser">Tối đa / người dùng</Label>
              <Input
                id="vc-peruser"
                type="number"
                value={form.maxUsagePerUser}
                onChange={(e) =>
                  setForm({ ...form, maxUsagePerUser: e.target.value })
                }
                min="1"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Áp dụng cho địa điểm</Label>
            <Select
              value={form.appliesToPlaceId}
              onValueChange={(v) => setForm({ ...form, appliesToPlaceId: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả địa điểm</SelectItem>
                {places.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vc-start">Ngày bắt đầu</Label>
              <Input
                id="vc-start"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vc-end">Ngày kết thúc</Label>
              <Input
                id="vc-end"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Checkbox
              id="vc-active"
              checked={form.isActive}
              onCheckedChange={(checked) =>
                setForm({ ...form, isActive: !!checked })
              }
            />
            <Label htmlFor="vc-active" className="cursor-pointer">
              Voucher đang hoạt động
            </Label>
          </div>
        </form>

        <DialogFooter className="shrink-0 gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button type="submit" form="voucher-form" disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu voucher"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Voucher Card ──────────────────────────────────────────────────────────────

const VoucherCard = ({
  voucher,
  places,
  selected,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const isExpired = voucher.endDate && new Date(voucher.endDate) < new Date();
  const usagePct =
    voucher.maxUsage > 0 ? (voucher.usageCount / voucher.maxUsage) * 100 : 0;

  const discountLabel =
    voucher.discountType === "percentage"
      ? `${voucher.discountValue}%`
      : formatVND(voucher.discountValue);

  const placeNames =
    Array.isArray(voucher?.applicableServices?.placeIds) &&
    voucher.applicableServices.placeIds.length > 0
      ? voucher.applicableServices.placeIds
          .map((id) => places.find((p) => p.id === id)?.name || `#${id}`)
          .join(", ")
      : "Tất cả địa điểm";

  return (
    <div className={cn(DESIGN.card, "[content-visibility:auto] p-4 space-y-3")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onSelect(voucher.id)}
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold tracking-widest text-sm">
                {voucher.code}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] font-semibold text-emerald-600 border-emerald-200 bg-emerald-50"
              >
                -{discountLabel}
              </Badge>
              {!voucher.isActive && (
                <Badge
                  variant="outline"
                  className="text-[10px] text-muted-foreground"
                >
                  Tạm dừng
                </Badge>
              )}
              {isExpired && (
                <Badge
                  variant="outline"
                  className="text-[10px] text-destructive border-destructive/30"
                >
                  Hết hạn
                </Badge>
              )}
            </div>
            {voucher.name && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {voucher.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onEdit(voucher)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(voucher.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Usage progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Đã dùng: {voucher.usageCount || 0}/{voucher.maxUsage}
          </span>
          <span>{usagePct.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              usagePct > 80 ? "bg-rose-500" : "bg-emerald-500",
            )}
            style={{ width: `${Math.min(usagePct, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <BarChart3 className="h-3 w-3" />
          Địa điểm: {placeNames}
        </span>
        {voucher.endDate && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            HSD: {formatDate(voucher.endDate)}
          </span>
        )}
      </div>
    </div>
  );
};

const ConfirmDeleteVoucherModal = ({ open, code, onConfirm, onCancel }) => (
  <Dialog open={open} onOpenChange={onCancel}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="h-5 w-5" />
          Xác nhận xóa voucher
        </DialogTitle>
        <DialogDescription>
          Bạn có chắc chắn muốn xóa voucher{" "}
          <span className="font-semibold text-foreground">{code || ""}</span>?
          Hành động này không thể hoàn tác.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onCancel}>
          Hủy bỏ
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          Xóa voucher
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────

const VoucherListPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editVoucher, setEditVoucher] = useState(null);
  const [selected, setSelected] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await voucherApi.getAll({ search, page: 1, limit: 50 });
      setVouchers(response.data || []);
    } catch {
      toast.error("Không thể tải danh sách voucher");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);
  useEffect(() => {
    getMyPlaces()
      .then((res) => setPlaces(res.data || []))
      .catch(() => {});
  }, []);

  const filteredVouchers = useMemo(() => {
    if (selectedPlaceId === "all") return vouchers;
    return vouchers.filter((v) => {
      const placeIds = v?.applicableServices?.placeIds || [];
      if (!Array.isArray(placeIds) || placeIds.length === 0) return true;
      return placeIds.includes(Number(selectedPlaceId));
    });
  }, [vouchers, selectedPlaceId]);

  const activeCount = filteredVouchers.filter((v) => v.isActive).length;
  const expiredCount = filteredVouchers.filter(
    (v) => v.endDate && new Date(v.endDate) < new Date(),
  ).length;

  const handleCreate = async (data) => {
    await voucherApi.create(data);
    toast.success("Tạo voucher thành công");
    loadVouchers();
  };

  const handleUpdate = async (data) => {
    await voucherApi.update(editVoucher.id, data);
    toast.success("Cập nhật voucher thành công");
    setEditVoucher(null);
    loadVouchers();
  };

  const handleDelete = async (id) => {
    try {
      await voucherApi.remove(id);
      toast.success("Xóa voucher thành công");
      loadVouchers();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể xóa");
    }
  };

  const handleBulkDeactivate = async () => {
    if (selected.length === 0) return;
    try {
      await voucherApi.bulkDeactivate(selected);
      toast.success(`Đã tắt ${selected.length} voucher`);
      setSelected([]);
      loadVouchers();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể tắt voucher");
    }
  };

  const toggleSelect = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  const openEdit = (v) => {
    setEditVoucher(v);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditVoucher(null);
  };

  return (
    <div className="space-y-6 p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <PageHeader
        title="Quản lý voucher"
        subtitle="Tạo và quản lý các mã giảm giá cho dịch vụ của bạn"
        badge={
          filteredVouchers.length > 0 ? filteredVouchers.length : undefined
        }
        action={
          <div className="flex gap-2">
            {selected.length > 0 && (
              <Button
                variant="outline"
                onClick={handleBulkDeactivate}
                className="gap-2"
              >
                <ToggleLeft className="h-4 w-4" />
                Tắt {selected.length} voucher
              </Button>
            )}
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Tạo voucher
            </Button>
          </div>
        }
      />

      {/* Quick Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Tổng voucher",
              value: filteredVouchers.length,
              color: "text-foreground",
            },
            {
              label: "Đang hoạt động",
              value: activeCount,
              color: "text-emerald-600",
            },
            {
              label: "Hết hạn",
              value: expiredCount,
              color: "text-destructive",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className={`rounded-xl border border-border/60 shadow-sm bg-card p-4 text-center`}
            >
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      <SectionCard
        title="Danh sách voucher"
        titleIcon={Tag}
        action={
          <div className="flex gap-2">
            <Select value={selectedPlaceId} onValueChange={setSelectedPlaceId}>
              <SelectTrigger className="h-8 text-xs w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả địa điểm</SelectItem>
                {places.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Tìm mã / tên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs w-40"
              />
            </div>
          </div>
        }
      >
        {(() => {
          if (loading) {
            return (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
            );
          }

          if (filteredVouchers.length === 0) {
            return (
              <EmptyState
                icon={Tag}
                message="Chưa có voucher nào. Nhấn 'Tạo voucher' để bắt đầu."
                action={
                  <Button
                    size="sm"
                    onClick={() => setShowForm(true)}
                    className="gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> Tạo voucher
                  </Button>
                }
              />
            );
          }

          return (
            <div className="space-y-3">
              {filteredVouchers.map((v) => (
                <VoucherCard
                  key={v.id}
                  voucher={v}
                  places={places}
                  selected={selected.includes(v.id)}
                  onSelect={toggleSelect}
                  onEdit={openEdit}
                  onDelete={(id) =>
                    setDeleteTarget(
                      filteredVouchers.find((item) => item.id === id) || null,
                    )
                  }
                />
              ))}
            </div>
          );
        })()}
      </SectionCard>

      <VoucherFormModal
        open={showForm}
        voucher={editVoucher}
        places={places}
        onSave={editVoucher ? handleUpdate : handleCreate}
        onClose={closeForm}
      />

      <ConfirmDeleteVoucherModal
        open={!!deleteTarget}
        code={deleteTarget?.code}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await handleDelete(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default VoucherListPage;
