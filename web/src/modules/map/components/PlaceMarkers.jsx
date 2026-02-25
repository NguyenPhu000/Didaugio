import { useState } from "react";
import { Marker, Popup } from "../adapters";
import { useMapContext } from "../context/MapProvider";
import {
  MapPin,
  Star,
  Eye,
  X,
  Phone,
  Globe,
  Navigation,
  Utensils,
  Hotel,
  TreePine,
  ShoppingBag,
  Landmark,
  Coffee,
  Tent,
  Leaf,
} from "lucide-react";

// ── Category config ──────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  1: { color: "#ef4444", bg: "#fef2f2", Icon: Utensils, label: "Ẩm thực" },
  2: { color: "#f97316", bg: "#fff7ed", Icon: Hotel, label: "Lưu trú" },
  3: { color: "#8b5cf6", bg: "#f5f3ff", Icon: Landmark, label: "Tham quan" },
  4: { color: "#06b6d4", bg: "#ecfeff", Icon: ShoppingBag, label: "Mua sắm" },
  5: { color: "#22c55e", bg: "#f0fdf4", Icon: TreePine, label: "Sinh thái" },
  6: { color: "#ec4899", bg: "#fdf2f8", Icon: Coffee, label: "Cafe" },
  7: { color: "#f59e0b", bg: "#fffbeb", Icon: Tent, label: "Homestay" },
  8: { color: "#14b8a6", bg: "#f0fdfa", Icon: Leaf, label: "Khu sinh thái" },
  13: { color: "#ef4444", bg: "#fef2f2", Icon: Utensils, label: "Ẩm thực" },
};

const getConfig = (categoryId) =>
  CATEGORY_CONFIG[categoryId] || {
    color: "#6366f1",
    bg: "#eef2ff",
    Icon: MapPin,
    label: "Địa điểm",
  };

const PRICE_LABELS = {
  FREE: { label: "Miễn phí", color: "#22c55e" },
  BUDGET: { label: "Bình dân", color: "#3b82f6" },
  MODERATE: { label: "Trung bình", color: "#f59e0b" },
  EXPENSIVE: { label: "Cao cấp", color: "#f97316" },
  LUXURY: { label: "Sang trọng", color: "#8b5cf6" },
};

// ── Pin marker ───────────────────────────────────────────────────────────────
const PlacePin = ({ place, isActive }) => {
  const { color, Icon } = getConfig(place.categoryId);
  return (
    <div
      className="cursor-pointer group select-none"
      style={{
        filter: isActive ? `drop-shadow(0 0 8px ${color}99)` : undefined,
      }}
    >
      <div className="relative flex flex-col items-center transition-transform duration-200 group-hover:-translate-y-1">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center border-[2.5px] border-white transition-all duration-200 group-hover:scale-110"
          style={{
            backgroundColor: color,
            boxShadow: `0 4px 12px ${color}55, 0 2px 4px rgba(0,0,0,0.2)`,
          }}
        >
          <Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        {/* Tail */}
        <div
          className="w-0 h-0"
          style={{
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: `7px solid ${color}`,
            marginTop: -1,
          }}
        />
        {place.isFeatured && (
          <div
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow"
            style={{ backgroundColor: "#f59e0b" }}
          >
            <Star className="h-2 w-2 text-white fill-white" />
          </div>
        )}
      </div>
    </div>
  );
};

// ── Star rating ──────────────────────────────────────────────────────────────
const Stars = ({ value = 0 }) => {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= full
              ? "fill-amber-400 text-amber-400"
              : i === full + 1 && half
                ? "fill-amber-200 text-amber-400"
                : "text-gray-200 fill-gray-200"
          }`}
        />
      ))}
      {value > 0 && (
        <span className="ml-1 text-[11px] font-bold text-amber-600">
          {Number(value).toFixed(1)}
        </span>
      )}
    </span>
  );
};

// ── Popup card ───────────────────────────────────────────────────────────────
const PlacePopup = ({ place, onClose }) => {
  const { color, bg, label } = getConfig(place.categoryId);
  const price = PRICE_LABELS[place.priceRange];
  const rating = Number(place.averageRating ?? place.ratingAvg ?? 0);
  const imgSrc = place.thumbnail || place.images?.[0]?.url;

  return (
    <div
      className="font-sans w-[300px] overflow-hidden rounded-xl bg-white"
      style={{ margin: -10 }}
    >
      {/* Image */}
      <div
        className="relative h-[148px] overflow-hidden"
        style={{ backgroundColor: bg }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={place.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <MapPin className="h-12 w-12 opacity-20" style={{ color }} />
            <span className="text-xs font-medium opacity-30" style={{ color }}>
              Chưa có ảnh
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {/* Category badge */}
        <span
          className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wide shadow-sm"
          style={{ backgroundColor: color }}
        >
          {place.category?.name || label}
        </span>
        {/* Featured */}
        {place.isFeatured && (
          <span className="absolute top-2.5 right-9 flex items-center gap-1 bg-amber-400 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
            <Star className="h-2.5 w-2.5 fill-white" /> NỔI BẬT
          </span>
        )}
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow transition-colors"
        >
          <X className="h-3.5 w-3.5 text-gray-600" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-black text-[15px] text-gray-900 line-clamp-2 leading-tight mb-1">
          {place.name}
        </h3>
        {place.address && (
          <p className="flex items-start gap-1.5 text-[12px] text-gray-500 mb-3 line-clamp-1">
            <Navigation className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400" />
            {place.address}
          </p>
        )}

        {/* Rating + views */}
        <div className="flex items-center justify-between mb-3">
          <Stars value={rating} />
          <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
            <Eye className="h-3.5 w-3.5" />
            {(place.viewCount || 0).toLocaleString()}
          </div>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {price && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
              style={{
                color: price.color,
                borderColor: price.color + "44",
                backgroundColor: price.color + "11",
              }}
            >
              {price.label}
            </span>
          )}
          {place.isVerified && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-sky-200 text-sky-600 bg-sky-50">
              ✓ Đã xác thực
            </span>
          )}
          {place.district?.name && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-gray-200 text-gray-500 bg-gray-50">
              {place.district.name}
            </span>
          )}
        </div>

        {/* Contact */}
        {(place.phone || place.website) && (
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            {place.phone && (
              <a
                href={`tel:${place.phone}`}
                className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-900 transition-colors font-medium"
              >
                <Phone className="h-3.5 w-3.5" />
                {place.phone}
              </a>
            )}
            {place.website && (
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] text-blue-500 hover:text-blue-700 transition-colors font-medium ml-auto"
              >
                <Globe className="h-3.5 w-3.5" />
                Website
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────
const PlaceMarkers = () => {
  const { filteredPlaces, flyTo } = useMapContext();
  const [activePlace, setActivePlace] = useState(null);

  const handleClick = (e, place) => {
    e.originalEvent?.stopPropagation();
    setActivePlace(place);
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
            onClick={(e) => handleClick(e, place)}
          >
            <PlacePin place={place} isActive={activePlace?.id === place.id} />
          </Marker>
        ) : null,
      )}

      {activePlace && (
        <Popup
          anchor="top"
          latitude={Number(activePlace.latitude)}
          longitude={Number(activePlace.longitude)}
          onClose={() => setActivePlace(null)}
          closeOnClick={false}
          offset={16}
          maxWidth="320px"
        >
          <PlacePopup
            place={activePlace}
            onClose={() => setActivePlace(null)}
          />
        </Popup>
      )}
    </>
  );
};

export default PlaceMarkers;
