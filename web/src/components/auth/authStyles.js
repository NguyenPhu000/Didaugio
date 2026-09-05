/**
 * Lớp style dùng chung cho các trang auth để giữ ngôn ngữ thiết kế thống nhất:
 * bo góc mềm (rounded-xl), viền slate nhạt, focus ring êm, nút vàng thương hiệu.
 */

export const fieldLabel =
  "flex items-center gap-1.5 text-sm font-medium text-slate-700";

export const fieldInput =
  "h-12 rounded-xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus-visible:border-slate-900 focus-visible:ring-4 focus-visible:ring-slate-900/10";

export const fieldError = "text-xs font-medium text-rose-600";

// Nút chính: vàng thương hiệu, chữ đậm màu mực, shadow rõ hơn
export const primaryButton =
  "h-12 w-full rounded-xl bg-[#F3E600] text-sm font-semibold text-slate-900 shadow-[0_2px_8px_rgba(243,230,0,0.35)] transition-all duration-300 hover:bg-[#e3d600] hover:shadow-[0_4px_16px_rgba(243,230,0,0.45)] active:scale-[0.99] disabled:opacity-60";

// Nút phụ: viền, nền trắng
export const secondaryButton =
  "flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 shadow-sm transition-all duration-300 hover:bg-slate-50 active:scale-[0.99]";

// Thẻ chứa nội dung (form / trạng thái)
export const authCard =
  "rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)] sm:p-9";

// Nút hiện/ẩn mật khẩu
export const eyeButton =
  "absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700";
