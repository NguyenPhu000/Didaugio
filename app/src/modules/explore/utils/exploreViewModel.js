export function buildExploreContentVisibility(selectedCategory) {
  const showGlobalContent = selectedCategory == null;

  return {
    showGlobalContent,
    showFilteredContent: !showGlobalContent,
  };
}

export function resolveExploreSheetCategory({
  category,
  fullPlacesByCategory,
  allPlaces,
  selectedCategoryName,
}) {
  const categoryId = category?.id;
  const fullCategoryData =
    categoryId != null ? fullPlacesByCategory.get(categoryId) : null;
  const places = fullCategoryData?.places?.length
    ? fullCategoryData.places
    : category?.places?.length
      ? category.places
      : allPlaces;

  return {
    id: categoryId,
    name: category?.name || selectedCategoryName || "Tất cả địa điểm",
    icon: category?.icon,
    places,
  };
}
