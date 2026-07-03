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
              <h1 className="tim-title">{t("tags.title")}</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1">
                  SYSTEM // TAGS
                </span>
                <p className="tim-meta">{t("tags.subtitle")}</p>
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
              {t("tags.createTag")}
            </Button>
          </div>
        </div>

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TimStatsCard
            title={t("tags.stats.total")}
            value={tags.length}
            icon={Layers}
            serial="TAG-001"
          />
          <TimStatsCard
            title={t("tags.stats.active")}
            value={tags.filter((tag) => tag.isActive).length}
            icon={Activity}
            serial="TAG-002"
            textColor="text-emerald-600"
          />
          <TimStatsCard
            title={t("tags.stats.totalUsage")}
            value={tags.reduce((sum, tag) => sum + (tag.usageCount || 0), 0)}
            icon={BarChart3}
            serial="TAG-003"
          />
          <TimStatsCard
            title={t("tags.stats.tagTypes")}
            value={new Set(tags.map((tag) => tag.tagType)).size}
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
              placeholder={t("tags.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-10 flex-1 px-4 border-y border-r border-black font-mono text-sm uppercase focus:outline-none focus:bg-black focus:text-primary placeholder:text-gray-400"
            />
            <Button
              onClick={handleSearch}
              className="h-10 rounded-none bg-primary text-black border border-black border-l-0 font-bold uppercase hover:bg-yellow-400"
            >
              {t("common.search")}
            </Button>
          </div>

          <div className="flex gap-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px] rounded-none border-black font-mono text-xs uppercase h-10">
                <Filter className="h-3 w-3 mr-2" />
                <SelectValue placeholder={t("tags.filterByType")} />
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
                <SelectValue placeholder={t("tags.sortBy")} />
              </SelectTrigger>
              <SelectContent className="rounded-none border-black">
                <SelectItem
                  value="usageCount"
                  className="font-mono text-xs uppercase focus:bg-primary focus:text-black"
                >
                  {t("tags.sortOptions.mostUsed")}
                </SelectItem>
                <SelectItem
                  value="name"
                  className="font-mono text-xs uppercase focus:bg-primary focus:text-black"
                >
                  {t("tags.sortOptions.nameAZ")}
                </SelectItem>
                <SelectItem
                  value="newest"
                  className="font-mono text-xs uppercase focus:bg-primary focus:text-black"
                >
                  {t("tags.sortOptions.newest")}
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
            loading={isLoading}
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
              <Activity className="h-6 w-6" /> {t("tags.deleteDialog.title")}
            </DialogTitle>
            <DialogDescription className="text-red-100 font-mono text-xs mt-2 uppercase">
              {t("tags.deleteDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 bg-white">
            <p className="font-mono text-sm mb-4">
              {t("tags.deleteDialog.message", { name: selectedTag?.name })}
            </p>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                className="rounded-none border-black hover:bg-gray-100"
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                className="rounded-none bg-red-600 hover:bg-red-700 font-bold uppercase"
              >
                {t("common.confirmDelete")}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
