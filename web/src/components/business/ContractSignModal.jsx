import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PenLine, RotateCcw, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";

const PAD_WIDTH = 720;
const PAD_HEIGHT = 240;

const ContractSignModal = ({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  contractVersion,
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const id = requestAnimationFrame(() => {
      setHasStroke(false);
      setAcceptedTerms(false);
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

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

  const drawEnd = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
  };

  const handleConfirm = async () => {
    if (!acceptedTerms) {
      toast.error("Bạn cần đồng ý điều khoản trước khi ký");
      return;
    }

    if (!hasStroke) {
      toast.error("Vui lòng ký vào khung chữ ký");
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
          userAgent: navigator.userAgent,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
      onOpenChange?.(false);
    } catch {
      // caller handles API errors
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-4 w-4 text-primary" />
            Ký hợp đồng điện tử
          </DialogTitle>
          <DialogDescription>
            Xác nhận chữ ký nội bộ cho phiên bản hợp đồng{" "}
            {contractVersion || "mới nhất"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-2xl border border-border/70 bg-card p-3">
            <canvas
              ref={canvasRef}
              width={PAD_WIDTH}
              height={PAD_HEIGHT}
              className="h-48 w-full rounded-xl border border-dashed border-border/80 bg-slate-50 touch-none"
              onPointerDown={drawStart}
              onPointerMove={drawMove}
              onPointerUp={drawEnd}
              onPointerLeave={drawEnd}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Ký bằng chuột hoặc cảm ứng. Chữ ký sẽ được lưu kèm thời điểm và
              metadata phiên ký.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/30 p-3">
            <label className="flex items-start gap-2 text-sm text-foreground">
              <Checkbox
                checked={acceptedTerms}
                onCheckedChange={(checked) =>
                  setAcceptedTerms(Boolean(checked))
                }
              />
              <span>Tôi đã đọc, hiểu và đồng ý với điều khoản hợp đồng.</span>
            </label>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={clearSignature}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Xóa chữ ký
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} loading={loading} className="gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            Xác nhận ký
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContractSignModal;
