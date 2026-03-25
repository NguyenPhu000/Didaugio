import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  BarChart3,
  Layers,
  Tag as TagIcon,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { useToast } from "@/hooks/use-toast";
import useTagStore from "@/stores/tagStore";
import TagList from "@/components/tag/TagList";
import TagFormDialog from "@/components/tag/TagFormDialog";
import TimStatsCard from "@/components/admin/TimStatsCard";

/**
 * TAG MANAGEMENT PAGE - T.I.M STYLE OVERHAUL (VIETNAMESE)
 */

const TAG_TYPES = {
  all: "Tất cả",
  general: "Chung",
  food: "Ẩm thực",
  travel: "Du lịch",
  service: "Dịch vụ",
  activity: "Hoạt động",
  ambience: "Không gian",
  price: "Giá cả",
  time: "Thời gian",
  ai_signal: "AI Signal",
};

export default function TagManagementPage() {
  const { tags, loading, fetchTags, deleteTag } = useTagStore();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("usageCount");

  useEffect(() => {
    loadTags();
  }, [filterType, sortBy]);

  const loadTags = () => {
    const params = {};
    if (filterType !== "all") params.tagType = filterType;
    if (searchQuery) params.search = searchQuery;
    params.sortBy = sortBy;
    fetchTags(params);
  };

  const handleSearch = () => {
    loadTags();
  };

  const handleAdd = () => {
    setSelectedTag(null);
    setFormOpen(true);
  };

  const handleEdit = (tag) => {
    setSelectedTag(tag);
    setFormOpen(true);
  };

  const handleDeleteClick = (tag) => {
    setSelectedTag(tag);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTag) return;

    try {
      await deleteTag(selectedTag.id);
      toast({
        title: "CẬP NHẬT HỆ THỐNG",
        description: `Thẻ [${selectedTag.name}] đã được xóa thành công.`,
        className: "bg-black text-white border border-primary font-mono",
      });
      setDeleteDialogOpen(false);
      setSelectedTag(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "LỖI",
        description: error.response?.data?.message || error.message,
      });
    }
  };

  const handleRefresh = () => {
    loadTags();
    toast({
      title: "ĐÃ LÀM MỚI",
      description: "Dữ liệu đã được đồng bộ với máy chủ.",
    });
  };

  return (
    <div className="min-h-screen p-8 bg-background relative">
      {/* Enhanced grid background with dots */}
      <div className="absolute inset-0 bg-grid-dots opacity-60 pointer-events-none"></div>
      <div className="absolute inset-0 bg-grid-lines opacity-20 pointer-events-none"></div>

      <div className="relative z-10 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between border-b-2 border-black pb-6">
          <div className="flex items-center gap-6">
            <div className="accent-bar h-16"></div>
            <div>
              <h1 className="tim-title">QUẢN LÝ THẻ</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1">
                  SYSTEM // TAGS
                </span>
                <p className="tim-meta">PHÂN LOẠI VÀ GẮN NHÃN</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="h-12 w-12 rounded-none border border-black hover:bg-black hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleAdd}
              className="h-12 bg-black text-white hover:bg-primary hover:text-black hover:shadow-hard transition-all tim-button rounded-none border border-black px-6"
            >
              <Plus className="mr-2 h-4 w-4" />
              TẠO THẺ MỚI
            </Button>
          </div>
        </div>

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TimStatsCard
            title="TỔNG THẺ"
            value={tags.length}
            icon={Layers}
            serial="TAG-001"
          />
          <TimStatsCard
            title="ĐANG HOẠT ĐỘNG"
            value={tags.filter((t) => t.isActive).length}
            icon={Activity}
            serial="TAG-002"
            textColor="text-emerald-600"
          />
          <TimStatsCard
            title="TỔNG LƯỢT DÙNG"
            value={tags.reduce((sum, t) => sum + (t.usageCount || 0), 0)}
            icon={BarChart3}
            serial="TAG-003"
          />
          <TimStatsCard
            title="LOẠI THẺ (NHÓM)"
            value={new Set(tags.map((t) => t.tagType)).size}
            icon={TagIcon}
            serial="TAG-004"
            color="bg-yellow-50"
          />
        </div>

        {/* Control Panel */}
        <div className="bg-white border border-black p-4 flex flex-wrap gap-4 items-center rounded-none shadow-sm">
          <div className="flex-1 min-w-[300px] flex items-center gap-0">
            <div className="h-10 w-10 bg-black flex items-center justify-center text-white">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="TÌM KIẾM DỮ LIỆU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-10 flex-1 px-4 border-y border-r border-black font-mono text-sm uppercase focus:outline-none focus:bg-black focus:text-primary placeholder:text-gray-400"
            />
            <Button
              onClick={handleSearch}
              className="h-10 rounded-none bg-primary text-black border border-black border-l-0 font-bold uppercase hover:bg-yellow-400"
            >
              TÌM KIẾM
            </Button>
          </div>

          <div className="flex gap-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px] rounded-none border-black font-mono text-xs uppercase h-10">
                <Filter className="h-3 w-3 mr-2" />
                <SelectValue placeholder="LỌC THEO LOẠI" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-black">
                {Object.entries(TAG_TYPES).map(([value, label]) => (
                  <SelectItem
                    key={value}
                    value={value}
                    className="font-mono text-xs uppercase focus:bg-primary focus:text-black"
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] rounded-none border-black font-mono text-xs uppercase h-10">
                <SelectValue placeholder="SẮP XẾP" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-black">
                <SelectItem
                  value="usageCount"
                  className="font-mono text-xs uppercase focus:bg-primary focus:text-black"
                >
                  SỬ DỤNG NHIỀU
                </SelectItem>
                <SelectItem
                  value="name"
                  className="font-mono text-xs uppercase focus:bg-primary focus:text-black"
                >
                  TÊN (A-Z)
                </SelectItem>
                <SelectItem
                  value="newest"
                  className="font-mono text-xs uppercase focus:bg-primary focus:text-black"
                >
                  MỚI NHẤT
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Data List */}
        <div className="relative">
          {/* Micro-typography decorative label */}
          <div className="absolute -top-6 left-0 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
            DATA_VIEW // TABLE-01
          </div>
          <TagList
            tags={tags}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            loading={loading}
          />
        </div>
      </div>

      {/* Form Dialog */}
      <TagFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedTag(null);
        }}
        tag={selectedTag}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-none border border-black p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-red-600 text-white">
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Activity className="h-6 w-6" /> CẢNH BÁO: QUY TRÌNH XÓA
            </DialogTitle>
            <DialogDescription className="text-red-100 font-mono text-xs mt-2 uppercase">
              Thao tác này là vĩnh viễn và không thể hoàn tác. Xin xác nhận.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 bg-white">
            <p className="font-mono text-sm mb-4">
              Bạn có chắc chắn muốn xóa thẻ{" "}
              <span className="font-bold">[{selectedTag?.name}]</span> khỏi cơ
              sở dữ liệu?
            </p>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                className="rounded-none border-black hover:bg-gray-100"
              >
                Hủy bỏ
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                className="rounded-none bg-red-600 hover:bg-red-700 font-bold uppercase"
              >
                Xác nhận xóa
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
