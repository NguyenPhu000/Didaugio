import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Link } from "react-router-dom";
import { BUSINESS_ROUTES } from "@/constants/routes";

const PLAN_LEVEL = { basic: 1, plus: 2, pro: 3 };

/**
 * Wraps children content and shows a lock overlay
 * when the current plan level is below the required level.
 *
 * @param {Object} props
 * @param {string} props.requiredPlan - Minimum plan slug: "basic" | "plus" | "pro"
 * @param {string} props.currentPlanSlug - Current subscription plan slug
 * @param {React.ReactNode} props.children - Content to render
 */
export default function FeatureGateWrapper({
  requiredPlan = "basic",
  currentPlanSlug = "basic",
  children,
}) {
  const { t } = useTranslation();
  const currentLevel = PLAN_LEVEL[currentPlanSlug] ?? 0;
  const requiredLevel = PLAN_LEVEL[requiredPlan] ?? 1;

  if (currentLevel >= requiredLevel) {
    return children;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-40 blur-[2px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Card className="max-w-sm shadow-lg">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="rounded-full bg-muted p-3">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Tính năng này yêu cầu gói{" "}
              <span className="font-semibold capitalize">{requiredPlan}</span> trở lên.
            </p>
            <Button asChild size="sm">
              <Link to={BUSINESS_ROUTES.SUBSCRIPTION_PLANS}>
                {t("subscription.upgradeBtn")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
