import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserX } from "lucide-react";

export const UserDeleteDialog = ({
  open,
  onOpenChange,
  userToDelete,
  onConfirm,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
            <UserX className="h-5 w-5 text-rose-500" />{" "}
            {t("users.deleteDialog.title")}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            {t("users.deleteDialog.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="py-3">
          <p className="text-xs text-slate-700 leading-relaxed">
            {t("users.deleteDialog.message", {
              username: userToDelete?.username || userToDelete?.email,
            })}
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-black/[0.04]">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full text-xs font-semibold h-9 px-4"
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            className="rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 px-5 shadow-sm"
          >
            {t("common.confirmDelete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserDeleteDialog;
