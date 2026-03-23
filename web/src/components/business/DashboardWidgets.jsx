import { memo } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  CheckCircle,
  Trophy,
  XCircle,
  UserX,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { BOOKING_STATUS } from "@/constants/constants";

// ─── Helpers ────────────────────────────────────────────────────────────────

export const formatVND = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    price || 0,
  );

export const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

export const formatDateTime = (date) =>
  date
    ? new Date(date).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const WELCOME_PATTERN_STYLE = {
  backgroundImage:
    "radial-gradient(circle, rgba(15, 23, 42, 0.06) 1px, transparent 1px)",
  backgroundSize: "20px 20px",
};

const formatTrendValue = (trend) => {
  if (trend === undefined || trend === null || trend === "") return null;
  if (typeof trend === "number") {
    const sign = trend > 0 ? "+" : "";
    return `${sign}${trend}%`;
  }
  return String(trend);
};

// ─── Design Tokens ──────────────────────────────────────────────────────────

export const DESIGN = {
  card: "rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 dark:bg-zinc-950/70 dark:backdrop-blur-md",
  cardHover: "hover:shadow-md hover:-translate-y-0.5 active:scale-[0.995]",
  tabUnderlineTrigger:
    "h-9 px-3 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary",
  sectionHeader:
    "px-5 py-4 border-b border-border/60 flex items-center justify-between",
  iconBox: (color) =>
    cn(
      "rounded-xl p-3 flex items-center justify-center shrink-0",
      {
        emerald:
          "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
        teal: "bg-teal-100 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400",
        blue: "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
        amber:
          "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
        rose: "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
        violet:
          "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
        primary: "bg-primary/10 text-primary dark:bg-primary/20",
      }[color] || "bg-muted text-muted-foreground",
    ),
};

const SPARKLINE_BAR_CLASS = {
  emerald: "bg-emerald-500/80",
  teal: "bg-teal-500/80",
  blue: "bg-blue-500/80",
  amber: "bg-amber-500/80",
  rose: "bg-rose-500/80",
  violet: "bg-violet-500/80",
  primary: "bg-primary/80",
};

// ─── Status Config (Booking) ─────────────────────────────────────────────────

export const BOOKING_STATUS_CONFIG = {
  [BOOKING_STATUS.PENDING]: {
    label: "Chờ xác nhận",
    icon: Clock,
    className:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  },
  [BOOKING_STATUS.CONFIRMED]: {
    label: "Đã xác nhận",
    icon: CheckCircle,
    className:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  },
  [BOOKING_STATUS.COMPLETED]: {
    label: "Hoàn thành",
    icon: Trophy,
    className:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  },
  [BOOKING_STATUS.CANCELLED]: {
    label: "Đã hủy",
    icon: XCircle,
    className:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
  },
  [BOOKING_STATUS.NO_SHOW]: {
    label: "Không đến",
    icon: UserX,
    className:
      "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700",
  },
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────

export const StatusBadge = ({ status, className }) => {
  const cfg = BOOKING_STATUS_CONFIG[status];
  if (!cfg) return <Badge variant="outline">{status}</Badge>;
  const StatusIcon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        cfg.className,
        className,
      )}
    >
      <StatusIcon className="h-3.5 w-3.5 shrink-0" />
      {cfg.label}
    </span>
  );
};

// ─── WelcomeBanner ───────────────────────────────────────────────────────────

