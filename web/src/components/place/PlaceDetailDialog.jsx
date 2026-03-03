import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
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
  Calendar,
  ExternalLink,
  ShieldCheck,
  Mail,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Navigation,
  Info,
  Layers,
  Hash,
  Building2,
  ImageOff,
  TrendingUp,
  Award,
  ArrowUpRight,
} from "lucide-react";
import { PRICE_RANGE_LABELS } from "@/constants/constants";
import { MapView } from "@/modules/map";
import { cn } from "@/lib/utils";

// ─── Constants ───────────────────────────────────────────────────────────────

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
    label: "NHÁP",
    bg: "bg-gray-100",
    text: "text-gray-700",
    dot: "bg-gray-400",
    border: "border-gray-300",
  },
  pending: {
    label: "CHỜ DUYỆT",
    bg: "bg-amber-50",
    text: "text-amber-800",
    dot: "bg-amber-500",
    border: "border-amber-200",
  },
  approved: {
    label: "ĐÃ DUYỆT",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
  rejected: {
    label: "TỪ CHỐI",
    bg: "bg-red-50",
    text: "text-red-800",
    dot: "bg-red-500",
    border: "border-red-200",
  },
  hidden: {
    label: "ẨN",
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400",
    border: "border-slate-300",
  },
};

const PRICE_CFG = {
  FREE: {
    label: "Miễn phí",
    icon: "✦",
    cls: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  BUDGET: {
    label: "Bình dân",
    icon: "₫",
    cls: "text-sky-700     bg-sky-50     border-sky-200",
  },
  MODERATE: {
    label: "Trung bình",
    icon: "₫₫",
    cls: "text-amber-700  bg-amber-50   border-amber-200",
  },
  EXPENSIVE: {
    label: "Cao cấp",
    icon: "₫₫₫",
    cls: "text-orange-700 bg-orange-50  border-orange-200",
  },
  LUXURY: {
    label: "Sang trọng",
    icon: "💎",
    cls: "text-purple-700  bg-purple-50  border-purple-200",
  },
};

// ─── Mini helpers ─────────────────────────────────────────────────────────────

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
      <span className="text-sm text-gray-400">({count ?? 0} đánh giá)</span>
    </div>
  );
}

function InfoChip({ icon: Icon, children, href, className }) {
  const inner = (
    <div className={cn("flex items-center gap-2.5 group", className)}>
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
      </div>
      <span className="text-sm text-gray-700 leading-snug">{children}</span>
    </div>
  );
  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : "_self"}
        rel="noreferrer"
        className="hover:opacity-80 transition-opacity"
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
      <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <h3 className="text-sm font-black uppercase tracking-tight text-gray-900">
        {children}
      </h3>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

// ─── Image Gallery (Left panel) ───────────────────────────────────────────────

