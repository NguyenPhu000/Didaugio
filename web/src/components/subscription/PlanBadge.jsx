import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PLAN_STYLES = {
  basic: "bg-zinc-100 text-zinc-700 border-zinc-200",
  plus: "bg-blue-50 text-blue-700 border-blue-200",
  pro: "bg-violet-50 text-violet-700 border-violet-200",
};

export default function PlanBadge({ planSlug, className }) {
  const style = PLAN_STYLES[planSlug] || PLAN_STYLES.basic;
  const label = planSlug ? planSlug.charAt(0).toUpperCase() + planSlug.slice(1) : "-";

  return (
    <Badge variant="outline" className={cn(style, className)}>
      {label}
    </Badge>
  );
}
