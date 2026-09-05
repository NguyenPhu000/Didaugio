import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Check, Copy, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function StaffInviteModal({ open, onClose, roles = [], onInvite }) {
  const { t } = useTranslation();
  const [sending, setSending] = useState(false);
  const [invitedLink, setInvitedLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      email: "",
      roleId: "",
      note: "",
    },
  });

  const selectedRoleId = watch("roleId");

  const onSubmit = async (formData) => {
    setSending(true);
    try {
      const res = await onInvite({
        email: formData.email,
        roleId: formData.roleId ? Number(formData.roleId) : null,
        note: formData.note || null,
      });
      if (res?.inviteLink) {
        setInvitedLink(res.inviteLink);
      } else {
        toast.success(t("business.staff.inviteSuccess", { defaultValue: "Đã gửi lời mời thành công" }));
        onClose();
        reset();
      }
    } catch {
      toast.error(t("business.staff.inviteFailed", { defaultValue: "Gửi lời mời thất bại" }));
    } finally {
      setSending(false);
    }
  };

  const handleCopy = () => {
    if (invitedLink) {
      navigator.clipboard.writeText(invitedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Đã sao chép liên kết mời");
    }
  };

  const handleCloseAll = () => {
    setInvitedLink(null);
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseAll}>
      <DialogContent className="max-w-md rounded-[38px] p-6 sm:p-7 border border-slate-200/80 dark:border-border/80 shadow-2xl bg-white dark:bg-card">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Thêm Thành Viên & Phân Quyền
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-muted-foreground">
            Gửi liên kết mời tham gia quản trị cơ sở dịch vụ qua email.
          </DialogDescription>
        </DialogHeader>

        {invitedLink ? (
          <div className="space-y-4 py-3">
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Liên kết mời đã được khởi tạo thành công. Bạn có thể gửi trực tiếp liên kết này cho nhân viên:
            </p>
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-50 dark:bg-muted border border-slate-200/80 dark:border-border/80">
              <Input
                value={invitedLink}
                readOnly
                className="font-mono text-xs bg-transparent border-0 shadow-none focus-visible:ring-0 select-all"
              />
              <Button
                size="sm"
                onClick={handleCopy}
                className="rounded-xl h-8 px-3 text-xs font-bold shrink-0 bg-slate-950 text-white dark:bg-primary dark:text-primary-foreground gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Đã chép" : "Sao chép"}
              </Button>
            </div>
            <DialogFooter className="pt-2">
              <Button onClick={handleCloseAll} className="w-full rounded-2xl h-10 text-xs font-bold bg-slate-950 text-white">
                Hoàn tất
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form id="invite-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5 text-left">
              <Label htmlFor="inv-email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Email nhân viên *
              </Label>
              <Input
                id="inv-email"
                type="email"
                {...register("email", { required: true })}
                placeholder="nhanvien@example.com"
                className="rounded-2xl text-xs h-10 bg-slate-50 dark:bg-muted border-slate-200/80 dark:border-border/80 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Vai trò phân quyền *
              </Label>
              <Select value={selectedRoleId} onValueChange={(val) => setValue("roleId", val)}>
                <SelectTrigger className="rounded-2xl text-xs h-10 bg-slate-50 dark:bg-muted border-slate-200/80 dark:border-border/80">
                  <SelectValue placeholder="Chọn vai trò (Quản lý, Thu ngân, Lễ tân...)" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)} className="text-xs">
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 text-left">
              <Label htmlFor="inv-note" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Ghi chú nội bộ (Tùy chọn)
              </Label>
              <Textarea
                id="inv-note"
                {...register("note")}
                rows={2}
                placeholder="Chi nhánh làm việc, ghi chú phân công..."
                className="rounded-2xl text-xs bg-slate-50 dark:bg-muted border-slate-200/80 dark:border-border/80 focus:bg-white"
              />
            </div>

            <DialogFooter className="pt-3 gap-2 flex-row justify-end">
              <Button
                variant="outline"
                type="button"
                onClick={handleCloseAll}
                disabled={sending}
                className="rounded-2xl h-10 px-4 text-xs font-bold border-slate-200 dark:border-border/80"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={sending}
                className="rounded-2xl h-10 px-5 text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground shadow-xs gap-1.5"
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Gửi lời mời
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
