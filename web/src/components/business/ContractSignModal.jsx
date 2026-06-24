import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  PenLine,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  MessageSquare,
  IdCard,
  CalendarClock,
  MapPin,
  Monitor,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const PAD_WIDTH = 720;
const PAD_HEIGHT = 220;
const STEP_KEYS = ["confirmInfo", "readContract", "signContract"];
const CHECKLIST_TOTAL = 2;

const PLATFORM_INFO = {
  name: "CÔNG TY ĐI ĐÂU GIỜ",
  representative: "Ông Nguyễn Minh Quân",
  position: "Tổng Giám Đốc",
  address:
    "Tầng 5, Tòa nhà Innovation, Khu Công nghệ cao, TP. Thủ Đức, TP. Hồ Chí Minh, Việt Nam.",
  phone: "1900 1234",
  email: "hotro@didaugio.vn",
  taxCode: "0312987654",
  bankAccount: "1903 6688 9999",
  accountName: "CONG TY DI DAU GIO",
  branch: "Sở Giao Dịch",
  bankName: "Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)",
  website: "https://didaugio.vn",
};

const BROWSER_MATCHERS = [
  [/Edg/, "Edge"],
  [/OPR|Opera/, "Opera"],
  [/Chrome/, "Chrome"],
  [/Firefox/, "Firefox"],
  [/Safari/, "Safari"],
];

const OS_MATCHERS = [
  [/Windows/, "Windows"],
  [/Android/, "Android"],
  [/iPhone|iPad|iOS/, "iOS"],
  [/Mac/, "macOS"],
  [/Linux/, "Linux"],
];

const matchLabel = (ua, matchers) => {
  const found = matchers.find(([pattern]) => pattern.test(ua));
  return found ? found[1] : "Unknown";
};

const detectDevice = () => {
  if (typeof navigator === "undefined") return "—";
  const ua = navigator.userAgent || "";
  return `${matchLabel(ua, BROWSER_MATCHERS)} / ${matchLabel(ua, OS_MATCHERS)}`;
};

const Stepper = ({ activeStep, completedSteps, labels }) => (
  <div className="flex items-center gap-1 overflow-x-auto pb-1">
    {STEP_KEYS.map((key, index) => {
      const stepNumber = index + 1;
      const isActive = activeStep === stepNumber;
      const isCompleted = completedSteps.includes(stepNumber);
      return (
        <div key={key} className="flex items-center gap-1 shrink-0">
          <div
            className={cn(
              "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              isActive && "bg-primary/10 text-primary",
              isCompleted && !isActive && "bg-emerald-50 text-emerald-600",
              !isActive && !isCompleted && "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white",
                isActive && "bg-primary",
                isCompleted && !isActive && "bg-emerald-500",
                !isActive && !isCompleted && "bg-muted-foreground/40",
              )}
            >
              {isCompleted && !isActive ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                stepNumber
              )}
            </span>
            <span className="whitespace-nowrap">{labels[index]}</span>
          </div>
          {index < STEP_KEYS.length - 1 && (
            <span
              className={cn(
                "h-px w-6 shrink-0",
                completedSteps.includes(stepNumber)
                  ? "bg-emerald-400"
                  : "bg-border",
              )}
            />
          )}
        </div>
      );
    })}
  </div>
);

const InfoRow = ({ label, value, fallback }) => (
  <div className="flex flex-col gap-0.5 py-1 sm:flex-row sm:items-baseline sm:gap-3">
    <span className="shrink-0 text-xs text-muted-foreground sm:w-32">
      {label}
    </span>
    <span className="text-sm font-medium text-foreground">
      {value || (
        <span className="italic text-xs text-muted-foreground/60">
          {fallback}
        </span>
      )}
    </span>
  </div>
);

