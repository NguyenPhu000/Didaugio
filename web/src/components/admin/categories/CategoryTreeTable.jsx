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
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-slate-200 rounded" />
                        <div className="h-4 w-32 bg-slate-200 rounded" />
                      </div>
                    </td>
                    <td className="p-4 text-center"><div className="h-7 w-7 bg-slate-200 rounded-md mx-auto" /></td>
                    <td className="p-4 text-center"><div className="h-3.5 w-20 bg-slate-200 rounded mx-auto" /></td>
                    <td className="p-4 text-center"><div className="h-3.5 w-8 bg-slate-200 rounded mx-auto" /></td>
                    <td className="p-4 text-center"><div className="h-5 w-12 bg-slate-200 rounded-full mx-auto" /></td>
                    <td className="p-4 text-center"><div className="h-5 w-16 bg-slate-200 rounded-full mx-auto" /></td>
                    <td className="p-4 text-right"><div className="h-7 w-7 bg-slate-200 rounded-full ml-auto" /></td>
                  </tr>
                ))
              ) : (
                <>
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
                          {cat.children && cat.children.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(cat.id)}
                              className="mr-2 p-1 rounded-md hover:bg-black/[0.05] transition-colors cursor-pointer text-slate-500"
                            >
                              {expandedRows[cat.id] !== false ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </button>
                          ) : (
                            <span className="w-5 mr-2" />
                          )}
                          <span
                            className={
                              cat.level === 0
                                ? "font-bold text-slate-950 text-sm"
                                : "text-slate-700 font-medium"
                            }
                          >
                            {cat.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <Avatar className="h-7 w-7 rounded-lg border border-black/[0.05] shadow-2xs">
                            <AvatarImage
                              src={cat.icon}
                              className="object-contain p-1"
                            />
                            <AvatarFallback className="bg-[#FAF9F5] text-[10px] font-bold text-slate-600 rounded-lg">
                              <MdiCategoryIcon
                                name={cat.icon}
                                className="h-3.5 w-3.5 text-slate-700"
                              />
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </td>
                      <td className="p-4 text-center font-mono text-[11px] text-slate-400">
                        {cat.slug}
                      </td>
                      <td className="p-4 text-center font-mono font-semibold text-slate-600">
                        {cat.order}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-slate-100 text-slate-700">
                          {cat._count?.places || 0}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            cat.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {cat.isActive ? (
                            <>
                              <Eye className="w-3 h-3" />{" "}
                              {t("categories.status.active")}
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />{" "}
                              {t("categories.status.hidden")}
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="h-7 w-7 rounded-full bg-[#FAF9F5] border border-black/[0.04] inline-flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer text-slate-600"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="rounded-2xl border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.06)] min-w-[140px] text-xs"
                          >
                            <DropdownMenuLabel className="font-bold text-slate-400 uppercase text-[10px] px-3 py-1.5">
                              {t("categories.actions.title")}
                            </DropdownMenuLabel>
                            {cat.level < 2 && (
                              <DropdownMenuItem
                                onClick={() => handleAddChild(cat)}
                                className="rounded-xl hover:bg-slate-50 cursor-pointer py-2 font-semibold"
                              >
                                <Plus className="mr-2 h-3.5 w-3.5 text-slate-700" />{" "}
                                {t("categories.actions.addChild")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleEdit(cat)}
                              className="rounded-xl hover:bg-slate-50 cursor-pointer py-2 font-semibold"
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
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

CategoryTreeTable.displayName = "CategoryTreeTable";
export default CategoryTreeTable;
