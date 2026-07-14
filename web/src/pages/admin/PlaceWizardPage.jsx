import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Check } from "lucide-react";
import usePlaceStore from "@/stores/placeStore";
import { usePlaceDetail } from "@/hooks/queries/usePlaceQueries";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import StepBasicInfo from "@/components/place/StepBasicInfo";
import StepDetails from "@/components/place/StepDetails";
import StepPreview from "@/components/place/StepPreview";
import { cn } from "@/lib/utils";

/**
 * PLACE WIZARD PAGE
 * Multi-step form de tao/chinh sua dia diem
 */
const PlaceWizardPage = () => {
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

  const handleBack = () => {
    navigate("/admin/places");
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Top Header */}
      <div className="bg-background border-b sticky top-0 z-40">
        <div className="container mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                {isEditMode ? t("admin.placeWizard.editPlace") : t("admin.placeWizard.addPlace")}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t("admin.placeWizard.step", { n: currentStep })}</span>
            <span className="text-muted-foreground/50">/</span>
            <span>{totalSteps}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Stepper */}
        <div className="mb-10 px-4">
          <div className="flex items-center justify-between relative">
            {/* Connecting Lines */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-border -z-10" />

            {steps.map((step) => {
              const isActive = step.number === currentStep;
              const isCompleted = step.number < currentStep;

              return (
                <div
                  key={step.number}
                  className="flex flex-col items-center bg-background gap-2 cursor-pointer group"
                  onClick={() =>
                    !placeLoading &&
                    step.number < currentStep &&
                    setCurrentStep(step.number)
                  }
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10",
                      isActive && "border-primary bg-primary text-primary-foreground",
                      isCompleted && "border-primary bg-primary text-primary-foreground",
                      !isActive && !isCompleted && "border-border bg-background text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="font-semibold">{step.number}</span>
                    )}
                  </div>
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "text-sm font-medium transition-colors",
                        isActive && "text-foreground",
                        isCompleted && "text-primary",
                        !isActive && !isCompleted && "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </span>
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div>
          {StepComponent && <StepComponent isEditMode={isEditMode} />}
        </div>

      </div>
    </div>
  );
};

export default PlaceWizardPage;
