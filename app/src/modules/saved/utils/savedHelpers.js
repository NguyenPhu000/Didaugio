import i18n from "@/i18n";

export const ALL_AREAS_KEY = "__all_areas__";
export const ALL_COLLECTIONS_KEY = "__all_collections__";
export const NOTES_COLLECTION_KEY = "__notes__";
export const ALL_CATEGORIES_KEY = "__all_categories__";

export const FILTERS = [
  { key: "all", label: i18n.t("savedHelpers.all") },
  { key: "notes", label: i18n.t("savedHelpers.hasNotes") },
  { key: "collections", label: i18n.t("savedHelpers.collections") },
];

export function getPlaceArea(place) {
  const districtId =
    place?.district?.id ?? place?.ward?.districtId ?? place?.districtId;
  const districtName =
    place?.district?.name ?? place?.ward?.district?.name ?? null;

  if (districtId != null) {
    return {
      key: `id:${districtId}`,
      name: districtName || i18n.t("savedHelpers.area", { id: districtId }),
    };
  }

  if (districtName) {
    return {
      key: `name:${districtName.trim().toLowerCase()}`,
      name: districtName,
    };
  }

  return null;
}

export function getPlaceCollection(place) {
  const categoryId = place?.category?.id ?? place?.categoryId;
  const categoryName = place?.category?.name ?? place?.categoryName ?? null;

  if (categoryId != null) {
    return {
      key: `category:${categoryId}`,
      name: categoryName || i18n.t("savedHelpers.category", { id: categoryId }),
    };
  }

  if (categoryName) {
    return {
      key: `category-name:${categoryName.trim().toLowerCase()}`,
      name: categoryName,
    };
  }

  return null;
}

export function getEntryCollection(entry) {
  const customName = String(entry?.collectionName || "").trim();
  if (customName) {
    return {
      key: `custom:${customName.toLowerCase()}`,
      name: customName,
      icon: "collections-bookmark",
      rawName: customName,
    };
  }

  return getPlaceCollection(entry?.place || entry);
}

export function getLocationText(place) {
  if (place?.address) return place.address;
  const parts = [place?.ward?.name, place?.district?.name].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  return i18n.t("exploreHelpers.canTho");
}

