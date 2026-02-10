import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Check from "lucide-react/dist/esm/icons/check";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import usePlaceStore from "@/stores/placeStore";
import { Button, Card } from "@/components/ui";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import StepBasicInfo from "@/components/place/StepBasicInfo";
import StepDetails from "@/components/place/StepDetails";
import StepPreview from "@/components/place/StepPreview";
import { cn } from "@/lib/utils";

/**
 * PLACE WIZARD PAGE
 * Multi-step form để tạo/chỉnh sửa địa điểm
 */

const PlaceWizardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    currentStep,
    totalSteps,
    wizardData,
    loading,
    fetchPlaceById,
    loadPlaceIntoWizard,
    resetWizard,
    setCurrentStep,
  } = usePlaceStore();

  const isEditMode = !!id;

  // Load place data if editing
  useEffect(() => {
    if (isEditMode) {
      fetchPlaceById(parseInt(id))
        .then((place) => {
          loadPlaceIntoWizard(place);
        })
        .catch((error) => {
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: error.message || "Không thể tải thông tin địa điểm",
          });
          navigate("/admin/places");
        });
    } else {
      resetWizard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  const steps = [
    {
      number: 1,
      title: "Thông tin cơ bản",
      description: "Tên & Danh mục",
      component: StepBasicInfo,
    },
    {
      number: 2,
      title: "Chi tiết",
      description: "Mô tả & Hình ảnh",
      component: StepDetails,
    },
    {
      number: 3,
      title: "Hoàn tất",
      description: "Xem trước & Lưu",
      component: StepPreview,
    },
  ];

  const currentStepData = steps.find((s) => s.number === currentStep);
  const StepComponent = currentStepData?.component;

  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  const handleBack = () => {
    navigate("/admin/places");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="rounded-full hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {isEditMode ? "Chỉnh sửa địa điểm" : "Thêm địa điểm mới"}
                {!isEditMode && (
                  <Sparkles className="h-4 w-4 text-yellow-500 fill-yellow-500 animate-pulse" />
                )}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <span>Bước {currentStep}</span>
            <span className="text-slate-300">/</span>
            <span>{totalSteps}</span>
          </div>
        </div>

        {/* Progress Bar Line */}
        <div className="h-0.5 w-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(14,107,168,0.5)]"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Stepper Visual */}
        <div className="mb-10 px-4">
          <div className="flex items-center justify-between relative">
            {/* Connecting Lines */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 -z-10" />

            {steps.map((step) => {
              const isActive = step.number === currentStep;
              const isCompleted = step.number < currentStep;

              return (
                <div
                  key={step.number}
                  className="flex flex-col items-center bg-transparent gap-2 cursor-pointer group"
                  onClick={() =>
                    !loading &&
                    step.number < currentStep &&
                    setCurrentStep(step.number)
                  }
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10",
                      isActive
                        ? "bg-primary border-white shadow-lg shadow-primary/20 scale-110"
                        : isCompleted
                          ? "bg-primary border-primary/10 text-white"
                          : "bg-white border-slate-200 text-slate-400",
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span
                        className={cn(
                          "font-bold",
                          isActive ? "text-white" : "",
                        )}
                      >
                        {step.number}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "text-sm font-bold transition-colors",
                        isActive
                          ? "text-slate-800"
                          : isCompleted
                            ? "text-primary"
                            : "text-slate-400",
                      )}
                    >
                      {step.title}
                    </span>
                    <span className="text-xs text-slate-400 hidden sm:block">
                      {step.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="">
          {StepComponent && <StepComponent isEditMode={isEditMode} />}
        </div>
      </div>
    </div>
  );
};

export default PlaceWizardPage;
