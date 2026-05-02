import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Source, Layer, Marker, Popup } from "../adapters";
import { useMapContext } from "../hooks/useMapContext";
import {
  getCategoryConfig,
  CATEGORY_CONFIG,
  DEFAULT_CATEGORY,
  PRICE_LABELS,
} from "../config/placeMapConfig";
import {
  MapPin,
  Star,
  Eye,
  X,
  Phone,
  Globe,
  Navigation,
  ExternalLink,
  Navigation2,
  Flag,
} from "lucide-react";

// ─── GL layer constants ──────────────────────────────────────────────────────

/** MapLibre data-driven expression: match categoryId → brand colour */
const buildCategoryColorExpr = () => {
  const expr = ["match", ["to-number", ["get", "categoryId"]]];
  Object.entries(CATEGORY_CONFIG).forEach(([id, { color }]) => {
    expr.push(parseInt(id, 10), color);
  });
  expr.push(DEFAULT_CATEGORY.color); // fallback
  return expr;
};
const CATEGORY_COLOR_EXPR = buildCategoryColorExpr();

const CLUSTER_CIRCLE_LAYER = {
  id: "place-clusters",
  type: "circle",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": [
      "step",
      ["get", "point_count"],
      "#334155", // 0–9
      10,
      "#1d4ed8", // 10–29
      30,
      "#7c3aed", // 30+
    ],
    "circle-radius": ["step", ["get", "point_count"], 20, 10, 26, 30, 32],
    "circle-stroke-width": 3,
    "circle-stroke-color": "#ffffff",
    "circle-opacity": 0.93,
  },
};

const CLUSTER_COUNT_LAYER = {
  id: "place-cluster-count",
  type: "symbol",
  filter: ["has", "point_count"],
  layout: {
    "text-field": "{point_count_abbreviated}",
    "text-font": ["Noto Sans Regular"],
    "text-size": 13,
    "text-allow-overlap": true,
  },
  paint: { "text-color": "#ffffff" },
};

const UNCLUSTERED_CIRCLE_LAYER = {
  id: "place-unclustered",
  type: "circle",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": CATEGORY_COLOR_EXPR,
    "circle-radius": 9,
    "circle-stroke-width": 2.5,
    "circle-stroke-color": "#ffffff",
    "circle-opacity": 0.95,
  },
};

/** Outer glow ring for hovered/active place */
const UNCLUSTERED_ACTIVE_LAYER = {
  id: "place-unclustered-active",
  type: "circle",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": "transparent",
    "circle-radius": 14,
    "circle-stroke-width": 2,
    "circle-stroke-color": CATEGORY_COLOR_EXPR,
    "circle-stroke-opacity": [
      "case",
      ["boolean", ["feature-state", "active"], false],
      0.7,
      0,
    ],
  },
};

/** Small amber dot for featured places */
const FEATURED_DOT_LAYER = {
  id: "place-featured",
  type: "circle",
  filter: [
    "all",
    ["!", ["has", "point_count"]],
    ["==", ["get", "isFeatured"], true],
  ],
  paint: {
    "circle-color": "#f59e0b",
    "circle-radius": 4,
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 1.5,
    "circle-translate": [7, -7],
    "circle-opacity": 0.95,
  },
};

/** Zoom threshold – switch from GL dots to DOM image pins */
const CARD_ZOOM = 14;

// ─── Popup UI (DOM – only one shown at a time, no perf issue) ────────────────

