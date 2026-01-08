import { useState } from "react";
import {
  Folder,
  FolderOpen,
  MoreVertical,
  Plus,
  Edit,
  Trash2,
  UtensilsCrossed,
  ChefHat,
  Coffee,
  Hotel,
  Home,
  Landmark,
  ShoppingBag,
  TreePine,
  Building,
  Waves,
  Palmtree,
  Mountain,
  Church,
  Store,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

/**
 * CATEGORY TREE ITEM
 * Recursive component hiển thị category tree
 */

// Icon mapper
const ICON_MAP = {
  UtensilsCrossed,
  ChefHat,
  Coffee,
  Hotel,
  Home,
  Landmark,
  ShoppingBag,
  TreePine,
  Building,
  Waves,
  Palmtree,
  Mountain,
  Church,
  Store,
  Camera,
};

export default function CategoryTreeItem({
  category,
  level = 0,
  onEdit,
  onDelete,
  onAddChild,
  onSelect,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(category);
    }
  };

  return (
    <div className="select-none">
      {/* Category Item */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors ${
          level > 0 ? "ml-6" : ""
        }`}
      >
        {/* Expand/Collapse Icon */}
        <button
          onClick={handleToggle}
          className={`p-1 hover:bg-accent-foreground/10 rounded ${
            !hasChildren ? "invisible" : ""
          }`}
        >
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Category Icon */}
        {category.icon && (
          <div
            className="flex items-center justify-center w-8 h-8 rounded"
            style={{
              backgroundColor: `${category.color}20`,
              color: category.color,
            }}
          >
            {(() => {
              const IconComponent = ICON_MAP[category.icon];
              return IconComponent ? (
                <IconComponent className="h-4 w-4" />
              ) : (
                <span className="text-xs">{category.icon}</span>
              );
            })()}
          </div>
        )}

        {/* Category Info */}
        <div className="flex-1 cursor-pointer" onClick={handleSelect}>
          <div className="flex items-center gap-2">
            <span className="font-medium">{category.name}</span>
            <Badge variant="outline" className="text-xs">
              Cấp {category.level}
            </Badge>
          </div>
          {category.description && (
            <p className="text-xs text-muted-foreground truncate">
              {category.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span>{category._count?.children || 0} con</span>
            <span>{category._count?.places || 0} địa điểm</span>
            <span>{category._count?.categoryTags || 0} thẻ</span>
          </div>
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(category)}>
              <Edit className="h-4 w-4 mr-2" />
              Sửa
            </DropdownMenuItem>
            {category.level < 3 && (
              <DropdownMenuItem onClick={() => onAddChild(category)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm danh mục con
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onDelete(category)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="mt-1">
          {category.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