export function getReviewCount(place) {
  const parsed = Number(place?.reviewCount ?? place?._count?.reviews ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatReviewLabel(reviewCount) {
  if (!reviewCount) return i18n.t("savedHelpers.new");
  if (reviewCount >= 1000) {
    return `${(reviewCount / 1000).toFixed(1).replace(/\.0$/, "")}k ${i18n.t("savedHelpers.reviews")}`;
  }
  return `${reviewCount} ${i18n.t("savedHelpers.reviews")}`;
}

export function formatPriceLabel(place) {
  const parsed = Number(place?.priceFrom ?? place?.price_from);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  if (parsed >= 1_000_000) {
    return `Từ ${(parsed / 1_000_000).toFixed(1).replace(/\.0$/, "")}trđ`;
  }
  if (parsed >= 1000) return `Từ ${Math.round(parsed / 1000)}kđ`;
  return `Từ ${parsed}đ`;
}

export function getCategorySlug(place) {
  return place?.category?.slug ?? place?.categorySlug ?? "default";
}

export function buildCollectionOptions({ savedData, savedCollections }) {
  const map = new Map();
  let noteCount = 0;

  savedCollections.forEach((collection) => {
    const name = String(collection?.name || "").trim();
    if (!name) return;
    map.set(`custom:${name.toLowerCase()}`, {
      key: `custom:${name.toLowerCase()}`,
      name: `${name} (${collection.count || 0})`,
      icon: "collections-bookmark",
      rawName: name,
    });
  });

  savedData.forEach((entry) => {
    const collection = getEntryCollection(entry);
    if (collection && !map.has(collection.key)) {
      map.set(collection.key, collection);
    }
    if (String(entry?.note || "").trim()) {
      noteCount += 1;
    }
  });

  const collections = Array.from(map.values()).sort((a, b) =>
    String(a.name).localeCompare(String(b.name), "vi"),
  );

  if (noteCount > 0) {
    collections.unshift({
      key: NOTES_COLLECTION_KEY,
      name: `${i18n.t("savedHelpers.hasNotesLabel")} (${noteCount})`,
      icon: "edit-note",
    });
  }

  return collections;
}

export function buildAreaOptions(savedData) {
  const map = new Map();
  savedData.forEach((entry) => {
    const place = entry?.place || entry;
    const area = getPlaceArea(place);
    if (!area || map.has(area.key)) return;
    map.set(area.key, area);
  });
  return Array.from(map.values()).sort((a, b) =>
    String(a.name).localeCompare(String(b.name), "vi"),
  );
}

export function buildCategoryOptions(savedData) {
  const map = new Map();
  savedData.forEach((entry) => {
    const place = entry?.place || entry;
    const categoryId = place?.category?.id ?? place?.categoryId;
    const categoryName = place?.category?.name ?? place?.categoryName;
    if (!categoryName) return;
    const key = categoryId != null ? `cat:${categoryId}` : `cat-name:${String(categoryName).trim().toLowerCase()}`;
    if (!map.has(key)) {
      map.set(key, { key, name: categoryName });
    }
  });
  return Array.from(map.values()).sort((a, b) =>
    String(a.name).localeCompare(String(b.name), "vi"),
  );
}

export function filterSavedEntries({ savedData, activeCollection, activeArea, activeCategory }) {
  return savedData.filter((entry) => {
    const place = entry?.place || entry;

    if (activeCollection === NOTES_COLLECTION_KEY) {
      if (!String(entry?.note || "").trim()) return false;
    } else if (activeCollection !== ALL_COLLECTIONS_KEY) {
      const collection = getEntryCollection(entry);
      if (collection?.key !== activeCollection) return false;
    }

    if (activeArea !== ALL_AREAS_KEY) {
      const area = getPlaceArea(place);
      if (area?.key !== activeArea) return false;
    }

    if (activeCategory && activeCategory !== ALL_CATEGORIES_KEY) {
      const categoryId = place?.category?.id ?? place?.categoryId;
      const categoryName = place?.category?.name ?? place?.categoryName;
      const catKey = categoryId != null
        ? `cat:${categoryId}`
        : `cat-name:${String(categoryName || "").trim().toLowerCase()}`;
      if (catKey !== activeCategory) return false;
    }

    return true;
  });
}

export function buildSavedSummary({ savedData, collectionOptions, areaOptions }) {
  const noteCount = savedData.filter((entry) =>
    String(entry?.note || "").trim(),
  ).length;
  const collectionCount = collectionOptions.filter(
    (option) => option.key !== NOTES_COLLECTION_KEY,
  ).length;

  return [
    {
      key: "saved",
      icon: "bookmark",
      value: String(savedData.length),
      label: i18n.t("savedHelpers.saved"),
      tone: "blue",
    },
    {
      key: "collections",
      icon: "collections-bookmark",
      value: String(collectionCount),
      label: i18n.t("savedHelpers.collectionsLabel"),
      tone: "amber",
    },
    {
      key: "areas",
      icon: "map",
      value: String(areaOptions.length),
      label: i18n.t("savedHelpers.areas"),
      tone: "teal",
    },
    {
      key: "notes",
      icon: "edit-note",
      value: String(noteCount),
      label: i18n.t("savedHelpers.hasNotesLabel"),
      tone: "green",
    },
  ];
}

export function getHeroEntry(savedData) {
  if (!savedData?.length) return null;
  const sorted = [...savedData].sort((a, b) => {
    const aTime = new Date(a?.createdAt || a?.savedAt || 0).getTime();
    const bTime = new Date(b?.createdAt || b?.savedAt || 0).getTime();
    return bTime - aTime;
  });
  return sorted[0];
}
