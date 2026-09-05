import React, { memo } from "react";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_OPTIONS } from "./reviewModerationConstants";

export const ReviewModerationFilterBar = memo(
  ({
    search,
    setSearch,
    queue,
    setQueue,
    sort,
    setSort,
    isSeededFilter,
    setIsSeededFilter,
    status,
    setStatus,
    rating,
    setRating,
    hasMedia,
    setHasMedia,
  }) => {
    return (
      <div className="rounded-2xl border border-black/[0.04] bg-white p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 w-full">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm nội dung, địa điểm, người dùng, note..."
              className="w-full h-10 pl-10 pr-4 bg-[#F8F7F3] rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#F3E600] placeholder:text-slate-400 transition-all border border-transparent focus:border-[#F3E600]/50"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:items-center gap-2.5 w-full lg:w-auto">
            <Select value={queue} onValueChange={setQueue}>
              <SelectTrigger className="h-10 px-3.5 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 w-full lg:w-44">
                <SelectValue placeholder="Hàng đợi" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
                <SelectItem value="all">Tất cả review</SelectItem>
                <SelectItem value="needs_action">
                  Cần xử lý (chờ/report)
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-10 px-3.5 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 w-full lg:w-44">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
                <SelectItem value="created_desc">Mới nhất trước</SelectItem>
                <SelectItem value="priority">
                  Ưu tiên (report → chờ)
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={isSeededFilter} onValueChange={setIsSeededFilter}>
              <SelectTrigger className="h-10 px-3.5 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 w-full lg:w-36">
                <SelectValue placeholder="Nguồn" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
                <SelectItem value="all">Mọi nguồn</SelectItem>
                <SelectItem value="seeded">Chỉ seed</SelectItem>
                <SelectItem value="not-seeded">Không seed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={setStatus}
              disabled={queue === "needs_action"}
            >
              <SelectTrigger className="h-10 px-3.5 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 w-full lg:w-40">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={rating} onValueChange={setRating}>
              <SelectTrigger className="h-10 px-3.5 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 w-full lg:w-32">
                <SelectValue placeholder="Số sao" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
                <SelectItem value="all">Tất cả sao</SelectItem>
                {[5, 4, 3, 2, 1].map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value} sao
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={hasMedia} onValueChange={setHasMedia}>
              <SelectTrigger className="h-10 px-3.5 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 w-full lg:w-36">
                <SelectValue placeholder="Ảnh" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
                <SelectItem value="all">Tất cả ảnh</SelectItem>
                <SelectItem value="with-media">Có ảnh</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }
);

ReviewModerationFilterBar.displayName = "ReviewModerationFilterBar";
export default ReviewModerationFilterBar;
