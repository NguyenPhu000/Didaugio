import { Link } from "react-router-dom";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * BusinessPageHeader — standardized page header pattern.
 *
 * @param {object} props
 * @param {string} props.title - Page title
 * @param {string} [props.description] - Subtitle description
 * @param {string|number} [props.badge] - Count or status badge
 * @param {React.ReactNode} [props.action] - Primary action button
 * @param {React.ReactNode} [props.secondaryActions] - Secondary action buttons
 * @param {Array<{label: string, href?: string}>} [props.breadcrumbs] - Breadcrumb trail
 * @param {string} [props.backLink] - Back navigation URL
 * @param {string} [props.className] - Additional classes
 */
export function BusinessPageHeader({
  title,
  description,
  badge,
  action,
  secondaryActions,
  breadcrumbs,
  backLink,
  className,
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
          {backLink && (
            <Link
              to={backLink}
              className="mr-1 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          )}
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600" />}
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            {backLink && !breadcrumbs && (
              <Link
                to={backLink}
                className="inline-flex items-center justify-center rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            )}
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
              {title}
            </h1>
            {badge !== undefined && badge !== null && (
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>
        {(action || secondaryActions) && (
          <div className="flex shrink-0 items-center gap-2">
            {secondaryActions}
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
