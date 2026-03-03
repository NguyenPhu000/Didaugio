import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Ticket, Plus, Pencil, Trash2, Search, ToggleLeft } from "lucide-react";
import { Button, Input, Card, CardContent } from "@/components/ui";
import * as voucherApi from "@/apis/voucherService";

const DISCOUNT_TYPE_LABELS = { percentage: "Phần trăm", fixed: "Cố định" };

const VoucherFormModal = ({ voucher, onSave, onClose }) => {
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
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      };
      await onSave(data);
      onClose();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">
          {voucher ? "Chỉnh sửa voucher" : "Tạo voucher mới"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mã voucher *</label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
                disabled={!!voucher}
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên voucher</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Loại giảm *</label>
              <select
                className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
              >
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed">Cố định (VND)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Giá trị giảm *</label>
              <Input
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                min="0"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Đơn tối thiểu (VND)</label>
              <Input
                type="number"
                value={form.minOrderValue}
                onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Giảm tối đa (VND)</label>
              <Input
                type="number"
                value={form.maxDiscount}
                onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                min="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Số lần dùng tối đa</label>
              <Input
                type="number"
                value={form.maxUsage}
                onChange={(e) => setForm({ ...form, maxUsage: e.target.value })}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tối đa / user</label>
              <Input
                type="number"
                value={form.maxUsagePerUser}
                onChange={(e) => setForm({ ...form, maxUsagePerUser: e.target.value })}
                min="1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ngày bắt đầu</label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ngày kết thúc</label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              id="voucherActive"
            />
            <label htmlFor="voucherActive" className="text-sm">Đang hoạt động</label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" type="button" onClick={onClose}>Hủy</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const VoucherListPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editVoucher, setEditVoucher] = useState(null);
  const [selected, setSelected] = useState([]);

  const loadVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await voucherApi.getAll({ search, page: 1, limit: 20 });
      setVouchers(response.data || []);
    } catch {
      toast.error("Không thể tải danh sách voucher");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadVouchers(); }, [loadVouchers]);

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
    if (!confirm("Bạn có chắc muốn xóa voucher này?")) return;
    try {
      await voucherApi.remove(id);
      toast.success("Xóa voucher thành công");
      loadVouchers();
    } catch (error) {
      toast.error(error.message || "Không thể xóa");
    }
  };

  const handleBulkDeactivate = async () => {
    if (selected.length === 0) return;
    try {
      await voucherApi.bulkDeactivate(selected);
      toast.success(`Đã deactivate ${selected.length} voucher`);
      setSelected([]);
      loadVouchers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const formatDiscount = (v) =>
    v.discountType === "percentage" ? `${v.discountValue}%` :
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v.discountValue);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ticket className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Quản lý voucher</h1>
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <Button variant="outline" onClick={handleBulkDeactivate}>
              <ToggleLeft className="h-4 w-4 mr-2" /> Deactivate ({selected.length})
            </Button>
          )}
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" /> Tạo voucher
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Tìm mã / tên voucher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        </div>
      ) : vouchers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Chưa có voucher nào</div>
      ) : (
        <div className="grid gap-4">
          {vouchers.map((v) => (
            <Card key={v.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(v.id)}
                    onChange={() =>
                      setSelected((p) =>
                        p.includes(v.id) ? p.filter((s) => s !== v.id) : [...p, v.id],
                      )
                    }
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">{v.code}</span>
                      {v.name && <span className="text-sm text-gray-600">— {v.name}</span>}
                      {!v.isActive && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                          Tạm dừng
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Giảm: {formatDiscount(v)} | Đã dùng: {v.usageCount || 0}/{v.maxUsage}
                      {v.endDate && (
                        <span className="ml-2">| HSD: {new Date(v.endDate).toLocaleDateString("vi-VN")}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEditVoucher(v); setShowForm(true); }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(v.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <VoucherFormModal
          voucher={editVoucher}
          onSave={editVoucher ? handleUpdate : handleCreate}
          onClose={() => { setShowForm(false); setEditVoucher(null); }}
        />
      )}
    </div>
  );
};

export default VoucherListPage;
