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
  Smartphone,
  Send,
  ShieldCheck,
  CheckCircle2,
  Download,
  Mail,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import * as businessApi from "@/apis/businessApi";

const PAD_WIDTH = 720;
const PAD_HEIGHT = 220;
const STEP_KEYS = ["confirmInfo", "readContract", "signContract"];
const CHECKLIST_TOTAL = 2;

const PLATFORM_INFO = {
  name: "Trường Đại Học Tây Đô",
  representative: "Ông Nguyễn Hồng Phú",
  position: "Người Vận hành",
  address:
    "Số 68, đường Trần Chiên, Lê Bình, Cái Răng, Cần Thơ.",
  phone: "1900 1234",
  email: "hotro@didaugio.vn",
  taxCode: "0312987654",
  bankAccount: "1903 6688 9999",
  accountName: "Truong Dai Hoc Tay Do",
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

const generateElectronicSignature = (fullName, phone, dateStr) => {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 150;
  const ctx = canvas.getContext("2d");

  // Vẽ viền nét đứt màu xanh dương của chữ ký điện tử
  ctx.strokeStyle = "#2563eb"; // màu blue-600
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(10, 10, 380, 130);

  // Vẽ nền nhạt
  ctx.fillStyle = "rgba(37, 99, 235, 0.03)";
  ctx.fillRect(11, 11, 378, 128);

  // Vẽ chữ "ĐÃ KÝ ĐIỆN TỬ"
  ctx.setLineDash([]);
  ctx.fillStyle = "#2563eb";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CHỮ KÝ ĐIỆN TỬ (DIGITAL SIGNATURE)", 200, 38);

  // Vẽ tên người ký
  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText(fullName, 200, 72);

  // Vẽ OTP và Email
  ctx.fillStyle = "#64748b";
  ctx.font = "11px sans-serif";
  ctx.fillText("Xác thực ký kết bằng OTP gửi qua Email", 200, 102);

  // Vẽ ngày ký
  ctx.fillText(`Thời gian xác nhận ký: ${dateStr}`, 200, 122);

  return canvas.toDataURL("image/png");
};

const ContractSignModal = ({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  contractVersion,
  business,
  decryptedData,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [hasReadContract, setHasReadContract] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [partyBOpen, setPartyBOpen] = useState(false); // Default collapse for clean look
  const [confirmedAt, setConfirmedAt] = useState(null);

  // Form states cho Bên A
  const [partyAData, setPartyAData] = useState({
    fullName: "",
    idCard: "",
    idCardIssuedDate: "",
    idCardIssuedPlace: "",
    address: "",
    phone: "",
    email: "",
  });

  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [timer, setTimer] = useState(0);

  // Chạy đếm ngược timer
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const sendOtp = async () => {
    try {
      const email = business?.owner?.email || "email";
      toast.loading(`Đang gửi mã OTP đến email ${email}...`, { id: "send-otp" });
      await businessApi.sendContractOtp();
      setOtpSent(true);
      setTimer(60);
      toast.success(`Mã OTP đã được gửi đến email ${email} thành công!`, { id: "send-otp" });
    } catch (err) {
      toast.error(err?.message || "Không thể gửi OTP qua email", { id: "send-otp" });
    }
  };

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setHasReadContract(false);
    setAcceptedTerms(false);
    setPartyBOpen(false);
    setConfirmedAt(new Date());
    setOtpSent(false);
    setEnteredOtp("");
    setTimer(0);

    if (business) {
      setPartyAData({
        fullName: decryptedData?.fullName || business.owner?.fullName || business.businessName || "",
        idCard: decryptedData?.idCardNumber || "",
        idCardIssuedDate: business.idCardIssuedDate || "",
        idCardIssuedPlace: business.idCardIssuedPlace || "",
        address: decryptedData?.address || business.owner?.address || business.address || "",
        phone: decryptedData?.phone || business.owner?.phone || "",
        email: decryptedData?.email || business.owner?.email || "",
      });
    }
  }, [open, business, decryptedData]);

  const partyA = useMemo(
    () => ({
      fullName: partyAData.fullName,
      idCard: partyAData.idCard,
      address: partyAData.address,
      phone: partyAData.phone,
      email: partyAData.email,
    }),
    [partyAData],
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

  const goToStep2 = () => {
    if (!partyAData.fullName?.trim()) {
      toast.error("Họ và tên không được để trống");
      return;
    }
    if (!partyAData.idCard?.trim()) {
      toast.error("Số CCCD không được để trống");
      return;
    }
    if (!partyAData.idCardIssuedDate?.trim()) {
      toast.error("Ngày cấp không được để trống");
      return;
    }
    if (!partyAData.idCardIssuedPlace?.trim()) {
      toast.error("Nơi cấp không được để trống");
      return;
    }
    if (!partyAData.address?.trim()) {
      toast.error("Địa chỉ không được để trống");
      return;
    }
    if (!partyAData.phone?.trim()) {
      toast.error("Số điện thoại không được để trống");
      return;
    }
    setStep(2);
  };

  const goToStep3 = () => {
    setHasReadContract(true);
    setStep(3);
  };

  const handlePrintDraft = () => {
    const printWindow = window.open("", "_blank", "width=900,height=750");
    if (!printWindow) {
      toast.error("Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép popup cho trang này.");
      return;
    }

    const day = contractDate.getDate();
    const month = contractDate.getMonth() + 1;
    const year = contractDate.getFullYear();

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Bản nháp hợp đồng dịch vụ - iPoint Genie</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #1e293b; background: #fff; padding: 2cm; line-height: 1.6; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; margin-bottom: 16px; }
    .header-left { max-width: 55%; }
    .header-right { text-align: right; }
    .org-name { font-size: 13pt; font-weight: 900; text-transform: uppercase; color: #2563eb; letter-spacing: -0.5px; }
    .org-address { font-size: 9pt; color: #64748b; margin-top: 4px; line-height: 1.5; }
    .republic-title { font-size: 10pt; font-weight: 700; text-transform: uppercase; color: #1e293b; }
    .republic-motto { font-size: 9.5pt; font-weight: 600; font-style: italic; color: #475569; }
    .republic-divider { font-size: 9pt; color: #94a3b8; }
    .meta-row { display: flex; justify-content: space-between; font-size: 10pt; color: #475569; margin-bottom: 16px; }
    .meta-row span b { color: #1e293b; }
    h2.contract-title { text-align: center; font-size: 13pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #1e293b; margin: 16px 0 12px; }
    .legal-basis { font-size: 9.5pt; color: #64748b; font-style: italic; margin-bottom: 12px; }
    .legal-basis li { margin-bottom: 2px; list-style: none; }
    .parties-intro { font-size: 10.5pt; color: #334155; margin-bottom: 12px; }
    .party-section { border-top: 1px solid #e2e8f0; margin-top: 14px; padding-top: 10px; }
    .party-title { font-size: 10pt; font-weight: 700; text-transform: uppercase; color: #1e293b; margin-bottom: 8px; }
    .party-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; font-size: 10pt; color: #334155; }
    .party-grid p { margin: 1px 0; }
    .party-grid .full-width { grid-column: 1 / -1; }
    .party-grid b { color: #0f172a; }
    .clauses { border-top: 1px solid #e2e8f0; margin-top: 18px; padding-top: 16px; }
    .clause { margin-bottom: 16px; }
    .clause-title { font-size: 10.5pt; font-weight: 700; text-transform: uppercase; color: #0f172a; margin-bottom: 6px; }
    .clause p { font-size: 10pt; color: #334155; margin: 4px 0; line-height: 1.7; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10pt; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
    th { background: #f8fafc; font-weight: 700; color: #1e293b; }
    .watermark { text-align: center; font-size: 9pt; color: #94a3b8; margin-top: 30px; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-style: italic; }
    @media print { body { padding: 1.5cm; } .watermark { page-break-before: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <p class="org-name">${PLATFORM_INFO.name}</p>
      <p class="org-address">${PLATFORM_INFO.address}</p>
      <p class="org-address">Tel: ${PLATFORM_INFO.phone} | Web: ${PLATFORM_INFO.website}</p>
    </div>
    <div class="header-right">
      <p class="republic-title">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
      <p class="republic-motto">Độc Lập - Tự Do - Hạnh Phúc</p>
      <p class="republic-divider">---o0o---</p>
    </div>
  </div>

  <div class="meta-row">
    <span>Hợp đồng số: <b>${contractNumber}</b></span>
    <span>Ngày ${day} tháng ${month} năm ${year}</span>
  </div>

  <h2 class="contract-title">HỢP ĐỒNG DỊCH VỤ</h2>

  <ul class="legal-basis">
    <li>- Căn cứ Luật Thương mại nước CHXHCN Việt Nam năm 2005;</li>
    <li>- Căn cứ Bộ Luật dân sự số 91/2015/QH13 ngày 24/11/2015;</li>
    <li>- Căn cứ nhu cầu và khả năng thực tế của các bên trong hợp đồng;</li>
    <li>- Căn cứ Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 ngày 26/6/2025, có hiệu lực từ ngày 01/01/2026;</li>
  </ul>

  <p class="parties-intro">Chúng tôi gồm:</p>

  <div class="party-section">
    <p class="party-title">Bên sử dụng dịch vụ (Bên A) &mdash; BÊN SỬ DỤNG DỊCH VỤ</p>
    <div class="party-grid">
      <p>Họ và tên: <b>${partyAData.fullName || "—"}</b></p>
      <p>Số CCCD: <b>${partyAData.idCard || "—"}</b></p>
      <p>Ngày cấp: <b>${partyAData.idCardIssuedDate || "—"}</b></p>
      <p>Nơi cấp: <b>${partyAData.idCardIssuedPlace || "—"}</b></p>
      <p class="full-width">Địa chỉ: <b>${partyAData.address || "—"}</b></p>
      <p>Điện thoại: <b>${partyAData.phone || "—"}</b></p>
      <p>Email: <b>${partyAData.email || "—"}</b></p>
    </div>
  </div>

  <div class="party-section">
    <p class="party-title">Bên cung cấp dịch vụ (Bên B) &mdash; BÊN CUNG CẤP DỊCH VỤ</p>
    <div class="party-grid">
      <p>Tên tổ chức: <b>${PLATFORM_INFO.name}</b></p>
      <p>Người đại diện: <b>${PLATFORM_INFO.representative}</b></p>
      <p>Chức vụ: <b>${PLATFORM_INFO.position}</b></p>
      <p class="full-width">Địa chỉ: <b>${PLATFORM_INFO.address}</b></p>
      <p>Điện thoại: <b>${PLATFORM_INFO.phone}</b></p>
      <p>Email: <b>${PLATFORM_INFO.email}</b></p>
      <p>Mã số thuế: <b>${PLATFORM_INFO.taxCode}</b></p>
      <p class="full-width">Số tài khoản: <b>${PLATFORM_INFO.bankAccount}</b> (${PLATFORM_INFO.bankName})</p>
    </div>
  </div>

  <div class="clauses">
    <div class="clause">
      <p class="clause-title">ĐIỀU 1: NỘI DUNG CUNG CẤP DỊCH VỤ</p>
      <p>Bên A đồng ý sử dụng Nền tảng Du lịch thông minh iPoint Genie của Bên B để quảng bá địa điểm, dịch vụ du lịch tại Cần Thơ với các tính năng:</p>
      <table>
        <thead><tr><th>Mục tiêu cung cấp</th><th>Chi tiết dịch vụ</th></tr></thead>
        <tbody>
          <tr><td>1. Địa điểm hiển thị</td><td>Quảng bá thông tin chi tiết, hình ảnh trên Nền tảng web/app</td></tr>
          <tr><td>2. Công cụ quản lý</td><td>Trang quản trị (Business Portal) theo dõi doanh thu, đặt chỗ, voucher</td></tr>
          <tr><td>3. Tích hợp AI</td><td>Hệ thống AI tự động gợi ý lịch trình có chứa địa điểm của Bên A</td></tr>
        </tbody>
      </table>
    </div>
    <div class="clause">
      <p class="clause-title">ĐIỀU 2: CHI PHÍ VÀ PHƯƠNG THỨC THANH TOÁN</p>
      <p>- Phí đăng ký gian hàng và quảng bá ban đầu: <b>Miễn phí</b>.</p>
      <p>- Tỷ lệ hoa hồng dịch vụ đặt chỗ thành công (Commission Rate): <b>10%</b> trên giá trị mỗi đơn đặt phòng/dịch vụ hoàn tất.</p>
      <p>- Đối soát và chi trả doanh thu: Bên B sẽ tự động đối soát doanh thu đặt dịch vụ vào ngày cuối cùng của tháng và chuyển khoản doanh thu (sau khi trừ phí hoa hồng) cho Bên A trước ngày 05 của tháng kế tiếp.</p>
    </div>
    <div class="clause">
      <p class="clause-title">ĐIỀU 3: TRÁCH NHIỆM CỦA BÊN A</p>
      <p>3.1 Cung cấp đầy đủ giấy tờ pháp lý chính xác (CCCD, Giấy phép kinh doanh, Chứng nhận chuyên môn) khi đăng ký và đảm bảo tính pháp lý của dịch vụ cung cấp.</p>
      <p>3.2 Đảm bảo thông tin về giá cả, hình ảnh, tình trạng phòng/dịch vụ trên Nền tảng là chính xác và khớp với thực tế.</p>
    </div>
  </div>

  <p class="watermark">-- Đây là bản nháp hợp đồng, chưa có giá trị pháp lý khi chưa ký kết --</p>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 400);
  };

  const checklistDone =
    (hasReadContract ? 1 : 0) + (acceptedTerms ? 1 : 0);
  const checklistComplete = checklistDone === CHECKLIST_TOTAL;

  const handleConfirm = async () => {
    if (!checklistComplete) {
      toast.error(t("business.common.acceptTermsBeforeSign"));
      return;
    }
    if (!otpSent) {
      toast.error("Vui lòng gửi và xác thực mã OTP trước khi ký");
      return;
    }
    if (enteredOtp.length !== 6) {
      toast.error("Mã OTP phải có đúng 6 chữ số");
      return;
    }

    const dateStr = contractDate.toLocaleString("vi-VN");
    const signatureData = generateElectronicSignature(partyAData.fullName, partyAData.phone, dateStr);

    try {
      await onSubmit?.({
        otp: enteredOtp,
        acceptedTerms: true,
        signatureData,
        signedAt: new Date().toISOString(),
        contractVersion,
        fullName: partyAData.fullName,
        phone: partyAData.phone,
        address: partyAData.address,
        idCard: partyAData.idCard,
        idCardIssuedDate: partyAData.idCardIssuedDate,
        idCardIssuedPlace: partyAData.idCardIssuedPlace,
        signerMetadata: {
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : "",
          timezone,
          otpVerified: true,
          phoneVerified: partyAData.phone,
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
              <div className="rounded-2xl border border-border/70 p-5 bg-card">
                <h3 className="text-sm font-bold text-foreground border-b pb-2 mb-4">
                  {t("business.contractWizard.partyA.title")} (Xác nhận/Chỉnh sửa thông tin)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <Label htmlFor="partyA-fullName" className="text-xs font-semibold text-slate-700">Họ và tên *</Label>
                    <Input
                      id="partyA-fullName"
                      value={partyAData.fullName}
                      onChange={(e) => setPartyAData({ ...partyAData, fullName: e.target.value })}
                      placeholder="Nguyễn Văn A"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="partyA-idCard" className="text-xs font-semibold text-slate-700">Số CCCD *</Label>
                    <Input
                      id="partyA-idCard"
                      value={partyAData.idCard}
                      onChange={(e) => setPartyAData({ ...partyAData, idCard: e.target.value })}
                      placeholder="086xxxxxxxx"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="partyA-issuedDate" className="text-xs font-semibold text-slate-700">Ngày cấp *</Label>
                    <Input
                      id="partyA-issuedDate"
                      value={partyAData.idCardIssuedDate}
                      onChange={(e) => setPartyAData({ ...partyAData, idCardIssuedDate: e.target.value })}
                      placeholder="DD/MM/YYYY"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="partyA-issuedPlace" className="text-xs font-semibold text-slate-700">Nơi cấp *</Label>
                    <Input
                      id="partyA-issuedPlace"
                      value={partyAData.idCardIssuedPlace}
                      onChange={(e) => setPartyAData({ ...partyAData, idCardIssuedPlace: e.target.value })}
                      placeholder="Cục Cảnh sát QLHC về TTXH"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="partyA-address" className="text-xs font-semibold text-slate-700">Địa chỉ *</Label>
                    <Input
                      id="partyA-address"
                      value={partyAData.address}
                      onChange={(e) => setPartyAData({ ...partyAData, address: e.target.value })}
                      placeholder="Số nhà, đường, phường, quận, tỉnh..."
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="partyA-phone" className="text-xs font-semibold text-slate-700">Điện thoại *</Label>
                    <Input
                      id="partyA-phone"
                      value={partyAData.phone}
                      onChange={(e) => setPartyAData({ ...partyAData, phone: e.target.value })}
                      placeholder="081xxxxxxx"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="partyA-email" className="text-xs font-semibold text-slate-700">Email</Label>
                    <Input
                      id="partyA-email"
                      value={partyAData.email}
                      readOnly
                      disabled
                      className="h-9 text-xs bg-slate-50 dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-white">
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 leading-normal max-w-[70%]">
                  Vui lòng đọc kỹ nội dung hợp đồng dịch vụ dưới đây trước khi tiến hành xác nhận OTP để ký kết.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs shrink-0 bg-white hover:bg-slate-50"
                  onClick={handlePrintDraft}
                >
                  <Download className="h-3.5 w-3.5" />
                  In / Tải nháp
                </Button>
              </div>

              <div id="contract-preview-content" className="rounded-2xl border-t-4 border-t-blue-600 border border-border/70 bg-white px-6 py-6 text-slate-800 dark:text-slate-900 max-h-[50vh] overflow-y-auto shadow-inner">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b pb-4">
                  <div className="space-y-1">
                    <p className="text-base font-black uppercase text-blue-600 tracking-tight">
                      {PLATFORM_INFO.name}
                    </p>
                    <p className="max-w-xs text-[10px] leading-relaxed text-slate-500">
                      {PLATFORM_INFO.address}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Tel: {PLATFORM_INFO.phone} | Web: {PLATFORM_INFO.website}
                    </p>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-xs font-bold uppercase tracking-tight text-slate-800">
                      {t("business.contractWizard.contract.republicTitle")}
                    </p>
                    <p className="text-[11px] font-semibold italic text-slate-600">
                      {t("business.contractWizard.contract.republicMotto")}
                    </p>
                    <p className="text-[10px] text-slate-400">---o0o---</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between text-slate-600">
                  <span>
                    {t("business.contractWizard.contract.contractNumberLabel")}:{" "}
                    <span className="font-bold text-slate-800">{contractNumber}</span>
                  </span>
                  <span>
                    {t("business.contractWizard.contract.dateLabel", {
                      day: contractDate.getDate(),
                      month: contractDate.getMonth() + 1,
                      year: contractDate.getFullYear(),
                    })}
                  </span>
                </div>

                <h2 className="mt-5 text-center text-sm font-black uppercase tracking-wide text-slate-800">
                  {t("business.contractWizard.contract.contractTitle")}
                </h2>

                <ul className="mt-3 space-y-1 text-[11px] italic text-slate-500">
                  {Array.isArray(legalBasis) &&
                    legalBasis.map((line) => (
                      <li key={line}>- {line}</li>
                    ))}
                  <li>- Căn cứ Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 ngày 26/6/2025, có hiệu lực từ ngày 01/01/2026;</li>
                </ul>

                <p className="mt-3 text-xs text-slate-700">
                  {t("business.contractWizard.contract.partiesIntro")}
                </p>

                <div className="mt-4 border-t border-slate-200 pt-3">
                  <p className="text-xs font-bold text-slate-800 uppercase">
                    {t("business.contractWizard.partyA.title")} (BÊN SỬ DỤNG DỊCH VỤ)
                  </p>
                  <div className="mt-2 text-[11px] text-slate-700 leading-relaxed grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                    <p>Họ và tên: <strong className="text-slate-900">{partyAData.fullName}</strong></p>
                    <p>Số CCCD: <strong className="text-slate-900">{partyAData.idCard}</strong></p>
                    <p>Ngày cấp: <strong className="text-slate-900">{partyAData.idCardIssuedDate}</strong></p>
                    <p>Nơi cấp: <strong className="text-slate-900">{partyAData.idCardIssuedPlace}</strong></p>
                    <p className="md:col-span-2">Địa chỉ: <strong className="text-slate-900">{partyAData.address}</strong></p>
                    <p>Điện thoại: <strong className="text-slate-900">{partyAData.phone}</strong></p>
                    <p>Email: <strong className="text-slate-900">{partyAData.email}</strong></p>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-200 pt-3">
                  <p className="text-xs font-bold text-slate-800 uppercase">
                    {t("business.contractWizard.partyB.title")} (BÊN CUNG CẤP DỊCH VỤ)
                  </p>
                  <div className="mt-2 text-[11px] text-slate-700 leading-relaxed grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                    <p>Tên tổ chức: <strong className="text-slate-900">{PLATFORM_INFO.name}</strong></p>
                    <p>Người đại diện: <strong className="text-slate-900">{PLATFORM_INFO.representative}</strong></p>
                    <p>Chức vụ: <strong className="text-slate-900">{PLATFORM_INFO.position}</strong></p>
                    <p className="md:col-span-2">Địa chỉ: <strong className="text-slate-900">{PLATFORM_INFO.address}</strong></p>
                    <p>Điện thoại: <strong className="text-slate-900">{PLATFORM_INFO.phone}</strong></p>
                    <p>Email: <strong className="text-slate-900">{PLATFORM_INFO.email}</strong></p>
                    <p>Mã số thuế: <strong className="text-slate-900">{PLATFORM_INFO.taxCode}</strong></p>
                    <p>Số tài khoản: <strong className="text-slate-900">{PLATFORM_INFO.bankAccount}</strong> ({PLATFORM_INFO.bankName})</p>
                  </div>
                </div>

                {/* Các điều khoản mẫu SePay */}
                <div className="mt-5 border-t border-slate-200 pt-4 space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-tight">ĐIỀU 1: NỘI DUNG CUNG CẤP DỊCH VỤ</h3>
                    <p className="text-[11px] mt-1 text-slate-600 leading-relaxed">
                      Bên A đồng ý sử dụng Nền tảng Du lịch thông minh iPoint Genie của Bên B để quảng bá địa điểm, dịch vụ du lịch tại Cần Thơ với các tính năng:
                    </p>
                    <table className="min-w-full border mt-2 text-[11px] text-slate-700">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="border px-2.5 py-1 text-left font-bold text-slate-800">Mục tiêu cung cấp</th>
                          <th className="border px-2.5 py-1 text-left font-bold text-slate-800">Chi tiết dịch vụ</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border px-2.5 py-1 font-semibold">1. Địa điểm hiển thị</td>
                          <td className="border px-2.5 py-1">Quảng bá thông tin chi tiết, hình ảnh trên Nền tảng web/app</td>
                        </tr>
                        <tr>
                          <td className="border px-2.5 py-1 font-semibold">2. Công cụ quản lý</td>
                          <td className="border px-2.5 py-1">Trang quản trị (Business Portal) theo dõi doanh thu, đặt chỗ, voucher</td>
                        </tr>
                        <tr>
                          <td className="border px-2.5 py-1 font-semibold">3. Tích hợp AI</td>
                          <td className="border px-2.5 py-1">Hệ thống AI tự động gợi ý lịch trình có chứa địa điểm của Bên A</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-tight">ĐIỀU 2: CHI PHÍ VÀ PHƯƠNG THỨC THANH TOÁN</h3>
                    <p className="text-[11px] mt-1 text-slate-600 leading-relaxed">
                      - Phí đăng ký gian hàng và quảng bá ban đầu: <strong>Miễn phí</strong>.
                    </p>
                    <p className="text-[11px] mt-1 text-slate-600 leading-relaxed">
                      - Tỷ lệ hoa hồng dịch vụ đặt chỗ thành công (Commission Rate): <strong>10%</strong> trên giá trị mỗi đơn đặt phòng/dịch vụ hoàn tất.
                    </p>
                    <p className="text-[11px] mt-1 text-slate-600 leading-relaxed">
                      - Đối soát và chi trả doanh thu: Bên B sẽ tự động đối soát doanh thu đặt dịch vụ vào ngày cuối cùng của tháng và chuyển khoản doanh thu (sau khi trừ phí hoa hồng) cho Bên A trước ngày 05 của tháng kế tiếp.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-tight">ĐIỀU 3: TRÁCH NHIỆM CỦA BÊN A</h3>
                    <p className="text-[11px] mt-1 text-slate-600 leading-relaxed">
                      3.1 Cung cấp đầy đủ giấy tờ pháp lý chính xác (CCCD, Giấy phép kinh doanh, Chứng nhận chuyên môn) khi đăng ký và đảm bảo tính pháp lý của dịch vụ cung cấp.
                    </p>
                    <p className="text-[11px] mt-1 text-slate-600 leading-relaxed">
                      3.2 Đảm bảo thông tin về giá cả, hình ảnh, tình trạng phòng/dịch vụ trên Nền tảng là chính xác và khớp với thực tế.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {/* Checklist hoàn tất */}
              <div className="rounded-2xl border border-border/70 p-4 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Cần hoàn tất trước khi ký
                  </p>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      checklistComplete
                        ? "text-emerald-600"
                        : "text-muted-foreground",
                    )}
                  >
                    {checklistDone} / {CHECKLIST_TOTAL} hoàn tất
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs text-muted-foreground line-through">
                      Đã đọc hợp đồng
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded",
                        acceptedTerms
                          ? "bg-emerald-500 text-white"
                          : "border border-border bg-muted",
                      )}
                    >
                      {acceptedTerms && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span
                      className={cn(
                        "text-xs",
                        acceptedTerms
                          ? "text-muted-foreground line-through"
                          : "text-foreground font-medium",
                      )}
                    >
                      Đã tích xác nhận đồng ý điều khoản
                    </span>
                  </div>
                </div>
              </div>

              {/* Thông tin xác thực điện tử */}
              <div className="rounded-2xl border border-border/70 p-4 space-y-2.5 bg-white">
                {signerRows.map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2.5 text-xs"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">{label}:</span>
                    <span className="font-bold text-slate-800">
                      {value}
                    </span>
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground border-t pt-2 leading-relaxed">
                  Mã OTP có hiệu lực trong 5 phút. Tuyệt đối không chia sẻ OTP với bất kỳ ai để đảm bảo an toàn pháp lý.
                </p>
              </div>

              {/* Khối OTP Ký điện tử */}
              <div className="rounded-2xl border border-border/70 p-4 space-y-4 bg-white">
                {!otpSent ? (
                  <div className="space-y-3">
                    <Button
                      type="button"
                      onClick={sendOtp}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-5.5 flex flex-col items-center justify-center gap-0.5 rounded-xl transition shadow-md"
                    >
                      <span className="flex items-center gap-1.5 text-sm">
                        <Mail className="w-4 h-4" /> Xác nhận bằng OTP qua Email
                      </span>
                      <span className="text-[10px] font-normal text-blue-100">Miễn phí, gửi mã xác thực về email của bạn</span>
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between border border-dashed rounded-xl px-3 py-2 bg-slate-50 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Smartphone className="w-3.5 h-3.5" /> Zalo OTP
                        </span>
                        <span className="text-[8px] uppercase bg-slate-200 px-1.5 py-0.5 font-bold tracking-wider rounded">Không khả dụng</span>
                      </div>
                      <div className="flex items-center justify-between border border-dashed rounded-xl px-3 py-2 bg-slate-50 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" /> SMS OTP
                        </span>
                        <span className="text-[8px] uppercase bg-slate-200 px-1.5 py-0.5 font-bold tracking-wider rounded">Không khả dụng</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="otp-input" className="text-xs font-bold text-slate-700">Mã OTP xác thực ký điện tử</Label>
                      <div className="flex gap-2">
                        <Input
                          id="otp-input"
                          type="text"
                          maxLength={6}
                          value={enteredOtp}
                          onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ""))}
                          placeholder="Nhập 6 chữ số OTP"
                          className="h-10 text-center tracking-[0.5em] text-sm font-black"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && enteredOtp.length === 6 && checklistComplete) {
                              handleConfirm();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={sendOtp}
                          disabled={timer > 0}
                          className="h-10 text-xs px-3 shrink-0"
                        >
                          {timer > 0 ? `${timer}s` : "Gửi lại"}
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        Mã xác thực đã được gửi đến email <strong className="text-slate-800">{business?.owner?.email}</strong>. Vui lòng kiểm tra hộp thư (bao gồm cả mục Thư rác/Spam nếu không tìm thấy).
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Checkbox đồng ý */}
              <label className="flex items-start gap-2.5 text-xs text-foreground cursor-pointer select-none py-1">
                <Checkbox
                  checked={acceptedTerms}
                  onCheckedChange={(checked) =>
                    setAcceptedTerms(Boolean(checked))
                  }
                  className="mt-0.5"
                />
                <span className="leading-normal font-medium text-slate-700">
                  Tôi đã đọc và đồng ý ký kết hợp đồng cung cấp và sử dụng dịch vụ điện tử này của iPoint Genie.
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-muted/20 px-5 py-3">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={() => setStep((prev) => prev - 1)}
              className="gap-1.5 text-xs h-9"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
          ) : (
            <span />
          )}

          {step === 1 && (
            <Button onClick={goToStep2} className="gap-1.5 text-xs h-9">
              Tiếp tục
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {step === 2 && (
            <Button onClick={goToStep3} className="gap-1.5 text-xs h-9">
              Tiếp tục
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {step === 3 && (
            <Button
              onClick={handleConfirm}
              loading={loading}
              disabled={!checklistComplete || enteredOtp.length !== 6}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9"
            >
              <ShieldCheck className="h-4 w-4" />
              Xác nhận ký điện tử
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
