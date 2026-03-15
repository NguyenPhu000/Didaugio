import { useEffect, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Ticket,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import * as businessOfferingApi from "@/apis/businessOfferingApi";
import { getMyPlaces } from "@/apis/businessApi";
import { SERVICE_TYPE_LABELS } from "@/constants/businessConstants";
import PlaceAccordion from "@/components/business/PlaceAccordion";

const ServiceFormModal = ({
  service,
  places = [],
  initialPlaceId = "",
  onSave,
  onClose,
}) => {
  const [form, setForm] = useState({
    name: service?.name || "",
    description: service?.description || "",
    serviceType: service?.serviceType || "service",
    price: service?.price || 0,
    discountPrice: service?.discountPrice || "",
    duration: service?.duration || "",
    maxCapacity: service?.maxCapacity || "",
    placeId: service?.place?.id
      ? String(service.place.id)
      : initialPlaceId
        ? String(initialPlaceId)
        : "",
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
        placeId: form.placeId ? Number(form.placeId) : undefined,
      };
      await onSave(data);
      onClose();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra", {
        className: "border-2 border-black rounded-none font-mono font-bold",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white border-4 border-black p-0 max-w-2xl w-full relative shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b-4 border-black bg-primary flex items-center justify-between shrink-0">
          <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
            <Ticket className="w-6 h-6" />
            {service ? "CẬP NHẬT DỊCH VỤ" : "TẠO DỊCH VỤ MỚI"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <form id="service-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="tim-meta text-xs font-bold uppercase tracking-wider">
                TÊN DỊCH VỤ <span className="text-primary">*</span>
              </label>
              <input
                className="w-full h-12 bg-white border-2 border-black px-4 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                minLength={2}
                placeholder="Nhập tên..."
              />
            </div>

            <div className="space-y-2">
              <label className="tim-meta text-xs font-bold uppercase tracking-wider">
                MÔ TẢ
              </label>
              <textarea
                className="w-full bg-white border-2 border-black p-4 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary min-h-[100px] resize-y focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Viết mô tả chi tiết..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="tim-meta text-xs font-bold uppercase tracking-wider">
                  ĐỊA ĐIỂM <span className="text-primary">*</span>
                </label>
                {places.length === 0 ? (
                  <div className="flex items-center gap-2 h-12 border-2 border-red-400 px-4 bg-red-50 font-mono text-sm text-red-600">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Chưa có địa điểm nào — hãy tạo địa điểm trước
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      className="w-full h-12 bg-white border-2 border-black px-4 font-mono text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      value={form.placeId}
                      onChange={(e) =>
                        setForm({ ...form, placeId: e.target.value })
                      }
                      required
                    >
                      <option value="">-- Chọn địa điểm --</option>
                      {places.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none border-l-2 border-black bg-gray-50">
                      ▼
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="tim-meta text-xs font-bold uppercase tracking-wider">
                  LOẠI DỊCH VỤ
                </label>
                <div className="relative">
                  <select
                    className="w-full h-12 bg-white border-2 border-black px-4 font-mono text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    value={form.serviceType}
                    onChange={(e) =>
                      setForm({ ...form, serviceType: e.target.value })
                    }
                  >
                    {Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none border-l-2 border-black bg-gray-50">
                    ▼
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="tim-meta text-xs font-bold uppercase tracking-wider">
                  GIÁ GỐC (VND) <span className="text-primary">*</span>
                </label>
                <input
                  type="number"
                  className="w-full h-12 bg-white border-2 border-black px-4 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="tim-meta text-xs font-bold uppercase tracking-wider">
                  GIÁ KHUYẾN MÃI (VND)
                </label>
                <input
                  type="number"
                  className="w-full h-12 bg-white border-2 border-black px-4 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  value={form.discountPrice}
                  onChange={(e) =>
                    setForm({ ...form, discountPrice: e.target.value })
                  }
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <label className="tim-meta text-xs font-bold uppercase tracking-wider">
                  THỜI LƯỢNG (PHÚT)
                </label>
                <input
                  type="number"
                  className="w-full h-12 bg-white border-2 border-black px-4 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value })
                  }
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <label className="tim-meta text-xs font-bold uppercase tracking-wider">
                  SỨC CHỨA TỐI ĐA
                </label>
                <input
                  type="number"
                  className="w-full h-12 bg-white border-2 border-black px-4 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  value={form.maxCapacity}
                  onChange={(e) =>
                    setForm({ ...form, maxCapacity: e.target.value })
                  }
                  min="1"
                  placeholder="Không giới hạn"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border-2 border-black bg-gray-50">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                id="isActive"
                className="w-6 h-6 border-2 border-black appearance-none checked:bg-black checked:before:content-['✓'] checked:before:text-white flex items-center justify-center font-bold cursor-pointer transition-colors"
              />
              <label
                htmlFor="isActive"
                className="font-bold text-sm uppercase tracking-widest cursor-pointer"
              >
                TRẠNG THÁI HOẠT ĐỘNG
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t-4 border-black bg-gray-100 flex gap-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 border-2 border-black font-black uppercase text-sm hover:bg-white transition-colors"
          >
            HỦY BỎ
          </button>
          <button
            type="submit"
            form="service-form"
            disabled={saving}
            className="flex-1 py-4 bg-black text-white font-black uppercase text-sm hover:bg-primary hover:text-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] border-2 border-black disabled:opacity-50"
          >
            {saving ? "ĐANG LƯU..." : "LƯU DỊCH VỤ"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ConfirmDeleteModal = ({ name, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
    <div className="bg-white border-4 border-black p-0 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-200">
      <div className="p-4 border-b-4 border-black bg-red-500 flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-white" />
        <h3 className="text-xl font-black uppercase tracking-widest text-white">
          XÁC NHẬN XÓA
        </h3>
      </div>
      <div className="p-6 space-y-4">
        <p className="font-mono text-sm">
          Bạn có chắc chắn muốn xóa dịch vụ{" "}
          <span className="font-black">&quot;{name}&quot;</span>?
        </p>
        <p className="font-mono text-xs text-gray-500">
          Hành động này không thể hoàn tác. Dịch vụ đang có booking chưa hoàn
          thành sẽ không thể xóa.
        </p>
      </div>
      <div className="p-4 border-t-4 border-black bg-gray-100 flex gap-4">
        <button
          onClick={onCancel}
          className="flex-1 py-3 border-2 border-black font-black uppercase text-sm hover:bg-white transition-colors"
        >
          HỦY BỎ
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-3 bg-red-500 text-white font-black uppercase text-sm hover:bg-red-600 border-2 border-red-700 transition-colors"
        >
          XÓA
        </button>
      </div>
    </div>
  </div>
);

const PAGE_SIZE = 10;

const ServiceListPage = () => {
  const [services, setServices] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editService, setEditService] = useState(null);
  const [draftPlaceId, setDraftPlaceId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }
  const [expandedPlaces, setExpandedPlaces] = useState({});

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await businessOfferingApi.getAll({
        search,
        page,
        limit: PAGE_SIZE,
        ...(selectedPlaceId !== "all" && { placeId: selectedPlaceId }),
      });
      setServices(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotal(response.pagination?.total || 0);
    } catch {
      toast.error("Không thể tải danh sách dịch vụ", {
        className: "border-2 border-black rounded-none font-mono font-bold",
      });
    } finally {
      setLoading(false);
    }
  }, [search, page, selectedPlaceId]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    getMyPlaces()
      .then((res) => setPlaces(res.data || []))
      .catch(() => {});
  }, []);

  // Reset về page 1 khi tìm kiếm thay đổi
  useEffect(() => {
    setPage(1);
  }, [search, selectedPlaceId]);

  const groupedServices = useMemo(() => {
    return services.reduce((acc, svc) => {
      const key = svc.place?.id || "none";
      const label = svc.place?.name || "Chưa gán địa điểm";
      if (!acc[key]) acc[key] = { label, items: [] };
      acc[key].items.push(svc);
      return acc;
    }, {});
  }, [services]);

  const placeOverview = useMemo(() => {
    return Object.entries(groupedServices).map(([placeKey, group]) => {
      const activeCount = group.items.filter((item) => item.isActive).length;
      const discountedCount = group.items.filter(
        (item) => item.discountPrice,
      ).length;
      const bookingCount = group.items.reduce(
        (sum, item) => sum + (item._count?.bookings || 0),
        0,
      );
      return {
        placeKey,
        placeName: group.label,
        total: group.items.length,
        activeCount,
        discountedCount,
        bookingCount,
      };
    });
  }, [groupedServices]);

  const handleCreate = async (data) => {
    await businessOfferingApi.create(data);
    toast.success("Tạo dịch vụ thành công", {
      className: "border-2 border-black rounded-none font-mono font-bold",
    });
    loadServices();
  };

  const handleUpdate = async (data) => {
    await businessOfferingApi.update(editService.id, data);
    toast.success("Cập nhật dịch vụ thành công", {
      className: "border-2 border-black rounded-none font-mono font-bold",
    });
    setEditService(null);
    loadServices();
  };

  const handleDeleteConfirmed = async () => {
    const { id } = confirmDelete;
    setConfirmDelete(null);
    try {
      await businessOfferingApi.remove(id);
      toast.success("Xóa dịch vụ thành công", {
        className: "border-2 border-black rounded-none font-mono font-bold",
      });
      // Nếu trang hiện tại chỉ còn 1 item và không phải trang đầu, lùi 1 trang
      if (services.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        loadServices();
      }
    } catch (error) {
      toast.error(error.message || "Không thể xóa", {
        className: "border-2 border-black rounded-none font-mono font-bold",
      });
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-background relative">
      <div className="absolute inset-0 bg-grid-dots opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-[1200px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-black pb-6 gap-4">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary border-4 border-black flex items-center justify-center shadow-hard rotate-3 hover:rotate-0 transition-transform">
              <Ticket className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 hover:text-primary transition-colors">
                DỊCH VỤ
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="tim-system bg-black text-white px-3 py-1 text-xs">
                  PORTAL // SERVICES
                </span>
                {total > 0 && (
                  <span className="tim-system border-2 border-black px-3 py-1 text-xs">
                    {total} DỊCH VỤ
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-black text-primary px-6 py-3 font-black text-sm uppercase tracking-widest hover:bg-primary hover:text-black border-4 border-transparent hover:border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
          >
            <Plus className="w-5 h-5" />
            TẠO MỚI
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-white border-4 border-black p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center shadow-sm">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="TÌM TÊN DỊCH VỤ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 bg-gray-50 border-2 border-black pl-12 pr-4 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all placeholder:normal-case"
            />
          </div>

          <div className="relative w-full md:w-[280px]">
            <select
              value={selectedPlaceId}
              onChange={(e) => setSelectedPlaceId(e.target.value)}
              className="w-full h-12 bg-white border-2 border-black px-4 pr-12 font-mono text-sm uppercase appearance-none focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">TẤT CẢ ĐỊA ĐIỂM</option>
              {places.map((place) => (
                <option key={place.id} value={String(place.id)}>
                  {place.name}
                </option>
              ))}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs">
              ▼
            </span>
          </div>
        </div>

        {/* Place Overview */}
        {placeOverview.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {placeOverview.map((item) => (
              <button
                key={item.placeKey}
                type="button"
                onClick={() =>
                  setSelectedPlaceId(
                    item.placeKey === "none" ? "all" : String(item.placeKey),
                  )
                }
                className="text-left bg-white border-4 border-black p-4 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <p className="font-black uppercase text-xs tracking-wide truncate">
                  {item.placeName}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 font-mono text-[11px]">
                  <span className="border border-black px-2 py-1">
                    Tổng: {item.total}
                  </span>
                  <span className="border border-black px-2 py-1">
                    Hoạt động: {item.activeCount}
                  </span>
                  <span className="border border-black px-2 py-1">
                    Đang KM: {item.discountedCount}
                  </span>
                  <span className="border border-black px-2 py-1">
                    Booking: {item.bookingCount}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Data List */}
        {loading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center bg-white border-2 border-black border-dashed">
            <div className="w-16 h-16 border-4 border-black border-t-primary rounded-none animate-spin mb-4" />
            <span className="tim-system bg-black text-white px-4 py-2 animate-pulse">
              ĐANG TẢI DỮ LIỆU [ _ ]
            </span>
          </div>
        ) : services.length === 0 ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center bg-white border-2 border-black border-dashed">
            <div className="w-16 h-16 bg-gray-100 border-2 border-black flex items-center justify-center mb-4 rotate-12">
              <AlertTriangle className="w-8 h-8 text-gray-400" />
            </div>
            <span className="text-gray-500 font-mono font-bold uppercase tracking-widest">
              CHƯA CÓ DỊCH VỤ NÀO
            </span>
          </div>
        ) : (
          <div className="grid gap-4">
            {Object.entries(groupedServices).map(([placeKey, group]) => (
              <PlaceAccordion
                key={placeKey}
                title={group.label}
                subtitle="Quản lý dịch vụ theo địa điểm"
                count={group.items.length}
                countLabel="dịch vụ"
                expanded={expandedPlaces[placeKey] ?? true}
                onToggle={() =>
                  setExpandedPlaces((prev) => ({
                    ...prev,
                    [placeKey]: !(prev[placeKey] ?? true),
                  }))
                }
                preview={[
                  {
                    label: "Hoạt động",
                    value: group.items.filter((item) => item.isActive).length,
                  },
                  {
                    label: "Đang KM",
                    value: group.items.filter((item) => item.discountPrice)
                      .length,
                  },
                ]}
                actions={[
                  <button
                    key="create-service"
                    type="button"
                    onClick={() => {
                      setEditService(null);
                      setDraftPlaceId(
                        placeKey === "none" ? "" : String(placeKey),
                      );
                      setShowForm(true);
                    }}
                    className="px-3 py-2 border-2 border-black text-xs font-black uppercase tracking-wider bg-white hover:bg-black hover:text-white transition-colors"
                  >
                    + Tạo dịch vụ cho địa điểm
                  </button>,
                  <button
                    key="filter-place"
                    type="button"
                    onClick={() =>
                      setSelectedPlaceId(
                        placeKey === "none" ? "all" : String(placeKey),
                      )
                    }
                    className="px-3 py-2 border-2 border-black text-xs font-black uppercase tracking-wider bg-white hover:bg-black hover:text-white transition-colors"
                  >
                    Lọc theo địa điểm này
                  </button>,
                ]}
              >
                {group.items.map((svc) => (
                  <div
                    key={svc.id}
                    className="bg-white border-4 border-black p-6 relative group hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
                  >
                    <div className="absolute top-0 right-0 w-8 h-8 bg-grid-dots opacity-20" />
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-black text-2xl uppercase tracking-tight">
                            {svc.name}
                          </h3>
                          <span className="px-2 py-1 bg-black text-white text-[10px] font-mono font-bold tracking-widest">
                            {(
                              SERVICE_TYPE_LABELS[svc.serviceType] ||
                              svc.serviceType
                            ).toUpperCase()}
                          </span>
                          {!svc.isActive && (
                            <span className="px-2 py-1 bg-red-500 text-white text-[10px] font-mono font-bold tracking-widest border border-red-700">
                              TẠM DỪNG
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm font-mono">
                          <div className="flex items-center gap-2">
                            {svc.discountPrice ? (
                              <>
                                <span className="text-gray-400 line-through">
                                  {formatPrice(svc.price)}
                                </span>
                                <span className="font-black text-emerald-600 text-lg">
                                  {formatPrice(svc.discountPrice)}
                                </span>
                              </>
                            ) : (
                              <span className="font-black text-lg">
                                {formatPrice(svc.price)}
                              </span>
                            )}
                          </div>

                          {svc.duration && (
                            <>
                              <span className="text-gray-300">|</span>
                              <span className="flex items-center gap-1 text-gray-600">
                                ⏱ {svc.duration} PHÚT
                              </span>
                            </>
                          )}

                          {svc.maxCapacity && (
                            <>
                              <span className="text-gray-300">|</span>
                              <span className="flex items-center gap-1 text-gray-600">
                                👥 {svc.maxCapacity} NGƯỜI
                              </span>
                            </>
                          )}

                          {svc._count?.bookings > 0 && (
                            <>
                              <span className="text-gray-300">|</span>
                              <span className="flex items-center gap-1 font-bold">
                                ★ {svc._count.bookings} BOOKING
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setEditService(svc);
                            setDraftPlaceId("");
                            setShowForm(true);
                          }}
                          className="flex items-center justify-center w-12 h-12 bg-white border-2 border-black hover:bg-black hover:text-white transition-colors"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() =>
                            setConfirmDelete({ id: svc.id, name: svc.name })
                          }
                          className="flex items-center justify-center w-12 h-12 bg-white border-2 border-black text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </PlaceAccordion>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between bg-white border-4 border-black p-4">
            <span className="font-mono text-xs">
              TRANG {page} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-10 h-10 flex items-center justify-center border-2 border-black hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                )
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) {
                    acc.push("...");
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="w-10 h-10 flex items-center justify-center font-mono text-sm"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-10 h-10 flex items-center justify-center border-2 border-black font-mono text-sm font-bold transition-colors ${
                        p === page
                          ? "bg-black text-white"
                          : "hover:bg-black hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-10 h-10 flex items-center justify-center border-2 border-black hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <ServiceFormModal
          service={editService}
          places={places}
          initialPlaceId={draftPlaceId}
          onSave={editService ? handleUpdate : handleCreate}
          onClose={() => {
            setShowForm(false);
            setEditService(null);
            setDraftPlaceId("");
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDeleteModal
          name={confirmDelete.name}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

export default ServiceListPage;