function ImageGallery({ images, name, status, isFeatured }) {
  const [idx, setIdx] = useState(0);
  const imgs = Array.isArray(images) && images.length > 0 ? images : [];
  const src = imgs[idx]?.imageData || imgs[idx]?.url;
  const s = STATUS_CFG[status] || STATUS_CFG.draft;

  return (
    <div className="flex flex-col h-full bg-gray-950 rounded-l-2xl overflow-hidden">
      {/* Main image */}
      <div className="relative flex-1 min-h-0 overflow-hidden group">
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
            <ImageOff className="w-14 h-14 opacity-20 mb-3" />
            <span className="text-xs font-mono uppercase opacity-30">
              Chưa có hình ảnh
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/30 pointer-events-none" />

        {/* Top-left: status + featured */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md border",
              s.bg,
              s.text,
              s.border,
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
            {s.label}
          </div>
          {isFeatured && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 text-[11px] font-black">
              <Award className="w-3 h-3" /> NỔI BẬT
            </div>
          )}
        </div>

        {/* Top-right: counter */}
        {imgs.length > 0 && (
          <div className="absolute top-4 right-4 bg-black/45 text-white text-[10px] font-mono px-2.5 py-1 rounded-lg backdrop-blur-sm">
            {idx + 1} / {imgs.length}
          </div>
        )}

        {/* Nav arrows */}
        {imgs.length > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => (i - 1 + imgs.length) % imgs.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/65 flex items-center justify-center text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIdx((i) => (i + 1) % imgs.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/65 flex items-center justify-center text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Bottom: name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <p className="text-xl font-black tracking-tight leading-tight drop-shadow-lg line-clamp-2">
            {name}
          </p>
        </div>
      </div>

      {/* Thumbnail strip */}
      {imgs.length > 1 && (
        <div className="h-20 bg-black/80 px-3 py-2 flex gap-2 overflow-x-auto">
          {imgs.map((img, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={cn(
                "flex-shrink-0 h-full w-[60px] rounded-lg overflow-hidden border-2 transition-all",
                i === idx
                  ? "border-white shadow-md scale-105"
                  : "border-white/20 opacity-50 hover:opacity-80",
              )}
            >
              <img
                src={img.imageData || img.url}
                alt={`Ảnh ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

const PlaceDetailDialog = ({
  place,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const openStatus = useCurrentOpenStatus(place?.openingHours);

  if (!place) return null;

  const creatorData = place.createdByUser || place.user;
  const creatorPrf = creatorData?.profile;
  const creatorName =
    creatorPrf?.fullName ||
    creatorData?.fullName ||
    creatorData?.username ||
    creatorData?.email ||
    `#${place.createdBy}`;
  const creatorAva = creatorPrf?.avatar || creatorData?.avatar;
  const rating = Number(place.ratingAvg ?? place.averageRating ?? 0);
  const priceInfo = PRICE_CFG[place.priceRange];
  const phone = place.phone || place.phoneNumber;
  const facebook = place.facebook || place.facebookUrl;

  const hasAmenities = place.amenities?.length > 0;
  const hasTags = place.tagLinks?.length > 0 || place.tags?.length > 0;
  const tagList = place.tagLinks
    ? place.tagLinks.map((l) => l.tag).filter(Boolean)
    : place.tags || [];

  const TABS = [
    { id: "overview", label: "Tổng quan", icon: Info },
    { id: "hours", label: "Giờ mở cửa", icon: Clock },
    { id: "location", label: "Vị trí", icon: MapPin },
    { id: "details", label: "Chi tiết", icon: Layers },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1100px] w-full h-[90vh] max-h-[90vh] p-0 gap-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <DialogTitle className="sr-only">
          {place.name} - Chi tiết địa điểm
        </DialogTitle>
        <div className="flex h-full overflow-hidden">
          {/* ═══ LEFT panel: image gallery ═══ */}
          <div className="w-[400px] flex-shrink-0 flex flex-col overflow-hidden">
            <ImageGallery
              images={place.images}
              name={place.name}
              status={place.status}
              isFeatured={place.isFeatured}
            />
          </div>

          {/* ═══ RIGHT panel: information ═══ */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* ── Header ── */}
            <div className="px-7 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
              {/* Badges row */}
              <div className="flex flex-wrap gap-2 mb-3">
                {place.category?.name && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-gray-900 text-white">
                    {place.category.icon && <span>{place.category.icon}</span>}
                    {place.category.name}
                  </span>
                )}
                {place.isVerified && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <ShieldCheck className="w-3 h-3" /> Đã xác minh
                  </span>
                )}
                {priceInfo && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border",
                      priceInfo.cls,
                    )}
                  >
                    {priceInfo.icon} {priceInfo.label}
                  </span>
                )}
              </div>

              {/* Name */}
              <h1 className="text-[22px] font-black text-gray-900 leading-tight tracking-tight mb-1.5 pr-2">
                {place.name}
              </h1>

              {/* Short description */}
              {place.shortDescription && (
                <p className="text-sm text-gray-500 italic mb-3 line-clamp-2 leading-relaxed">
                  {place.shortDescription}
                </p>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-3 flex-wrap mb-4">
                <StarRow value={rating} count={place.ratingCount} />
                <div className="w-px h-5 bg-gray-200" />
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Eye className="w-4 h-4" />
                  <span className="font-bold text-gray-800">
                    {(place.viewCount || 0).toLocaleString()}
                  </span>
                  <span>lượt xem</span>
                </div>
                {openStatus.known && (
                  <>
                    <div className="w-px h-5 bg-gray-200" />
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full",
                        openStatus.open
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-600",
                      )}
                    >
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          openStatus.open
                            ? "bg-emerald-500 animate-pulse"
                            : "bg-red-400",
                        )}
                      />
                      {openStatus.open ? "Đang mở cửa" : "Đã đóng cửa"}
                      {openStatus.todayHour &&
                        !openStatus.todayHour.isClosed && (
                          <span className="font-normal text-gray-500">
                            · {openStatus.todayHour.openTime?.slice(0, 5)}–
                            {openStatus.todayHour.closeTime?.slice(0, 5)}
                          </span>
                        )}
                    </span>
                  </>
                )}
              </div>

              {/* Action buttons */}
              {(onEdit || onApprove || onReject || onDelete) && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(place)}
                      className="inline-flex items-center gap-1.5 h-8 px-3.5 text-[12px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" /> Chỉnh sửa
                    </button>
                  )}
                  {onApprove && place.status === "pending" && (
                    <button
                      onClick={() => onApprove(place)}
                      className="inline-flex items-center gap-1.5 h-8 px-3.5 text-[12px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Duyệt
                    </button>
                  )}
                  {onReject && place.status === "pending" && (
                    <button
                      onClick={() => onReject(place)}
                      className="inline-flex items-center gap-1.5 h-8 px-3.5 text-[12px] font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Từ chối
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(place)}
                      className="ml-auto h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      title="Xóa địa điểm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Tab bar ── */}
            <div className="flex border-b border-gray-100 bg-gray-50/80 flex-shrink-0 px-3">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-3 text-[12px] font-bold transition-all border-b-2 -mb-px",
                    activeTab === id
                      ? "border-gray-900 text-gray-900 bg-white rounded-t-lg"
                      : "border-transparent text-gray-400 hover:text-gray-700 hover:bg-white/60",
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* ── Scrollable tab content ── */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-7 py-6 space-y-8">
                {/* ═══ OVERVIEW ═══ */}
                {activeTab === "overview" && (
                  <>
                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex gap-3 items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0">
                          <span className="text-lg">
                            {place.category?.icon || "📍"}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Danh mục
                          </p>
                          <p className="text-sm font-bold text-gray-900 mt-0.5">
                            {place.category?.name || "—"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0">
                          <Navigation className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Khu vực
                          </p>
                          <p className="text-sm font-bold text-gray-900 mt-0.5">
                            {[place.ward?.name, place.district?.name]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </p>
                        </div>
                      </div>

                      {place.priceRange && (
                        <div className="flex gap-3 items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0">
                            <DollarSign className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              Mức giá
                            </p>
                            <p className="text-sm font-bold text-gray-900 mt-0.5">
                              {PRICE_RANGE_LABELS[place.priceRange] ||
                                place.priceRange}
                            </p>
                            {(place.priceFrom || place.priceTo) && (
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                {place.priceFrom
                                  ? new Intl.NumberFormat("vi-VN").format(
                                      place.priceFrom,
                                    )
                                  : "0"}
                                đ{" – "}
                                {place.priceTo
                                  ? new Intl.NumberFormat("vi-VN").format(
                                      place.priceTo,
                                    )
                                  : "∞"}
                                đ
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-gray-200 overflow-hidden border border-gray-200 shadow-sm shrink-0 flex items-center justify-center">
                          {creatorAva ? (
                            <img
                              src={creatorAva}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                          ) : (
                            <span className="text-base font-black text-gray-500">
                              {creatorName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Người đăng
                          </p>
                          <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">
                            {creatorName}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {(place.description || place.shortDescription) && (
                      <div>
                        <SectionTitle icon={Info}>Mô tả</SectionTitle>
                        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl p-5 border border-gray-100">
                          {place.description || place.shortDescription}
                        </div>
                      </div>
                    )}

                    {/* Contact */}
                    <div>
                      <SectionTitle icon={Phone}>Liên hệ</SectionTitle>
                      <div className="space-y-3">
                        {place.address && (
                          <InfoChip icon={MapPin}>
                            {place.address}
                            {place.ward ? `, ${place.ward.name}` : ""}
                            {place.district ? `, ${place.district.name}` : ""}
                          </InfoChip>
                        )}
                        {phone && (
                          <InfoChip icon={Phone} href={`tel:${phone}`}>
                            <span className="font-semibold text-blue-600">
                              {phone}
                            </span>
                          </InfoChip>
                        )}
                        {place.email && (
                          <InfoChip icon={Mail} href={`mailto:${place.email}`}>
                            <span className="text-blue-600 truncate">
                              {place.email}
                            </span>
                          </InfoChip>
                        )}
                        {place.website && (
                          <InfoChip icon={Globe} href={place.website}>
                            <span className="text-blue-600 flex items-center gap-1 truncate">
                              {place.website.replace(/^https?:\/\//, "")}
                              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                            </span>
                          </InfoChip>
                        )}
                        {facebook && (
                          <InfoChip icon={Facebook} href={facebook}>
                            <span className="text-blue-600 flex items-center gap-1 truncate">
                              {facebook.replace(
                                /^https?:\/\/(www\.)?facebook\.com\//,
                                "fb/",
                              )}
                              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                            </span>
                          </InfoChip>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* ═══ HOURS ═══ */}
                {activeTab === "hours" && (
                  <>
                    {/* Open/closed banner */}
                    {openStatus.known && (
                      <div
                        className={cn(
                          "flex items-start gap-4 p-5 rounded-2xl border",
                          openStatus.open
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-red-50 border-red-200",
                        )}
                      >
                        <span
                          className={cn(
                            "w-3 h-3 rounded-full mt-1 shrink-0",
                            openStatus.open
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-red-400",
                          )}
                        />
                        <div>
                          <p
                            className={cn(
                              "font-black text-base",
                              openStatus.open
                                ? "text-emerald-800"
                                : "text-red-700",
                            )}
                          >
                            {openStatus.open
                              ? "Hiện đang mở cửa"
                              : "Hiện đã đóng cửa"}
                          </p>
                          {openStatus.todayHour &&
                            !openStatus.todayHour.isClosed && (
                              <p className="text-sm text-gray-500 mt-0.5">
                                {DAY_FULL[new Date().getDay()]}:{" "}
                                <span className="font-bold text-gray-800">
                                  {openStatus.todayHour.openTime?.slice(0, 5)} –{" "}
                                  {openStatus.todayHour.closeTime?.slice(0, 5)}
                                </span>
                              </p>
                            )}
                          {openStatus.todayHour?.isClosed && (
                            <p className="text-sm text-gray-500 mt-0.5">
                              Hôm nay ({DAY_FULL[new Date().getDay()]}) đóng cửa
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Hours list */}
                    {place.openingHours?.length > 0 ? (
                      <div>
                        <SectionTitle icon={Clock}>Lịch hoạt động</SectionTitle>
                        <div className="space-y-1.5">
                          {[...place.openingHours]
                            .sort((a, b) => {
                              const da = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
                              const db = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
                              return da - db;
                            })
                            .map((h, i) => {
                              const isToday =
                                h.dayOfWeek === new Date().getDay();
                              return (
                                <div
                                  key={i}
                                  className={cn(
                                    "flex items-center justify-between px-4 py-3 rounded-xl transition-colors",
                                    isToday
                                      ? "bg-gray-900 text-white"
                                      : "bg-gray-50 hover:bg-gray-100",
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={cn(
                                        "w-7 text-xs font-black uppercase",
                                        isToday
                                          ? "text-yellow-400"
                                          : "text-gray-400",
                                      )}
                                    >
                                      {DAY_SHORT[h.dayOfWeek]}
                                    </span>
                                    <span
                                      className={cn(
                                        "text-sm font-semibold",
                                        isToday
                                          ? "text-white"
                                          : "text-gray-700",
                                      )}
                                    >
                                      {DAY_FULL[h.dayOfWeek]}
                                    </span>
                                    {isToday && (
                                      <span className="text-[9px] bg-yellow-400 text-yellow-950 font-black px-2 py-0.5 rounded-full">
                                        HÔM NAY
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={cn(
                                      "text-sm font-bold",
                                      h.isClosed
                                        ? isToday
                                          ? "text-red-400"
                                          : "text-red-500"
                                        : isToday
                                          ? "text-emerald-300"
                                          : "text-gray-800",
                                    )}
                                  >
                                    {h.isClosed
                                      ? "Đóng cửa"
                                      : `${h.openTime?.slice(0, 5)} – ${h.closeTime?.slice(0, 5)}`}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Clock className="w-14 h-14 mb-4 opacity-15" />
                        <p className="text-sm font-semibold">
                          Chưa cập nhật giờ hoạt động
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* ═══ LOCATION ═══ */}
                {activeTab === "location" && (
                  <>
                    {place.latitude && place.longitude ? (
                      <>
                        {/* Map */}
                        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                          <div className="h-[280px]">
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
                          <div className="bg-gray-900 px-5 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-mono">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span className="text-white font-bold">
                                {Number(place.latitude).toFixed(6)}
                              </span>
                              <span className="text-gray-600">,</span>
                              <span className="text-white font-bold">
                                {Number(place.longitude).toFixed(6)}
                              </span>
                            </div>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                              Mở Google Maps{" "}
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>

                        {/* Address breakdown */}
                        <div>
                          <SectionTitle icon={Navigation}>
                            Địa chỉ đầy đủ
                          </SectionTitle>
                          <div className="space-y-3">
                            {place.address && (
                              <InfoChip icon={MapPin}>{place.address}</InfoChip>
                            )}
                            {place.ward && (
                              <InfoChip icon={Building2}>
                                <span className="text-gray-400 text-xs mr-1">
                                  Phường/Xã:
                                </span>
                                {place.ward.name}
                              </InfoChip>
                            )}
                            {place.district && (
                              <InfoChip icon={Navigation}>
                                <span className="text-gray-400 text-xs mr-1">
                                  Quận/Huyện:
                                </span>
                                {place.district.name}
                              </InfoChip>
                            )}
                            <InfoChip icon={MapPin}>
                              <span className="text-gray-400 text-xs mr-1">
                                Tọa độ:
                              </span>
                              <span className="font-mono">
                                {Number(place.latitude).toFixed(6)},{" "}
                                {Number(place.longitude).toFixed(6)}
                              </span>
                            </InfoChip>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <MapPin className="w-14 h-14 mb-4 opacity-15" />
                        <p className="text-sm font-semibold">
                          Chưa có thông tin vị trí
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* ═══ DETAILS ═══ */}
                {activeTab === "details" && (
                  <>
                    {/* Amenities */}
                    {hasAmenities && (
                      <div>
                        <SectionTitle icon={CheckCircle}>Tiện ích</SectionTitle>
                        <div className="flex flex-wrap gap-2">
                          {place.amenities.map((a, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[12px] font-medium text-gray-700 hover:border-gray-400 transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="font-bold">{a.amenityType}</span>
                              {a.amenityValue && (
                                <span className="text-gray-400">
                                  · {a.amenityValue}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {hasTags && (
                      <div>
                        <SectionTitle icon={Hash}>Thẻ (Tags)</SectionTitle>
                        <div className="flex flex-wrap gap-2">
                          {tagList.map((tag, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-[12px] font-bold rounded-xl hover:bg-gray-700 transition-colors"
                            >
                              <Hash className="w-3 h-3" />
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* System info */}
                    <div>
                      <SectionTitle icon={TrendingUp}>
                        Thông tin hệ thống
                      </SectionTitle>
                      <div className="bg-gray-50 rounded-2xl p-5 space-y-2.5 border border-gray-100">
                        {[
                          { label: "ID", value: `#${place.id}` },
                          { label: "Slug", value: place.slug || "—" },
                          {
                            label: "Trạng thái",
                            value:
                              STATUS_CFG[place.status]?.label || place.status,
                          },
                          {
                            label: "Ngày tạo",
                            value: place.createdAt
                              ? new Date(place.createdAt).toLocaleString(
                                  "vi-VN",
                                )
                              : "—",
                          },
                          {
                            label: "Cập nhật",
                            value: place.updatedAt
                              ? new Date(place.updatedAt).toLocaleString(
                                  "vi-VN",
                                )
                              : "—",
                          },
                          {
                            label: "Lượt xem",
                            value: (place.viewCount || 0).toLocaleString(),
                          },
                          {
                            label: "Tổng đánh giá",
                            value: `${place.ratingCount || 0} đánh giá · TB ${rating.toFixed(1)}/5`,
                          },
                        ].map(({ label, value }) => (
                          <div
                            key={label}
                            className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0"
                          >
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                              {label}
                            </span>
                            <span className="text-[12px] font-mono font-semibold text-gray-800">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rejection reason */}
                    {place.status === "rejected" && place.rejectionReason && (
                      <div className="p-5 bg-red-50 border border-red-200 rounded-2xl">
                        <p className="text-[11px] font-bold text-red-500 uppercase tracking-widest mb-2">
                          Lý do từ chối
                        </p>
                        <p className="text-sm text-red-700 leading-relaxed">
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
