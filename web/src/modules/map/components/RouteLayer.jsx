/**
 * RouteLayer — Phase 1 routing
 * GL line layers for the driving route + informative DOM pins for waypoints.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Source, Layer, Marker } from "react-map-gl/maplibre";
import { Navigation2, Flag, MapPin } from "lucide-react";

// ─── Route line layers ────────────────────────────────────────────────────────

const ROUTE_BORDER_LAYER = {
  id: "route-border",
  type: "line",
  layout: { "line-join": "round", "line-cap": "round" },
  paint: { "line-color": "#1d4ed8", "line-width": 10, "line-opacity": 0.18 },
};

const ROUTE_LINE_LAYER = {
  id: "route-line",
  type: "line",
  layout: { "line-join": "round", "line-cap": "round" },
  paint: { "line-color": "#3b82f6", "line-width": 5, "line-opacity": 0.92 },
};

const ROUTE_DASH_LAYER = {
  id: "route-dash",
  type: "line",
  layout: { "line-join": "round", "line-cap": "butt" },
  paint: {
    "line-color": "#ffffff",
    "line-width": 2,
    "line-opacity": 0.45,
    "line-dasharray": [0, 3, 0],
  },
};

// ─── Waypoint pin ─────────────────────────────────────────────────────────────

const WaypointPin = ({ point, type }) => {
  const { t } = useTranslation();
  const isOrigin = type === "origin";
  const bg = isOrigin ? "bg-green-500" : "bg-red-500";
  const labelBg = isOrigin ? "bg-green-700" : "bg-red-700";
  const Icon = isOrigin ? Navigation2 : Flag;

  return (
    // anchor="bottom" so the pin tip points at the coordinate
    <div
      className="flex flex-col items-center"
      style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.45))" }}
    >
      {/* Label card — shown above the icon */}
      <div
        className={`${labelBg} text-white rounded-xl px-2.5 py-1.5 mb-1 max-w-[170px] text-left`}
        style={{ backdropFilter: "blur(4px)" }}
      >
        <p className="text-[12px] font-black leading-tight line-clamp-2 break-words">
          {point.name}
        </p>
        {point.address && (
          <p className="mt-0.5 text-[10px] opacity-80 flex items-start gap-1 line-clamp-1">
            <MapPin className="w-2.5 h-2.5 shrink-0 mt-px" />
            {point.address}
          </p>
        )}
        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider opacity-60">
          {isOrigin ? t("map.routing.originLabel") : t("map.routing.destinationLabel")}
        </p>
      </div>

      {/* Circle icon */}
      <div
        className={`${bg} w-9 h-9 rounded-full flex items-center justify-center border-[3px] border-white`}
      >
        <Icon className="w-4 h-4 text-white fill-white" />
      </div>

      {/* Stem line */}
      <div
        className={`w-0.5 h-2 ${isOrigin ? "bg-green-500" : "bg-red-500"} opacity-70`}
      />
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @param {{ route: GeoJSON.Feature|null, origin: {lat,lng,name,address}|null, destination: {lat,lng,name,address}|null }} props
 */
const RouteLayer = ({ route, origin, destination }) => {
  const geojson = useMemo(
    () =>
      route
        ? { type: "FeatureCollection", features: [route] }
        : { type: "FeatureCollection", features: [] },
    [route],
  );

  return (
    <>
      <Source id="route-source" type="geojson" data={geojson}>
        <Layer {...ROUTE_BORDER_LAYER} />
        <Layer {...ROUTE_LINE_LAYER} />
        <Layer {...ROUTE_DASH_LAYER} />
      </Source>

      {origin && (
        <Marker latitude={origin.lat} longitude={origin.lng} anchor="bottom">
          <WaypointPin point={origin} type="origin" />
        </Marker>
      )}

      {destination && (
        <Marker
          latitude={destination.lat}
          longitude={destination.lng}
          anchor="bottom"
        >
          <WaypointPin point={destination} type="destination" />
        </Marker>
      )}
    </>
  );
};

export default RouteLayer;
