import React from "react";
import { useTranslation } from "react-i18next";
import { Lock, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const ProfilePasswordVerifyModal = ({
  open,
  onOpenChange,
  verifyPassword,
  setVerifyPassword,
  onVerifyPassword,
  verifying,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[32px] p-6 border border-slate-200/80 dark:border-border/80 shadow-2xl bg-white dark:bg-card">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" />
            <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white">
              Xác thực bảo mật thông tin
            </DialogTitle>
          </div>
          <p className="text-xs text-slate-500 dark:text-muted-foreground">
            Vui lòng nhập mật khẩu tài khoản của bạn để giải mã và hiển thị đầy đủ thông tin pháp lý nhạy cảm.
          </p>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onVerifyPassword();
          }}
          className="space-y-4 pt-2"
        >
          <Input
            type="password"
            placeholder="Nhập mật khẩu đăng nhập..."
            value={verifyPassword}
            onChange={(e) => setVerifyPassword(e.target.value)}
            className="rounded-2xl text-xs h-10 bg-slate-50 dark:bg-muted"
            autoFocus
          />

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl text-xs font-bold px-4"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={verifying || !verifyPassword}
              className="rounded-2xl text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground px-4 gap-1.5"
            >
              {verifying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Xác thực
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfilePasswordVerifyModal;
