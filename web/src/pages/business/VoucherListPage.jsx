import { useEffect, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Ticket,
  Plus,
  Pencil,
  Trash2,
  Search,
  ToggleLeft,
  AlertTriangle,
} from "lucide-react";
import { Button, Input, Card, CardContent } from "@/components/ui";
import * as voucherApi from "@/apis/voucherService";
import { getMyPlaces } from "@/apis/businessApi";
import * as businessOfferingApi from "@/apis/businessOfferingApi";
import PlaceAccordion from "@/components/business/PlaceAccordion";

const VoucherFormModal = ({ voucher, places = [], onSave, onClose }) => {
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
                onChange={(e) =>
                  setForm({ ...form, discountType: e.target.value })
                }
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
                onChange={(e) =>
                  setForm({ ...form, discountValue: e.target.value })
                }
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
                onChange={(e) =>
                  setForm({ ...form, minOrderValue: e.target.value })
                }
                min="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Giảm tối đa (VND)</label>
              <Input
                type="number"
                value={form.maxDiscount}
                onChange={(e) =>
                  setForm({ ...form, maxDiscount: e.target.value })
                }
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
                onChange={(e) =>
                  setForm({ ...form, maxUsagePerUser: e.target.value })
                }
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Áp dụng cho địa điểm</label>
            <select
              className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              value={form.appliesToPlaceId}
              onChange={(e) =>
                setForm({ ...form, appliesToPlaceId: e.target.value })
              }
            >
              <option value="all">Tất cả địa điểm</option>
              {places.map((place) => (
                <option key={place.id} value={String(place.id)}>
                  {place.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ngày bắt đầu</label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
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
            <label htmlFor="voucherActive" className="text-sm">
              Đang hoạt động
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" type="button" onClick={onClose}>
              Hủy
            </Button>
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
  const [places, setPlaces] = useState([]);
  const [serviceMap, setServiceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editVoucher, setEditVoucher] = useState(null);
  const [selected, setSelected] = useState([]);
  const [expandedPlaces, setExpandedPlaces] = useState({});

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

  useEffect(() => {
    businessOfferingApi
      .getAll({ page: 1, limit: 500 })
      .then((res) => {
        const map = (res.data || []).reduce((acc, svc) => {
          acc[String(svc.id)] = svc.name;
          return acc;
        }, {});
        setServiceMap(map);
      })
      .catch(() => {});
  }, []);

  const filteredVouchers = useMemo(() => {
    if (selectedPlaceId === "all") return vouchers;
    return vouchers.filter((voucher) => {
      const placeIds = voucher?.applicableServices?.placeIds || [];
      if (!Array.isArray(placeIds) || placeIds.length === 0) return true;
      return placeIds.includes(Number(selectedPlaceId));
    });
  }, [vouchers, selectedPlaceId]);

  const groupedVouchers = useMemo(() => {
    return filteredVouchers.reduce((acc, voucher) => {
      const placeIds = voucher?.applicableServices?.placeIds;
      if (Array.isArray(placeIds) && placeIds.length > 0) {
        placeIds.forEach((placeId) => {
          const placeName =
            places.find((p) => p.id === placeId)?.name ||
            `Địa điểm #${placeId}`;
          const key = String(placeId);
          if (!acc[key]) acc[key] = { label: placeName, items: [] };
          acc[key].items.push(voucher);
        });
        return acc;
      }

      if (!acc.all) acc.all = { label: "Tất cả địa điểm", items: [] };
      acc.all.items.push(voucher);
      return acc;
    }, {});
  }, [filteredVouchers, places]);

  const placeOverview = useMemo(() => {
    return Object.entries(groupedVouchers).map(([placeKey, group]) => {
      const activeCount = group.items.filter((item) => item.isActive).length;
      const expiredCount = group.items.filter(
        (item) => item.endDate && new Date(item.endDate) < new Date(),
      ).length;
      const usageTotal = group.items.reduce(
        (sum, item) => sum + Number(item.usageCount || 0),
        0,
      );
      return {
        placeKey,
        label: group.label,
        total: group.items.length,
        activeCount,
        expiredCount,
        usageTotal,
      };
    });
  }, [groupedVouchers]);

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
      toast.error(error.message || "Không thể deactivate");
    }
  };

  const handleDeactivateByPlace = async (placeKey, items) => {
    const ids = items.filter((item) => item.isActive).map((item) => item.id);
    if (ids.length === 0) {
      toast.error("Không có voucher đang hoạt động để tắt");
      return;
    }

    try {
      await voucherApi.bulkDeactivate(ids);
      toast.success(
        `Đã tắt ${ids.length} voucher tại ${
          placeKey === "all" ? "nhóm tất cả địa điểm" : "địa điểm này"
        }`,
      );
      setSelected((prev) => prev.filter((id) => !ids.includes(id)));
      loadVouchers();
    } catch (error) {
      toast.error(error.message || "Không thể deactivate theo địa điểm");
    }
  };

  const formatDiscount = (voucher) =>
    voucher.discountType === "percentage"
      ? `${voucher.discountValue}%`
      : new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(voucher.discountValue);

  const getServicePreview = (voucher) => {
    const serviceIds = voucher?.applicableServices?.serviceIds || [];
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return "Áp dụng mọi dịch vụ";
    }

    const names = serviceIds
      .slice(0, 2)
      .map((id) => serviceMap[String(id)] || `#${id}`)
      .join(", ");

    if (serviceIds.length <= 2) return names;
    return `${names} +${serviceIds.length - 2}`;
  };

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-background relative">
      <div className="absolute inset-0 bg-grid-dots opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-[1200px] mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-black pb-6 gap-4">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary border-4 border-black flex items-center justify-center shadow-hard rotate-3 hover:rotate-0 transition-transform">
              <Ticket className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 hover:text-primary transition-colors">
                VOUCHER
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="tim-system bg-black text-white px-3 py-1 text-xs">
                  PORTAL // VOUCHERS
                </span>
                {filteredVouchers.length > 0 && (
                  <span className="tim-system border-2 border-black px-3 py-1 text-xs">
                    {filteredVouchers.length} KẾT QUẢ
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {selected.length > 0 && (
              <Button variant="outline" onClick={handleBulkDeactivate}>
                <ToggleLeft className="h-4 w-4 mr-2" /> Deactivate (
                {selected.length})
              </Button>
            )}
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" /> Tạo voucher
            </Button>
          </div>
        </div>

        <div className="bg-white border-4 border-black p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center shadow-sm">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm mã / tên voucher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="relative w-full md:w-[280px]">
            <select
              value={selectedPlaceId}
              onChange={(e) => setSelectedPlaceId(e.target.value)}
              className="w-full h-12 border-2 border-black px-3 pr-10 font-mono text-xs uppercase bg-white focus:outline-none focus:ring-4 focus:ring-primary/20"
            >
              <option value="all">Tất cả địa điểm</option>
              {places.map((place) => (
                <option key={place.id} value={String(place.id)}>
                  {place.name}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs">
              ▼
            </span>
          </div>
        </div>

        {placeOverview.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {placeOverview.map((item) => (
              <button
                key={item.placeKey}
                type="button"
                onClick={() =>
                  setSelectedPlaceId(
                    item.placeKey === "all" ? "all" : String(item.placeKey),
                  )
                }
                className="text-left bg-white border-4 border-black p-4 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <p className="font-black uppercase text-xs tracking-wide truncate">
                  {item.label}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 font-mono text-[11px]">
                  <span className="border border-black px-2 py-1">
                    Tổng: {item.total}
                  </span>
                  <span className="border border-black px-2 py-1">
                    Active: {item.activeCount}
                  </span>
                  <span className="border border-black px-2 py-1">
                    Hết hạn: {item.expiredCount}
                  </span>
                  <span className="border border-black px-2 py-1">
                    Đã dùng: {item.usageTotal}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="min-h-[35vh] flex flex-col items-center justify-center bg-white border-2 border-black border-dashed">
            <div className="w-12 h-12 border-4 border-black border-t-primary rounded-none animate-spin mb-3" />
            <span className="font-mono text-xs uppercase text-gray-500">
              Đang tải voucher...
            </span>
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="min-h-[30vh] flex flex-col items-center justify-center bg-white border-2 border-black border-dashed">
            <AlertTriangle className="w-10 h-10 text-gray-300 mb-3" />
            <span className="text-gray-400 font-mono font-bold uppercase tracking-widest">
              CHƯA CÓ VOUCHER NÀO
            </span>
          </div>
        ) : (
          <div className="grid gap-4">
            {Object.entries(groupedVouchers).map(([placeKey, group]) => (
              <PlaceAccordion
                key={placeKey}
                title={group.label}
                subtitle="Theo dõi hiệu quả voucher theo địa điểm"
                count={group.items.length}
                countLabel="voucher"
                expanded={expandedPlaces[placeKey] ?? true}
                onToggle={() =>
                  setExpandedPlaces((prev) => ({
                    ...prev,
                    [placeKey]: !(prev[placeKey] ?? true),
                  }))
                }
                preview={[
                  {
                    label: "Active",
                    value: group.items.filter((item) => item.isActive).length,
                  },
                  {
                    label: "Expired",
                    value: group.items.filter(
                      (item) =>
                        item.endDate && new Date(item.endDate) < new Date(),
                    ).length,
                  },
                ]}
                actions={[
                  <button
                    key="deactivate-by-place"
                    type="button"
                    onClick={() =>
                      handleDeactivateByPlace(placeKey, group.items)
                    }
                    className="px-3 py-2 border-2 border-black text-xs font-black uppercase tracking-wider bg-white hover:bg-black hover:text-white transition-colors"
                  >
                    Deactivate toàn bộ voucher địa điểm
                  </button>,
                  <button
                    key="filter-by-place"
                    type="button"
                    onClick={() =>
                      setSelectedPlaceId(
                        placeKey === "all" ? "all" : String(placeKey),
                      )
                    }
                    className="px-3 py-2 border-2 border-black text-xs font-black uppercase tracking-wider bg-white hover:bg-black hover:text-white transition-colors"
                  >
                    Lọc theo địa điểm này
                  </button>,
                ]}
              >
                {group.items.map((voucher) => (
                  <Card key={voucher.id}>
                    <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border-2 border-black">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(voucher.id)}
                          onChange={() =>
                            setSelected((prev) =>
                              prev.includes(voucher.id)
                                ? prev.filter((id) => id !== voucher.id)
                                : [...prev, voucher.id],
                            )
                          }
                          className="mt-1"
                        />

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black">
                              {voucher.code}
                            </span>
                            {voucher.name && (
                              <span className="text-sm text-gray-600">
                                - {voucher.name}
                              </span>
                            )}
                            {!voucher.isActive && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                Tạm dừng
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-600">
                            Giảm: {formatDiscount(voucher)} | Đã dùng:{" "}
                            {voucher.usageCount || 0}/{voucher.maxUsage}
                            {voucher.endDate && (
                              <span className="ml-2">
                                | HSD:{" "}
                                {new Date(voucher.endDate).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </span>
                            )}
                          </p>

                          <p className="text-xs text-gray-500 font-mono">
                            Địa điểm:{" "}
                            {Array.isArray(
                              voucher?.applicableServices?.placeIds,
                            ) && voucher.applicableServices.placeIds.length > 0
                              ? voucher.applicableServices.placeIds
                                  .map(
                                    (placeId) =>
                                      places.find(
                                        (place) => place.id === placeId,
                                      )?.name || `#${placeId}`,
                                  )
                                  .join(", ")
                              : "Tất cả địa điểm"}
                          </p>

                          <p className="text-xs text-gray-500 font-mono">
                            Dịch vụ: {getServicePreview(voucher)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditVoucher(voucher);
                            setShowForm(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(voucher.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </PlaceAccordion>
            ))}
          </div>
        )}

        {showForm && (
          <VoucherFormModal
            voucher={editVoucher}
            places={places}
            onSave={editVoucher ? handleUpdate : handleCreate}
            onClose={() => {
              setShowForm(false);
              setEditVoucher(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default VoucherListPage;