const Stars = ({ value = 0 }) => {
  const full = Math.floor(value);
  const half = value - full >= 0.5;

  const getStarClass = (index) => {
    if (index <= full) return "fill-amber-400 text-amber-400";
    if (index === full + 1 && half) return "fill-amber-200 text-amber-400";
    return "text-gray-200 fill-gray-200";
  };

  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${getStarClass(i)}`} />
      ))}
      {value > 0 && (
        <span className="ml-1 text-[11px] font-bold text-amber-600">
          {Number(value).toFixed(1)}
        </span>
      )}
    </span>
  );
};

const PlacePopup = ({ place, onClose }) => {
  const { color, bg, label } = getCategoryConfig(place.categoryId);
  const { selectPlace } = useMapContext();
  const price = PRICE_LABELS[place.priceRange];
  const rating = Number(place.averageRating ?? place.ratingAvg ?? 0);
  const imgSrc = place.thumbnail || place.images?.[0]?.secureUrl || place.images?.[0]?.thumbnailUrl || place.images?.[0]?.imageData || place.images?.[0]?.url;

  return (
    <div
      className="font-sans w-[300px] overflow-hidden rounded-xl bg-white"
      style={{ margin: -10 }}
    >
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
        <span
          className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wide shadow-sm"
          style={{ backgroundColor: color }}
        >
          {place.category?.name || label}
        </span>
        {place.isFeatured && (
          <span className="absolute top-2.5 right-9 flex items-center gap-1 bg-amber-400 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
            <Star className="h-2.5 w-2.5 fill-white" /> NỔI BẬT
          </span>
        )}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow transition-colors"
        >
          <X className="h-3.5 w-3.5 text-gray-600" />
        </button>
      </div>

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

        <div className="flex items-center justify-between mb-3">
          <Stars value={rating} />
          <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
            <Eye className="h-3.5 w-3.5" />
            {(place.viewCount || 0).toLocaleString()}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {price && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
              style={{
                color: price.color,
                borderColor: `${price.color}44`,
                backgroundColor: `${price.color}11`,
              }}
            >
              {price.label}
            </span>
          )}
          {place.isVerified && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-sky-200 text-sky-600 bg-sky-50">
              Đã xác thực
            </span>
          )}
          {place.district?.name && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-gray-200 text-gray-500 bg-gray-50">
              {place.district.name}
            </span>
          )}
        </div>

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

        {selectPlace && (
          <button
            onClick={() => {
              onClose();
              selectPlace(place);
            }}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-900 hover:bg-gray-700 text-white text-[12px] font-bold transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Xem chi tiết
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Routing Picker (portal-based — renders outside MapLibre DOM entirely) ────
// Uses createPortal to document.body with fixed positioning.
// This bypasses all MapLibre event capture.

const RoutingPicker = ({
  place,
  screenX,
  screenY,
  onClose,
  onSetOrigin,
  onSetDestination,
}) => {
  const { color, label } = getCategoryConfig(place.categoryId);

  // Clamp so the card doesn't overflow the viewport
  const cardW = 248;
  const cardH = 240;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const left = Math.min(Math.max(screenX - cardW / 2, 8), vw - cardW - 8);
  const top = Math.min(Math.max(screenY - cardH - 16, 8), vh - cardH - 8);

  return createPortal(
    <div
      style={{ left, top, width: cardW, zIndex: 9999, position: "fixed" }}
      className="font-sans rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden"
    >
      {/* Place info */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-start gap-2 pr-5">
          <span
            className="mt-1 shrink-0 w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <div className="min-w-0">
            <p className="text-[13px] font-black text-gray-900 leading-tight line-clamp-2">
              {place.name}
            </p>
            {place.address && (
              <p className="mt-0.5 text-[11px] text-gray-400 line-clamp-1 flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {place.address}
              </p>
            )}
            <p className="mt-0.5 text-[10px] font-semibold" style={{ color }}>
              {place.category?.name || label}
            </p>
          </div>
        </div>
      </div>

      {/* Route action buttons */}
      <div className="p-3 flex flex-col gap-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">
          Chọn vai trò cho địa điểm này
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSetOrigin();
          }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-green-50 hover:bg-green-100 border border-green-200 text-left transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
            <Navigation2 className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-green-800">
              Điểm xuất phát
            </p>
            <p className="text-[10px] text-green-600">Bắt đầu từ đây</p>
          </div>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSetDestination();
          }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-left transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0">
            <Flag className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-red-800">Điểm đến</p>
            <p className="text-[10px] text-red-600">Kết thúc tại đây</p>
          </div>
        </button>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>,
    document.body,
  );
};

// ─── Custom DOM Pin (image + name-on-hover) ──────────────────────────────────

const PlacePin = ({ place, isActive, onClick }) => {
  const { color } = getCategoryConfig(place.categoryId);
  const imgSrc = place.thumbnail || place.images?.[0]?.secureUrl || place.images?.[0]?.thumbnailUrl || place.images?.[0]?.imageData || place.images?.[0]?.url;
  let pinStateClass = "border-2 border-white group-hover:border-blue-400";
  if (isActive) {
    pinStateClass = "border-[3px] border-blue-500 ring-2 ring-blue-300";
  } else if (place.isFeatured) {
    pinStateClass = "border-[3px] border-amber-400";
  }

  let stemColor = "#ffffff";
  if (isActive) {
    stemColor = "#3b82f6";
  } else if (place.isFeatured) {
    stemColor = "#f59e0b";
  }

  return (
    <div
      className={`flex flex-col items-center group cursor-pointer transition-transform duration-200
        ${isActive ? "scale-110 z-50" : "hover:scale-110 z-10"}`}
      onClick={onClick}
    >
      {/* Circular thumbnail */}
      <div
        className={`w-10 h-10 rounded-full overflow-hidden shadow-lg transition-all duration-200
          ${pinStateClass}`}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${color}22` }}
          >
            <MapPin className="w-4 h-4" style={{ color }} />
          </div>
        )}
      </div>

      {/* Arrow stem */}
      <div
        className="w-0 h-0 -mt-[1px]"
        style={{
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: `8px solid ${stemColor}`,
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,.15))",
        }}
      />

      {/* Name label – visible on hover */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-0.5 pointer-events-none">
        <span className="px-1.5 py-0.5 rounded bg-gray-900/80 text-white text-[10px] font-bold whitespace-nowrap max-w-[120px] truncate block">
          {place.name}
        </span>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const CLICK_LAYERS = [
  "place-clusters",
  "place-cluster-count",
  "place-unclustered",
  "place-featured",
];

const PlaceMarkers = () => {
  const { filteredPlaces, places, flyTo, mapRef, routingMode, routing } =
    useMapContext();
  const [activePlace, setActivePlace] = useState(null);
  // routingPickerState: { place, x, y } where x/y are fixed screen coords
  const [routingPickerState, setRoutingPickerState] = useState(null);
  const [zoom, setZoom] = useState(null);
  const activeFeatIdRef = useRef(null);

  // Stable refs for routing (prevents stale closure in map.on handler)
  const routingModeRef = useRef(routingMode);
  useEffect(() => {
    routingModeRef.current = routingMode;
  }, [routingMode]);
  const routingRef = useRef(routing);
  useEffect(() => {
    routingRef.current = routing;
  }, [routing]);
  const setRoutingPickerRef = useRef(setRoutingPickerState);

  // ── Zoom tracking ─────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    let frameId = null;
    const setZoomDeferred = (value) => {
      frameId = requestAnimationFrame(() => {
        setZoom(value);
      });
    };

    const onZoom = () => setZoom(map.getZoom());
    if (map.loaded()) setZoomDeferred(map.getZoom());
    else map.once("load", () => setZoomDeferred(map.getZoom()));
    map.on("zoom", onZoom);

    return () => {
      if (frameId != null) cancelAnimationFrame(frameId);
      map.off("zoom", onZoom);
    };
  }, [mapRef]);

  const isCardMode = zoom != null && zoom >= CARD_ZOOM;
  const isCardModeRef = useRef(isCardMode);
  useEffect(() => {
    isCardModeRef.current = isCardMode;
  }, [isCardMode]);

  /** GeoJSON FeatureCollection from filteredPlaces — recreated only when list changes */
  const geojson = useMemo(
    () => ({
      type: "FeatureCollection",
      features: filteredPlaces
        .filter((p) => p.latitude && p.longitude)
        .map((p) => ({
          type: "Feature",
          id: p.id,
          geometry: {
            type: "Point",
            coordinates: [Number(p.longitude), Number(p.latitude)],
          },
          properties: {
            id: p.id,
            categoryId: p.categoryId ?? 0,
            isFeatured: !!p.isFeatured,
          },
        })),
    }),
    [filteredPlaces],
  );

  /** id → full place object lookup for popup data */
  const placeById = useMemo(() => {
    const m = {};
    places.forEach((p) => {
      m[p.id] = p;
    });
    return m;
  }, [places]);

  /** Keep a stable ref to the latest placeById so the click handler never goes stale */
  const placeByIdRef = useRef(placeById);
  useEffect(() => {
    placeByIdRef.current = placeById;
  }, [placeById]);

  const flyToRef = useRef(flyTo);
  useEffect(() => {
    flyToRef.current = flyTo;
  }, [flyTo]);

  const setActivePlaceRef = useRef(setActivePlace);

  // ── Visible bounds tracking (DOM markers only rendered in viewport) ────────
  const [visibleBounds, setVisibleBounds] = useState(null);
  useEffect(() => {
    let frameId = null;

    if (!isCardMode) {
      frameId = requestAnimationFrame(() => {
        setVisibleBounds(null);
      });
      return;
    }

    const map = mapRef.current?.getMap?.();
    if (!map) return;

    const update = () => {
      frameId = requestAnimationFrame(() => {
        setVisibleBounds(map.getBounds());
      });
    };

    update();
    map.on("moveend", update);
    map.on("zoomend", update);

    return () => {
      if (frameId != null) cancelAnimationFrame(frameId);
      map.off("moveend", update);
      map.off("zoomend", update);
    };
  }, [mapRef, isCardMode]);

  const visiblePlaces = useMemo(() => {
    if (!isCardMode || !visibleBounds) return [];
    return filteredPlaces.filter((p) => {
      if (!p.latitude || !p.longitude) return false;
      const lng = Number(p.longitude);
      const lat = Number(p.latitude);
      return (
        lng >= visibleBounds.getWest() &&
        lng <= visibleBounds.getEast() &&
        lat >= visibleBounds.getSouth() &&
        lat <= visibleBounds.getNorth()
      );
    });
  }, [isCardMode, visibleBounds, filteredPlaces]);

  // ── Dynamic paint – fade GL dots when DOM pins are active ──────────────────
  const unclusteredPaint = useMemo(
    () => ({
      ...UNCLUSTERED_CIRCLE_LAYER.paint,
      "circle-opacity": isCardMode ? 0 : 0.95,
      "circle-stroke-opacity": isCardMode ? 0 : 1,
    }),
    [isCardMode],
  );

  const activePaint = useMemo(
    () => ({
      ...UNCLUSTERED_ACTIVE_LAYER.paint,
      "circle-stroke-opacity": isCardMode
        ? 0
        : UNCLUSTERED_ACTIVE_LAYER.paint["circle-stroke-opacity"],
    }),
    [isCardMode],
  );

  const featuredPaint = useMemo(
    () => ({
      ...FEATURED_DOT_LAYER.paint,
      "circle-opacity": isCardMode ? 0 : 0.95,
      "circle-stroke-opacity": isCardMode ? 0 : 1,
    }),
    [isCardMode],
  );

  const clearActiveState = useCallback((map, id) => {
    if (id == null || !map) return;
    try {
      map.setFeatureState({ source: "places-source", id }, { active: false });
    } catch {
      // Ignore when source/state is unavailable during transient map updates.
    }
  }, []);

  /**
   * Stable click handler — reads latest data via refs so we never need to
   * re-attach the MapLibre listener on every render.
   */
  const handleClick = useCallback(
    (e) => {
      const map = mapRef.current?.getMap?.();
      if (!map) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: CLICK_LAYERS,
      });
      if (!features.length) return;

      // Stop MapBase boundary click from also firing
      e.originalEvent?.stopPropagation?.();

      const feature = features[0];

      // ── Cluster → zoom in ──────────────────────────────────────────────────
      if (feature.properties.cluster) {
        const source = map.getSource("places-source");
        source?.getClusterExpansionZoom(
          feature.properties.cluster_id,
          (err, zoom) => {
            if (err || zoom == null) return;
            map.easeTo({
              center: feature.geometry.coordinates,
              zoom: zoom + 0.5,
              duration: 500,
            });
          },
        );
        return;
      }

      // ── Individual place → show popup ──────────────────────────────────────
      // In card mode, DOM Marker handles individual place clicks
      if (isCardModeRef.current) return;

      const placeId = feature.properties.id;
      const placeData = placeByIdRef.current[placeId];
      if (!placeData) return;

      // Clear previous glow ring
      clearActiveState(map, activeFeatIdRef.current);

      // Set new glow ring
      try {
        map.setFeatureState(
          { source: "places-source", id: placeId },
          { active: true },
        );
      } catch {
        // Ignore when source/state is unavailable during transient map updates.
      }
      activeFeatIdRef.current = placeId;

      // Routing mode → show compact picker; normal mode → full popup
      if (routingModeRef.current) {
        setActivePlaceRef.current(null);
        // Capture screen coords from the native event for portal positioning
        const clientX = e.originalEvent?.clientX ?? 0;
        const clientY = e.originalEvent?.clientY ?? 0;
        setRoutingPickerRef.current({
          place: placeData,
          x: clientX,
          y: clientY,
        });
      } else {
        setRoutingPickerRef.current(null);
        setActivePlaceRef.current(placeData);
      }
      flyToRef.current(
        { lat: Number(placeData.latitude), lng: Number(placeData.longitude) },
        15,
      );
    },
    [mapRef, clearActiveState],
  );

  /** Attach click + cursor listeners once when the map is loaded; stable via refs */
  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    const showPointer = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const resetPointer = () => {
      map.getCanvas().style.cursor = "";
    };

    const attach = () => {
      map.on("click", handleClick);
      CLICK_LAYERS.forEach((layer) => {
        map.on("mouseenter", layer, showPointer);
        map.on("mouseleave", layer, resetPointer);
      });
    };
    const detach = () => {
      map.off("click", handleClick);
      CLICK_LAYERS.forEach((layer) => {
        map.off("mouseenter", layer, showPointer);
        map.off("mouseleave", layer, resetPointer);
      });
    };

    if (map.loaded()) {
      attach();
    } else {
      map.once("load", attach);
    }
    return detach;
  }, [mapRef, handleClick]);

  const handlePopupClose = useCallback(() => {
    const map = mapRef.current?.getMap?.();
    clearActiveState(map, activeFeatIdRef.current);
    activeFeatIdRef.current = null;
    setActivePlace(null);
    setRoutingPickerState(null);
  }, [mapRef, clearActiveState]);

  /** Click on a DOM Marker pin */
  const handlePinClick = useCallback(
    (place, e) => {
      e?.stopPropagation?.();
      const map = mapRef.current?.getMap?.();

      clearActiveState(map, activeFeatIdRef.current);
      activeFeatIdRef.current = place.id;
      try {
        map?.setFeatureState(
          { source: "places-source", id: place.id },
          { active: true },
        );
      } catch {
        // Ignore when source/state is unavailable during transient map updates.
      }

      if (routingModeRef.current) {
        setActivePlace(null);
        const clientX = e?.clientX ?? 0;
        const clientY = e?.clientY ?? 0;
        setRoutingPickerState({ place, x: clientX, y: clientY });
      } else {
        setRoutingPickerState(null);
        setActivePlace(place);
      }
      flyToRef.current(
        { lat: Number(place.latitude), lng: Number(place.longitude) },
        Math.max(zoom || 15, 15),
      );
    },
    [mapRef, clearActiveState, zoom],
  );

  // Close routing picker when clicking map background
  useEffect(() => {
    if (!routingPickerState) return;
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    const onMapClick = () => setRoutingPickerState(null);
    map.on("click", onMapClick);
    return () => map.off("click", onMapClick);
  }, [mapRef, routingPickerState]);

  // Also dismiss routing picker when routing mode turns off
  useEffect(() => {
    if (routingMode) return;
    const timerId = setTimeout(() => {
      setRoutingPickerState(null);
    }, 0);
    return () => clearTimeout(timerId);
  }, [routingMode]);

  return (
    <>
      <Source
        id="places-source"
        type="geojson"
        data={geojson}
        cluster
        clusterMaxZoom={13}
        clusterRadius={50}
        promoteId="id"
      >
        <Layer {...CLUSTER_CIRCLE_LAYER} />
        <Layer {...CLUSTER_COUNT_LAYER} />
        <Layer {...UNCLUSTERED_ACTIVE_LAYER} paint={activePaint} />
        <Layer {...UNCLUSTERED_CIRCLE_LAYER} paint={unclusteredPaint} />
        <Layer {...FEATURED_DOT_LAYER} paint={featuredPaint} />
      </Source>

      {/* DOM image-pin markers – zoomed-in card mode */}
      {isCardMode &&
        visiblePlaces.map((p) => (
          <Marker
            key={p.id}
            latitude={Number(p.latitude)}
            longitude={Number(p.longitude)}
            anchor="bottom"
            style={{ zIndex: activePlace?.id === p.id ? 50 : 10 }}
          >
            <PlacePin
              place={p}
              isActive={activePlace?.id === p.id}
              onClick={(e) => handlePinClick(p, e)}
            />
          </Marker>
        ))}

      {activePlace && (
        <Popup
          anchor="top"
          latitude={Number(activePlace.latitude)}
          longitude={Number(activePlace.longitude)}
          onClose={handlePopupClose}
          closeOnClick={false}
          closeButton={false}
          offset={16}
          maxWidth="320px"
        >
          <PlacePopup place={activePlace} onClose={handlePopupClose} />
        </Popup>
      )}

      {/* Routing picker rendered as portal outside MapLibre DOM */}
      {routingPickerState && (
        <RoutingPicker
          place={routingPickerState.place}
          screenX={routingPickerState.x}
          screenY={routingPickerState.y}
          onClose={() => setRoutingPickerState(null)}
          onSetOrigin={() => {
            const p = routingPickerState.place;
            routingRef.current?.setOrigin({
              lat: Number(p.latitude),
              lng: Number(p.longitude),
              name: p.name,
              address: p.address,
            });
            setRoutingPickerState(null);
            clearActiveState(
              mapRef.current?.getMap?.(),
              activeFeatIdRef.current,
            );
            activeFeatIdRef.current = null;
          }}
          onSetDestination={() => {
            const p = routingPickerState.place;
            routingRef.current?.setDestination({
              lat: Number(p.latitude),
              lng: Number(p.longitude),
              name: p.name,
              address: p.address,
            });
            setRoutingPickerState(null);
            clearActiveState(
              mapRef.current?.getMap?.(),
              activeFeatIdRef.current,
            );
            activeFeatIdRef.current = null;
          }}
        />
      )}
    </>
  );
};

export default PlaceMarkers;
