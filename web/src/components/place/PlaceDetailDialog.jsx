import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui";
import {
  MapPin,
  Clock,
  Phone,
  Globe,
  Star,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Facebook,
  ShieldCheck,
  Mail,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Navigation,
  Info,
  Hash,
  Building2,
  ImageOff,
  TrendingUp,
  Award,
  ArrowUpRight,
  Volume2,
  Briefcase,
  Tag,
  Compass,
  FileText,
  HelpCircle,
  Radio,
  User,
} from "lucide-react";
import { BUSINESS_STATUS_LABELS } from "@/constants/businessConstants";
import { MdiCategoryIcon } from "@/components/category/MdiCategoryIcon";
import { MapView } from "@/modules/map";
import { cn } from "@/lib/utils";

// ─── Dynamic Category Icon Component ──────────────────────────────────────────

function CategoryIcon({ icon, className = "w-4 h-4" }) {
  if (!icon) return <Compass className={className} />;
  if (typeof icon === "string" && icon.length <= 4) {
    return <span className="text-base leading-none">{icon}</span>;
  }
  return <MdiCategoryIcon category={icon} className={className} />;
}

// ─── Price Range Formatting Helper ───────────────────────────────────────────

const PRICE_LABELS_MAP = {
  FREE: "Miễn phí",
  free: "Miễn phí",
  BUDGET: "Bình dân",
  budget: "Bình dân",
  MODERATE: "Vừa phải",
  moderate: "Vừa phải",
  midRange: "Vừa phải",
  EXPENSIVE: "Cao cấp",
  expensive: "Cao cấp",
  premium: "Cao cấp",
  LUXURY: "Sang trọng",
  luxury: "Sang trọng",
  "explore.search.price.free": "Miễn phí",
  "explore.search.price.budget": "Bình dân",
  "explore.search.price.midRange": "Vừa phải",
  "explore.search.price.premium": "Cao cấp",
};

function formatPriceRange(val) {
  if (!val) return "Chưa xác định";
  if (PRICE_LABELS_MAP[val]) return PRICE_LABELS_MAP[val];
  if (typeof val === "string" && val.includes(".")) {
    const key = val.split(".").pop();
    if (PRICE_LABELS_MAP[key]) return PRICE_LABELS_MAP[key];
  }
  return String(val);
}

// ─── Creator Name Resolver ───────────────────────────────────────────────────

function getCreatorName(place) {
  if (!place) return "Chưa xác định";
  const u =
    place.createdByUser ||
    place.user ||
    place.creator ||
    place.author ||
    place.business?.user;
  if (u) {
    const fullName = u.profile?.fullName || u.fullName;
    if (fullName && fullName.trim()) return fullName.trim();
    if (u.username && u.username.trim()) return u.username.trim();
    if (u.email && u.email.trim()) return u.email.trim();
  }
  if (place.business?.businessName) {
    return place.business.businessName;
  }
  if (place.createdBy) return `Tài khoản #${place.createdBy}`;
  return "Ban Quản Trị Hệ Thống";
}

// ─── Status Configurations ───────────────────────────────────────────────────

const DAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const DAY_FULL = [
  "Chủ nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
];

const STATUS_CFG = {
  draft: {
    label: "BẢN NHÁP",
    bg: "bg-slate-100 text-slate-800 border-slate-300",
    dot: "bg-slate-500",
  },
  pending: {
    label: "CHỜ DUYỆT",
    bg: "bg-amber-100/90 text-amber-900 border-amber-300",
    dot: "bg-amber-500 animate-pulse",
  },
  approved: {
    label: "ĐÃ DUYỆT",
    bg: "bg-emerald-100/90 text-emerald-900 border-emerald-300",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "TỪ CHỐI",
    bg: "bg-rose-100/90 text-rose-900 border-rose-300",
    dot: "bg-rose-500",
  },
  hidden: {
    label: "ĐÃ ẨN",
    bg: "bg-gray-100 text-gray-700 border-gray-300",
    dot: "bg-gray-400",
  },
};

