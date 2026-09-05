import React from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const CategoryDeleteDialog = ({
  deleteDialogOpen,
  setDeleteDialogOpen,
  categoryToDelete,
  handleDeleteConfirm,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <DialogContent className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-rose-500" />{" "}
            {t("categories.deleteDialog.title")}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            {t("categories.deleteDialog.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="py-3">
          <p className="text-xs text-slate-700 leading-relaxed">
            {t("categories.deleteDialog.message", {
              name: categoryToDelete?.name,
            })}
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-black/[0.04]">
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(false)}
            className="rounded-full text-xs font-semibold h-9 px-4 cursor-pointer"
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            className="rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 px-5 shadow-sm cursor-pointer"
          >
            {t("common.confirmDelete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDeleteDialog;
