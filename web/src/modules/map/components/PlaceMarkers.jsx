import { useState, useMemo } from "react";
import { Marker, Popup } from "../adapters";
import { useMapContext } from "../context/MapProvider";
import { MapPin, Star, Eye, X } from "lucide-react";

const CATEGORY_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f43f5e",
];

const categoryColor = (categoryId) =>
  CATEGORY_COLORS[((categoryId || 0) - 1) % CATEGORY_COLORS.length] ||
  "#6b7280";

const StarRating = ({ value }) => {
  const full = Math.round(value || 0);
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i <= full ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </span>
  );
};

const PlaceMarkers = () => {
  const { filteredPlaces, flyTo } = useMapContext();
  const [popupInfo, setPopupInfo] = useState(null);

  const handleMarkerClick = (e, place) => {
    e.originalEvent.stopPropagation();
    setPopupInfo(place);
    flyTo({ lat: Number(place.latitude), lng: Number(place.longitude) }, 15);
  };

  return (
    <>
      {filteredPlaces.map((place) =>
        place.latitude && place.longitude ? (
          <Marker
            key={place.id}
            latitude={Number(place.latitude)}
            longitude={Number(place.longitude)}
            anchor="bottom"
            onClick={(e) => handleMarkerClick(e, place)}
          >
            <div className="group cursor-pointer relative flex flex-col items-center">
              <div
                className="w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-transform group-hover:scale-125 group-hover:shadow-xl"
                style={{ backgroundColor: categoryColor(place.categoryId) }}
              >
                <MapPin className="h-3.5 w-3.5 text-white fill-white" />
              </div>
              {place.isFeatured && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 border border-white" />
              )}
            </div>
          </Marker>
        ) : null,
      )}

      {popupInfo && (
        <Popup
          anchor="top"
          latitude={Number(popupInfo.latitude)}
          longitude={Number(popupInfo.longitude)}
          onClose={() => setPopupInfo(null)}
          closeOnClick={false}
          offset={12}
          maxWidth="280px"
        >
          <div className="relative font-sans">
            <button
              onClick={() => setPopupInfo(null)}
              className="absolute top-1 right-1 z-10 bg-white/80 rounded-full p-0.5 hover:bg-white"
            >
              <X className="h-3.5 w-3.5 text-gray-500" />
            </button>

            <div className="relative h-28 bg-gray-100 overflow-hidden">
              {popupInfo.images?.[0]?.url ? (
                <img
                  src={popupInfo.images[0].url}
                  className="w-full h-full object-cover"
                  alt={popupInfo.name}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    backgroundColor: categoryColor(popupInfo.categoryId) + "22",
                  }}
                >
                  <MapPin
                    className="h-10 w-10"
                    style={{ color: categoryColor(popupInfo.categoryId) }}
                  />
                </div>
              )}
              {popupInfo.category?.name && (
                <span
                  className="absolute bottom-2 left-2 px-1.5 py-0.5 text-[9px] font-black uppercase text-white"
                  style={{
                    backgroundColor: categoryColor(popupInfo.categoryId),
                  }}
                >
                  {popupInfo.category.name}
                </span>
              )}
            </div>

            <div className="p-3">
              <h3 className="font-black text-sm text-gray-900 line-clamp-1 mb-0.5">
                {popupInfo.name}
              </h3>
              {popupInfo.address && (
                <p className="text-[11px] text-gray-500 line-clamp-1 mb-2">
                  {popupInfo.address}
                </p>
              )}
              <div className="flex items-center justify-between">
                <StarRating
                  value={popupInfo.averageRating ?? popupInfo.ratingAvg}
                />
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <Eye className="h-3 w-3" />
                  {popupInfo.viewCount || 0}
                </span>
              </div>
            </div>
          </div>
        </Popup>
      )}
    </>
  );
};

export default PlaceMarkers;
