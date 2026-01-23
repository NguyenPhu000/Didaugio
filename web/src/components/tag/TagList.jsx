import { useState } from "react";
import { Edit, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TAG_TYPE_COLORS } from "@/constants/tagConstants";

/**
 * TAG LIST
 * Hiển thị danh sách tags dạng table
 */

export default function TagList({ tags, onEdit, onDelete, loading }) {
  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading tags...
      </div>
    );
  }

  if (!tags || tags.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No tags found</p>
        <p className="text-sm">Create your first tag to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 rounded-lg font-medium text-sm">
        <div className="col-span-4">Name</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-2">Usage Count</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Actions</div>
      </div>

      {/* Table Body */}
      {tags.map((tag) => (
        <Card key={tag.id} className="p-4">
          <div className="grid grid-cols-12 gap-4 items-center">
            {/* Name */}
            <div className="col-span-4 flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              <div className="min-w-0">
                <div className="font-medium truncate">{tag.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {tag.slug}
                </div>
              </div>
            </div>

            {/* Type */}
            <div className="col-span-2">
              <Badge variant={TAG_TYPE_COLORS[tag.tagType] || "default"}>
                {tag.tagType}
              </Badge>
            </div>

            {/* Usage Count */}
            <div className="col-span-2">
              <span className="text-sm">{tag.usageCount || 0} places</span>
            </div>

            {/* Status */}
            <div className="col-span-2">
              <Badge variant={tag.isActive ? "success" : "secondary"}>
                {tag.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            {/* Actions */}
            <div className="col-span-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(tag)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(tag)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
