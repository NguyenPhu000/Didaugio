import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Menu,
  X,
  Facebook,
  Instagram,
  Youtube,
  Send,
  Compass,
  Sparkles,
} from "lucide-react";

const NAV_LINKS = [
  { label: "Bản Đồ Số", href: "/" },
  { label: "Lịch Trình AI", href: "/" },
  { label: "Điểm Đến", href: "/" },
  { label: "Đối Tác Doanh Nghiệp", href: "/business/welcome" },
  { label: "Bảng Giá Gói", href: "/business/pricing" },
  { label: "Chính Sách Bảo Mật", href: "/privacy" },
];

const FOOTER_COLUMNS = [
  {
    title: "ĐIỂM ĐẾN CẦN THƠ",
    links: [
      { label: "Bến Ninh Kiều", href: "/" },
      { label: "Chợ Nổi Cái Răng", href: "/" },
      { label: "Cồn Sơn Sinh Thái", href: "/" },
      { label: "Nhà Cổ Bình Thủy", href: "/" },
      { label: "Vườn Cò Bằng Lăng", href: "/" },
    ],
  },
  {
    title: "DÀNH CHO ĐỐI TÁC",
    links: [
      { label: "Đăng Ký Doanh Nghiệp", href: "/business/register" },
      { label: "Gói Dịch Vụ iPoint", href: "/business/pricing" },
      { label: "Quản Lý Đặt Chỗ", href: "/business/bookings" },
      { label: "Tối Ưu Doanh Thu", href: "/business/revenue" },
      { label: "Hồ Sơ Đối Tác", href: "/business/profile" },
    ],
  },
  {
    title: "CÔNG NGHỆ & AI",
    links: [
      { label: "Gợi Ý Tour Thông Minh", href: "/" },
      { label: "Bản Đồ Số 9 Quận Huyện", href: "/" },
      { label: "Trợ Lý Giọng Nói Genie", href: "/" },
      { label: "Dữ Liệu Du Lịch Mở", href: "/" },
      { label: "Xác Thực GPS Địa Điểm", href: "/" },
    ],
  },
  {
    title: "VỀ CHÚNG TÔI",
    links: [
      { label: "Câu Chuyện iPoint Genie", href: "/" },
      { label: "Hệ Sinh Thái Du Lịch", href: "/" },
      { label: "Chính Sách Bảo Mật", href: "/privacy" },
      { label: "Điều Khoản Dịch Vụ", href: "/terms" },
      { label: "Trung Tâm Trợ Giúp", href: "mailto:support@ipointgenie.vn" },
    ],
  },
];

