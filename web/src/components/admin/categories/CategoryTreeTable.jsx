import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import {
  FolderOpen,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MdiCategoryIcon } from "@/components/category/MdiCategoryIcon";

export const CategoryTreeTable = memo(
  ({
    isLoading,
    filteredFlatCategories,
    expandedRows,
    toggleExpand,
    handleAddChild,
    handleEdit,
    handleDeleteClick,
  }) => {
    const { t } = useTranslation();

    return (
      <div className="bg-white rounded-3xl border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-9 h-9 border-3 border-slate-950 border-t-[#F3E600] rounded-full animate-spin mx-auto" />
            <span className="text-xs font-semibold text-slate-500">
              {t("common.loading")}
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F5] text-slate-500 font-semibold border-b border-black/[0.04]">
                  <th className="p-4">{t("categories.table.name")}</th>
                  <th className="p-4 text-center w-[90px]">
                    {t("categories.table.icon")}
                  </th>
                  <th className="p-4 text-center w-[140px]">SLUG</th>
                  <th className="p-4 text-center w-[90px]">
                    {t("categories.table.order")}
                  </th>
                  <th className="p-4 text-center w-[130px]">
                    {t("categories.table.places")}
                  </th>
                  <th className="p-4 text-center w-[130px]">
                    {t("categories.table.status")}
                  </th>
                  <th className="p-4 text-right w-[100px]">
                    {t("categories.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03]">
                {filteredFlatCategories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-[#FAF9F5] group transition-colors"
                  >
                    <td className="p-4 font-medium">
                      <div
                        className="flex items-center"
                        style={{ paddingLeft: `${cat.level * 24}px` }}
                      >
                        <div className="flex items-center mr-2">
                          {cat.children && cat.children.length > 0 ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(cat.id);
                              }}
                              className="h-6 w-6 rounded-lg flex items-center justify-center border border-black/[0.08] bg-white hover:bg-[#F5F4F0] transition-all z-10 cursor-pointer"
                            >
                              {expandedRows[cat.id] !== false ? (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-700" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-slate-700" />
                              )}
                            </button>
                          ) : (
                            <div className="w-6 h-6 flex items-center justify-center opacity-30">
                              {cat.level > 0 && (
                                <div className="w-2.5 h-0.5 bg-slate-400 rounded-full" />
                              )}
                            </div>
                          )}
                        </div>
                        {/* Name */}
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              cat.level === 0
                                ? "font-bold text-slate-950 text-sm"
                                : "text-slate-800 font-semibold text-xs"
                            }
                          >
                            {cat.name}
                          </span>
                          {cat.level === 0 && (
                            <span className="bg-[#FFFDE6] text-slate-950 border border-[#F3E600]/80 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                              ROOT
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        {String(cat.icon || "").startsWith("http") ? (
                          <Avatar className="h-8 w-8 rounded-xl border border-black/[0.06]">
                            <AvatarImage src={cat.icon} />
                            <AvatarFallback className="rounded-xl bg-slate-100 font-mono text-xs">
                              {(cat.name || "?")
                                .substring(0, 1)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-8 w-8 rounded-xl flex items-center justify-center border border-black/[0.06] bg-[#FAF9F5]">
                            <MdiCategoryIcon
                              category={cat}
                              className="h-4 w-4 text-slate-900"
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-400 lowercase max-w-[140px] truncate text-center mx-auto">
                      {cat.slug}
                    </td>
                    <td className="p-4 font-mono font-bold text-xs text-center tabular-nums text-slate-900">
                      {cat.order || 0}
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-[11px] font-mono tabular-nums font-semibold inline-block">
                        {cat._count?.places || 0} địa điểm
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {!cat.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          <EyeOff className="w-3 h-3 text-slate-400" />{" "}
                          {t("categories.status.hidden")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFFDE6] text-slate-950 border border-[#F3E600]/80">
                          <Eye className="w-3 h-3 text-slate-900" />{" "}
                          {t("categories.status.active")}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="h-8 w-8 rounded-xl border border-black/[0.06] bg-white hover:bg-[#F5F4F0] text-slate-700 flex items-center justify-center transition-all ml-auto cursor-pointer"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="rounded-2xl border border-black/[0.06] bg-white shadow-lg p-1.5 w-48 text-xs"
                        >
                          <DropdownMenuLabel className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                            {t("categories.management")}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-black/[0.04]" />
                          {cat.level < 2 && (
                            <DropdownMenuItem
                              onClick={() => handleAddChild(cat)}
                              className="rounded-xl cursor-pointer py-2 font-medium"
                            >
                              <Plus className="mr-2 h-3.5 w-3.5 text-slate-700" />{" "}
                              {t("categories.actions.addChild")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleEdit(cat)}
                            className="rounded-xl cursor-pointer py-2 font-medium"
                          >
                            <Edit className="mr-2 h-3.5 w-3.5 text-slate-700" />{" "}
                            {t("categories.actions.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-black/[0.04]" />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(cat)}
                            className="rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer py-2 font-semibold"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5 text-rose-500" />{" "}
                            {t("categories.actions.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filteredFlatCategories.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-20 text-center">
                      <FolderOpen className="h-12 w-12 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
                      <div className="font-bold text-slate-800">
                        {t("common.noData")}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Không tìm thấy danh mục nào.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
);

CategoryTreeTable.displayName = "CategoryTreeTable";
export default CategoryTreeTable;
