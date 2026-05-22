import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Image,
  Bell,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  EyeOffIcon,
  ToggleLeft,
  ToggleRight,
  Globe,
  RefreshCw,
} from "lucide-react";
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
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Content Types ─────────────────────────────────────────────────────────────

const CONTENT_TYPES = [
  {
    id: "banners",
    label: "Banner",
    icon: Image,
    description: "Quản lý banner hiển thị trên app",
    color: "bg-blue-500",
  },
  {
    id: "announcements",
    label: "Thông báo",
    icon: Bell,
    description: "Tạo và quản lý thông báo hệ thống",
    color: "bg-amber-500",
  },
  {
    id: "featured",
    label: "Nổi bật",
    icon: Globe,
    description: "Quản lý nội dung được đánh dấu nổi bật",
    color: "bg-emerald-500",
  },
  {
    id: "pages",
    label: "Trang tĩnh",
    icon: FileText,
    description: "Quản lý các trang giới thiệu, điều khoản",
    color: "bg-purple-500",
  },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ active }) => (
  <Badge
    variant="outline"
    className={cn(
      "gap-1",
      active
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-slate-200 bg-slate-50 text-slate-500"
    )}
  >
    {active ? (
      <>
        <Eye className="h-3 w-3" /> Hoạt động
      </>
    ) : (
      <>
        <EyeOffIcon className="h-3 w-3" /> Ẩn
      </>
    )}
  </Badge>
);

// ─── Content Card ─────────────────────────────────────────────────────────────

