import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";

export const StepIndicator = memo(({ currentStep, steps }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isActive = idx === currentStep;
        const isCompleted = idx < currentStep;
        const stepClassName = isActive
          ? "bg-primary text-primary-foreground shadow-md"
          : "";
        const completedClassName = isCompleted
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-muted text-muted-foreground";

        return (
          <div key={step.key} className="flex items-center">
            <div
              className={`
                flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all
                ${stepClassName || completedClassName}
              `}
            >
              {isCompleted ? (
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
              <span className="hidden sm:inline">{t(step.labelKey)}</span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`mx-1 sm:mx-2 h-px w-3 sm:w-8 ${
                  idx < currentStep ? "bg-emerald-300" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
});

StepIndicator.displayName = "StepIndicator";
export default StepIndicator;
