import { useState, useEffect } from "react";
import {
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  MapPin,
  FolderTree,
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useUIStore from "@/stores/uiStore";

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

/**
 * CATEGORY SUB ITEM
 * Recursive component cho nested sub-categories
 */
function CategorySubItem({
  category,
  onEdit,
  onDelete,
  onAddChild,
  level = 1,
}) {
  // Use selective subscription - only re-render when THIS category's state changes
  const isExpanded = useUIStore((state) =>
    state.expandedCategories.includes(category.id)
  );
  const toggleCategoryExpansion = useUIStore(
    (state) => state.toggleCategoryExpansion
  );

  const hasChildren = category.children && category.children.length > 0;
  const childrenCount = category._count?.children || 0;
  const IconComponent = category.icon ? ICON_MAP[category.icon] : FolderTree;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-all group/item border border-transparent hover:border-border">
        {/* Expand button or spacer */}
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0"
            onClick={() => toggleCategoryExpansion(category.id)}
          >
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        ) : (
          <div className="h-5 w-5" /> /* Spacer for alignment */
        )}

        {/* Icon */}
        <div
          className="flex items-center justify-center w-6 h-6 rounded transition-transform group-hover/item:scale-110"
          style={{
            backgroundColor: `${category.color}20`,
            color: category.color,
          }}
        >
          {IconComponent && <IconComponent className="h-3 w-3" />}
        </div>

        {/* Name */}
        <span className="text-sm flex-1 font-medium group-hover/item:text-primary transition-colors">
          {category.name}
        </span>

        {/* Badge */}
        <Badge variant="outline" className="text-xs">
          {childrenCount}
        </Badge>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover/item:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(category)}>
              <Edit className="h-3 w-3 mr-2" />
              Sửa
            </DropdownMenuItem>
            {category.level < 3 && (
              <DropdownMenuItem onClick={() => onAddChild(category)}>
                <Plus className="h-3 w-3 mr-2" />
                Thêm con
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onDelete(category)}
              className="text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Recursive children */}
      {isExpanded && hasChildren && (
        <div className="ml-4 mt-1 space-y-1 border-l-2 border-primary/20 pl-3 animate-in slide-in-from-top-2 duration-200">
          {category.children.map((child) => (
            <CategorySubItem
              key={`sub-item-${level}-${child.id}`}
              category={child}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * CATEGORY CARD
 * Card component hiển thị category với sub-categories
 */
export default function CategoryCard({
  category,
  onEdit,
  onDelete,
  onAddChild,
  onViewDetails,
}) {
  // Use selective subscription - only re-render when THIS category's state changes
  const showSubCategories = useUIStore((state) =>
    state.expandedCategories.includes(category.id)
  );
  const toggleCategoryExpansion = useUIStore(
    (state) => state.toggleCategoryExpansion
  );

  const hasChildren = category.children && category.children.length > 0;
  const childrenCount = category._count?.children || 0;
  const placesCount = category._count?.places || 0;

  // Get icon component
  const IconComponent = category.icon ? ICON_MAP[category.icon] : FolderTree;

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 relative overflow-hidden border-2 hover:border-primary/20">
      {/* Color accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 transition-all duration-300"
        style={{ backgroundColor: category.color }}
      />

      {/* Gradient overlay on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${category.color}00 0%, ${category.color} 100%)`,
        }}
      />

      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between">
          {/* Icon */}
          <div
            className="flex items-center justify-center w-14 h-14 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
            style={{
              backgroundColor: `${category.color}20`,
              color: category.color,
              boxShadow: `0 4px 14px ${category.color}30`,
            }}
          >
            {IconComponent && <IconComponent className="h-7 w-7" />}
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
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

        {/* Category Name & Description */}
        <div className="mt-4 space-y-1.5">
          <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
            {category.name}
          </h3>
          {category.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {category.description}
            </p>
          )}
        </div>

        {/* Stats Badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge
            variant="outline"
            className="text-xs font-semibold border-2"
            style={{
              borderColor: category.color,
              color: category.color,
              backgroundColor: `${category.color}10`,
            }}
          >
            Cấp {category.level}
          </Badge>
          <Badge variant="secondary" className="text-xs font-medium">
            <FolderTree className="h-3 w-3 mr-1" />
            {childrenCount} nhánh
          </Badge>
          <Badge variant="secondary" className="text-xs font-medium">
            <MapPin className="h-3 w-3 mr-1" />
            {placesCount} địa điểm
          </Badge>
        </div>
      </CardHeader>

      {/* Sub-categories Section */}
      {hasChildren && (
        <CardContent className="pt-0 pb-4 relative z-10">
          <div className="border-t pt-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-sm hover:bg-accent/50 transition-all"
              onClick={() => toggleCategoryExpansion(category.id, "single")}
            >
              <span className="text-muted-foreground font-semibold tracking-wide">
                DANH MỤC CON ({childrenCount})
              </span>
              {showSubCategories ? (
                <ChevronUp className="h-4 w-4 transition-transform" />
              ) : (
                <ChevronDown className="h-4 w-4 transition-transform" />
              )}
            </Button>

            {/* Sub-categories List with animation */}
            {showSubCategories && (
              <div className="mt-2 space-y-1 animate-in slide-in-from-top-2 duration-300">
                {category.children.map((child) => (
                  <CategorySubItem
                    key={`root-sub-${child.id}`}
                    category={child}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onAddChild={onAddChild}
                    level={2}
                  />
                ))}

                {childrenCount > category.children.length && (
                  <Button
                    variant="link"
                    size="sm"
                    className="w-full text-xs mt-2 hover:text-primary"
                    onClick={() => onViewDetails && onViewDetails(category)}
                  >
                    Xem tất cả {childrenCount} danh mục con →
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      )}

      {/* No sub-items state */}
      {!hasChildren && category.level < 3 && (
        <CardContent className="pt-0 pb-4 relative z-10">
          <div className="border-t pt-3">
            <div className="text-center py-6 text-muted-foreground">
              <div className="mb-3 flex justify-center">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                  <FolderTree className="h-5 w-5 text-muted-foreground/50" />
                </div>
              </div>
              <p className="text-xs mb-3 font-medium">Chưa có danh mục con</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddChild(category)}
                className="hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Thêm danh mục con
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
