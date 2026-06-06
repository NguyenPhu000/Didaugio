import { Star, Layers, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getCategoryConfig, PRICE_LABELS, getPriceLabel } from "@/modules/map";

const CatIcon = ({ id, className }) => {
  const { Icon } = getCategoryConfig(id);
  return <Icon className={className} />;
};

const FilterPanel = ({
  categories,
  places,
  selectedCategory,
  setSelectedCategory,
  selectedPrice,
  setSelectedPrice,
  onlyFeatured,
  setOnlyFeatured,
  hasActiveFilters,
  onResetFilters,
}) => {
  const { t } = useTranslation();
  const PRICE_OPTIONS = [
    { value: "all", label: t("common.all") },
    ...Object.entries(PRICE_LABELS).map(([value]) => ({
      value,
      label: getPriceLabel(value),
    })),
  ];

  return (
  <div className="flex-1 overflow-y-auto p-4 space-y-5">
    <div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
        {t("places.category")}
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`flex items-center gap-2 p-2 rounded-lg border text-left text-[11px] font-bold transition-all ${
            selectedCategory === "all"
              ? "bg-gray-900 text-white border-gray-900"
              : "border-gray-200 text-gray-600 hover:border-gray-400"
          }`}
        >
          <Layers className="h-3.5 w-3.5" /> {t("common.all")}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              setSelectedCategory(
                selectedCategory === cat.id.toString()
                  ? "all"
                  : cat.id.toString(),
              )
            }
            className={`flex items-center gap-2 p-2 rounded-lg border text-left text-[11px] font-bold transition-all ${
              selectedCategory === cat.id.toString()
                ? "bg-gray-900 text-white border-gray-900"
                : "border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            <CatIcon id={cat.id} className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{cat.name}</span>
            <span className="ml-auto text-[9px] opacity-60 font-mono">
              {places.filter((p) => p.categoryId === cat.id).length}
            </span>
          </button>
        ))}
      </div>
    </div>

    <div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
        {t("common.filter")}
      </p>
      <div className="space-y-1">
        {PRICE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSelectedPrice(value)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-[12px] font-medium transition-all ${
              selectedPrice === value
                ? "bg-gray-900 text-white border-gray-900"
                : "border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            {label}
            {value !== "all" && (
              <span className="text-[10px] font-mono text-gray-400">
                {places.filter((p) => p.priceRange === value).length}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>

    <div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
        {t("common.other")}
      </p>
      <button
        onClick={() => setOnlyFeatured((v) => !v)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-[12px] font-medium transition-all ${
          onlyFeatured
            ? "bg-amber-50 border-amber-300 text-amber-800"
            : "border-gray-200 text-gray-600 hover:border-gray-400"
        }`}
      >
        <Star
          className={`h-4 w-4 ${onlyFeatured ? "fill-amber-400 text-amber-400" : "text-gray-400"}`}
        />
        {t("places.card.feature")}
        <span className="ml-auto text-[10px] font-mono text-gray-400">
          {places.filter((p) => p.isFeatured).length}
        </span>
      </button>
    </div>

    {hasActiveFilters && (
      <button
        onClick={onResetFilters}
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-200 text-red-600 bg-red-50 rounded-lg text-[12px] font-bold hover:bg-red-100 transition-colors"
      >
        <RefreshCw className="h-3.5 w-3.5" /> {t("map.clearFilters")}
      </button>
    )}
  </div>
);
};

export default FilterPanel;
