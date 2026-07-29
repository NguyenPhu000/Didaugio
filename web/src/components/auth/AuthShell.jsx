import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Khung dùng chung cho các trang xác thực (auth).
 * Bố cục 2 cột: một tấm ảnh du lịch thật bên trái + vùng form bên phải.
 * Giữ ngôn ngữ mộc mạc: ảnh thật, chữ đời thường, điểm nhấn vàng thương hiệu #F3E600.
 */
const AuthShell = ({
  children,
  title = "Du lịch Cần Thơ, gọn trong một nền tảng.",
  subtitle = "Nơi các doanh nghiệp ở miền Tây quản lý điểm đến, tour và trải nghiệm mỗi ngày.",
  caption = "",
  
}) => {
  return (
    <div className="page-enter flex min-h-[100dvh] w-full bg-[#F6F6F4] font-sans text-slate-900 antialiased">
      {/* Ảnh thương hiệu bên trái (chỉ desktop) */}
      <aside className="relative hidden w-[46%] shrink-0 overflow-hidden lg:block">
        <img
          src="/floating-market.jpg"
          alt="Chợ nổi Cái Răng, Cần Thơ"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* Phủ tối nhẹ ở đáy để chữ đọc được, giữ ảnh sáng tự nhiên phía trên */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/35 to-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          {/* Logo (Desktop) */}
          <Link
            to="/"
            className="inline-flex w-max items-center gap-3 rounded-2xl border border-white/15 bg-black/40 px-4 py-2.5 backdrop-blur-md transition-all hover:bg-black/50 hover:border-white/25 shadow-lg"
          >
            <img
              src="/logo512.png"
              alt="iPoint Genie"
              className="h-9 w-9 object-contain"
            />
            <span className="text-base font-semibold tracking-tight text-white">
              iPoint Genie
            </span>
          </Link>

          {/* Thông điệp chính */}
          <div className="max-w-md rounded-3xl border border-white/15 bg-black/40 p-6 sm:p-7 backdrop-blur-md shadow-xl">
            <h2 className="text-[26px] font-semibold leading-snug text-white xl:text-[30px]">
              {title}
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-white/80">
              {subtitle}
            </p>
            {caption && (
              <div className="mt-6 flex items-center gap-2 text-[13px] font-medium text-emerald-300">
                <MapPin className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
                {caption}
              </div>
            )}
            <div className="mt-6 border-t border-white/10 pt-4 text-xs text-white/60">
              © 2026 Cần Thơ Smart Tourism. Đồng hành cùng du lịch địa phương.
            </div>
          </div>
        </div>
      </aside>

      {/* Vùng form (phải) */}
      <main className="flex flex-1 items-center justify-center bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-[400px]">
          {/* Logo cho màn hình nhỏ */}
          <Link
            to="/"
            className="mb-8 inline-flex w-max items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-900/90 px-3.5 py-2 backdrop-blur-md lg:hidden"
          >
            <img
              src="/logo512.png"
              alt="iPoint Genie"
              className="h-8 w-8 object-contain"
            />
            <span className="text-sm font-semibold tracking-tight text-white">
              iPoint Genie
            </span>
          </Link>

          {children}
        </div>
      </main>
    </div>
  );
};

export default AuthShell;
