import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { UserPlus, Send, Copy, Check, Loader2 } from "lucide-react";
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
        toast.success(t("business.staff.inviteSuccess"));
        onClose();
        reset();
      }
    } catch {
      toast.error(t("business.staff.inviteFailed"));
    } finally {
      setSending(false);
    }
  };

  const handleCopy = () => {
    if (invitedLink) {
      navigator.clipboard.writeText(invitedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t("common.copied"));
    }
  };

  const handleCloseAll = () => {
    setInvitedLink(null);
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseAll}>
      <DialogContent className="max-w-md border-zinc-200/80 dark:bg-zinc-950 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-950 dark:text-zinc-100">
            <UserPlus className="h-5 w-5 text-zinc-500" />
            {t("business.staff.inviteStaff")}
          </DialogTitle>
          <DialogDescription>
            {t("business.staff.inviteSubtitle")}
          </DialogDescription>
        </DialogHeader>

        {invitedLink ? (
          <div className="space-y-4 py-3">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {t("business.staff.inviteLinkCreated")}
            </p>
            <div className="flex items-center gap-2">
              <Input value={invitedLink} readOnly className="font-mono text-xs bg-zinc-50 dark:bg-zinc-900" />
              <Button size="sm" onClick={handleCopy} className="gap-1.5 shrink-0">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                {copied ? t("common.copied") : t("common.copy")}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={handleCloseAll}>{t("common.close")}</Button>
            </DialogFooter>
          </div>
        ) : (
          <form id="invite-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="inv-email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="inv-email"
                type="email"
                {...register("email", { required: true })}
                placeholder="nhanvien@example.com"
                className="bg-white dark:bg-zinc-950"
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("business.staff.selectRole")}</Label>
              <Select value={selectedRoleId} onValueChange={(val) => setValue("roleId", val)}>
                <SelectTrigger className="bg-white dark:bg-zinc-950">
                  <SelectValue placeholder={t("business.staff.selectRolePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-note">{t("business.staff.note")} ({t("common.optional")})</Label>
              <Textarea
                id="inv-note"
                {...register("note")}
                rows={2}
                placeholder={t("business.staff.notePlaceholder")}
                className="bg-white dark:bg-zinc-950"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" type="button" onClick={handleCloseAll} disabled={sending}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={sending} className="gap-2 bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {t("business.staff.sendInvite")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
