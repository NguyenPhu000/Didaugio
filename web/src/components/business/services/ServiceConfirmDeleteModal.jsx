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

export const ServiceConfirmDeleteModal = ({ name, open, onConfirm, onCancel }) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-md rounded-[32px] p-6 border border-slate-200/80 dark:border-border/80 shadow-2xl bg-white dark:bg-card">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-rose-600 font-black text-lg">
            Xác nhận xóa gói dịch vụ
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Bạn có chắc muốn xóa vĩnh viễn dịch vụ <strong className="text-slate-900 dark:text-white">"{name}"</strong>? Các đơn đặt chỗ liên quan có thể bị ảnh hưởng.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-3 flex-row justify-end border-t border-slate-100 dark:border-border/60">
          <Button
            variant="outline"
            onClick={onCancel}
            className="rounded-2xl h-9 px-4 text-xs font-bold border-slate-200"
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="rounded-2xl h-9 px-4 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
          >
            Xóa dịch vụ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceConfirmDeleteModal;