const ContentCard = ({ item, onEdit, onToggle, onDelete }) => {
  const Icon = item.icon || FileText;

  return (
    <Card className="group hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {item.image ? (
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className={cn(
              "w-16 h-16 rounded-lg flex items-center justify-center shrink-0 text-white",
              item.color || "bg-muted"
            )}>
              <Icon className="h-8 w-8" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{item.title}</h3>
                {item.subtitle && (
                  <p className="text-sm text-muted-foreground truncate">
                    {item.subtitle}
                  </p>
                )}
              </div>
              <StatusBadge active={item.active} />
            </div>

            {item.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {item.description}
              </p>
            )}

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              {item.startDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {item.startDate}
                </span>
              )}
              {item.views !== undefined && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {item.views} lượt xem
                </span>
              )}
              {item.order !== undefined && (
                <span className="flex items-center gap-1">
                  #{item.order}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(item)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onToggle(item)}
            >
              {item.active ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(item)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Edit Modal ───────────────────────────────────────────────────────────────

const EditModal = ({ open, onClose, item, onSave, type, loading }) => {
  const [form, setForm] = useState(
    item || {
      title: "",
      subtitle: "",
      description: "",
      link: "",
      order: 1,
      active: true,
      image: "",
    }
  );

  useEffect(() => {
    if (open) {
      setForm(
        item || {
          title: "",
          subtitle: "",
          description: "",
          link: "",
          order: 1,
          active: true,
          image: "",
        }
      );
    }
  }, [open, item]);

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề");
      return;
    }
    onSave(form);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước file không được vượt quá 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? "Chỉnh sửa" : "Tạo mới"} {type?.label}
          </DialogTitle>
          <DialogDescription>
            Điền thông tin chi tiết cho nội dung này
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Tiêu đề *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Nhập tiêu đề..."
            />
          </div>

          {type?.id !== "pages" && (
            <div className="space-y-1.5">
              <Label>Phụ đề</Label>
              <Input
                value={form.subtitle || ""}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="Nhập phụ đề..."
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Textarea
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Nhập mô tả..."
              className="min-h-[100px]"
            />
          </div>

          {type?.id !== "pages" && (
            <>
              <div className="space-y-1.5">
                <Label>Liên kết (URL)</Label>
                <Input
                  value={form.link || ""}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Thứ tự hiển thị</Label>
                  <Input
                    type="number"
                    value={form.order || 1}
                    onChange={(e) =>
                      setForm({ ...form, order: parseInt(e.target.value) || 1 })
                    }
                    min={1}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Trạng thái</Label>
                  <div className="flex items-center gap-2 h-10">
                    <span className="text-sm text-muted-foreground">
                      {form.active ? "Hoạt động" : "Ẩn"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, active: !form.active })}
                      className="ml-auto"
                    >
                      {form.active ? (
                        <ToggleRight className="h-6 w-6 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {type?.id === "banners" && (
                <div className="space-y-1.5">
                  <Label>Hình ảnh {item?.image ? "(Tải lên để thay đổi)" : "*"}</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer relative">
                    {form.image ? (
                      <div className="relative">
                        <img
                          src={form.image}
                          alt="Preview"
                          className="mx-auto max-h-40 rounded-lg object-contain"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => setForm((prev) => ({ ...prev, image: "" }))}
                        >
                          Xóa ảnh
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Kéo thả hoặc click để tải ảnh lên
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, WEBP (tối đa 5MB)
                        </p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {type?.id === "announcements" && (
            <div className="space-y-1.5">
              <Label>Loại thông báo</Label>
              <Select
                value={form.type || "info"}
                onValueChange={(value) => setForm({ ...form, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Thông tin</SelectItem>
                  <SelectItem value="warning">Cảnh báo</SelectItem>
                  <SelectItem value="promo">Khuyến mãi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {type?.id === "pages" && (
            <>
              <div className="space-y-1.5">
                <Label>Slug (URL)</Label>
                <Input
                  value={form.slug || ""}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="gioi-thieu"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nội dung</Label>
                <Textarea
                  value={form.content || ""}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Nội dung trang..."
                  className="min-h-[200px]"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_DATA = {
  banners: [
    {
      id: 1,
      title: "Khuyến mãa mùa hè",
      subtitle: "Giảm đến 50%",
      description: "Ưu đãi đặc biệt cho mùa hè 2024",
      image: "https://picsum.photos/400/200?random=1",
      link: "/promo/summer",
      order: 1,
      active: true,
      views: 12500,
      startDate: "01/06/2024",
    },
    {
      id: 2,
      title: "Grand Opening",
      subtitle: "Chào đón khách hàng mới",
      description: "Nhà hàng mới khai trương",
      image: "https://picsum.photos/400/200?random=2",
      link: "/new",
      order: 2,
      active: true,
      views: 8200,
      startDate: "15/06/2024",
    },
    {
      id: 3,
      title: "Thực đơn mùa",
      subtitle: "Món mới đặc biệt",
      description: "Cập nhật thực đơn theo mùa",
      image: "https://picsum.photos/400/200?random=3",
      link: "/menu",
      order: 3,
      active: false,
      views: 4500,
      startDate: "01/07/2024",
    },
  ],
  announcements: [
    {
      id: 1,
      title: "Bảo trì hệ thống",
      subtitle: "Ngày 25/06/2024",
      description: "Hệ thống sẽ bảo trì từ 2:00 - 4:00 sáng",
      type: "warning",
      order: 1,
      active: true,
      startDate: "24/06/2024",
    },
    {
      id: 2,
      title: "Cập nhật app v1.2.0",
      subtitle: "Tính năng mới",
      description: "Thêm tính năng đặt chỗ nhanh",
      type: "info",
      order: 2,
      active: true,
      startDate: "20/06/2024",
    },
  ],
  featured: [
    {
      id: 1,
      title: "Địa điểm được yêu thích",
      subtitle: "Top 10 tháng này",
      description: "Những địa điểm được khách hàng yêu thích nhất",
      order: 1,
      active: true,
      startDate: "01/06/2024",
    },
    {
      id: 2,
      title: "Combo tiết kiệm",
      subtitle: "Giảm 30%",
      description: "Gói dịch vụ tiết kiệm cho gia đình",
      order: 2,
      active: true,
      startDate: "15/06/2024",
    },
  ],
  pages: [
    {
      id: 1,
      title: "Giới thiệu",
      subtitle: "Về chúng tôi",
      description: "Thông tin về công ty và sứ mệnh",
      order: 1,
      active: true,
      views: 3500,
    },
    {
      id: 2,
      title: "Điều khoản sử dụng",
      subtitle: "Terms of Service",
      description: "Các điều khoản và điều kiện sử dụng",
      order: 2,
      active: true,
      views: 2100,
    },
    {
      id: 3,
      title: "Chính sách bảo mật",
      subtitle: "Privacy Policy",
      description: "Chính sách bảo mật thông tin người dùng",
      order: 3,
      active: true,
      views: 1800,
    },
  ],
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const CMSContentPage = () => {
  const [activeTab, setActiveTab] = useState("banners");
  const [editModal, setEditModal] = useState({ open: false, item: null });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [initialized, setInitialized] = useState(false);

  const selectedType = CONTENT_TYPES.find((t) => t.id === activeTab);

  // Load mock data (replace with API call when backend is ready)
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      setItems(MOCK_DATA[activeTab] || []);
    } catch (error) {
      console.error("Failed to fetch items:", error);
      toast.error("Không thể tải danh sách nội dung");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!initialized) {
      setItems(MOCK_DATA[activeTab] || []);
      setInitialized(true);
    } else {
      fetchItems();
    }
  }, [activeTab, initialized, fetchItems]);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && item.active) ||
      (statusFilter === "inactive" && !item.active);
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (item) => {
    setEditModal({ open: true, item });
  };

  const handleToggle = (item) => {
    // Update local state
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, active: !i.active } : i))
    );
    // Update mock data
    const mockKey = activeTab;
    if (MOCK_DATA[mockKey]) {
      const idx = MOCK_DATA[mockKey].findIndex((i) => i.id === item.id);
      if (idx !== -1) {
        MOCK_DATA[mockKey][idx].active = !MOCK_DATA[mockKey][idx].active;
      }
    }
    toast.success(
      `${item.title}: ${item.active ? "Đã ẩn" : "Đã hiển thị"}`
    );
  };

  const handleDelete = (item) => {
    if (!window.confirm(`Xóa "${item.title}"?`)) return;
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    const mockKey = activeTab;
    if (MOCK_DATA[mockKey]) {
      MOCK_DATA[mockKey] = MOCK_DATA[mockKey].filter((i) => i.id !== item.id);
    }
    toast.success("Đã xóa nội dung");
  };

  const handleSave = (form) => {
    if (editModal.item?.id) {
      // Update existing
      setItems((prev) =>
        prev.map((i) => (i.id === editModal.item.id ? { ...i, ...form } : i))
      );
      const mockKey = activeTab;
      if (MOCK_DATA[mockKey]) {
        const idx = MOCK_DATA[mockKey].findIndex((i) => i.id === editModal.item.id);
        if (idx !== -1) {
          MOCK_DATA[mockKey][idx] = { ...MOCK_DATA[mockKey][idx], ...form };
        }
      }
      toast.success("Đã cập nhật nội dung");
    } else {
      // Create new
      const newItem = {
        ...form,
        id: Math.max(...items.map((i) => i.id), 0) + 1,
        views: 0,
        startDate: new Date().toLocaleDateString("vi-VN"),
      };
      setItems((prev) => [newItem, ...prev]);
      MOCK_DATA[activeTab] = [newItem, ...(MOCK_DATA[activeTab] || [])];
      toast.success("Đã tạo nội dung mới");
    }
    setEditModal({ open: false, item: null });
  };

  const handleRefresh = () => {
    fetchItems();
  };

  const getContentCount = (typeId) => MOCK_DATA[typeId]?.length || 0;

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quản lý nội dung</h1>
            <p className="text-muted-foreground mt-1">
              Tạo và quản lý banner, thông báo, trang tĩnh và nội dung nổi bật
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button
              className="gap-2"
              onClick={() => setEditModal({ open: true, item: null })}
            >
              <Plus className="h-4 w-4" />
              Tạo mới
            </Button>
          </div>
        </div>

        {/* Content Type Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CONTENT_TYPES.map((type) => {
            const Icon = type.icon;
            const count = getContentCount(type.id);
            const isActive = activeTab === type.id;

            return (
              <button
                key={type.id}
                onClick={() => setActiveTab(type.id)}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border text-left transition-all",
                  isActive
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-card hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg shrink-0 text-white",
                  type.color
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">{type.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {count} mục
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Search & Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm nội dung..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Ẩn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Content List */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-16 h-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Globe className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">Chưa có nội dung nào</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tạo nội dung mới bằng cách nhấn nút "Tạo mới"
                </p>
                <Button
                  variant="outline"
                  className="mt-4 gap-2"
                  onClick={() => setEditModal({ open: true, item: null })}
                >
                  <Plus className="h-4 w-4" />
                  Tạo nội dung đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredItems.map((item) => (
              <ContentCard
                key={item.id}
                item={{ ...item, icon: selectedType?.icon, color: selectedType?.color }}
                onEdit={handleEdit}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Edit Modal */}
        <EditModal
          open={editModal.open}
          onClose={() => setEditModal({ open: false, item: null })}
          item={editModal.item}
          onSave={handleSave}
          type={selectedType}
          loading={isLoading}
        />
      </div>
    </div>
  );
};

export default CMSContentPage;
