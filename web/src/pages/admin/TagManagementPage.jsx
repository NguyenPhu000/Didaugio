import { useState } from "react";
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
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTags, useDeleteTag } from "@/hooks/queries/useTagQueries";
import TagList from "@/components/tag/TagList";
import TagFormDialog from "@/components/tag/TagFormDialog";
import TimStatsCard from "@/components/admin/TimStatsCard";
import { useTranslation } from "react-i18next";

/**
 * TAG MANAGEMENT PAGE - T.I.M STYLE OVERHAUL
 */

export default function TagManagementPage() {
  const { t } = useTranslation();

  const TAG_TYPES = {
    all: t("tags.types.all"),
    general: t("tags.types.general"),
    food: t("tags.types.food"),
    travel: t("tags.types.travel"),
    service: t("tags.types.service"),
    activity: t("tags.types.activity"),
    ambience: t("tags.types.ambience"),
    price: t("tags.types.price"),
    time: t("tags.types.time"),
    ai_signal: "AI Signal",
  };
  const { toast } = useToast();
  const deleteMutation = useDeleteTag();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("usageCount");

  // Build query params
  const queryParams = {};
  if (filterType !== "all") queryParams.tagType = filterType;
  if (searchQuery) queryParams.search = searchQuery;
  queryParams.sortBy = sortBy;

  const { data: tags = [], isLoading, refetch } = useTags(queryParams);

  const handleSearch = () => {
    refetch();
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
      await deleteMutation.mutateAsync(selectedTag.id);
      toast({
        title: t("common.success"),
        description: t("tags.messages.deleteSuccess", { name: selectedTag.name }),
        className: "bg-black text-white border border-primary font-mono",
      });
      setDeleteDialogOpen(false);
      setSelectedTag(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.response?.data?.message || error.message,
      });
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: t("common.refreshed"),
      description: t("tags.messages.refreshed"),
    });
  };

  return (
    <div className="space-y-6 text-slate-900 antialiased max-w-[1560px] mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/[0.04]">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Hệ thống Phân loại & Gắn thẻ
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            {t("tags.title")}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {t("tags.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="h-10 w-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-sm cursor-pointer"
          >
            <RefreshCw className="h-4 w-4 text-slate-700" />
          </Button>
          <Button
            onClick={handleAdd}
            className="flex-1 sm:flex-initial h-10 px-5 rounded-full bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4 text-white" />
            <span>{t("tags.createTag")}</span>
          </Button>
        </div>
      </header>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TimStatsCard
          title={t("tags.stats.total")}
          value={tags.length}
          icon={Layers}
        />
        <TimStatsCard
          title={t("tags.stats.active")}
          value={tags.filter((tag) => tag.isActive).length}
          icon={Activity}
        />
        <TimStatsCard
          title={t("tags.stats.totalUsage")}
          value={tags.reduce((sum, tag) => sum + (tag.usageCount || 0), 0)}
          icon={BarChart3}
        />
        <TimStatsCard
          title={t("tags.stats.tagTypes")}
          value={new Set(tags.map((tag) => tag.tagType)).size}
          icon={TagIcon}
        />
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-2xl border border-black/[0.04] p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row gap-3 items-center">
        <div className="w-full md:flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={t("tags.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full h-10 pl-10 pr-4 bg-slate-50 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-300 placeholder:text-slate-400 transition-all border border-slate-200 focus:border-slate-400"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex gap-2.5 w-full md:w-auto">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium h-10">
              <Filter className="h-3.5 w-3.5 mr-2 text-slate-500" />
              <SelectValue placeholder={t("tags.filterByType")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-slate-200">
              {Object.entries(TAG_TYPES).map(([value, label]) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="text-xs"
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[160px] rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium h-10">
              <SelectValue placeholder={t("tags.sortBy")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-slate-200">
              <SelectItem
                value="usageCount"
                className="text-xs"
              >
                {t("tags.sortOptions.mostUsed")}
              </SelectItem>
              <SelectItem
                value="name"
                className="text-xs"
              >
                {t("tags.sortOptions.nameAZ")}
              </SelectItem>
              <SelectItem
                value="newest"
                className="text-xs"
              >
                {t("tags.sortOptions.newest")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data List */}
      <TagList
        tags={tags}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        loading={isLoading}
      />

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
        <DialogContent className="rounded-2xl border border-slate-200 bg-white p-6 max-w-md shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-950 flex items-center gap-2">
              <Activity className="h-5 w-5 text-rose-600" /> {t("tags.deleteDialog.title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              {t("tags.deleteDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-slate-700">
              {t("tags.deleteDialog.message", { name: selectedTag?.name })}
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-xl border-slate-200 text-xs font-semibold"
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold"
            >
              {t("common.confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
