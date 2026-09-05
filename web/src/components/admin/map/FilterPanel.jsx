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
    <div className="flex-1 overflow-y-auto p-4 space-y-5 text-slate-900">
      {/* Category Section */}
      <div>
        <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
          {t("places.category")}
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-bold transition-all ${
              selectedCategory === "all"
                ? "bg-slate-950 text-white shadow-2xs"
                : "bg-[#F8F7F3] border border-black/[0.04] text-slate-700 hover:bg-[#FAF9F5]"
            }`}
          >
            <Layers className="h-3.5 w-3.5" /> {t("common.all")}
          </button>
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === cat.id.toString()
                    ? "all"
                    : cat.id.toString(),
                )
              }
              className={`flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-bold transition-all truncate ${
                selectedCategory === cat.id.toString()
                  ? "bg-slate-950 text-white shadow-2xs"
                  : "bg-[#F8F7F3] border border-black/[0.04] text-slate-700 hover:bg-[#FAF9F5]"
              }`}
            >
              <CatIcon id={cat.id} className="h-3.5 w-3.5 shrink-0 text-[#F3E600]" />
              <span className="truncate">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Section */}
      <div>
        <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
          {t("places.priceRange")}
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {PRICE_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => setSelectedPrice(opt.value)}
              className={`p-2.5 rounded-xl text-center text-xs font-bold transition-all ${
                selectedPrice === opt.value
                  ? "bg-slate-950 text-white shadow-2xs"
                  : "bg-[#F8F7F3] border border-black/[0.04] text-slate-700 hover:bg-[#FAF9F5]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Filter */}
      <div>
        <button
          type="button"
          onClick={() => setOnlyFeatured(!onlyFeatured)}
          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
            onlyFeatured
              ? "bg-[#FFFDE6] border-[#F3E600]/80 text-slate-950 shadow-2xs"
              : "bg-[#F8F7F3] border-black/[0.04] text-slate-700 hover:bg-[#FAF9F5]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Star className={`h-4 w-4 ${onlyFeatured ? "fill-slate-950 text-slate-950" : "text-slate-400"}`} />
            <span className="text-xs font-bold">{t("map.markers.featured")}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {places.filter((p) => p.isFeatured).length}
          </span>
        </button>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t("admin.map.clearFilters")}
        </button>
      )}
    </div>
  );
};

export default FilterPanel;
