import { FolderTree, Eye, EyeOff, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { useTranslation } from "react-i18next";

/**
 * CATEGORY STATS
 * Stats cards hiển thị tổng quan về categories
 */
export default function CategoryStats({ categories = [] }) {
  const { t } = useTranslation();
  const totalCategories = categories.length;
  const activeCategories = categories.filter((cat) => !cat.isHidden).length;
  const hiddenCategories = categories.filter((cat) => cat.isHidden).length;
  const totalPlaces = categories.reduce(
    (sum, cat) => sum + (cat._count?.places || 0),
    0
  );

  const stats = [
    {
      label: t("category.stats.total"),
      value: totalCategories,
      icon: FolderTree,
      color: "#3B82F6",
      bgColor: "#EFF6FF",
    },
    {
      label: t("category.stats.visible"),
      value: activeCategories,
      icon: Eye,
      color: "#10B981",
      bgColor: "#ECFDF5",
    },
    {
      label: t("category.stats.hidden"),
      value: hiddenCategories,
      icon: EyeOff,
      color: "#6B7280",
      bgColor: "#F3F4F6",
    },
    {
      label: t("category.stats.totalPlaces"),
      value: totalPlaces,
      icon: MapPin,
      color: "#F59E0B",
      bgColor: "#FEF3C7",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className="hover:shadow-md transition-shadow duration-300 border-2"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </p>
                </div>
                <div
                  className="flex items-center justify-center w-14 h-14 rounded-xl"
                  style={{
                    backgroundColor: stat.bgColor,
                    color: stat.color,
                  }}
                >
                  <Icon className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