const ContractSignModal = ({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  contractVersion,
  business,
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const [step, setStep] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);
  const [hasReadContract, setHasReadContract] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [partyBOpen, setPartyBOpen] = useState(true);
  const [confirmedAt, setConfirmedAt] = useState(null);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setHasStroke(false);
    setHasReadContract(false);
    setAcceptedTerms(false);
    setPartyBOpen(true);
    setConfirmedAt(new Date());
  }, [open]);

  const partyA = useMemo(
    () => ({
      fullName: business?.owner?.fullName || business?.businessName || "",
      idCard: business?.idCardNumberMasked || "",
      address: business?.owner?.address || "",
      phone: business?.owner?.phone || "",
      email: business?.owner?.email || "",
    }),
    [business],
  );

  const contractDate = useMemo(() => confirmedAt || new Date(), [confirmedAt]);
  const contractNumber = useMemo(
    () => (business?.id ? `HD-${business.id}` : "—"),
    [business?.id],
  );
  const device = useMemo(() => detectDevice(), []);
  const timezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "";
    }
  }, []);
  const legalBasis = t("business.contractWizard.contract.legalBasis", {
    returnObjects: true,
  });

  const prepareCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  useEffect(() => {
    if (step !== 3) return;
    const id = requestAnimationFrame(prepareCanvas);
    return () => cancelAnimationFrame(id);
  }, [step]);

  const pointFromEvent = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const drawStart = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const p = pointFromEvent(event);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    setIsDrawing(true);
    setHasStroke(true);
  };

  const drawMove = (event) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const p = pointFromEvent(event);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const drawEnd = () => setIsDrawing(false);

  const clearSignature = () => {
    prepareCanvas();
    setHasStroke(false);
  };

  const goToStep2 = () => setStep(2);

  const goToStep3 = () => {
    setHasReadContract(true);
    setStep(3);
  };

  const checklistDone =
    (hasReadContract ? 1 : 0) + (acceptedTerms ? 1 : 0);
  const checklistComplete = checklistDone === CHECKLIST_TOTAL;

  const handleConfirm = async () => {
    if (!checklistComplete) {
      toast.error(t("business.common.acceptTermsBeforeSign"));
      return;
    }
    if (!hasStroke) {
      toast.error(t("business.common.signHereRequired"));
      return;
    }

    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL("image/png");

    try {
      await onSubmit?.({
        acceptedTerms: true,
        signatureData,
        signedAt: new Date().toISOString(),
        contractVersion,
        signerMetadata: {
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : "",
          timezone,
        },
      });
      onOpenChange?.(false);
    } catch {
      // caller handles API errors
    }
  };

  const stepLabels = STEP_KEYS.map((key) =>
    t(`business.contractWizard.steps.${key}`),
  );
  const completedSteps = [];
  if (step > 1) completedSteps.push(1);
  if (step > 2) completedSteps.push(2);

  const partyBRows = [
    ["representative", PLATFORM_INFO.representative],
    ["position", PLATFORM_INFO.position],
    ["address", PLATFORM_INFO.address],
    ["phone", PLATFORM_INFO.phone],
    ["email", PLATFORM_INFO.email],
    ["taxCode", PLATFORM_INFO.taxCode],
    ["bankAccount", PLATFORM_INFO.bankAccount],
    ["accountName", PLATFORM_INFO.accountName],
    ["branch", PLATFORM_INFO.branch],
    ["bankName", PLATFORM_INFO.bankName],
  ];

  const signerRows = [
    {
      icon: IdCard,
      label: t("business.contractWizard.signer.name"),
      value: partyA.fullName || "—",
    },
    {
      icon: CalendarClock,
      label: t("business.contractWizard.signer.confirmedAt"),
      value: contractDate.toLocaleString("vi-VN"),
    },
    {
      icon: MapPin,
      label: t("business.contractWizard.signer.ip"),
      value: t("business.contractWizard.signer.ipResolving"),
    },
    {
      icon: Monitor,
      label: t("business.contractWizard.signer.device"),
      value: device,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border/70 bg-muted/30 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <PenLine className="h-4 w-4 text-primary" />
            </span>
            {t("business.contractWizard.headerTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="border-b border-border/60 px-5 py-3">
          <Stepper
            activeStep={step}
            completedSteps={completedSteps}
            labels={stepLabels}
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 p-4">
                <h3 className="text-sm font-semibold text-foreground">
                  {t("business.contractWizard.partyA.title")}
                  {partyA.fullName ? `: ${partyA.fullName}` : ""}
                </h3>
                <div className="mt-3 space-y-0.5">
                  <InfoRow
                    label={t("business.contractWizard.partyA.fullName")}
                    value={partyA.fullName}
                    fallback={t("business.profile.notUpdated")}
                  />
                  <InfoRow
                    label={t("business.contractWizard.partyA.idCard")}
                    value={partyA.idCard}
                    fallback={t("business.profile.notUpdated")}
                  />
                  <InfoRow
                    label={t("business.contractWizard.partyA.address")}
                    value={partyA.address}
                    fallback={t("business.profile.notUpdated")}
                  />
                  <InfoRow
                    label={t("business.contractWizard.partyA.phone")}
                    value={partyA.phone}
                    fallback={t("business.profile.notUpdated")}
                  />
                  <InfoRow
                    label={t("business.contractWizard.partyA.email")}
                    value={partyA.email}
                    fallback={t("business.profile.notUpdated")}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border/70">
                <button
                  type="button"
                  onClick={() => setPartyBOpen((prev) => !prev)}
                  aria-expanded={partyBOpen}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                >
                  <h3 className="text-sm font-semibold text-foreground">
                    {t("business.contractWizard.partyB.title")}:{" "}
                    <span className="text-primary">{PLATFORM_INFO.name}</span>
                  </h3>
                  {partyBOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {partyBOpen && (
                  <div className="space-y-0.5 border-t border-border/60 px-4 py-3">
                    {partyBRows.map(([key, value]) => (
                      <InfoRow
                        key={key}
                        label={t(`business.contractWizard.partyB.${key}`)}
                        value={value}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="rounded-2xl border-t-4 border-t-primary border border-border/70 bg-white px-6 py-6 text-slate-800">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-lg font-bold text-primary">
                    {PLATFORM_INFO.name}
                  </p>
                  <p className="max-w-xs text-xs leading-relaxed text-slate-600">
                    {PLATFORM_INFO.address}
                  </p>
                  <p className="text-xs text-slate-600">
                    Tel.: {PLATFORM_INFO.phone}
                  </p>
                  <p className="text-xs text-slate-600">
                    Web: {PLATFORM_INFO.website}
                  </p>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-sm font-bold uppercase">
                    {t("business.contractWizard.contract.republicTitle")}
                  </p>
                  <p className="text-sm font-semibold italic">
                    {t("business.contractWizard.contract.republicMotto")}
                  </p>
                  <p className="text-sm">---o0o---</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {t("business.contractWizard.contract.contractNumberLabel")}:{" "}
                  <span className="font-semibold">{contractNumber}</span>
                </span>
                <span className="text-slate-600">
                  {t("business.contractWizard.contract.dateLabel", {
                    day: contractDate.getDate(),
                    month: contractDate.getMonth() + 1,
                    year: contractDate.getFullYear(),
                  })}
                </span>
              </div>

              <h2 className="mt-6 text-center text-lg font-bold uppercase">
                {t("business.contractWizard.contract.contractTitle")}
              </h2>

              <ul className="mt-4 space-y-2 text-sm italic text-slate-700">
                {Array.isArray(legalBasis) &&
                  legalBasis.map((line) => (
                    <li key={line}>- {line}</li>
                  ))}
              </ul>

              <p className="mt-4 text-sm">
                {t("business.contractWizard.contract.partiesIntro")}
              </p>

              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="text-sm font-semibold">
                  {t("business.contractWizard.partyA.title")}
                  {partyA.fullName ? `: ${partyA.fullName}` : ""}
                </p>
                <div className="mt-2 space-y-0.5">
                  <InfoRow
                    label={t("business.contractWizard.partyA.fullName")}
                    value={partyA.fullName}
                    fallback={t("business.profile.notUpdated")}
                  />
                  <InfoRow
                    label={t("business.contractWizard.partyA.idCard")}
                    value={partyA.idCard}
                    fallback={t("business.profile.notUpdated")}
                  />
                  <InfoRow
                    label={t("business.contractWizard.partyA.address")}
                    value={partyA.address}
                    fallback={t("business.profile.notUpdated")}
                  />
                </div>
              </div>

              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="text-sm font-semibold">
                  {t("business.contractWizard.partyB.title")}:{" "}
                  {PLATFORM_INFO.name}
                </p>
                <div className="mt-2 space-y-0.5">
                  <InfoRow
                    label={t("business.contractWizard.partyB.representative")}
                    value={PLATFORM_INFO.representative}
                  />
                  <InfoRow
                    label={t("business.contractWizard.partyB.taxCode")}
                    value={PLATFORM_INFO.taxCode}
                  />
                  <InfoRow
                    label={t("business.contractWizard.partyB.address")}
                    value={PLATFORM_INFO.address}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("business.contractWizard.checklist.title")}
                  </p>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      checklistComplete
                        ? "text-emerald-600"
                        : "text-muted-foreground",
                    )}
                  >
                    {t("business.contractWizard.checklist.completed", {
                      done: checklistDone,
                      total: CHECKLIST_TOTAL,
                    })}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    {
                      done: hasReadContract,
                      label: t(
                        "business.contractWizard.checklist.readContract",
                      ),
                    },
                    {
                      done: acceptedTerms,
                      label: t(
                        "business.contractWizard.checklist.acceptTerms",
                      ),
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded",
                          item.done
                            ? "bg-emerald-500 text-white"
                            : "border border-border bg-muted",
                        )}
                      >
                        {item.done && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span
                        className={cn(
                          "text-sm",
                          item.done
                            ? "text-muted-foreground line-through"
                            : "text-foreground",
                        )}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 p-4">
                <div className="space-y-2">
                  {signerRows.map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground">{label}:</span>
                      <span className="font-medium text-foreground">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  {t("business.contractWizard.signer.note")}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 p-3">
                <canvas
                  ref={canvasRef}
                  width={PAD_WIDTH}
                  height={PAD_HEIGHT}
                  className="h-44 w-full touch-none rounded-xl border border-dashed border-border/80 bg-slate-50"
                  onPointerDown={drawStart}
                  onPointerMove={drawMove}
                  onPointerUp={drawEnd}
                  onPointerLeave={drawEnd}
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {t("business.common.signWithMouse")}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={clearSignature}
                    className="gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {t("business.common.clearSignature")}
                  </Button>
                </div>
              </div>

              <label className="flex items-start gap-2 text-sm text-foreground">
                <Checkbox
                  checked={acceptedTerms}
                  onCheckedChange={(checked) =>
                    setAcceptedTerms(Boolean(checked))
                  }
                />
                <span>{t("business.contractWizard.consentLabel")}</span>
              </label>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-muted/20 px-5 py-3">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={() => setStep((prev) => prev - 1)}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("business.contractWizard.back")}
            </Button>
          ) : (
            <span />
          )}

          {step === 1 && (
            <Button onClick={goToStep2} className="gap-1.5">
              {t("business.contractWizard.continue")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {step === 2 && (
            <Button onClick={goToStep3} className="gap-1.5">
              {t("business.contractWizard.continue")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {step === 3 && (
            <Button
              onClick={handleConfirm}
              loading={loading}
              disabled={!checklistComplete}
              className="gap-1.5"
            >
              <PenLine className="h-4 w-4" />
              {t("business.contractWizard.signNow")}
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-border/60 px-5 py-2.5 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => onOpenChange?.(false)}
            className="flex items-center gap-1.5 hover:text-foreground"
          >
            <Clock className="h-3.5 w-3.5" />
            {t("business.contractWizard.deferLater")}
          </button>
          <span className="text-muted-foreground/40">·</span>
          <span className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            {t("business.contractWizard.termsIssue")}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContractSignModal;
