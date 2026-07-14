import { useCallback, useMemo, useState } from "react";
import {
  ALL_AREAS_KEY,
  DEFAULT_QUICK_FILTERS,
  FILTER_GROUP_OPTIONS,
  QUICK_FILTER_OPTIONS,
} from "../constants/filter.constants";
import { MAP_TEXT } from "../constants/mapText.constants";
import { getCategoryIconName } from "../../../constants/categoryIcons";

export function useFilterState({
  categories,
  areaOptions,
}) {
  const [filterPickerVisible, setFilterPickerVisible] = useState(false);
  const [activeFilterGroup, setActiveFilterGroup] = useState("category");
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [activeArea, setActiveArea] = useState(ALL_AREAS_KEY);
  const [quickFilters, setQuickFilters] = useState(() => ({
    ...DEFAULT_QUICK_FILTERS,
  }));

  const activeQuickFilterLabels = useMemo(
    () =>
      QUICK_FILTER_OPTIONS.filter(
        (option) => quickFilters[option.key] === true,
      ).map((option) => option.label),
    [quickFilters],
  );

  const activeFilterGroupMeta = useMemo(
    () =>
      FILTER_GROUP_OPTIONS.find((group) => group.key === activeFilterGroup) ||
      FILTER_GROUP_OPTIONS[0],
    [activeFilterGroup],
  );

  const activeFilterSummaryLabel = useMemo(() => {
    if (activeFilterGroup === "category") {
      if (activeCategoryId === null) return MAP_TEXT.filters.allCategories;
      const matchedCategory = categories.find(
        (category) => String(category.id) === String(activeCategoryId),
      );
      return matchedCategory?.name || MAP_TEXT.filters.categoryFallback;
    }

    if (activeFilterGroup === "area") {
      if (activeArea === ALL_AREAS_KEY) return MAP_TEXT.filters.allAreas;
      const matchedArea = areaOptions.find((area) => area.key === activeArea);
      return matchedArea?.name || MAP_TEXT.filters.areaFallback;
    }

    if (activeQuickFilterLabels.length === 0)
      return MAP_TEXT.filters.noneApplied;
    if (activeQuickFilterLabels.length === 1) return activeQuickFilterLabels[0];
    return MAP_TEXT.filters.countApplied(activeQuickFilterLabels.length);
  }, [
    activeArea,
    activeCategoryId,
    activeFilterGroup,
    activeQuickFilterLabels,
    areaOptions,
    categories,
  ]);

  const filterPickerOptions = useMemo(() => {
    if (activeFilterGroup === "category") {
      return [
        {
          key: "category:all",
          value: null,
          label: MAP_TEXT.filters.allCategories,
          icon: "apps",
          active: activeCategoryId === null,
        },
        ...categories.map((category) => ({
          key: `category:${category.id}`,
          value: category.id,
          label: category.name,
          icon: getCategoryIconName(category),
          iconFamily: "mdi",
          active: String(activeCategoryId ?? "") === String(category.id),
        })),
      ];
    }

    if (activeFilterGroup === "area") {
      return [
        {
          key: "area:all",
          value: ALL_AREAS_KEY,
          label: MAP_TEXT.filters.allAreas,
          icon: "public",
          active: activeArea === ALL_AREAS_KEY,
        },
        ...areaOptions.map((area) => ({
          key: `area:${area.key}`,
          value: area.key,
          label: area.name,
          icon: "place",
          active: area.key === activeArea,
        })),
      ];
    }

    return QUICK_FILTER_OPTIONS.map((option) => ({
      key: `quick:${option.key}`,
      value: option.key,
      label: option.label,
      icon: option.icon,
      active: quickFilters[option.key] === true,
    }));
  }, [
    activeArea,
    activeCategoryId,
    activeFilterGroup,
    areaOptions,
    categories,
    quickFilters,
  ]);

  const handleQuickFilterToggle = useCallback((filterKey) => {
    setQuickFilters((prev) => {
      if (filterKey === "budget") {
        return {
          ...prev,
          budget: !prev.budget,
          premium: false,
        };
      }

      if (filterKey === "premium") {
        return {
          ...prev,
          premium: !prev.premium,
          budget: false,
        };
      }

      return {
        ...prev,
        [filterKey]: !prev[filterKey],
      };
    });
  }, []);

  const handleSelectFilterGroup = useCallback((groupKey) => {
    setActiveFilterGroup(groupKey);
  }, []);

  const handleOpenFilterPicker = useCallback(() => {
    setFilterPickerVisible(true);
  }, []);

  const handleCloseFilterPicker = useCallback(() => {
    setFilterPickerVisible(false);
  }, []);

  const handleSelectFilterOption = useCallback(
    (value) => {
      if (activeFilterGroup === "category") {
        setActiveCategoryId(value);
        return;
      }

      if (activeFilterGroup === "area") {
        setActiveArea(value ?? ALL_AREAS_KEY);
        return;
      }

      if (typeof value === "string" && value.length > 0) {
        handleQuickFilterToggle(value);
      }
    },
    [activeFilterGroup, handleQuickFilterToggle],
  );

  const handleResetFilters = useCallback(() => {
    setActiveCategoryId(null);
    setActiveArea(ALL_AREAS_KEY);
    setQuickFilters({ ...DEFAULT_QUICK_FILTERS });
    setFilterPickerVisible(false);
  }, []);

  return {
    activeFilterGroup,
    activeCategoryId,
    activeArea,
    quickFilters,
    filterPickerVisible,
    activeFilterGroupMeta,
    activeFilterSummaryLabel,
    filterPickerOptions,
    handleQuickFilterToggle,
    handleSelectFilterGroup,
    handleOpenFilterPicker,
    handleCloseFilterPicker,
    handleSelectFilterOption,
    handleResetFilters,
  };
}
