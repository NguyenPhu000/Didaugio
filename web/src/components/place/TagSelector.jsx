import { useMemo, useState } from "react";
import { useTags } from "@/hooks/queries/useTagQueries";
import { Loader2, Tag, X, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";

const TAG_GROUPS = {
  food: "Ẩm thực",
  travel: "Du lịch",
  service: "Dịch vụ/Tiện ích",
  activity: "Hoạt động",
  ambience: "Không gian",
  time: "Thời gian",
  general: "Thông tin chung",
  other: "Khác",
};

const TagSelector = ({ selectedTags = [], onChange }) => {
  const { data: tags = [], isLoading } = useTags();
  const [activeGroup, setActiveGroup] = useState(null);

  const toggleTag = (tagId) => {
    const newSelected = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId];
    onChange(newSelected);
  };

  const groupedTags = useMemo(() => {
    const groups = {};
    const sortedTags = [...tags].sort((a, b) => a.name.localeCompare(b.name));

    sortedTags.forEach((tag) => {
      const type =
        tag.tagType && TAG_GROUPS[tag.tagType] ? tag.tagType : "other";
      if (!groups[type]) groups[type] = [];
      groups[type].push(tag);
    });
    return groups;
  }, [tags]);

  const groupOrder = [
    "food",
    "service",
    "ambience",
    "activity",
    "travel",
    "general",
    "time",
    "other",
  ];

  const selectedTagObjects = tags.filter((t) => selectedTags.includes(t.id));

  if (isLoading && tags.length === 0)
    return (
      <div className="p-8 flex justify-center border border-black border-dashed bg-gray-50">
        <Loader2 className="animate-spin w-6 h-6" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <label className="text-xs font-bold uppercase tracking-wider block">
          TAGS & TIỆN ÍCH
        </label>
        <span className="text-[10px] font-mono text-gray-500 uppercase">
          {selectedTags.length} SELECTED
        </span>
      </div>

      {/* Selected Tags Summary */}
      <div className="min-h-[60px] p-3 border border-black bg-white flex flex-wrap gap-2">
        {selectedTagObjects.length > 0 ? (
          selectedTagObjects.map((tag) => (
            <Badge
              key={tag.id}
              className="bg-gray-100 text-black border border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer pr-1 transition-all rounded-none font-mono uppercase text-[10px]"
              onClick={() => toggleTag(tag.id)}
            >
              {tag.name}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))
        ) : (
          <span className="text-xs text-gray-400 font-mono italic p-1">
            -- Chưa chọn tag nào --
          </span>
        )}
      </div>

      <p className="text-[10px] font-mono text-gray-500 uppercase mb-4">
        * Nhấn vào các nhóm bên dưới để chọn tags chi tiết.
      </p>

      {/* Group Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {groupOrder.map((groupKey) => {
          const count = (groupedTags[groupKey] || []).length;
          const selectedInGroup = (groupedTags[groupKey] || []).filter((t) =>
            selectedTags.includes(t.id)
          ).length;

          return (
            <Button
              key={groupKey}
              variant="outline"
              type="button"
              className={cn(
                "h-auto py-3 px-3 flex flex-col items-start gap-1 border-black rounded-none shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-hard",
                selectedInGroup > 0
                  ? "bg-gray-50 ring-1 ring-black ring-offset-1"
                  : "bg-white"
              )}
              onClick={() => setActiveGroup(groupKey)}
            >
              <div className="flex justify-between w-full items-center">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase">
                    {TAG_GROUPS[groupKey]}
                  </span>
                </div>
                {selectedInGroup > 0 && (
                  <Badge className="h-4 px-1 bg-black text-white text-[9px] rounded-none">
                    {selectedInGroup}
                  </Badge>
                )}
              </div>
              <div className="text-[9px] font-mono text-gray-500 w-full text-left truncate">
                {count} tags available
              </div>
            </Button>
          );
        })}
      </div>

      {/* Modal for Group Selection */}
      <Dialog
        open={!!activeGroup}
        onOpenChange={(open) => !open && setActiveGroup(null)}
      >
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto rounded-none border-2 border-black p-0">
          <DialogHeader className="p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <DialogTitle className="flex justify-between items-center text-lg font-black uppercase tracking-tight">
              <span>{TAG_GROUPS[activeGroup]}</span>
              <span className="text-xs font-mono font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-sm">
                {(groupedTags[activeGroup] || []).length} OPTIONS
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 bg-white min-h-[200px]">
            {(groupedTags[activeGroup] || []).length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {(groupedTags[activeGroup] || []).map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 text-xs font-mono uppercase border transition-all text-left",
                        isSelected
                          ? "bg-black text-white border-black shadow-hard transform translate-y-[-2px]"
                          : "bg-white text-black border-gray-200 hover:border-black hover:bg-gray-50"
                      )}
                    >
                      <span className="truncate mr-2 font-medium">
                        {tag.name}
                      </span>
                      {isSelected && <Check className="w-3 h-3 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
                <Tag className="w-8 h-8 mb-2 opacity-20" />
                <span className="text-xs font-mono italic">
                  NO TAGS FOUND IN THIS CATEGORY
                </span>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end sticky bottom-0">
            <Button
              onClick={() => setActiveGroup(null)}
              className="rounded-none bg-black text-white hover:bg-gray-800 font-bold uppercase text-xs"
            >
              Xong (Close)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TagSelector;
