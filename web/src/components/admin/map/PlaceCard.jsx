import { MapPin, Star, Navigation, ArrowUpRight, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PRICE_LABELS, getPriceLabel, getCategoryConfig } from "@/modules/map";

const PlaceCard = ({ place, onClick }) => {
  const { t } = useTranslation();
  const price = PRICE_LABELS[place.priceRange];
  const rating = Number(place.averageRating ?? place.ratingAvg ?? 0);
  const categoryConfig = getCategoryConfig(place.categoryId);
  const imgSrc =
    place.thumbnail ||
    place.images?.[0]?.secureUrl ||
    place.images?.[0]?.thumbnailUrl ||
    place.images?.[0]?.imageData ||
    place.images?.[0]?.url;

  return (
    <div
      onClick={() => onClick(place)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(place);
        }
      }}
      role="button"
      tabIndex={0}
      className="w-full text-left p-3 border-b border-black/[0.03] hover:bg-[#FAF9F5] transition-all duration-200 group relative flex gap-3 cursor-pointer select-none"
    >
      {/* Active hover left accent bar */}
      <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#F3E600] rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Place Image */}
      <div className="w-16 h-16 flex-shrink-0 rounded-2xl overflow-hidden bg-[#F8F7F3] border border-black/[0.04] shadow-2xs relative group-hover:scale-103 transition-transform duration-200">
        {imgSrc ? (
          <img
            src={imgSrc}
            className="w-full h-full object-cover"
            alt={place.name}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#F4F2EC]">
            <MapPin className="h-5 w-5 text-slate-300 stroke-[1.5]" />
          </div>
        )}
        {place.isFeatured && (
          <div className="absolute top-1 right-1 bg-slate-950/80 backdrop-blur-xs text-[#F3E600] rounded-full p-0.5 shadow-xs">
            <Star className="h-2.5 w-2.5 fill-[#F3E600]" />
          </div>
        )}
      </div>

      {/* Place Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <p className="text-xs font-extrabold text-slate-950 truncate leading-tight group-hover:text-black">
              {place.name}
            </p>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-950 transition-colors shrink-0 opacity-0 group-hover:opacity-100" />
          </div>

          {place.address && (
            <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1 font-medium">
              <Navigation className="h-2.5 w-2.5 shrink-0 text-slate-300" />
              {place.address}
            </p>
          )}
        </div>

        {/* Badges & Stats */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {rating > 0 && (
            <span className="inline-flex items-center gap-0.5 bg-[#FFFDE6] px-1.5 py-0.5 rounded-full border border-[#F3E600]/80">
              <Star className="h-2.5 w-2.5 fill-slate-950 text-slate-950" />
              <span className="text-[10px] font-mono font-bold text-slate-950 tabular-nums">
                {rating.toFixed(1)}
              </span>
            </span>
          )}

          {price && (
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${price.cls}`}
            >
              {getPriceLabel(place.priceRange)}
            </span>
          )}

          {place.viewCount !== undefined && (
            <span className="inline-flex items-center gap-0.5 text-[9.5px] font-mono text-slate-400 tabular-nums ml-auto">
              <Eye className="h-2.5 w-2.5 text-slate-300" />
              {Number(place.viewCount).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaceCard;
