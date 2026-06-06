import { FolderTree, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "react-i18next";

/**
 * CATEGORY EMPTY STATE
 * Empty state khi chưa có category nào
 */
export default function CategoryEmptyState({ onCreateFirst }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {/* Icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <FolderTree className="h-12 w-12 text-primary/70" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
          <Plus className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>

      {/* Text */}
      <h3 className="text-2xl font-bold mb-2">{t("category.empty.title")}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {t("category.empty.description")}
      </p>

      {/* Action Button */}
      <Button onClick={onCreateFirst} size="lg" className="font-semibold">
        <Plus className="h-5 w-5 mr-2" />
        {t("category.empty.createFirst")}
      </Button>

      {/* Tips */}
      <div className="mt-12 p-4 rounded-lg bg-muted/50 max-w-lg">
        <p className="text-sm text-muted-foreground">
          💡 <span className="font-semibold">{t("category.empty.tip")}</span>
        </p>
      </div>
    </div>
  );
}
