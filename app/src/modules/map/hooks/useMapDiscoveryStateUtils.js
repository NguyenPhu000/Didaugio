export function buildCategoryOptions({ homeData, places }) {
  const homeCategories =
    homeData?.categories ||
    homeData?.data?.categories ||
    homeData?.data?.data?.categories ||
    [];

  if (Array.isArray(homeCategories) && homeCategories.length > 0) {
    return homeCategories
      .map((item) => ({ id: item?.id, name: item?.name }))
      .filter((item) => item.id != null && item.name);
  }

  const derived = new Map();
  places.forEach((place) => {
    const id = place?.categoryId ?? place?.category?.id;
    const name = place?.category?.name;
    if (id == null || !name) return;
    const key = String(id);
    if (!derived.has(key)) {
      derived.set(key, { id, name });
    }
  });

  return Array.from(derived.values());
}

export function buildAreaOptions({ places, getDistrictMeta }) {
  const areas = new Map();
  places.forEach((place) => {
    const district = getDistrictMeta(place);
    if (!district || areas.has(district.key)) return;
    areas.set(district.key, district);
  });

  return Array.from(areas.values()).sort((a, b) =>
    String(a.name).localeCompare(String(b.name), "vi"),
  );
}
