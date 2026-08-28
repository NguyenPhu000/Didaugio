import React, { memo } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * Aether Bento Card with Inverted Corner Cutout & Nested Action Button
 * Auto-scales typography so large currency numbers (e.g. 12.001.000 ₫) never get clipped.
 */
export const AetherBentoCard = memo(
  ({
    title,
    subtitle,
    value,
    trend,
    trendText,
    variant = "peach", // "peach" | "blue" | "gray" | "mint" | "rose"
    onClick,
    href,
    actionIcon: ActionIcon = ArrowUpRight,
    className,
    children,
  }) => {
    // Theme color palettes matching the reference design
    const THEMES = {
      peach: {
        cardBg: "bg-[#FEE8D3] dark:bg-[#342416]",
        textColor: "text-[#2B1807] dark:text-[#FEE8D3]",
        subColor: "text-[#855D36] dark:text-[#D1A87D]",
        btnBg: "bg-slate-950 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-950",
        curveFill: "fill-[#FEE8D3] dark:fill-[#342416]",
      },
      blue: {
        cardBg: "bg-[#D7E5FF] dark:bg-[#1A2744]",
        textColor: "text-[#0F244A] dark:text-[#D7E5FF]",
        subColor: "text-[#4A6B9D] dark:text-[#9AB8E6]",
        btnBg: "bg-slate-950 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-950",
        curveFill: "fill-[#D7E5FF] dark:fill-[#1A2744]",
      },
      gray: {
        cardBg: "bg-[#E6E8EC] dark:bg-[#23262F]",
        textColor: "text-[#14171A] dark:text-[#F4F5F6]",
        subColor: "text-[#656E7B] dark:text-[#A2A8B4]",
        btnBg: "bg-slate-950 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-950",
        curveFill: "fill-[#E6E8EC] dark:fill-[#23262F]",
      },
      mint: {
        cardBg: "bg-[#DCFCE7] dark:bg-[#143324]",
        textColor: "text-[#06331A] dark:text-[#DCFCE7]",
        subColor: "text-[#3D7A58] dark:text-[#94D6AF]",
        btnBg: "bg-slate-950 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-950",
        curveFill: "fill-[#DCFCE7] dark:fill-[#143324]",
      },
      rose: {
        cardBg: "bg-[#FFE4E6] dark:bg-[#3D1A21]",
        textColor: "text-[#3B0C15] dark:text-[#FFE4E6]",
        subColor: "text-[#8E4452] dark:text-[#ECA5B1]",
        btnBg: "bg-slate-950 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-950",
        curveFill: "fill-[#FFE4E6] dark:fill-[#3D1A21]",
      },
    };

    const theme = THEMES[variant] || THEMES.peach;
    const valString = String(value ?? "");
    const hasHref = typeof href === "string" && href.length > 0;
    const hasAction = hasHref || typeof onClick === "function";
    const actionLabel = `Mở ${title}`;

    // Dynamic typography scaling based on string length (e.g. "12.001.000 ₫")
    const getValueTypography = (str) => {
      if (str.length > 13) {
        return "text-lg sm:text-xl lg:text-[20px] xl:text-[22px] 2xl:text-[25px]";
      }
      if (str.length > 9) {
        return "text-xl sm:text-2xl lg:text-[22px] xl:text-[25px] 2xl:text-[28px]";
      }
      if (str.length > 6) {
        return "text-2xl sm:text-3xl lg:text-[26px] xl:text-[30px] 2xl:text-4xl";
      }
      return "text-3xl sm:text-4xl xl:text-[40px]";
    };

    return (
      <div
        className={cn(
          "relative rounded-[32px] p-5 sm:p-6 min-h-[155px] sm:min-h-[165px] flex flex-col justify-between group shadow-xs",
          hasAction && "select-none transition-shadow duration-300 hover:shadow-md",
          theme.cardBg,
          className
        )}
      >
        {/* Card Header Content */}
        <div className="space-y-1 z-10 pr-4">
          <h4 className={cn("font-black text-xs sm:text-sm md:text-base tracking-tight leading-snug", theme.textColor)}>
            {title}
          </h4>
          {subtitle && (
            <p className={cn("text-[11px] sm:text-xs font-semibold leading-relaxed line-clamp-2", theme.subColor)}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Custom Extra Children */}
        {children && <div className="my-1.5 z-10">{children}</div>}

        {/* Card Bottom: Big Value & Cutout Button */}
        <div className="flex items-end justify-between z-10 mt-3">
          <div className={cn("space-y-0.5 min-w-0", hasAction && "pr-11")}>
            <span
              className={cn(
                "font-black tracking-tight block whitespace-nowrap leading-none",
                getValueTypography(valString),
                theme.textColor
              )}
            >
              {value}
            </span>
            {trendText && (
              <span className={cn("text-[10px] sm:text-[11px] font-bold block mt-1", theme.subColor)}>
                {trendText}
              </span>
            )}
          </div>
        </div>

        {hasAction && (
          <div className="absolute right-0 bottom-0 pointer-events-auto">
            <div className="absolute -top-4 right-0 w-4 h-4 overflow-hidden pointer-events-none">
              <svg
                viewBox="0 0 20 20"
                className={cn("w-full h-full rotate-0", theme.curveFill)}
              >
                <path d="M20,20 C20,8.954 11.046,0 0,0 L20,0 Z" />
              </svg>
            </div>

            <div className="absolute bottom-0 -left-4 w-4 h-4 overflow-hidden pointer-events-none">
              <svg
                viewBox="0 0 20 20"
                className={cn("w-full h-full rotate-0", theme.curveFill)}
              >
                <path d="M20,20 C8.954,20 0,11.046 0,0 L0,20 Z" />
              </svg>
            </div>

            <div className="w-[52px] h-[52px] bg-[#FAFAF8] dark:bg-background rounded-tl-[20px] flex items-center justify-center">
              {hasHref ? (
                <Link
                  to={href}
                  className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 active:scale-95",
                    theme.btnBg
                  )}
                  aria-label={actionLabel}
                >
                  <ActionIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onClick}
                  className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 active:scale-95 cursor-pointer",
                    theme.btnBg
                  )}
                  aria-label={actionLabel}
                >
                  <ActionIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

AetherBentoCard.displayName = "AetherBentoCard";

export default AetherBentoCard;
