import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import usePlaceStore from "@/stores/placeStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import StepBasicInfo from "@/components/place/StepBasicInfo";
import StepDetails from "@/components/place/StepDetails";
import StepPreview from "@/components/place/StepPreview";

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
    nextStep,
    prevStep,
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
      description: "Tên, danh mục, địa chỉ",
      component: StepBasicInfo,
    },
    {
      number: 2,
      title: "Chi tiết",
      description: "Mô tả, hình ảnh, liên hệ",
      component: StepDetails,
    },
    {
      number: 3,
      title: "Xác nhận",
      description: "Xem trước và gửi",
      component: StepPreview,
    },
  ];

  const currentStepData = steps.find((s) => s.number === currentStep);
  const StepComponent = currentStepData?.component;

  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  const handleBack = () => {
    if (currentStep === 1) {
      navigate("/admin/places");
    } else {
      prevStep();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>

        <h1 className="text-3xl font-bold mb-2">
          {isEditMode ? "Chỉnh sửa địa điểm" : "Tạo địa điểm mới"}
        </h1>
        <p className="text-muted-foreground">
          {currentStepData?.description}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setCurrentStep(step.number)}
                  disabled={loading}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    step.number < currentStep
                      ? "bg-green-500 text-white"
                      : step.number === currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-200 text-gray-600"
                  } ${!loading && "hover:opacity-80 cursor-pointer"}`}
                >
                  {step.number < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.number
                  )}
                </button>
                <div className="text-center mt-2">
                  <div className="text-sm font-medium">{step.title}</div>
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 mx-4 bg-gray-200">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{
                      width:
                        step.number < currentStep
                          ? "100%"
                          : step.number === currentStep
                          ? "0%"
                          : "0%",
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card className="p-6 mb-6">
        {StepComponent && <StepComponent isEditMode={isEditMode} />}
      </Card>

      {/* Debug Info (Development only) */}
      {import.meta.env.DEV && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Debug: Wizard Data
          </summary>
          <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-64">
            {JSON.stringify(wizardData, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

export default PlaceWizardPage;
