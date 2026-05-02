import { MapPin, Star, Navigation, ChevronRight } from "lucide-react";
import { PRICE_LABELS } from "@/modules/map";

const PlaceCard = ({ place, onClick }) => {
  const price = PRICE_LABELS[place.priceRange];
  const rating = Number(place.averageRating ?? place.ratingAvg ?? 0);
  const imgSrc = place.thumbnail || place.images?.[0]?.secureUrl || place.images?.[0]?.thumbnailUrl || place.images?.[0]?.imageData || place.images?.[0]?.url;

  return (
    <button
      onClick={() => onClick(place)}
      className="w-full text-left flex gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors group"
    >
      <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        {imgSrc ? (
          <img
            src={imgSrc}
            className="w-full h-full object-cover"
            alt=""
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="h-5 w-5 text-gray-300" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-gray-900 truncate leading-tight">
          {place.name}
        </p>
        {place.address && (
          <p className="text-[11px] text-gray-400 truncate mt-0.5 flex items-center gap-1">
            <Navigation className="h-2.5 w-2.5 shrink-0" />
            {place.address}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {rating > 0 && (
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-bold text-amber-600">
                {rating.toFixed(1)}
              </span>
            </span>
          )}
          {price && (
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${price.cls}`}
            >
              {price.label}
            </span>
          )}
          {place.isFeatured && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
              ★ NỔI BẬT
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300 self-center group-hover:text-gray-600 transition-colors shrink-0" />
    </button>
  );
};

export default PlaceCard;