const SOCIAL_ICONS = [
  { Icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { Icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { Icon: Youtube, href: "https://youtube.com", label: "Youtube" },
  { Icon: Compass, href: "/", label: "Cần Thơ Travel" },
];

export default function NotFoundPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const toggleMobileMenu = () => {
    if (!mobileMenuOpen) {
      setMobileMenuOpen(true);
    } else {
      setMenuVisible(false);
      setTimeout(() => {
        setMobileMenuOpen(false);
      }, 500);
    }
  };

  useEffect(() => {
    if (mobileMenuOpen) {
      const raf = requestAnimationFrame(() => {
        setMenuVisible(true);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [mobileMenuOpen]);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!emailInput) return;
    setSubscribed(true);
    setEmailInput("");
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <div
      className="relative min-h-screen flex flex-col overflow-x-hidden bg-[#030712] text-white selection:bg-emerald-500 selection:text-white"
      style={{ fontFamily: '"Helvetica Now Var", "IBM Plex Sans", Helvetica, Arial, sans-serif' }}
    >
      {/* Dynamic Inject Style for 404 Text Shadow & Liquid Glass */}
      <style>{`
        .four-oh-four {
          text-shadow: 0 0 80px rgba(255, 255, 255, 0.35), 0 0 160px rgba(16, 185, 129, 0.25);
        }
        .liquid-glass {
          background: rgba(255, 255, 255, 0.04);
          background-blend-mode: luminosity;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: none;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 10px 30px rgba(0, 0, 0, 0.5);
          position: relative;
          overflow: hidden;
        }
        .liquid-glass::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1.5px;
          background: linear-gradient(180deg,
            rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 20%,
            rgba(255,255,255,0) 40%, rgba(255,255,255,0.4) 60%,
            rgba(255,255,255,0.2) 80%, rgba(255,255,255,0.6) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      `}</style>

      {/* ── Background Cinematic Video ── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260613_180732_a54afbf6-b30d-470e-861f-669871f09f67.mp4"
          type="video/mp4"
        />
      </video>

      {/* Dark overlay gradient for readability & river depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 z-0 pointer-events-none" />

      {/* ── Content Wrapper ── */}
      <div className="relative z-10 flex flex-col min-h-screen justify-between">
        {/* ── Navigation Bar ── */}
        <header className="flex items-center justify-between px-6 md:px-12 lg:px-16 py-5">
          {/* Logo iPoint Genie */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative h-9 w-9 rounded-xl border border-white/20 bg-white/10 p-1 backdrop-blur-md transition-transform group-hover:scale-105">
              <img
                src="/logo512.png"
                alt="iPoint Genie Logo"
                className="h-full w-full object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <Sparkles className="absolute inset-0 m-auto h-4 w-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="text-white text-lg sm:text-xl font-black tracking-wider leading-tight">
                iPoint Genie
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-emerald-400 font-bold">
                Du Lịch Cần Thơ
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links (center) */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-white/80 hover:text-white text-xs font-semibold tracking-wide uppercase transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Login Button (right) */}
          <div className="hidden lg:flex items-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-slate-950 text-xs font-extrabold px-6 py-2.5 rounded-full shadow-lg hover:shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all duration-300 uppercase tracking-wider"
            >
              <span>ĐĂNG NHẬP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="lg:hidden relative z-[60] p-2 text-white focus:outline-none"
            aria-label="Mở Menu"
          >
            <div className="relative w-6 h-6">
              <Menu
                className={`w-6 h-6 absolute inset-0 transition-all duration-300 ${
                  menuVisible
                    ? "opacity-0 rotate-90 scale-75"
                    : "opacity-100 rotate-0 scale-100"
                }`}
              />
              <X
                className={`w-6 h-6 absolute inset-0 transition-all duration-300 ${
                  menuVisible
                    ? "opacity-100 rotate-0 scale-100"
                    : "opacity-0 -rotate-90 scale-75"
                }`}
              />
            </div>
          </button>
        </header>

        {/* ── Mobile Menu Dropdown ── */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={toggleMobileMenu}
              className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-md transition-opacity duration-400 ${
                menuVisible ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            />

            {/* Menu Panel */}
            <div className="absolute left-0 right-0 top-[72px] z-50 overflow-hidden">
              <div className="backdrop-blur-2xl bg-slate-950/80 rounded-b-3xl p-6 relative z-10 flex flex-col items-center gap-4 border-b border-white/10 shadow-2xl">
                {NAV_LINKS.map((item, index) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={() => {
                      setMenuVisible(false);
                      setTimeout(() => setMobileMenuOpen(false), 500);
                    }}
                    className="text-base font-medium tracking-wide text-white/90 hover:text-emerald-400 transition-all duration-400 ease-out"
                    style={{
                      transitionDelay: menuVisible ? `${250 + index * 40}ms` : "0ms",
                      opacity: menuVisible ? 1 : 0,
                      transform: menuVisible ? "translateY(0)" : "translateY(12px)",
                    }}
                  >
                    {item.label}
                  </Link>
                ))}

                <Link
                  to="/login"
                  onClick={() => {
                    setMenuVisible(false);
                    setTimeout(() => setMobileMenuOpen(false), 500);
                  }}
                  className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 text-xs font-extrabold px-8 py-3 rounded-full uppercase tracking-wider transition-all duration-400 ease-out shadow-lg"
                  style={{
                    transitionDelay: menuVisible
                      ? `${250 + NAV_LINKS.length * 40}ms`
                      : "0ms",
                    opacity: menuVisible ? 1 : 0,
                    transform: menuVisible ? "translateY(0)" : "translateY(12px)",
                  }}
                >
                  <span>ĐĂNG NHẬP HỆ THỐNG</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </>
        )}

        {/* ── HERO / 404 SECTION ── */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-12 sm:py-16 md:py-10">
          <div className="space-y-1 mb-4">
            <h1 className="text-white/85 text-lg sm:text-2xl md:text-4xl font-light leading-snug tracking-tight">
              Trang bạn đang tìm kiếm dường như đã
            </h1>
            <h2 className="text-emerald-400/90 text-lg sm:text-2xl md:text-4xl font-bold leading-snug tracking-tight">
              lạc khỏi bản đồ hành trình Cần Thơ :/
            </h2>
          </div>

          <div className="relative my-4 sm:my-6 w-full flex justify-center overflow-visible">
            <span className="four-oh-four text-[90px] sm:text-[150px] md:text-[210px] lg:text-[250px] font-black text-white leading-none tracking-tighter select-none font-mono">
              404
            </span>
          </div>

          <div className="pt-2">
            <Link
              to="/"
              className="liquid-glass text-white text-[11px] sm:text-xs tracking-[0.2em] font-bold px-8 sm:px-10 py-3.5 sm:py-4 rounded-full uppercase hover:scale-105 active:scale-95 transition-all duration-300 inline-flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: "12s" }} />
              <span>Về Trang Chủ Khám Phá</span>
            </Link>
          </div>
        </main>

        {/* ── FOOTER ── */}
        <footer className="relative z-10 px-4 sm:px-6 md:px-12 lg:px-16 pb-8 sm:pb-10 pt-8 sm:pt-12 border-t border-white/10 bg-black/40 backdrop-blur-md">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8 lg:gap-6 max-w-7xl mx-auto">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <h3 className="text-emerald-400 text-[10px] sm:text-xs font-bold tracking-[0.15em] mb-3 sm:mb-4 uppercase">
                  {column.title}
                </h3>
                <ul className="space-y-2 sm:space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="text-white/60 hover:text-white text-xs transition-colors duration-200 block leading-relaxed"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Newsletter + Social Column */}
            <div className="col-span-2 lg:col-span-2 space-y-4">
              <div>
                <h3 className="text-white text-[10px] sm:text-xs font-bold tracking-[0.15em] mb-2 uppercase">
                  NHẬN ƯU ĐÃI & TOUR AI MỚI NHẤT
                </h3>
                <p className="text-xs text-white/50 mb-3 leading-relaxed">
                  Cập nhật các địa điểm ẩm thực, voucher và lễ hội du lịch miền Tây sớm nhất.
                </p>

                <form onSubmit={handleSubscribe} className="flex items-center max-w-sm">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Nhập email của bạn..."
                    required
                    className="bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-xs px-4 py-2.5 rounded-l-xl w-full focus:outline-none focus:border-emerald-400 backdrop-blur-sm"
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-bold text-xs tracking-wider px-5 py-2.5 rounded-r-xl shrink-0 hover:opacity-95 transition-opacity flex items-center gap-1.5"
                  >
                    <span>GỬI</span>
                    <Send className="w-3 h-3" />
                  </button>
                </form>

                {subscribed && (
                  <p className="text-emerald-400 text-xs mt-2 animate-fade-in">
                    ✓ Cảm ơn bạn! Chúng tôi sẽ gửi thông tin tour mới nhất.
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-white text-[10px] sm:text-xs font-bold tracking-[0.15em] mb-2.5 uppercase">
                  KẾT NỐI VỚI iPOINT GENIE
                </h4>
                <div className="flex items-center gap-3">
                  {SOCIAL_ICONS.map(({ Icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-emerald-400 hover:border-emerald-400/40 transition-all duration-200"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto pt-6 mt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-white/40">
            <p>© 2026 iPoint Genie — Nền tảng Du lịch Thông minh Cần Thơ. All rights reserved.</p>
            <p className="flex items-center gap-2">
              <span>Bản quyền thuộc về iPoint Genie</span>
              <span>•</span>
              <Link to="/privacy" className="hover:text-white transition-colors">Bảo Mật</Link>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