const WelcomeBannerBase = ({ name, role = "Chủ doanh nghiệp" }) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString("vi-VN");
  const shortName = name || "Doanh nghiệp";
  const initials = shortName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-primary/10 via-background to-background px-6 py-6 shadow-sm">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={WELCOME_PATTERN_STYLE}
      />
      <div className="pointer-events-none absolute -top-14 -right-12 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
            {initials ? (
              <span className="text-sm font-semibold tracking-wide">
                {initials}
              </span>
            ) : (
              <User className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Chào mừng, {shortName}!
            </h1>
            <p className="text-sm text-muted-foreground">
              {role} • Hôm nay là {dateStr}
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <div className="rounded-xl border border-border/60 bg-card/80 px-3 py-2 text-right shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Vai trò
            </p>
            <p className="text-xs font-semibold text-foreground truncate max-w-[130px]">
              {role}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/80 px-3 py-2 text-right shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Ngày
            </p>
            <p className="text-xs font-semibold text-foreground">{dateStr}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const WelcomeBanner = memo(WelcomeBannerBase);
WelcomeBanner.displayName = "WelcomeBanner";

const MiniSparklineBase = ({ data, color = "primary" }) => {
  if (!Array.isArray(data) || data.length === 0) return null;

  const max = Math.max(...data, 1);
  const barClass = SPARKLINE_BAR_CLASS[color] || SPARKLINE_BAR_CLASS.primary;

  return (
    <div className="mt-3 flex h-10 items-end gap-1">
      {data.map((point, index) => {
        const heightPercent = Math.max(
          18,
          Math.min(100, Math.round((point / max) * 100)),
        );
        return (
          <div
            key={`${index}-${point}`}
            className={cn(
              "w-2 rounded-full transition-all duration-300",
              barClass,
            )}
            style={{ height: `${heightPercent}%` }}
          />
        );
      })}
    </div>
  );
};

const MiniSparkline = memo(MiniSparklineBase);
MiniSparkline.displayName = "MiniSparkline";

// ─── StatCard ─────────────────────────────────────────────────────────────────

export const StatCard = ({
  title,
  value,
  icon: Icon,
  iconColor = "primary",
  trend,
  miniChart,
  description,
  href,
  loading,
}) => {
  if (loading) return <StatCardSkeleton />;

  const trendValue = formatTrendValue(trend);

  return (
    <Card className={cn(DESIGN.card, DESIGN.cardHover, "group")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
        <div className={DESIGN.iconBox(iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
        {trendValue && (
          <Badge
            variant="secondary"
            className="rounded-lg border border-border/60 bg-muted/70 text-xs font-semibold"
          >
            {trendValue}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-[32px] font-semibold leading-tight tracking-tighter text-foreground">
            {value}
          </p>
          <p className="text-sm text-muted-foreground">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground/90 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <MiniSparkline data={miniChart} color={iconColor} />

        {href && (
          <Link
            to={href}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Xem chi tiết <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
};

const SectionCardBase = ({
  title,
  titleIcon: TitleIcon,
  action,
  children,
  className,
  bodyClassName,
}) => (
  <Card className={cn(DESIGN.card, className)}>
    {title && (
      <div className={DESIGN.sectionHeader}>
        <div className="flex items-center gap-2">
          {TitleIcon && <TitleIcon className="h-4 w-4 text-muted-foreground" />}
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    )}
    <CardContent className={cn("p-5", bodyClassName)}>{children}</CardContent>
  </Card>
);

export const SectionCard = memo(SectionCardBase);
SectionCard.displayName = "SectionCard";

const PageHeaderBase = ({ title, subtitle, badge, action }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {badge !== undefined && badge !== null && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
    {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
  </div>
);

export const PageHeader = memo(PageHeaderBase);
PageHeader.displayName = "PageHeader";

const EmptyStateBase = ({ icon: Icon = AlertCircle, message, action }) => (
  <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
    <div className="rounded-2xl bg-muted p-5">
      <Icon className="h-9 w-9 text-muted-foreground" />
    </div>
    <p className="max-w-xs text-sm font-medium leading-relaxed text-muted-foreground">
      {message}
    </p>
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export const EmptyState = memo(EmptyStateBase);
EmptyState.displayName = "EmptyState";

const LoadingStateBase = ({ message = "Đang tải dữ liệu..." }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

export const LoadingState = memo(LoadingStateBase);
LoadingState.displayName = "LoadingState";

const StatCardSkeletonBase = () => (
  <Card className={DESIGN.card}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <Skeleton className="h-6 w-16 rounded-lg" />
    </CardHeader>
    <CardContent className="space-y-2 p-5 pt-0">
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-4 w-24" />
      <div className="flex h-10 items-end gap-1 pt-1">
        {Array.from({ length: 8 }).map((_, idx) => (
          <Skeleton key={idx} className="h-full w-2 rounded-full" />
        ))}
      </div>
    </CardContent>
  </Card>
);

export const StatCardSkeleton = memo(StatCardSkeletonBase);
StatCardSkeleton.displayName = "StatCardSkeleton";

export const SectionCardSkeleton = ({ rows = 4 }) => (
  <Card className={DESIGN.card}>
    <div className={DESIGN.sectionHeader}>
      <Skeleton className="h-4 w-36" />
    </div>
    <CardContent className="space-y-3 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </CardContent>
  </Card>
);

export const TableRowSkeleton = ({ cols = 4 }) => (
  <div className="flex items-center gap-4 border-b border-border/50 px-5 py-4">
    {Array.from({ length: cols }).map((_, i) => (
      <Skeleton key={i} className="h-4 flex-1" />
    ))}
  </div>
);

// ─── Pagination ───────────────────────────────────────────────────────────────

export const PageNav = ({ page, totalPages, total, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-between py-3 px-1">
      {total !== undefined && (
        <p className="text-xs text-muted-foreground">
          Trang <span className="font-semibold text-foreground">{page}</span> /{" "}
          {totalPages}
          {total > 0 && <> · {total} kết quả</>}
        </p>
      )}
      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pages.map((p, idx) =>
          p === "..." ? (
            <span
              key={`e-${idx}`}
              className="px-2 text-muted-foreground text-xs"
            >
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0 text-xs"
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// ─── StatusProgress (cho dashboard / revenue) ─────────────────────────────────

export const StatusProgressRow = ({ label, count, total, colorClass }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {count} <span className="opacity-60">({pct.toFixed(0)}%)</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            colorClass,
          )}
          style={{ width: `${Math.max(pct, 0)}%` }}
        />
      </div>
    </div>
  );
};
