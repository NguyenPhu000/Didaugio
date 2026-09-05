import { MapPin, Star, Eye, Navigation, ArrowUpRight } from "lucide-react";
import { PRICE_LABELS, getPriceLabel } from "@/modules/map";

const MapListView = ({ places, onPlaceClick }) => (
  <div className="flex-1 overflow-auto bg-[#F4F2EC] p-5">
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 max-w-[1700px] mx-auto">
      {places.map((place) => {
        const imgSrc =
          place.thumbnail ||
          place.images?.[0]?.secureUrl ||
          place.images?.[0]?.thumbnailUrl ||
          place.images?.[0]?.imageData ||
          place.images?.[0]?.url;
        const rating = Number(place.averageRating ?? place.ratingAvg ?? 0);
        const price = PRICE_LABELS[place.priceRange];

        return (
          <div
            key={place.id}
            onClick={() => onPlaceClick(place)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPlaceClick(place);
              }
            }}
            role="button"
            tabIndex={0}
            className="bg-white border border-black/[0.04] rounded-3xl p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between select-none"
          >
            <div>
              {/* Image Container */}
              <div className="h-40 rounded-2xl overflow-hidden relative bg-[#F8F7F3] border border-black/[0.04]">
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={place.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#F4F2EC]">
                    <MapPin className="h-10 w-10 text-slate-300 stroke-[1.5]" />
                  </div>
                )}

                {place.category?.name && (
                  <span className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/[0.1] shadow-2xs">
                    {place.category.name}
                  </span>
                )}

                {place.isFeatured && (
                  <span className="absolute top-2.5 right-2.5 bg-[#F3E600] text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                    <Star className="h-2.5 w-2.5 fill-slate-950" />
                    Nổi bật
                  </span>
                )}
              </div>

              {/* Title & Address */}
              <div className="pt-3 px-1">
                <div className="flex items-start justify-between gap-1.5">
                  <h4 className="text-xs font-extrabold text-slate-950 truncate leading-tight group-hover:text-black">
                    {place.name}
                  </h4>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-950 transition-colors shrink-0" />
                </div>
                {place.address && (
                  <p className="text-[11px] text-slate-400 truncate mt-1 flex items-center gap-1 font-medium">
                    <Navigation className="h-2.5 w-2.5 shrink-0 text-slate-300" />
                    {place.address}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="flex items-center justify-between pt-3 px-1 mt-2 border-t border-black/[0.03]">
              <div className="flex items-center gap-1.5">
                {rating > 0 && (
                  <span className="inline-flex items-center gap-0.5 bg-[#FFFDE6] px-2 py-0.5 rounded-full border border-[#F3E600]/80">
                    <Star className="h-2.5 w-2.5 fill-slate-950 text-slate-950" />
                    <span className="text-[10px] font-mono font-bold text-slate-950 tabular-nums">
                      {rating.toFixed(1)}
                    </span>
                  </span>
                )}
                {price && (
                  <span
                    className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${price.cls}`}
                  >
                    {getPriceLabel(place.priceRange)}
                  </span>
                )}
              </div>

              {place.viewCount !== undefined && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 tabular-nums">
                  <Eye className="h-3 w-3 text-slate-300" />
                  {Number(place.viewCount).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default MapListView;