const PRICE_CFG = {
  FREE: { label: "Miễn phí", icon: "✦", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  BUDGET: { label: "Bình dân", icon: "₫", cls: "text-sky-700 bg-sky-50 border-sky-200" },
  MODERATE: { label: "Vừa phải", icon: "₫₫", cls: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  EXPENSIVE: { label: "Cao cấp", icon: "₫₫₫", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  LUXURY: { label: "Sang trọng", icon: "💎", cls: "text-purple-700 bg-purple-50 border-purple-200" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useCurrentOpenStatus(openingHours) {
  return useMemo(() => {
    if (!openingHours?.length) return { known: false };
    const now = new Date();
    const today = now.getDay();
    const hhmm = now.getHours() * 100 + now.getMinutes();
    const todayH = openingHours.find((h) => h.dayOfWeek === today);
    if (!todayH) return { known: false };
    if (todayH.isClosed) return { known: true, open: false, todayHour: todayH };
    const [oh, om] = (todayH.openTime || "00:00").split(":").map(Number);
    const [ch, cm] = (todayH.closeTime || "23:59").split(":").map(Number);
    return {
      known: true,
      open: hhmm >= oh * 100 + om && hhmm <= ch * 100 + cm,
      todayHour: todayH,
    };
  }, [openingHours]);
}

function StarRow({ value, count }) {
  const v = Math.min(5, Math.max(0, Number(value) || 0));
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <svg
            key={n}
            className={cn(
              "w-4 h-4",
              n <= Math.round(v)
                ? "fill-amber-400 text-amber-400"
                : "fill-gray-200 text-gray-200",
            )}
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
          </svg>
        ))}
      </div>
      <span className="text-base font-black text-gray-900">{v.toFixed(1)}</span>
      <span className="text-xs text-gray-500 font-medium">({count ?? 0} đánh giá)</span>
    </div>
  );
}

function InfoChip({ icon: Icon, children, href, className }) {
  const inner = (
    <div className={cn("flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100 hover:border-gray-300 hover:bg-gray-100/70 transition-all group", className)}>
      <div className="w-8 h-8 rounded-lg bg-white border border-gray-200/80 shadow-xs flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-gray-600 group-hover:text-gray-900 transition-colors" />
      </div>
      <span className="text-sm font-medium text-gray-800 leading-snug break-all">{children}</span>
    </div>
  );
  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : "_self"}
        rel="noreferrer"
        className="block hover:opacity-95 transition-opacity"
      >
        {inner}
      </a>
    );
  }
  return inner;
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center shadow-xs">
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
        {children}
      </h3>
      <div className="flex-1 h-px bg-gray-200/70" />
    </div>
  );
}

// ─── Image Gallery (Left Panel) ───────────────────────────────────────────────

