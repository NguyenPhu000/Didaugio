import { CATEGORY_ICON_MAP, getCategoryIconName } from "@/constants/categoryConstants";
import { MapPin } from "lucide-react";

export function MdiCategoryIcon({ category, className, size = 24 }) {
  const iconName = getCategoryIconName(category);
  const IconComponent = CATEGORY_ICON_MAP[iconName] || MapPin;

  return <IconComponent aria-hidden="true" className={className} size={size} />;
}
