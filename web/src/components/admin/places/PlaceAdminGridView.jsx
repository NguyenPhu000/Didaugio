import React, { memo } from "react";
import {
  MapPin,
  Star,
  Eye,
  Info,
  Edit,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { getTableSerialNumber } from "@/utils/tableSerial";
import { getPlaceCardImageSrc, getStatusBadge } from "./placesAdminConstants";

export const PlaceAdminGridView = memo(
  ({
    places,
    pagination,
    filters,
    handleViewDetails,
    handleEdit,
    handleDelete,
    handleToggleFeature,
    handleStatusChange,
    openModerationDialog,
    canFeaturePlaces,
    canModeratePlaces,
    hasPermission,
    moderationMode,
  }) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {places.map((place, index) => (
          <article
            key={place.id}
            className="group bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col overflow-hidden relative"
          >
            {/* Top Subtle Yellow Accent Bar on Hover */}
            <div className="h-1 w-full bg-transparent group-hover:bg-[#F3E600] transition-colors" />

            {/* Photo Thumbnail Container */}
            <div className="h-48 bg-[#F4F2EC] relative overflow-hidden shrink-0">
              {getPlaceCardImageSrc(place) ? (
                <img
                  src={getPlaceCardImageSrc(place)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                  alt={place.name}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FAF9F6]">
                  <MapPin className="h-8 w-8 text-slate-300 mb-1" />
                  <span className="font-mono text-[10px] text-slate-400">
                    Chưa có hình ảnh
                  </span>
                </div>
              )}

              {/* Status & Featured Badges */}
              <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                {getStatusBadge(place.status)}
                {place.isFeatured && (
                  <div className="bg-[#F3E600] text-slate-950 px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1 rounded-full shadow-xs">
                    <Star className="w-3 h-3 fill-slate-950" /> Nổi bật
                  </div>
                )}
              </div>

              {/* Serial Number */}
              <div className="absolute top-3 left-3 bg-slate-950/70 backdrop-blur-md px-2.5 py-0.5 rounded-full">
                <span className="font-mono text-[10px] text-[#F3E600] font-bold tabular-nums">
                  #{getTableSerialNumber(
                    pagination.total || places.length,
                    index,
                    pagination.page || filters.page,
                    pagination.limit || filters.limit
                  )}
                </span>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-4 flex-1 flex flex-col space-y-3">
              <div>
                <h3
                  className="font-bold text-[15px] text-slate-950 leading-snug truncate group-hover:text-slate-800 transition-colors cursor-pointer"
                  title={place.name}
                  onClick={() => handleViewDetails(place)}
                >
                  {place.name}
                </h3>

                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F5F4F0] text-slate-800">
                    {place.category?.name || "Chưa phân loại"}
                  </span>
                  <span>•</span>
                  <span className="truncate text-[11px]" title={place.district?.name}>
                    {place.district?.name || "Cần Thơ"}
                  </span>
                </div>
              </div>

              {/* 2-Col Metric Strip */}
              <div className="grid grid-cols-2 divide-x divide-black/[0.04] bg-[#FAF9F5] rounded-xl py-2 px-1 border border-black/[0.03] text-center">
                <div className="px-1">
                  <div className="text-[10px] font-medium text-slate-500 flex items-center justify-center gap-1">
                    <Eye className="w-3 h-3 text-slate-400" /> Lượt xem
                  </div>
                  <div className="font-extrabold text-sm text-slate-950 font-mono tabular-nums mt-0.5">
                    {place.viewCount || 0}
                  </div>
                </div>
                <div className="px-1">
                  <div className="text-[10px] font-medium text-slate-500 flex items-center justify-center gap-1">
                    <Star className="w-3 h-3 text-[#F3E600] fill-[#F3E600]" /> Đánh giá
                  </div>
                  <div className="font-extrabold text-sm text-slate-950 font-mono tabular-nums mt-0.5">
                    {place.ratingAvg ? parseFloat(place.ratingAvg).toFixed(1) : "—"}
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="mt-auto pt-2 border-t border-black/[0.04] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleViewDetails(place)}
                  className="flex-1 h-8 rounded-xl font-semibold text-xs bg-white text-slate-900 hover:bg-[#F5F4F0] border border-black/[0.06] shadow-2xs transition-all flex items-center justify-center gap-1 active:scale-98"
                >
                  <Info className="h-3.5 w-3.5 text-slate-500" />
                  Chi tiết
                </button>

                <button
                  type="button"
                  onClick={() => handleEdit(place)}
                  className="flex-1 h-8 rounded-xl bg-slate-950 hover:bg-black text-white font-semibold text-xs transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-98"
                >
                  <Edit className="h-3.5 w-3.5 text-[#F3E600]" />
                  Chỉnh sửa
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="h-8 w-8 rounded-xl border border-black/[0.06] bg-white hover:bg-[#F5F4F0] text-slate-700 flex items-center justify-center transition-all shrink-0 active:scale-98"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="rounded-2xl border border-black/[0.06] bg-white shadow-lg p-1.5 w-48 text-xs"
                  >
                    <DropdownMenuLabel className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      Thao tác địa điểm
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-black/[0.04]" />
                    {canFeaturePlaces && (
                      <DropdownMenuItem
                        onClick={() => handleToggleFeature(place)}
                        className="rounded-xl cursor-pointer py-2 font-medium"
                      >
                        <Star className="mr-2 h-3.5 w-3.5 text-[#F3E600]" />
                        {place.isFeatured ? "Bỏ đánh dấu nổi bật" : "Đánh dấu nổi bật"}
                      </DropdownMenuItem>
                    )}

                    {place.status === "pending" && canModeratePlaces && (
                      <>
                        <DropdownMenuSeparator className="bg-black/[0.04]" />
                        {hasPermission("places.approve") && (
                          <DropdownMenuItem
                            onClick={() =>
                              moderationMode
                                ? openModerationDialog(place, "approved")
                                : handleStatusChange(place, "approved")
                            }
                            className="rounded-xl text-slate-900 hover:bg-[#FFFDE6] cursor-pointer py-2 font-semibold"
                          >
                            <CheckCircle className="mr-2 h-3.5 w-3.5 text-[#F3E600]" />
                            Phê duyệt nhanh
                          </DropdownMenuItem>
                        )}
                        {hasPermission("places.reject") && (
                          <DropdownMenuItem
                            onClick={() =>
                              moderationMode
                                ? openModerationDialog(place, "rejected")
                                : handleStatusChange(place, "rejected")
                            }
                            className="rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer py-2 font-semibold"
                          >
                            <XCircle className="mr-2 h-3.5 w-3.5 text-rose-500" />
                            Từ chối địa điểm
                          </DropdownMenuItem>
                        )}
                      </>
                    )}

                    {hasPermission("places.delete") && (
                      <>
                        <DropdownMenuSeparator className="bg-black/[0.04]" />
                        <DropdownMenuItem
                          onClick={() => handleDelete(place)}
                          className="rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer py-2 font-semibold"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5 text-rose-500" />
                          Xóa địa điểm
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }
);

PlaceAdminGridView.displayName = "PlaceAdminGridView";
export default PlaceAdminGridView;
