import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Route } from "lucide-react";
import { MapGL, Marker, Source, Layer, NavigationControl } from "@/modules/map/adapters";
import { MAP_STYLES, MAP_CONFIGS, CAN_THO_CENTER } from "@/modules/map/config/mapConfig";
import { getDestinationCoordinates, OSRM_BASE } from "./sampleTripUtils";

const routeLayer = {
  id: "sample-trip-route-line",
  type: "line",
  paint: {
    "line-color": "#7c3aed",
    "line-width": 4,
    "line-opacity": 0.86,
  },
};

const routeCasingLayer = {
  id: "sample-trip-route-casing",
  type: "line",
  paint: {
    "line-color": "#ffffff",
    "line-width": 7,
    "line-opacity": 0.9,
  },
};

function buildRouteGeoJson(points) {
  return {
    type: "FeatureCollection",
    features:
      points.length >= 2
        ? [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: points.map((point) => [point.longitude, point.latitude]),
              },
            },
          ]
        : [],
  };
}

function buildBounds(points) {
  if (!points.length) return null;
  const longitudes = points.map((point) => point.longitude);
  const latitudes = points.map((point) => point.latitude);
  return [
    [Math.min(...longitudes) - 0.015, Math.min(...latitudes) - 0.015],
    [Math.max(...longitudes) + 0.015, Math.max(...latitudes) + 0.015],
  ];
}

export function TripRouteMapPreview({ destinations = [], activeDay = null, className = "" }) {
  const mapRef = useRef(null);
  const [roadRoute, setRoadRoute] = useState(null);
  const points = useMemo(() => {
    const scoped = activeDay
      ? destinations.filter((destination) => destination.dayNumber === activeDay)
      : destinations;
    return getDestinationCoordinates(scoped);
  }, [activeDay, destinations]);

  const pointSignature = useMemo(
    () => points.map((point) => `${point.longitude},${point.latitude}`).join(";"),
    [points],
  );
  const straightRouteGeoJson = useMemo(() => buildRouteGeoJson(points), [points]);
  const routeGeoJson = roadRoute?.signature === pointSignature
    ? roadRoute.geoJson
    : straightRouteGeoJson;
  const bounds = useMemo(() => buildBounds(points), [points]);
  const firstPoint = points[0];

  // Tự động fitBounds hoặc di chuyển camera tới tọa độ điểm dừng
  useEffect(() => {
    if (!mapRef.current) return;
    if (bounds) {
      mapRef.current.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 800 });
    } else if (firstPoint) {
      mapRef.current.flyTo({
        center: [firstPoint.longitude, firstPoint.latitude],
        zoom: 13,
        duration: 800,
      });
    }
  }, [bounds, firstPoint]);

  useEffect(() => {
    if (points.length < 2) return undefined;

    const controller = new AbortController();
    const fetchRoadRoute = async () => {
      try {
        const response = await fetch(
          `${OSRM_BASE}/${pointSignature}?overview=full&geometries=geojson&steps=false`,
          { signal: controller.signal },
        );
        if (!response.ok) return;
        const data = await response.json();
        const coordinates = data.routes?.[0]?.geometry?.coordinates;
        if (!coordinates?.length) return;
        setRoadRoute({
          signature: pointSignature,
          geoJson: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: { type: "LineString", coordinates },
              },
            ],
          },
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Cannot load sample trip route geometry:", err);
        }
      }
    };

    fetchRoadRoute();
    return () => controller.abort();
  }, [pointSignature, points.length]);

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-slate-100 ${className}`}>
      <MapGL
        ref={mapRef}
        initialViewState={{
          latitude: firstPoint?.latitude || CAN_THO_CENTER.lat,
          longitude: firstPoint?.longitude || CAN_THO_CENTER.lng,
          zoom: points.length > 1 ? 11 : points.length === 1 ? 13 : 12,
        }}
        mapStyle={MAP_STYLES.OSM}
        minZoom={MAP_CONFIGS.CONSTRAINTS.minZoom}
        maxZoom={MAP_CONFIGS.CONSTRAINTS.maxZoom}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass={false} />
        {routeGeoJson.features.length > 0 ? (
          <Source id="sample-trip-route" type="geojson" data={routeGeoJson}>
            <Layer {...routeCasingLayer} />
            <Layer {...routeLayer} />
          </Source>
        ) : null}
        {points.map((point, index) => (
          <Marker
            key={point.destination.id || `${point.longitude}-${point.latitude}-${index}`}
            longitude={point.longitude}
            latitude={point.latitude}
            anchor="bottom"
          >
            <div className="flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-white bg-violet-600 px-2 text-xs font-bold text-white shadow-lg">
              {index + 1}
            </div>
          </Marker>
        ))}
      </MapGL>

      <div className="pointer-events-none absolute left-3 top-3 rounded-lg border bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
        <div className="flex items-center gap-1.5">
          <Route className="h-3.5 w-3.5 text-violet-600" />
          {points.length > 0 ? (
            <span>{points.length} điểm trong tuyến {activeDay ? `(Ngày ${activeDay})` : ""}</span>
          ) : (
            <span className="text-slate-500 font-normal">Chưa có điểm dừng nào trong lịch trình</span>
          )}
        </div>
      </div>
    </div>
  );
}
