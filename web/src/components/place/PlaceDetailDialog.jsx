import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Briefcase,
  Tag,
  Compass,
  FileText,
  HelpCircle,
  Radio,
  User,
  Copy,
  Check,
  Sparkles,
  Layers,
} from "lucide-react";
import { BUSINESS_STATUS_LABELS } from "@/constants/businessConstants";
import { MdiCategoryIcon } from "@/components/category/MdiCategoryIcon";
import { MapView } from "@/modules/map";
import { usePlaceDetail } from "@/hooks/queries/usePlaceQueries";
import { cn } from "@/lib/utils";

// ─── Dynamic Category Icon ──────────────────────────────────────────────────

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

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2.5 mb-3.5">
      <div className="w-7 h-7 rounded-xl bg-slate-950 flex items-center justify-center shadow-2xs">
        <Icon className="w-3.5 h-3.5 text-[#F3E600]" />
      </div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
        {children}
      </h3>
      <div className="flex-1 h-px bg-black/[0.04]" />
    </div>
  );
}

function InfoChip({ icon: Icon, children, href, className, onCopyText }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    if (!onCopyText) return;
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard?.writeText?.(onCopyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const inner = (
    <div className={cn("flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#F8F7F3] border border-black/[0.04] hover:bg-[#FAF9F5] hover:border-black/[0.08] transition-all group", className)}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-xl bg-white border border-black/[0.05] shadow-2xs flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-950 transition-colors" />
        </div>
        <span className="text-xs font-medium text-slate-800 leading-snug break-all truncate">{children}</span>
      </div>

      {onCopyText && (
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-white transition-colors"
          title="Sao chép"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      )}
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
    <div className="flex flex-col h-full bg-slate-950 rounded-l-[32px] overflow-hidden relative border-r border-white/[0.08]">
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
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3E600] text-slate-950 text-[11px] font-black shadow-md">
              <Award className="w-3.5 h-3.5 fill-slate-950" /> DỊCH VỤ NỔI BẬT
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
              type="button"
              onClick={() => setIdx((i) => (i - 1 + imgs.length) % imgs.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md border border-slate-700 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
              title="Ảnh trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
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
          <h2 className="text-xl font-extrabold tracking-tight leading-snug drop-shadow-md line-clamp-2">
            {name}
          </h2>
        </div>
      </div>

      {/* Thumbnail Strip */}
      {imgs.length > 1 && (
        <div className="h-24 bg-slate-900/90 border-t border-slate-800 p-3 flex gap-2.5 overflow-x-auto scrollbar-thin">
          {imgs.map((img, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setIdx(i)}
              className={cn(
                "flex-shrink-0 h-full w-20 rounded-xl overflow-hidden border-2 transition-all relative group",
                i === idx
                  ? "border-[#F3E600] ring-2 ring-[#F3E600]/30 scale-105"
                  : "border-slate-700/80 opacity-60 hover:opacity-100 hover:border-slate-500",
              )}
            >
              <img
                src={getImgSrc(img)}
                alt={`Thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {img.isCover && (
                <span className="absolute top-1 left-1 bg-[#F3E600] text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded">
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

// ─── Voice Speech Player Hook ─────────────────────────────────────────────────

function useSpeechSynthesizer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [speechRate, setSpeechRate] = useState(1.0);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentId(null);
  }, []);

  const speak = useCallback(
    (text, id = "main") => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      // If already playing this ID, toggle pause/play
      if (currentId === id && isPlaying) {
        if (isPaused) {
          window.speechSynthesis.resume();
          setIsPaused(false);
        } else {
          window.speechSynthesis.pause();
          setIsPaused(true);
        }
        return;
      }

      window.speechSynthesis.cancel();
      if (!text || !text.trim()) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "vi-VN";
      utterance.rate = speechRate;

      // Select Vietnamese voice if available
      const voices = window.speechSynthesis.getVoices?.() || [];
      const viVoice = voices.find((v) => v.lang?.includes("vi") || v.name?.toLowerCase().includes("vietnamese"));
      if (viVoice) {
        utterance.voice = viVoice;
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
        setCurrentId(id);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentId(null);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentId(null);
      };

      window.speechSynthesis.speak(utterance);
    },
    [currentId, isPlaying, isPaused, speechRate],
  );

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isPlaying,
    isPaused,
    currentId,
    speechRate,
    setSpeechRate,
    speak,
    stop,
  };
}

// ─── Main PlaceDetailDialog Component ─────────────────────────────────────────

const PlaceDetailDialog = ({
  place: initialPlace,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onViewBusinessDetails,
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch full details if opened to guarantee all sub-relations (aiGuides, faqs, openingHours, services) are loaded
  const { data: fullDetailRes } = usePlaceDetail(open && initialPlace?.id ? initialPlace.id : null);
  const place = fullDetailRes?.data || fullDetailRes || initialPlace;

  const openStatus = useCurrentOpenStatus(place?.openingHours);
  const speech = useSpeechSynthesizer();

  // Reset speech when dialog closes
  useEffect(() => {
    if (!open) {
      speech.stop();
    }
  }, [open, speech]);

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

  const services = place.services || place.businessServices || [];

  // Robustly resolve Spoken Guide and FAQs across all data shapes
  let spokenGuideObj = place.spokenGuide || (place.aiGuides && place.aiGuides[0]) || null;
  if (typeof spokenGuideObj === "string") {
    try {
      spokenGuideObj = JSON.parse(spokenGuideObj);
    } catch {
      spokenGuideObj = { text: spokenGuideObj, faqs: [] };
    }
  }

  const spokenText =
    spokenGuideObj?.text ||
    (typeof place.spokenGuide === "string" ? place.spokenGuide : null) ||
    "";

  const spokenFaqs = Array.isArray(spokenGuideObj?.faqs)
    ? spokenGuideObj.faqs
    : Array.isArray(place.faqs)
      ? place.faqs
      : Array.isArray(place.aiGuides?.[0]?.faqs)
        ? place.aiGuides[0].faqs
        : [];

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
      badge: spokenFaqs.length > 0 ? `${spokenFaqs.length} FAQs` : undefined,
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
      <DialogContent className="max-w-[1240px] w-full h-[92vh] max-h-[92vh] p-0 gap-0 overflow-hidden rounded-[32px] border border-black/[0.06] bg-white shadow-[0_20px_70px_rgba(0,0,0,0.15)]">
        <DialogTitle className="sr-only">
          {place.name} - Thông tin chi tiết địa điểm
        </DialogTitle>
        <div className="flex h-full overflow-hidden">
          {/* ═══ LEFT PANEL: Image Gallery ═══ */}
          <div className="w-[440px] flex-shrink-0 flex flex-col overflow-hidden hidden md:flex">
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
            <div className="px-8 pt-6 pb-4 border-b border-black/[0.04] flex-shrink-0 bg-white">
              {/* Category & Status badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                {place.category?.name && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-950 text-white shadow-2xs">
                    <CategoryIcon
                      icon={place.category.icon}
                      className="w-3.5 h-3.5 text-[#F3E600] shrink-0"
                    />
                    {place.category.name}
                  </span>
                )}
                {place.isVerified && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600" /> Đã xác minh chính chủ
                  </span>
                )}
                {priceInfo && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs",
                      priceInfo.cls,
                    )}
                  >
                    {priceInfo.icon} {formatPriceRange(place.priceRange)}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 leading-tight tracking-tight mb-2">
                {place.name}
              </h1>

              {/* Short Tagline / Description */}
              {place.shortDescription && (
                <p className="text-xs text-slate-500 italic mb-4 line-clamp-2 leading-relaxed font-medium">
                  "{place.shortDescription}"
                </p>
              )}

              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="p-3.5 rounded-2xl bg-[#FFFDE6] border border-[#F3E600]/80 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-950 text-[#F3E600] flex items-center justify-center shrink-0 shadow-2xs">
                    <Star className="w-4 h-4 fill-[#F3E600]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đánh giá</p>
                    <p className="text-xs font-mono font-bold text-slate-950 tabular-nums">
                      {rating.toFixed(1)} <span className="text-[11px] font-normal text-slate-500">({place.ratingCount || 0})</span>
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F8F7F3] border border-black/[0.04] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-black/[0.04] text-slate-800 flex items-center justify-center shrink-0 shadow-2xs">
                    <Eye className="w-4 h-4 text-slate-700" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lượt xem</p>
                    <p className="text-xs font-mono font-bold text-slate-950 tabular-nums">{(place.viewCount || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F8F7F3] border border-black/[0.04] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-black/[0.04] text-slate-800 flex items-center justify-center shrink-0 shadow-2xs">
                    <Clock className="w-4 h-4 text-slate-700" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái mở</p>
                    <p className="text-xs font-bold text-slate-950 truncate flex items-center gap-1.5">
                      <span className={cn("size-1.5 rounded-full", openStatus.open ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                      {openStatus.open ? "Đang mở cửa" : "Đã đóng cửa"}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F8F7F3] border border-black/[0.04] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-black/[0.04] text-slate-800 flex items-center justify-center shrink-0 shadow-2xs">
                    <Navigation className="w-4 h-4 text-slate-700" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quận / Huyện</p>
                    <p className="text-xs font-bold text-slate-950 truncate">{place.district?.name || "Cần Thơ"}</p>
                  </div>
                </div>
              </div>

              {/* Moderation & Edit Actions */}
              {(onEdit || onApprove || onReject || onDelete) && (
                <div className="flex items-center gap-2 pt-3 border-t border-black/[0.03] flex-wrap">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(place)}
                      className="inline-flex items-center gap-2 h-9 px-4 text-xs font-bold bg-slate-950 hover:bg-black text-white rounded-full transition-all shadow-2xs"
                    >
                      <Edit className="w-3.5 h-3.5" /> Chỉnh sửa thông tin
                    </button>
                  )}
                  {onApprove && place.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => onApprove(place)}
                      className="inline-flex items-center gap-2 h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-all shadow-2xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Duyệt địa điểm
                    </button>
                  )}
                  {onReject && place.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => onReject(place)}
                      className="inline-flex items-center gap-2 h-9 px-4 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-all shadow-2xs"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Từ chối hồ sơ
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(place)}
                      className="ml-auto h-9 px-3.5 inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all"
                      title="Xóa địa điểm khỏi hệ thống"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Navigation Tab Bar ── */}
            <div className="flex border-b border-black/[0.04] bg-[#FAF9F5] flex-shrink-0 px-4 gap-1 overflow-x-auto">
              {TABS.map(({ id, label, icon: Icon, badge }) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 -mb-px whitespace-nowrap",
                    activeTab === id
                      ? "border-slate-950 text-slate-950 bg-white rounded-t-xl font-extrabold shadow-2xs"
                      : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-white/40",
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {badge && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#FFFDE6] text-slate-950 border border-[#F3E600] text-[9.5px] font-mono">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Scrollable Tab Content ── */}
            <ScrollArea className="flex-1 min-h-0 bg-white">
              <div className="p-8 space-y-8 text-slate-900">
                {/* ═══ OVERVIEW TAB ═══ */}
                {activeTab === "overview" && (
                  <>
                    {/* Business Owner Card */}
                    {place.business?.id && (
                      <div className="p-5 rounded-3xl border border-[#F3E600]/80 bg-[#FFFDE6] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex gap-4 items-start min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-[#F3E600] shadow-2xs flex items-center justify-center shrink-0">
                            <Building2 className="w-6 h-6 text-slate-950" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Doanh nghiệp sở hữu
                            </span>
                            <h4 className="text-sm font-extrabold text-slate-950 truncate">
                              {place.business.businessName || "Doanh nghiệp đối tác"}
                            </h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
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
                            className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-black/[0.1] bg-white px-4 py-2 text-xs font-bold text-slate-950 hover:bg-[#FAF9F5] transition-all shadow-2xs"
                          >
                            Chi tiết Doanh nghiệp <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Information Grid Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-[#F8F7F3] rounded-2xl border border-black/[0.04] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-black/[0.04] shadow-2xs flex items-center justify-center shrink-0">
                          <CategoryIcon icon={place.category?.icon} className="w-4 h-4 text-slate-800" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Danh mục chính</p>
                          <p className="text-xs font-bold text-slate-950 mt-0.5">{place.category?.name || "Chưa phân loại"}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-[#F8F7F3] rounded-2xl border border-black/[0.04] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-black/[0.04] shadow-2xs flex items-center justify-center shrink-0">
                          <Compass className="w-4 h-4 text-slate-800" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Khu vực hành chính</p>
                          <p className="text-xs font-bold text-slate-950 mt-0.5">
                            {[place.ward?.name, place.district?.name, "Cần Thơ"].filter(Boolean).join(", ")}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-[#F8F7F3] rounded-2xl border border-black/[0.04] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-black/[0.04] shadow-2xs flex items-center justify-center shrink-0">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Khung giá tham khảo</p>
                          <p className="text-xs font-bold text-slate-950 mt-0.5">
                            {formatPriceRange(place.priceRange)}
                          </p>
                          {(place.priceFrom || place.priceTo) && (
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5 tabular-nums">
                              {place.priceFrom ? new Intl.NumberFormat("vi-VN").format(place.priceFrom) : "0"}đ – {place.priceTo ? new Intl.NumberFormat("vi-VN").format(place.priceTo) : "Không giới hạn"}đ
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-[#F8F7F3] rounded-2xl border border-black/[0.04] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 text-[#F3E600] shadow-2xs flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Người tạo hồ sơ</p>
                          <p className="text-xs font-bold text-slate-950 truncate mt-0.5">{creatorName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Description */}
                    <div>
                      <SectionTitle icon={FileText}>Mô tả chi tiết</SectionTitle>
                      <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-[#F8F7F3] rounded-3xl p-6 border border-black/[0.04] font-sans">
                        {place.description || place.shortDescription || "Địa điểm chưa cập nhật bài viết mô tả chi tiết."}
                      </div>
                    </div>

                    {/* Contact & Social Links */}
                    <div>
                      <SectionTitle icon={Phone}>Thông tin liên hệ & Mạng xã hội</SectionTitle>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {place.address && (
                          <InfoChip
                            icon={MapPin}
                            className="col-span-1 sm:col-span-2"
                            onCopyText={`${place.address}${place.ward ? `, ${place.ward.name}` : ""}${place.district ? `, ${place.district.name}` : ""}, Cần Thơ`}
                          >
                            {place.address}{place.ward ? `, ${place.ward.name}` : ""}{place.district ? `, ${place.district.name}` : ""}, Cần Thơ
                          </InfoChip>
                        )}
                        {phone && (
                          <InfoChip icon={Phone} href={`tel:${phone}`} onCopyText={phone}>
                            <span className="font-bold text-slate-950 font-mono">{phone}</span>
                          </InfoChip>
                        )}
                        {place.email && (
                          <InfoChip icon={Mail} href={`mailto:${place.email}`} onCopyText={place.email}>
                            <span className="font-semibold text-slate-900 truncate">{place.email}</span>
                          </InfoChip>
                        )}
                        {place.website && (
                          <InfoChip icon={Globe} href={place.website}>
                            <span className="font-semibold text-slate-900 flex items-center gap-1 truncate">
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
                    {/* Audio Synthesizer Master Banner */}
                    <div className="p-6 bg-slate-950 rounded-3xl text-white shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-[#F3E600]/10 rounded-full blur-3xl pointer-events-none" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-white/[0.1] border border-white/[0.15] flex items-center justify-center backdrop-blur-md shadow-2xs">
                            <Volume2 className="w-5 h-5 text-[#F3E600]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold tracking-wider text-[#F3E600] uppercase font-mono">
                                HƯỚNG DẪN VIÊN AI
                              </span>
                              {speech.isPlaying && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F3E600]/20 text-[#F3E600] text-[9.5px] font-mono animate-pulse">
                                  <Radio className="w-3 h-3" /> Đang đọc âm thanh...
                                </span>
                              )}
                            </div>
                            <h3 className="text-base font-extrabold tracking-tight text-white">
                              Thuyết minh & Trả lời tự động (Voice Assistant)
                            </h3>
                          </div>
                        </div>

                        {/* Speech Speed & Controls */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-white/[0.08] p-1 rounded-full border border-white/[0.1]">
                            {[1.0, 1.25, 1.5].map((speed) => (
                              <button
                                type="button"
                                key={speed}
                                onClick={() => speech.setSpeechRate(speed)}
                                className={cn(
                                  "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold transition-colors",
                                  speech.speechRate === speed
                                    ? "bg-[#F3E600] text-slate-950"
                                    : "text-slate-400 hover:text-white",
                                )}
                              >
                                {speed}x
                              </button>
                            ))}
                          </div>

                          {spokenText && (
                            <button
                              type="button"
                              onClick={() => speech.speak(spokenText, "main")}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F3E600] text-slate-950 font-extrabold text-xs hover:bg-[#e6d800] transition-all shadow-md active:scale-95"
                            >
                              {speech.currentId === "main" && speech.isPlaying && !speech.isPaused ? (
                                <>
                                  <Pause className="w-3.5 h-3.5 fill-slate-950" /> Tạm dừng
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5 fill-slate-950" /> Nghe toàn bài
                                </>
                              )}
                            </button>
                          )}

                          {speech.isPlaying && (
                            <button
                              type="button"
                              onClick={speech.stop}
                              className="p-2 rounded-full bg-white/[0.1] text-slate-300 hover:text-white hover:bg-white/[0.2] transition-colors"
                              title="Dừng đọc"
                            >
                              <VolumeX className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Equalizer Visualizer Waves */}
                      {speech.isPlaying && (
                        <div className="flex items-center gap-1.5 pt-4">
                          {[4, 8, 14, 6, 12, 16, 9, 5, 15, 11, 7, 13, 8, 16, 10, 4].map((h, i) => (
                            <div
                              key={i}
                              className="w-1 bg-[#F3E600] rounded-full animate-pulse"
                              style={{
                                height: `${speech.isPaused ? 4 : h}px`,
                                animationDuration: `${0.3 + (i % 5) * 0.15}s`,
                              }}
                            />
                          ))}
                          <span className="text-[11px] text-[#F3E600] font-mono ml-2">
                            {speech.isPaused ? "Đang tạm dừng phát âm thanh" : "Đang phát giọng đọc tiếng Việt (vi-VN)..."}
                          </span>
                        </div>
                      )}

                      {/* Audio URL Player if exists */}
                      {audioUrl && (
                        <div className="mt-4 p-3 bg-white/[0.06] backdrop-blur-md rounded-2xl border border-white/[0.1]">
                          <audio controls className="w-full h-9">
                            <source src={audioUrl} />
                            Trình duyệt không hỗ trợ phát âm thanh trực tiếp.
                          </audio>
                        </div>
                      )}
                    </div>

                    {/* Spoken Text Content */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <SectionTitle icon={Radio}>Nội dung bài thuyết minh âm thanh</SectionTitle>
                        {spokenText && (
                          <button
                            type="button"
                            onClick={() => speech.speak(spokenText, "main")}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-black bg-[#F8F7F3] px-3 py-1 rounded-full border border-black/[0.04]"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-[#F3E600]" />
                            {speech.currentId === "main" && speech.isPlaying && !speech.isPaused ? "Tạm dừng" : "Nghe giọng đọc"}
                          </button>
                        )}
                      </div>

                      {spokenText ? (
                        <div className="bg-[#F8F7F3] border border-black/[0.04] rounded-3xl p-6 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-sans relative group">
                          {spokenText}
                        </div>
                      ) : (
                        <div className="p-8 bg-[#F8F7F3] border border-black/[0.04] rounded-3xl text-center text-slate-400 text-xs font-medium">
                          Địa điểm chưa cập nhật bài thuyết minh văn bản chi tiết.
                        </div>
                      )}
                    </div>

                    {/* FAQs Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <SectionTitle icon={HelpCircle}>
                          Câu hỏi thường gặp của Khách Du Lịch (FAQs) {spokenFaqs.length > 0 && `(${spokenFaqs.length})`}
                        </SectionTitle>
                      </div>

                      {spokenFaqs.length > 0 ? (
                        <div className="space-y-3.5">
                          {spokenFaqs.map((faq, idx) => {
                            const faqId = `faq-${idx}`;
                            const isFaqPlaying = speech.currentId === faqId && speech.isPlaying;
                            const faqTextToRead = `Câu hỏi: ${faq.question}. Trả lời: ${faq.answer}`;

                            return (
                              <div
                                key={faq.id || idx}
                                className={cn(
                                  "p-5 rounded-3xl bg-white border transition-all space-y-2.5",
                                  isFaqPlaying
                                    ? "border-[#F3E600] bg-[#FFFDE6]/40 shadow-sm"
                                    : "border-black/[0.05] shadow-2xs hover:border-black/[0.1]",
                                )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3 min-w-0 flex-1">
                                    <div className="w-7 h-7 rounded-xl bg-slate-950 text-[#F3E600] font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                                      Q{idx + 1}
                                    </div>
                                    <h4 className="text-xs font-extrabold text-slate-950 leading-snug">
                                      {faq.question}
                                    </h4>
                                  </div>

                                  {/* Sound read button per FAQ */}
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => speech.speak(faqTextToRead, faqId)}
                                      className={cn(
                                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs",
                                        isFaqPlaying
                                          ? "bg-slate-950 text-[#F3E600]"
                                          : "bg-[#F8F7F3] border border-black/[0.04] text-slate-700 hover:bg-[#FFFDE6] hover:text-slate-950",
                                      )}
                                      title="Nghe câu trả lời này"
                                    >
                                      {isFaqPlaying && !speech.isPaused ? (
                                        <>
                                          <Pause className="w-3 h-3" /> Đang đọc
                                        </>
                                      ) : (
                                        <>
                                          <Volume2 className="w-3 h-3 text-[#F3E600]" /> Nghe đọc
                                        </>
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard?.writeText?.(`Hỏi: ${faq.question}\nĐáp: ${faq.answer}`);
                                      }}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                      title="Sao chép nội dung FAQ"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="pl-10 text-xs text-slate-600 leading-relaxed whitespace-pre-line font-sans border-t border-black/[0.03] pt-2.5">
                                  {faq.answer}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 bg-[#F8F7F3] border border-black/[0.04] rounded-3xl text-center text-slate-400 text-xs font-medium">
                          Chưa có câu hỏi thường gặp (FAQs) cho địa điểm này.
                        </div>
                      )}
                    </div>
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
                            <div key={s.id || i} className="p-4 rounded-3xl bg-[#F8F7F3] border border-black/[0.04] hover:bg-[#FAF9F5] transition-all">
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <h4 className="text-xs font-bold text-slate-950">{s.name || s.title}</h4>
                                {s.price != null && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-[#FFFDE6] text-slate-950 border border-[#F3E600]/80 text-[11px] font-mono font-bold shrink-0 tabular-nums">
                                    {new Intl.NumberFormat("vi-VN").format(s.price)}đ
                                  </span>
                                )}
                              </div>
                              {s.description && (
                                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{s.description}</p>
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
                              className="flex items-center gap-2 px-3.5 py-2 bg-[#F8F7F3] border border-black/[0.04] rounded-2xl text-xs font-bold text-slate-800 shadow-2xs"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{a.amenityType || a.name || a}</span>
                              {a.amenityValue && (
                                <span className="text-slate-400 font-normal">
                                  ({a.amenityValue})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      services.length === 0 && (
                        <div className="py-16 text-center text-slate-400">
                          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p className="text-xs font-semibold">Chưa có thông tin dịch vụ & tiện ích</p>
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 text-white text-xs font-bold rounded-full shadow-2xs"
                            >
                              <Hash className="w-3 h-3 text-[#F3E600]" />
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
                          "flex items-start gap-4 p-5 rounded-3xl border shadow-2xs",
                          openStatus.open
                            ? "bg-emerald-50/70 border-emerald-200/80"
                            : "bg-rose-50/70 border-rose-200/80",
                        )}
                      >
                        <span
                          className={cn(
                            "w-3 h-3 rounded-full mt-1 shrink-0",
                            openStatus.open
                              ? "bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]"
                              : "bg-rose-500",
                          )}
                        />
                        <div>
                          <h4
                            className={cn(
                              "font-extrabold text-sm tracking-tight",
                              openStatus.open ? "text-emerald-950" : "text-rose-950",
                            )}
                          >
                            {openStatus.open ? "Địa điểm hiện đang mở cửa" : "Địa điểm hiện đã đóng cửa"}
                          </h4>
                          {openStatus.todayHour && !openStatus.todayHour.isClosed && (
                            <p className="text-xs text-slate-700 mt-1">
                              Giờ mở cửa {DAY_FULL[new Date().getDay()]}:{" "}
                              <strong className="text-slate-950 font-mono">
                                {openStatus.todayHour.openTime?.slice(0, 5)} – {openStatus.todayHour.closeTime?.slice(0, 5)}
                              </strong>
                            </p>
                          )}
                          {openStatus.todayHour?.isClosed && (
                            <p className="text-xs text-rose-700 mt-1">
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
                                    "flex items-center justify-between px-5 py-3 rounded-2xl transition-all border",
                                    isToday
                                      ? "bg-[#FFFDE6] text-slate-950 border-[#F3E600]/80 shadow-2xs font-extrabold"
                                      : "bg-[#F8F7F3] hover:bg-[#FAF9F5] border-black/[0.03] text-slate-700",
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={cn(
                                        "w-8 text-xs font-mono font-bold uppercase tracking-wider",
                                        isToday ? "text-slate-950" : "text-slate-400",
                                      )}
                                    >
                                      {DAY_SHORT[h.dayOfWeek]}
                                    </span>
                                    <span className="text-xs font-bold">
                                      {DAY_FULL[h.dayOfWeek]}
                                    </span>
                                    {isToday && (
                                      <span className="text-[9.5px] bg-slate-950 text-[#F3E600] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Hôm nay
                                      </span>
                                    )}
                                  </div>
                                  <span className={cn("text-xs font-bold font-mono tabular-nums", h.isClosed ? "text-rose-500" : isToday ? "text-slate-950" : "text-slate-600")}>
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
                      <div className="py-16 text-center text-slate-400">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-xs font-semibold">Chưa cập nhật lịch mở cửa tuần</p>
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
                        <div className="rounded-3xl overflow-hidden border border-black/[0.06] shadow-sm">
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
                          <div className="bg-slate-950 px-6 py-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-mono">
                              <MapPin className="w-4 h-4 text-[#F3E600]" />
                              <span className="text-white font-bold tabular-nums">
                                {Number(place.latitude).toFixed(6)}, {Number(place.longitude).toFixed(6)}
                              </span>
                            </div>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F3E600] hover:underline"
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
                              <InfoChip icon={MapPin} onCopyText={place.address}>
                                {place.address}
                              </InfoChip>
                            )}
                            {place.ward && (
                              <InfoChip icon={Building2}>
                                <span className="text-slate-400 text-xs mr-2">Phường / Xã:</span>
                                <strong>{place.ward.name}</strong>
                              </InfoChip>
                            )}
                            {place.district && (
                              <InfoChip icon={Navigation}>
                                <span className="text-slate-400 text-xs mr-2">Quận / Huyện:</span>
                                <strong>{place.district.name}</strong>
                              </InfoChip>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-16 text-center text-slate-400">
                        <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-xs font-semibold">Chưa cập nhật tọa độ GPS bản đồ</p>
                      </div>
                    )}
                  </>
                )}

                {/* ═══ AUDIT & SYSTEM LOGS TAB ═══ */}
                {activeTab === "audit" && (
                  <>
                    <div>
                      <SectionTitle icon={TrendingUp}>Thông tin quản trị hệ thống</SectionTitle>
                      <div className="bg-[#F8F7F3] rounded-3xl p-6 space-y-3 border border-black/[0.04]">
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
                            className="flex items-center justify-between py-2 border-b border-black/[0.03] last:border-0"
                          >
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              {label}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-950 tabular-nums">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rejection Reason Box */}
                    {place.status === "rejected" && place.rejectionReason && (
                      <div className="p-5 bg-rose-50 border border-rose-200 rounded-3xl">
                        <div className="flex items-center gap-2 mb-2 text-rose-800">
                          <XCircle className="w-5 h-5 text-rose-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider">Lý do từ chối hồ sơ</h4>
                        </div>
                        <p className="text-xs text-rose-900 leading-relaxed font-medium">
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
