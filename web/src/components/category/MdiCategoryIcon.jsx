import { CATEGORY_ICON_MAP, getCategoryIconName } from "@/constants/categoryConstants";

export function MdiCategoryIcon({ category, className, size = 24 }) {
  const iconName = getCategoryIconName(category);
  const path = CATEGORY_ICON_MAP[iconName] || CATEGORY_ICON_MAP["map-marker-outline"];

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path d={path} />
    </svg>
  );
}
