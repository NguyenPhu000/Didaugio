import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Ticket, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button, Input, Card, CardContent } from "@/components/ui";
import * as businessServiceApi from "@/apis/businessServiceApi";

const SERVICE_TYPES = {
  entry_ticket: "Vé vào cửa",
  tour: "Tour",
  package: "Gói dịch vụ",
  service: "Dịch vụ",
  experience: "Trải nghiệm",
};

const ServiceFormModal = ({ service, onSave, onClose }) => {
  const [form, setForm] = useState({
    name: service?.name || "",
    description: service?.description || "",
    serviceType: service?.serviceType || "service",
    price: service?.price || 0,
    discountPrice: service?.discountPrice || "",
    duration: service?.duration || "",
    maxCapacity: service?.maxCapacity || "",
    isActive: service?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
        duration: form.duration ? Number(form.duration) : null,
        maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : null,
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
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">
          {service ? "Chỉnh sửa dịch vụ" : "Tạo dịch vụ mới"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tên dịch vụ *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              minLength={2}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Mô tả</label>
            <textarea
              className="w-full border rounded-md p-3 min-h-[80px] text-sm"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Loại dịch vụ</label>
              <select
                className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={form.serviceType}
                onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
              >
                {Object.entries(SERVICE_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Giá (VND) *</label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                min="0"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Giá giảm</label>
              <Input
                type="number"
                value={form.discountPrice}
                onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Thời lượng (phút)</label>
              <Input
                type="number"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                min="1"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              id="isActive"
            />
            <label htmlFor="isActive" className="text-sm">Đang hoạt động</label>
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

const ServiceListPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editService, setEditService] = useState(null);
  const [pagination, setPagination] = useState({});

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await businessServiceApi.getAll({ search, page: 1, limit: 20 });
      setServices(response.data || []);
      setPagination(response.pagination || {});
    } catch (error) {
      toast.error("Không thể tải danh sách dịch vụ");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadServices(); }, [loadServices]);

  const handleCreate = async (data) => {
    await businessServiceApi.create(data);
    toast.success("Tạo dịch vụ thành công");
    loadServices();
  };

  const handleUpdate = async (data) => {
    await businessServiceApi.update(editService.id, data);
    toast.success("Cập nhật dịch vụ thành công");
    setEditService(null);
    loadServices();
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc muốn xóa dịch vụ này?")) return;
    try {
      await businessServiceApi.remove(id);
      toast.success("Xóa dịch vụ thành công");
      loadServices();
    } catch (error) {
      toast.error(error.message || "Không thể xóa");
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ticket className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Quản lý dịch vụ</h1>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" /> Tạo dịch vụ
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Tìm kiếm dịch vụ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Chưa có dịch vụ nào</div>
      ) : (
        <div className="grid gap-4">
          {services.map((svc) => (
            <Card key={svc.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{svc.name}</h3>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {SERVICE_TYPES[svc.serviceType] || svc.serviceType}
                    </span>
                    {!svc.isActive && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                        Tạm dừng
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatPrice(svc.price)}
                    {svc.discountPrice && (
                      <span className="ml-2 text-green-600">{formatPrice(svc.discountPrice)}</span>
                    )}
                    {svc.duration && <span className="ml-2">| {svc.duration} phút</span>}
                    {svc._count?.bookings > 0 && (
                      <span className="ml-2">| {svc._count.bookings} booking</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEditService(svc); setShowForm(true); }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(svc.id)}
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
        <ServiceFormModal
          service={editService}
          onSave={editService ? handleUpdate : handleCreate}
          onClose={() => { setShowForm(false); setEditService(null); }}
        />
      )}
    </div>
  );
};

export default ServiceListPage;
