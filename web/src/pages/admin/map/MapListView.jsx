import { MapPin, Star } from "lucide-react";
import { PRICE_LABELS } from "@/modules/map";

const MapListView = ({ places, onPlaceClick }) => (
  <div className="flex-1 overflow-auto bg-gray-50 p-4">
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {places.map((place) => {
        const imgSrc = place.thumbnail || place.images?.[0]?.secureUrl || place.images?.[0]?.thumbnailUrl || place.images?.[0]?.imageData || place.images?.[0]?.url;
        const rating = Number(place.averageRating ?? place.ratingAvg ?? 0);
        const price = PRICE_LABELS[place.priceRange];
        return (
          <div
            key={place.id}
            onClick={() => onPlaceClick(place)}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group"
          >
            <div className="h-36 overflow-hidden relative bg-gray-100">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  alt=""
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MapPin className="h-10 w-10 text-gray-200" />
                </div>
              )}
              {place.category?.name && (
                <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {place.category.name}
                </span>
              )}
              {place.isFeatured && (
                <span className="absolute top-2 right-2 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  ★
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="text-[13px] font-bold text-gray-900 truncate">
                {place.name}
              </p>
              {place.address && (
                <p className="text-[11px] text-gray-400 truncate mt-0.5">
                  {place.address}
                </p>
              )}
              <div className="flex items-center justify-between mt-2">
                {rating > 0 ? (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-[11px] font-bold text-amber-600">
                      {rating.toFixed(1)}
                    </span>
                  </span>
                ) : (
                  <span />
                )}
                {price && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${price.cls}`}
                  >
                    {price.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default MapListView;
