import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Loader2,
  QrCode,
  ScanLine,
  Square,
} from "lucide-react";
import jsQR from "jsqr";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import * as bookingApi from "@/apis/bookingService";
import { parseBookingQrText } from "@/utils/bookingQrScanner";

const getResponseData = (response) => response?.data?.data || response?.data || response;

function BookingResultCard({ result, t }) {
  if (!result) return null;

  const booking = result.booking || {};
  const serviceName = booking.service?.name || booking.serviceName || "-";
  const customerName =
    booking.user?.profile?.fullName ||
    booking.user?.fullName ||
    booking.guestName ||
    "-";

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-emerald-600 p-2 text-white">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">
              {result.action === "verify"
                ? t("business.bookings.qr.valid", { defaultValue: "QR hợp lệ" })
                : t("business.bookings.qr.checkedIn", { defaultValue: "Check-in thành công" })}
            </p>
            <Badge className="bg-white text-emerald-700 hover:bg-white">
              #{booking.bookingCode || result.bookingCode || "-"}
            </Badge>
          </div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-emerald-700/70">
                {t("business.bookings.qr.customer", { defaultValue: "Khách hàng" })}
              </p>
              <p className="truncate font-medium">{customerName}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-700/70">
                {t("business.bookings.qr.service", { defaultValue: "Dịch vụ" })}
              </p>
              <p className="truncate font-medium">{serviceName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingQrScannerDialog({ open, onOpenChange, onSuccess }) {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);
  const lastScannedRef = useRef("");
  const submittingRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [manualValue, setManualValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const stopCamera = useCallback(() => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    streamRef.current?.getTracks?.().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const decodeVideoFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return "";
    }

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return "";

    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return "";

    context.drawImage(video, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    const code = jsQR(imageData.data, width, height, {
      inversionAttempts: "dontInvert",
    });

    return code?.data || "";
  }, []);

  const verifyText = useCallback(
    async (rawText) => {
      if (submittingRef.current) return;

      let payload;
      try {
        payload = parseBookingQrText(rawText);
      } catch {
        toast.error(t("business.bookings.qr.invalid", { defaultValue: "Mã QR booking không hợp lệ" }));
        return;
      }

      setSubmitting(true);
      submittingRef.current = true;
      try {
        const response = await bookingApi.verifyQR(payload);
        const data = getResponseData(response);
        setResult(data);
        toast.success(
          data?.action === "verify"
            ? t("business.bookings.qr.valid", { defaultValue: "QR hợp lệ" })
            : t("business.bookings.qr.checkedIn", { defaultValue: "Check-in thành công" }),
        );
        stopCamera();
        onSuccess?.(data);
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          t("business.bookings.qr.verifyFailed", { defaultValue: "Không thể xác thực mã QR" });
        toast.error(message);
      } finally {
        setSubmitting(false);
        submittingRef.current = false;
      }
    },
    [onSuccess, stopCamera, t],
  );

  const startCamera = useCallback(async () => {
    setCameraError("");
    setResult(null);

    if (!decodeVideoFrame) {
      setCameraError(t("business.bookings.qr.unsupported", {
        defaultValue: "Trình duyệt này chưa hỗ trợ quét QR bằng camera. Hãy nhập hoặc dán mã QR.",
      }));
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(t("business.bookings.qr.cameraUnavailable", {
        defaultValue: "Thiết bị này chưa hỗ trợ mở camera trong trình duyệt. Hãy nhập hoặc dán mã QR.",
      }));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);

      scanTimerRef.current = window.setInterval(async () => {
        if (!videoRef.current || submittingRef.current) return;
        try {
          const rawValue = decodeVideoFrame();
          if (!rawValue || rawValue === lastScannedRef.current) return;
          lastScannedRef.current = rawValue;
          await verifyText(rawValue);
        } catch {
          // Keep the camera session alive; manual fallback remains available.
        }
      }, 700);
    } catch (error) {
      setCameraError(
        error?.name === "NotAllowedError"
          ? t("business.bookings.qr.cameraPermission", { defaultValue: "Bạn cần cấp quyền camera để quét QR." })
          : t("business.bookings.qr.cameraOpenFailed", {
            defaultValue: "Không mở được camera. Hãy nhập hoặc dán mã QR.",
          }),
      );
      stopCamera();
    }
  }, [decodeVideoFrame, stopCamera, t, verifyText]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setManualValue("");
      setCameraError("");
      setResult(null);
      lastScannedRef.current = "";
    }
  }, [open, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const handleManualSubmit = () => {
    verifyText(manualValue);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden rounded-3xl border-zinc-200 p-0">
        <DialogHeader className="border-b border-zinc-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-black p-3 text-white">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>{t("business.bookings.qr.title", { defaultValue: "Quét QR check-in" })}</DialogTitle>
              <DialogDescription>
                {t("business.bookings.qr.description", {
                  defaultValue: "Quét QR trên vé booking của khách hoặc nhập mã booking thủ công.",
                })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-5 p-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="relative flex aspect-square min-h-[280px] items-center justify-center overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-950">
              <video
                ref={videoRef}
                className={cn(
                  "h-full w-full object-cover",
                  !cameraActive && "opacity-0",
                )}
                muted
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
                  <div className="rounded-full bg-white/10 p-5">
                    <ScanLine className="h-10 w-10" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {t("business.bookings.qr.ready", { defaultValue: "Sẵn sàng quét QR" })}
                    </p>
                    <p className="mt-1 text-sm text-white/60">
                      {t("business.bookings.qr.cameraSession", {
                        defaultValue: "Camera sẽ chỉ dùng trong phiên quét này.",
                      })}
                    </p>
                  </div>
                </div>
              )}
              {cameraActive && (
                <div className="pointer-events-none absolute inset-8 rounded-3xl border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.22)]" />
              )}
            </div>

            {cameraError && (
              <div className="flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={cameraActive ? stopCamera : startCamera}
                disabled={submitting}
                className="gap-2 bg-black text-white hover:bg-zinc-800"
              >
                {cameraActive ? <Square className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                {cameraActive
                  ? t("business.bookings.qr.stopCamera", { defaultValue: "Dừng camera" })
                  : t("business.bookings.qr.openCamera", { defaultValue: "Mở camera" })}
              </Button>
              {submitting && (
                <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-2 text-sm text-zinc-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("business.bookings.qr.verifying", { defaultValue: "Đang xác thực" })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
              <Label htmlFor="booking-qr-manual" className="text-sm font-semibold">
                {t("business.bookings.qr.manualLabel", { defaultValue: "Nhập mã hoặc dán dữ liệu QR" })}
              </Label>
              <Input
                id="booking-qr-manual"
                value={manualValue}
                onChange={(event) => setManualValue(event.target.value)}
                placeholder={t("business.bookings.qr.manualPlaceholder", {
                  defaultValue: "BK-12345 hoặc JSON QR",
                })}
                className="mt-3 h-11 rounded-2xl border-zinc-200 bg-white"
              />
              <Button
                type="button"
                onClick={handleManualSubmit}
                disabled={submitting || !manualValue.trim()}
                className="mt-3 w-full gap-2 rounded-2xl bg-black text-white hover:bg-zinc-800"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {t("business.bookings.qr.submit", { defaultValue: "Xác nhận check-in" })}
              </Button>
            </div>

            <BookingResultCard result={result} t={t} />
          </div>
        </div>

        <DialogFooter className="border-t border-zinc-100 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close", { defaultValue: "Đóng" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
