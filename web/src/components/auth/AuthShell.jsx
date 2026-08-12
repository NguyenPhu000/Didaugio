import { MapPin, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";

/**
 * AuthShell — khung chung cho tất cả trang auth.
 * Editorial split: ảnh thật bên trái + form bên phải.
 * Tokens: #F3E600 yellow, slate-900, Geist-inspired sans.
 */
const AuthShell = ({
  children,
  title = "Du lịch Cần Thơ, gọn trong một nền tảng.",
  subtitle = "Nơi các doanh nghiệp ở miền Tây quản lý điểm đến, tour và trải nghiệm mỗi ngày.",
  caption = "",
  maxWidth = "max-w-[440px]",
}) => {
  return (
    <div className="flex min-h-[100dvh] w-full overflow-x-hidden bg-[#F2F1EF] font-sans text-slate-900 antialiased">
      {/* ── Left: Editorial image panel ── */}
      <aside className="relative hidden w-[46%] shrink-0 overflow-hidden lg:block">
        <img
          src="/floating-market.jpg"
          alt="Chợ nổi Cái Răng, Cần Thơ"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-slate-950/10" />
        <div className="absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-black/60 to-transparent" />
        {/* Yellow accent bar */}
        <div className="absolute inset-x-0 top-0 h-[3px] bg-[#F3E600]" />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          {/* Logo pill — glassmorphism */}
          <Link
            to="/"
            className="inline-flex w-max items-center gap-3 rounded-full border border-white/20 bg-black/50 px-4 py-2.5 shadow-lg backdrop-blur-lg transition-all hover:border-white/30 hover:bg-black/60"
          >
            <img src="/logo512.png" alt="iPoint Genie" className="h-8 w-8 object-contain" />
            <span className="text-sm font-semibold tracking-tight text-white">iPoint Genie</span>
          </Link>

          {/* Bottom content card */}
          <div className="max-w-sm rounded-3xl border border-white/10 bg-black/45 p-7 shadow-2xl backdrop-blur-xl">
            <div className="mb-5 h-1 w-8 rounded-full bg-[#F3E600]" />
            <h2 className="text-[24px] font-bold leading-snug tracking-tight text-white xl:text-[28px]">
              {title}
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-white/70">
              {subtitle}
            </p>
            {caption && (
              <div className="mt-5 flex items-center gap-2 text-[12px] font-medium text-[#F3E600]">
                <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
                {caption}
              </div>
            )}
            <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-5 text-[11px] text-white/35">
              <Sparkles className="h-3 w-3 shrink-0 text-[#F3E600]/50" />
              © 2026 Cần Thơ Smart Tourism. Đồng hành cùng du lịch địa phương.
            </div>
          </div>
        </div>
      </aside>

      {/* ── Right: Form panel ── */}
      <main className="flex flex-1 flex-col items-center justify-center bg-[#F2F1EF] px-4 py-10 sm:px-6 lg:px-8">
        {/* Mobile logo */}
        <Link
          to="/"
          className="mb-8 inline-flex w-max items-center gap-3 rounded-full border border-slate-900/10 bg-slate-900 px-4 py-2 shadow-sm lg:hidden"
        >
          <img src="/logo512.png" alt="iPoint Genie" className="h-7 w-7 object-contain" />
          <span className="text-sm font-semibold tracking-tight text-white">iPoint Genie</span>
        </Link>

        <motion.div
          className={`w-full ${maxWidth}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default AuthShell;