function ImageGallery({ images, thumbnail, name, status, isFeatured }) {
  const [idx, setIdx] = useState(0);

  const imgs = useMemo(() => {
    if (Array.isArray(images) && images.length > 0) return images;
    if (thumbnail) return [{ url: thumbnail, isCover: true }];
    return [];
  }, [images, thumbnail]);

  const getImgSrc = (img) =>
    img?.secureUrl || img?.thumbnailUrl || img?.imageData || img?.url || img?.image_data;

  const currentSrc = getImgSrc(imgs[idx]);
  const s = STATUS_CFG[status] || STATUS_CFG.draft;

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-l-3xl overflow-hidden relative border-r border-slate-800">
      {/* Main Preview */}
      <div className="relative flex-1 min-h-0 overflow-hidden group">
        {currentSrc ? (
          <img
            src={currentSrc}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900/90 p-6 text-center">
            <ImageOff className="w-16 h-16 opacity-25 mb-3 stroke-[1.5]" />
            <span className="text-xs font-mono tracking-widest uppercase text-slate-400">
              Chưa có hình ảnh địa điểm
            </span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/40 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          <div
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold backdrop-blur-md border shadow-md",
              s.bg,
            )}
          >
            <span className={cn("w-2 h-2 rounded-full", s.dot)} />
            {s.label}
          </div>
          {isFeatured && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-[11px] font-black shadow-md border border-amber-300">
              <Award className="w-3.5 h-3.5 fill-amber-950" /> DỊCH VỤ NỔI BẬT
            </div>
          )}
        </div>

        {/* Top-right Counter */}
        {imgs.length > 0 && (
          <div className="absolute top-4 right-4 bg-slate-900/80 text-slate-200 text-[11px] font-mono font-bold px-3 py-1 rounded-full backdrop-blur-md border border-slate-700/60 shadow-md">
            {idx + 1} / {imgs.length}
          </div>
        )}

        {/* Navigation Arrows */}
        {imgs.length > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => (i - 1 + imgs.length) % imgs.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md border border-slate-700 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
              title="Ảnh trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIdx((i) => (i + 1) % imgs.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md border border-slate-700 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
              title="Ảnh sau"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Bottom Name Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
          <h2 className="text-xl font-black tracking-tight leading-snug drop-shadow-md line-clamp-2">
            {name}
          </h2>
        </div>
      </div>

      {/* Thumbnail Strip */}
      {imgs.length > 1 && (
        <div className="h-24 bg-slate-900/90 border-t border-slate-800 p-3 flex gap-2.5 overflow-x-auto scrollbar-thin">
          {imgs.map((img, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={cn(
                "flex-shrink-0 h-full w-20 rounded-xl overflow-hidden border-2 transition-all relative group",
                i === idx
                  ? "border-amber-400 ring-2 ring-amber-400/30 scale-105"
                  : "border-slate-700/80 opacity-60 hover:opacity-100 hover:border-slate-500",
              )}
            >
              <img
                src={getImgSrc(img)}
                alt={`Thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {img.isCover && (
                <span className="absolute top-1 left-1 bg-amber-400 text-amber-950 text-[9px] font-black px-1.5 py-0.5 rounded">
                  BÌA
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main PlaceDetailDialog Component ─────────────────────────────────────────

const PlaceDetailDialog = ({
  place,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onViewBusinessDetails,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const openStatus = useCurrentOpenStatus(place?.openingHours);

  if (!place) return null;

  const creatorName = getCreatorName(place);
  const rating = Number(place.ratingAvg ?? place.averageRating ?? 0);
  const priceInfo = PRICE_CFG[place.priceRange];
  const phone = place.phone || place.phoneNumber;
  const facebook = place.facebook || place.facebookUrl;

  const hasAmenities = place.amenities?.length > 0;
  const hasTags = place.tagLinks?.length > 0 || place.tags?.length > 0;
  const tagList = place.tagLinks
    ? place.tagLinks.map((l) => l.tag).filter(Boolean)
    : place.tags || [];

  const services = place.services || [];

  // Resolve Spoken Guide details
  const spokenGuideObj =
    place.spokenGuide || (place.aiGuides && place.aiGuides[0]) || null;
  const spokenText =
    spokenGuideObj?.text ||
    (typeof place.spokenGuide === "string" ? place.spokenGuide : null);
  const spokenFaqs = spokenGuideObj?.faqs || [];
  const audioUrl =
    place.spokenGuideUrl ||
    place.audioGuide ||
    spokenGuideObj?.audioUrl ||
    null;
  const hasSpokenGuide = Boolean(spokenText || spokenFaqs.length > 0 || audioUrl);

  const TABS = [
    { id: "overview", label: "Tổng quan & Doanh nghiệp", icon: Info },
    {
      id: "spokenGuide",
      label: `Thuyết minh & FAQs ${hasSpokenGuide ? "🎙️" : ""}`,
      icon: Volume2,
    },
    {
      id: "services",
      label: `Dịch vụ & Tiện ích (${services.length + (place.amenities?.length || 0)})`,
      icon: Briefcase,
    },
    { id: "hours", label: "Giờ hoạt động", icon: Clock },
    { id: "location", label: "Vị trí & Bản đồ", icon: MapPin },
    { id: "audit", label: "Kiểm duyệt & Nhật ký", icon: ShieldCheck },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1180px] w-full h-[92vh] max-h-[92vh] p-0 gap-0 overflow-hidden rounded-3xl border border-gray-200/90 bg-white shadow-2xl">
        <DialogTitle className="sr-only">
          {place.name} - Thông tin chi tiết địa điểm
        </DialogTitle>
        <div className="flex h-full overflow-hidden">
          {/* ═══ LEFT PANEL: Image Gallery ═══ */}
          <div className="w-[420px] flex-shrink-0 flex flex-col overflow-hidden hidden md:flex">
            <ImageGallery
              images={place.images}
              thumbnail={place.thumbnail}
              name={place.name}
              status={place.status}
              isFeatured={place.isFeatured}
            />
          </div>

          {/* ═══ RIGHT PANEL: Information Workspace ═══ */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* ── Header Area ── */}
            <div className="px-8 pt-6 pb-5 border-b border-gray-100 flex-shrink-0 bg-white">
              {/* Category & Status badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {place.category?.name && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gray-900 text-white shadow-xs">
                    <CategoryIcon
                      icon={place.category.icon}
                      className="w-3.5 h-3.5 text-amber-400 shrink-0"
                    />
                    {place.category.name}
                  </span>
                )}
                {place.isVerified && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Đã xác minh chính chủ
                  </span>
                )}
                {priceInfo && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
                      priceInfo.cls,
                    )}
                  >
                    {priceInfo.icon} {formatPriceRange(place.priceRange)}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl font-black text-gray-900 leading-tight tracking-tight mb-2">
                {place.name}
              </h1>

              {/* Short Tagline / Description */}
              {place.shortDescription && (
                <p className="text-sm text-gray-600 italic mb-4 line-clamp-2 leading-relaxed">
                  "{place.shortDescription}"
                </p>
              )}

              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-400 text-amber-950 flex items-center justify-center shrink-0 shadow-xs">
                    <Star className="w-5 h-5 fill-amber-950" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-amber-900/60 uppercase tracking-widest">Đánh giá</p>
                    <p className="text-sm font-black text-amber-950">{rating.toFixed(1)} <span className="text-xs font-normal text-amber-800">({place.ratingCount || 0})</span></p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/70 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-900/60 uppercase tracking-widest">Lượt xem</p>
                    <p className="text-sm font-black text-blue-950">{(place.viewCount || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/70 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-900/60 uppercase tracking-widest">Trạng thái mở</p>
                    <p className="text-xs font-black text-emerald-950 truncate">
                      {openStatus.open ? "Đang mở cửa" : "Đã đóng cửa"}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200/70 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-purple-900/60 uppercase tracking-widest">Quận / Huyện</p>
                    <p className="text-xs font-black text-purple-950 truncate">{place.district?.name || "Cần Thơ"}</p>
                  </div>
                </div>
              </div>

              {/* Moderation & Edit Actions */}
              {(onEdit || onApprove || onReject || onDelete) && (
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100 flex-wrap">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(place)}
                      className="inline-flex items-center gap-2 h-9 px-4 text-xs font-bold bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-all shadow-xs"
                    >
                      <Edit className="w-3.5 h-3.5" /> Chỉnh sửa thông tin
                    </button>
                  )}
                  {onApprove && place.status === "pending" && (
                    <button
                      onClick={() => onApprove(place)}
                      className="inline-flex items-center gap-2 h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Duyệt địa điểm
                    </button>
                  )}
                  {onReject && place.status === "pending" && (
                    <button
                      onClick={() => onReject(place)}
                      className="inline-flex items-center gap-2 h-9 px-4 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all shadow-xs"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Từ chối hồ sơ
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(place)}
                      className="ml-auto h-9 px-3.5 inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all"
                      title="Xóa địa điểm khỏi hệ thống"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Navigation Tab Bar ── */}
            <div className="flex border-b border-gray-200/80 bg-gray-50/90 flex-shrink-0 px-4 overflow-x-auto">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 -mb-px whitespace-nowrap",
                    activeTab === id
                      ? "border-gray-900 text-gray-900 bg-white rounded-t-xl shadow-2xs font-extrabold"
                      : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-white/60",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* ── Scrollable Tab Content ── */}
            <ScrollArea className="flex-1 min-h-0 bg-white">
              <div className="p-8 space-y-8">
                {/* ═══ OVERVIEW TAB ═══ */}
                {activeTab === "overview" && (
                  <>
                    {/* Business Owner Card */}
                    {place.business?.id && (
                      <div className="p-5 rounded-2xl border-2 border-amber-300/90 bg-gradient-to-r from-amber-50 to-orange-50/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex gap-4 items-start min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-amber-300 shadow-sm flex items-center justify-center shrink-0">
                            <Building2 className="w-6 h-6 text-amber-800" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-black text-amber-900/70 uppercase tracking-widest">
                              Doanh nghiệp sở hữu
                            </span>
                            <h4 className="text-base font-black text-gray-900 truncate">
                              {place.business.businessName || "Doanh nghiệp đối tác"}
                            </h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-amber-900/90">
                              <span>MST: <strong>{place.business.taxCode || "Chưa cập nhật"}</strong></span>
                              <span>·</span>
                              <span>Trạng thái: <strong>{BUSINESS_STATUS_LABELS[place.business.status] || place.business.status || "Hoạt động"}</strong></span>
                            </div>
                          </div>
                        </div>
                        {typeof onViewBusinessDetails === "function" && (
                          <button
                            type="button"
                            onClick={() => onViewBusinessDetails(place.business.id)}
                            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border-2 border-amber-900 bg-white px-4 py-2 text-xs font-black text-amber-950 hover:bg-amber-100 transition-all shadow-xs"
                          >
                            Chi tiết Doanh nghiệp <ArrowUpRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Information Grid Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-2xs flex items-center justify-center shrink-0">
                          <CategoryIcon icon={place.category?.icon} className="w-5 h-5 text-gray-800" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Danh mục chính</p>
                          <p className="text-sm font-black text-gray-900 mt-0.5">{place.category?.name || "Chưa phân loại"}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-2xs flex items-center justify-center shrink-0">
                          <Compass className="w-5 h-5 text-gray-700" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Khu vực hành chính</p>
                          <p className="text-sm font-black text-gray-900 mt-0.5">
                            {[place.ward?.name, place.district?.name, "Cần Thơ"].filter(Boolean).join(", ")}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-2xs flex items-center justify-center shrink-0">
                          <DollarSign className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Khung giá tham khảo</p>
                          <p className="text-sm font-black text-gray-900 mt-0.5">
                            {formatPriceRange(place.priceRange)}
                          </p>
                          {(place.priceFrom || place.priceTo) && (
                            <p className="text-xs text-gray-500 font-mono mt-0.5">
                              {place.priceFrom ? new Intl.NumberFormat("vi-VN").format(place.priceFrom) : "0"}đ – {place.priceTo ? new Intl.NumberFormat("vi-VN").format(place.priceTo) : "Không giới hạn"}đ
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white shadow-2xs flex items-center justify-center shrink-0 font-black text-sm">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Người tạo hồ sơ</p>
                          <p className="text-sm font-black text-gray-900 truncate mt-0.5">{creatorName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Description */}
                    <div>
                      <SectionTitle icon={FileText}>Mô tả chi tiết</SectionTitle>
                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50/80 rounded-2xl p-6 border border-gray-200/70 font-sans">
                        {place.description || place.shortDescription || "Địa điểm chưa cập nhật bài viết mô tả chi tiết."}
                      </div>
                    </div>

                    {/* Contact & Social Links */}
                    <div>
                      <SectionTitle icon={Phone}>Thông tin liên hệ & Mạng xã hội</SectionTitle>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {place.address && (
                          <InfoChip icon={MapPin} className="col-span-1 sm:col-span-2">
                            {place.address}{place.ward ? `, ${place.ward.name}` : ""}{place.district ? `, ${place.district.name}` : ""}, Cần Thơ
                          </InfoChip>
                        )}
                        {phone && (
                          <InfoChip icon={Phone} href={`tel:${phone}`}>
                            <span className="font-bold text-blue-600">{phone}</span>
                          </InfoChip>
                        )}
                        {place.email && (
                          <InfoChip icon={Mail} href={`mailto:${place.email}`}>
                            <span className="font-semibold text-blue-600 truncate">{place.email}</span>
                          </InfoChip>
                        )}
                        {place.website && (
                          <InfoChip icon={Globe} href={place.website}>
                            <span className="font-semibold text-blue-600 flex items-center gap-1 truncate">
                              {place.website.replace(/^https?:\/\//, "")}
                              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                            </span>
                          </InfoChip>
                        )}
                        {facebook && (
                          <InfoChip icon={Facebook} href={facebook}>
                            <span className="font-semibold text-blue-600 flex items-center gap-1 truncate">
                              Trang Facebook địa điểm <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                            </span>
                          </InfoChip>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* ═══ SPOKEN GUIDE & FAQS TAB ═══ */}
                {activeTab === "spokenGuide" && (
                  <>
                    {/* Audio Guide Banner */}
                    <div className="p-6 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl text-white shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center backdrop-blur-md">
                          <Volume2 className="w-5 h-5 text-indigo-300" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black tracking-widest text-indigo-300 uppercase">
                            Hệ Thống Thuyết Minh Tự Động
                          </span>
                          <h3 className="text-lg font-black tracking-tight text-white">
                            Hướng Dẫn Viên Du Lịch AI (Spoken Audio Guide)
                          </h3>
                        </div>
                      </div>
                      <p className="text-xs text-indigo-200/90 leading-relaxed mb-4 max-w-2xl">
                        Tài liệu thuyết minh tự động giúp khách du lịch lắng nghe bài giới thiệu sâu sắc về văn hóa, lịch sử và nét độc đáo của địa điểm tại Cần Thơ.
                      </p>

                      {audioUrl && (
                        <div className="mt-4 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15">
                          <audio controls className="w-full h-10">
                            <source src={audioUrl} />
                            Trình duyệt không hỗ trợ phát âm thanh trực tiếp.
                          </audio>
                        </div>
                      )}
                    </div>

                    {/* Spoken Text Content */}
                    {spokenText ? (
                      <div>
                        <SectionTitle icon={Radio}>Nội dung bài thuyết minh âm thanh</SectionTitle>
                        <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-6 text-sm text-indigo-950 leading-relaxed whitespace-pre-line font-sans shadow-2xs">
                          {spokenText}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl text-center text-gray-500 text-xs">
                        Địa điểm chưa cập nhật bài thuyết minh văn bản chi tiết.
                      </div>
                    )}

                    {/* FAQs Section */}
                    {spokenFaqs.length > 0 ? (
                      <div>
                        <SectionTitle icon={HelpCircle}>Câu hỏi thường gặp của Khách Du Lịch (FAQs)</SectionTitle>
                        <div className="space-y-4">
                          {spokenFaqs.map((faq, idx) => (
                            <div
                              key={faq.id || idx}
                              className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs hover:border-gray-300 transition-all space-y-2"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-lg bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                  Q{idx + 1}
                                </div>
                                <h4 className="text-sm font-black text-gray-900 leading-snug">
                                  {faq.question}
                                </h4>
                              </div>
                              <p className="text-xs text-gray-700 leading-relaxed pl-9 whitespace-pre-line font-sans">
                                {faq.answer}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl text-center text-gray-400 text-xs">
                        Chưa có câu hỏi thường gặp (FAQs) cho địa điểm này.
                      </div>
                    )}
                  </>
                )}

                {/* ═══ SERVICES & AMENITIES TAB ═══ */}
                {activeTab === "services" && (
                  <>
                    {/* Services list */}
                    {services.length > 0 && (
                      <div>
                        <SectionTitle icon={Briefcase}>Dịch vụ & Sản phẩm ({services.length})</SectionTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {services.map((s, i) => (
                            <div key={s.id || i} className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 hover:border-gray-300 transition-all">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="text-sm font-black text-gray-900">{s.name || s.title}</h4>
                                {s.price != null && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-extrabold shrink-0">
                                    {new Intl.NumberFormat("vi-VN").format(s.price)}đ
                                  </span>
                                )}
                              </div>
                              {s.description && (
                                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{s.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Amenities list */}
                    {hasAmenities ? (
                      <div>
                        <SectionTitle icon={CheckCircle}>Tiện ích phục vụ ({place.amenities.length})</SectionTitle>
                        <div className="flex flex-wrap gap-2.5">
                          {place.amenities.map((a, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs font-bold text-emerald-950"
                            >
                              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>{a.amenityType || a.name || a}</span>
                              {a.amenityValue && (
                                <span className="text-emerald-700 font-normal">
                                  ({a.amenityValue})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      services.length === 0 && (
                        <div className="py-16 text-center text-gray-400">
                          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p className="text-sm font-semibold">Chưa có thông tin dịch vụ & tiện ích</p>
                        </div>
                      )
                    )}

                    {/* Tags list */}
                    {hasTags && (
                      <div>
                        <SectionTitle icon={Tag}>Thẻ phân loại (Tags)</SectionTitle>
                        <div className="flex flex-wrap gap-2">
                          {tagList.map((tag, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-xl shadow-xs"
                            >
                              <Hash className="w-3 h-3 text-amber-400" />
                              {tag.name || tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ═══ OPERATING HOURS TAB ═══ */}
                {activeTab === "hours" && (
                  <>
                    {/* Open/closed Status Banner */}
                    {openStatus.known && (
                      <div
                        className={cn(
                          "flex items-start gap-4 p-5 rounded-2xl border shadow-xs",
                          openStatus.open
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-rose-50 border-rose-200",
                        )}
                      >
                        <span
                          className={cn(
                            "w-3 h-3 rounded-full mt-1 shrink-0",
                            openStatus.open
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-rose-500",
                          )}
                        />
                        <div>
                          <h4
                            className={cn(
                              "font-black text-base tracking-tight",
                              openStatus.open ? "text-emerald-900" : "text-rose-900",
                            )}
                          >
                            {openStatus.open ? "Địa điểm hiện đang mở cửa" : "Địa điểm hiện đã đóng cửa"}
                          </h4>
                          {openStatus.todayHour && !openStatus.todayHour.isClosed && (
                            <p className="text-sm text-gray-700 mt-1">
                              Giờ mở cửa {DAY_FULL[new Date().getDay()]}:{" "}
                              <strong className="text-gray-900">
                                {openStatus.todayHour.openTime?.slice(0, 5)} – {openStatus.todayHour.closeTime?.slice(0, 5)}
                              </strong>
                            </p>
                          )}
                          {openStatus.todayHour?.isClosed && (
                            <p className="text-sm text-rose-700 mt-1">
                              Hôm nay ({DAY_FULL[new Date().getDay()]}) địa điểm tạm nghỉ.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Weekly Schedule */}
                    {place.openingHours?.length > 0 ? (
                      <div>
                        <SectionTitle icon={Clock}>Lịch mở cửa 7 ngày trong tuần</SectionTitle>
                        <div className="space-y-2">
                          {[...place.openingHours]
                            .sort((a, b) => {
                              const da = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
                              const db = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
                              return da - db;
                            })
                            .map((h, i) => {
                              const isToday = h.dayOfWeek === new Date().getDay();
                              return (
                                <div
                                  key={i}
                                  className={cn(
                                    "flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all border",
                                    isToday
                                      ? "bg-gray-900 text-white border-gray-900 shadow-md"
                                      : "bg-gray-50 hover:bg-gray-100/80 border-gray-100 text-gray-800",
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={cn(
                                        "w-8 text-xs font-black uppercase tracking-wider",
                                        isToday ? "text-amber-400" : "text-gray-400",
                                      )}
                                    >
                                      {DAY_SHORT[h.dayOfWeek]}
                                    </span>
                                    <span className="text-sm font-extrabold">
                                      {DAY_FULL[h.dayOfWeek]}
                                    </span>
                                    {isToday && (
                                      <span className="text-[10px] bg-amber-400 text-amber-950 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                        Hôm nay
                                      </span>
                                    )}
                                  </div>
                                  <span className={cn("text-sm font-bold font-mono", h.isClosed ? "text-rose-500" : isToday ? "text-amber-300" : "text-gray-900")}>
                                    {h.isClosed
                                      ? "Tạm đóng cửa"
                                      : `${h.openTime?.slice(0, 5)} – ${h.closeTime?.slice(0, 5)}`}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ) : (
                      <div className="py-16 text-center text-gray-400">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-semibold">Chưa cập nhật lịch mở cửa tuần</p>
                      </div>
                    )}
                  </>
                )}

                {/* ═══ LOCATION & MAP TAB ═══ */}
                {activeTab === "location" && (
                  <>
                    {place.latitude && place.longitude ? (
                      <>
                        {/* Interactive Digital Map */}
                        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                          <div className="h-[300px]">
                            <MapView
                              places={[place]}
                              showMarkers
                              interactive
                              initialViewState={{
                                latitude: Number(place.latitude),
                                longitude: Number(place.longitude),
                                zoom: 15,
                              }}
                            />
                          </div>
                          <div className="bg-gray-900 px-6 py-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-mono">
                              <MapPin className="w-4 h-4 text-amber-400" />
                              <span className="text-white font-bold">
                                {Number(place.latitude).toFixed(6)}, {Number(place.longitude).toFixed(6)}
                              </span>
                            </div>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-400 hover:text-amber-300 transition-colors"
                            >
                              Mở Google Maps <ArrowUpRight className="w-4 h-4" />
                            </a>
                          </div>
                        </div>

                        {/* Address Breakdown */}
                        <div>
                          <SectionTitle icon={Navigation}>Địa chỉ & Tọa độ GPS</SectionTitle>
                          <div className="space-y-3">
                            {place.address && (
                              <InfoChip icon={MapPin}>{place.address}</InfoChip>
                            )}
                            {place.ward && (
                              <InfoChip icon={Building2}>
                                <span className="text-gray-400 text-xs mr-2">Phường / Xã:</span>
                                <strong>{place.ward.name}</strong>
                              </InfoChip>
                            )}
                            {place.district && (
                              <InfoChip icon={Navigation}>
                                <span className="text-gray-400 text-xs mr-2">Quận / Huyện:</span>
                                <strong>{place.district.name}</strong>
                              </InfoChip>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-16 text-center text-gray-400">
                        <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-semibold">Chưa cập nhật tọa độ GPS bản đồ</p>
                      </div>
                    )}
                  </>
                )}

                {/* ═══ AUDIT & SYSTEM LOGS TAB ═══ */}
                {activeTab === "audit" && (
                  <>
                    <div>
                      <SectionTitle icon={TrendingUp}>Thông tin quản trị hệ thống</SectionTitle>
                      <div className="bg-gray-50/80 rounded-2xl p-6 space-y-3 border border-gray-200/80">
                        {[
                          { label: "ID Địa điểm", value: `#${place.id}` },
                          { label: "Định danh Slug", value: place.slug || "—" },
                          {
                            label: "Trạng thái kiểm duyệt",
                            value: STATUS_CFG[place.status]?.label || place.status,
                          },
                          {
                            label: "Ngày khởi tạo",
                            value: place.createdAt ? new Date(place.createdAt).toLocaleString("vi-VN") : "—",
                          },
                          {
                            label: "Cập nhật gần nhất",
                            value: place.updatedAt ? new Date(place.updatedAt).toLocaleString("vi-VN") : "—",
                          },
                          {
                            label: "Tổng số lượt xem",
                            value: (place.viewCount || 0).toLocaleString(),
                          },
                          {
                            label: "Tổng đánh giá tích lũy",
                            value: `${place.ratingCount || 0} bài đánh giá (TB ${rating.toFixed(1)}/5)`,
                          },
                        ].map(({ label, value }) => (
                          <div
                            key={label}
                            className="flex items-center justify-between py-2 border-b border-gray-200/60 last:border-0"
                          >
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                              {label}
                            </span>
                            <span className="text-xs font-mono font-extrabold text-gray-900">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rejection Reason Box */}
                    {place.status === "rejected" && place.rejectionReason && (
                      <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2 text-rose-800">
                          <XCircle className="w-5 h-5 text-rose-600" />
                          <h4 className="text-xs font-black uppercase tracking-wider">Lý do từ chối hồ sơ</h4>
                        </div>
                        <p className="text-sm text-rose-900 leading-relaxed font-medium">
                          {place.rejectionReason}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlaceDetailDialog;
