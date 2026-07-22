import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Check } from "lucide-react";
import usePlaceStore from "@/stores/placeStore";
import { usePlaceDetail } from "@/hooks/queries/usePlaceQueries";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/use-toast";
import StepBasicInfo from "@/components/place/StepBasicInfo";
import StepDetails from "@/components/place/StepDetails";
import StepPreview from "@/components/place/StepPreview";
import { useWizardEntrance } from "@/components/place/wizard/PlaceWizardSurface";
import { cn } from "@/lib/utils";

/**
 * PLACE WIZARD PAGE
 * Multi-step form de tao/chinh sua dia diem
 */
const PlaceWizardPage = () => {
  const pageRef = useRef(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const {
    currentStep,
    totalSteps,
    loadPlaceIntoWizard,
    resetWizard,
    setCurrentStep,
  } = usePlaceStore();

  const isEditMode = !!id;

  // Fetch place detail via TanStack Query when editing
  const { data: placeRes, isLoading: placeLoading, error: placeError } = usePlaceDetail(
    isEditMode ? parseInt(id) : null
  );
  const place = placeRes?.data || placeRes;

  // Load place into wizard when data arrives
  useEffect(() => {
    if (isEditMode && placeRes) {
      loadPlaceIntoWizard(place);
    } else if (!isEditMode) {
      resetWizard();
    }
  }, [isEditMode, placeRes, loadPlaceIntoWizard, resetWizard]);

  // Handle error when editing
  useEffect(() => {
    if (placeError) {
      toast({
        variant: "destructive",
        title: t("admin.placeWizard.error"),
        description: placeError.message || t("admin.placeWizard.loadFailed"),
      });
      navigate("/admin/places");
    }
  }, [placeError, toast, navigate]);

  const steps = [
    {
      number: 1,
      title: t("admin.placeWizard.steps.basic"),
      description: t("admin.placeWizard.steps.nameAndCategory"),
      component: StepBasicInfo,
    },
    {
      number: 2,
      title: t("admin.placeWizard.steps.details"),
      description: t("admin.placeWizard.steps.descriptionAndImages"),
      component: StepDetails,
    },
    {
      number: 3,
      title: t("admin.placeWizard.steps.preview"),
      description: t("admin.placeWizard.steps.reviewAndSave"),
      component: StepPreview,
    },
  ];

  const currentStepData = steps.find((s) => s.number === currentStep);
  const StepComponent = currentStepData?.component;

  useWizardEntrance(pageRef, currentStep);

  const handleBack = () => {
    navigate("/admin/places");
  };

  return (
    <main
      ref={pageRef}
      data-testid="place-wizard-canvas"
      className="min-h-full overflow-x-hidden rounded-[28px] border border-black/[0.06] bg-background pb-8 text-[#11110F]"
    >
      <header data-wizard-reveal className="border-b border-black/10 bg-[#FFFEFB]/70 px-5 py-5 sm:px-7">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              aria-label={t("common.back")}
              className="h-10 w-10 shrink-0 rounded-xl border border-black/15 text-[#11110F] hover:bg-black hover:text-white"
            >
              <ArrowLeft className="h-[18px] w-[18px]" />
            </Button>
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6B675F]">
                Ivory workspace
              </p>
              <h1 className="truncate text-xl font-semibold tracking-[-0.03em] text-[#11110F] sm:text-2xl">
                {isEditMode ? t("admin.placeWizard.editPlace") : t("admin.placeWizard.addPlace")}
              </h1>
            </div>
          </div>

          <div className="shrink-0 rounded-xl border border-black/15 bg-[#FFFEFB] px-3 py-2 text-sm font-semibold tabular-nums tracking-[0.04em] text-[#11110F]">
            {String(currentStep).padStart(2, "0")} <span className="text-[#8E887D]">/</span>{" "}
            {String(totalSteps).padStart(2, "0")}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <nav
          data-wizard-reveal
          aria-label="Place creation progress"
          className="rounded-[22px] border border-black/10 bg-[#FFFEFB] p-2 shadow-[0_16px_48px_rgba(32,28,20,0.06)]"
        >
          <div className="grid gap-2 md:grid-cols-3">

            {steps.map((step) => {
              const isActive = step.number === currentStep;
              const isCompleted = step.number < currentStep;

              return (
                <button
                  type="button"
                  key={step.number}
                  aria-label={`Step ${step.number}: ${step.title}`}
                  aria-current={isActive ? "step" : undefined}
                  disabled={placeLoading || step.number > currentStep}
                  onClick={() => step.number < currentStep && setCurrentStep(step.number)}
                  className={cn(
                    "group relative flex min-h-[82px] items-center gap-3 rounded-[16px] px-4 py-3 text-left transition-colors",
                    "disabled:cursor-default",
                    isActive && "bg-[#11110F] text-white shadow-[0_12px_25px_rgba(17,17,15,0.16)]",
                    isCompleted && "hover:bg-muted",
                    !isActive && !isCompleted && "text-[#6B675F]"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold tabular-nums transition-colors",
                      isActive && "border-white bg-white text-[#11110F]",
                      isCompleted && "border-[#11110F] bg-[#11110F] text-white",
                      !isActive && !isCompleted && "border-black/25 bg-[#FFFEFB] text-[#6B675F]"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span>{String(step.number).padStart(2, "0")}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span
                      className={cn(
                        "block text-sm font-semibold tracking-[-0.01em]",
                        !isActive && "text-[#11110F]"
                      )}
                    >
                      {step.title}
                    </span>
                    <span className={cn("mt-1 block text-xs leading-5", isActive ? "text-white/65" : "text-[#6B675F]")}>
                      {step.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        <section data-wizard-reveal className="mt-6">
          {StepComponent && <StepComponent isEditMode={isEditMode} />}
        </section>
      </div>
    </main>
  );
};

export default PlaceWizardPage;
