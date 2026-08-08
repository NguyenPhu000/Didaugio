import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, AlertCircle, Flame, MapPin, X } from "lucide-react";
import { MapProvider, MapBase } from "@/modules/map";
import { Layer, Source } from "@/modules/map/adapters";
import { Badge } from "@/components/ui/badge";
import {
  getHeatmapBounds,
  normalizeHeatmapPoints,
} from "./placeHeatmapUtils";

const HEATMAP_LAYER = {
  id: "place-telemetry-heatmap",
  type: "heatmap",
  maxzoom: 16,
  paint: {
    "heatmap-weight": [
      "interpolate",
      ["linear"],
      ["get", "weight"],
      1, 0.2,
      10, 0.6,
      50, 1.0,
    ],
    "heatmap-intensity": [
      "interpolate",
      ["linear"],
      ["zoom"],
      0, 1,
      9, 3,
      15, 5,
    ],
    "heatmap-color": [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0, "rgba(56, 189, 248, 0)",
      0.2, "rgba(56, 189, 248, 0.4)",
      0.4, "rgba(59, 130, 246, 0.75)",
      0.6, "rgba(234, 179, 8, 0.85)",
      0.8, "rgba(249, 115, 22, 0.95)",
      1, "rgba(239, 68, 68, 1)",
    ],
    "heatmap-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      0, 4,
      9, 24,
      16, 48,
    ],
    "heatmap-opacity": 0.85,
  },
};

const POINT_LAYER = {
  id: "place-telemetry-point",
  type: "circle",
  paint: {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["get", "weight"],
      1, 7,
      10, 10,
      50, 15,
    ],
    "circle-color": [
      "interpolate",
      ["linear"],
      ["get", "weight"],
      1, "#38bdf8",
      10, "#facc15",
      50, "#f97316",
    ],
    "circle-stroke-color": [
      "case",
      ["boolean", ["get", "selected"], false],
      "#ffffff",
      "#0f172a",
    ],
    "circle-stroke-width": [
      "case",
      ["boolean", ["get", "selected"], false],
      4,
      2,
    ],
    "circle-opacity": 0.95,
  },
};

function HeatmapCanvas({ points }) {
  const mapRef = useRef(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const bounds = useMemo(() => getHeatmapBounds(points), [points]);

  const fitMapToPoints = useCallback((mapTarget) => {
    const map = mapTarget?.getMap?.() || mapTarget;
    if (!map?.fitBounds || !bounds) return;

    map.fitBounds(bounds, {
      padding: { top: 72, right: 32, bottom: 72, left: 32 },
      maxZoom: 14,
      duration: 0,
    });
  }, [bounds]);

  useEffect(() => {
    fitMapToPoints(mapRef.current);
  }, [fitMapToPoints]);

  const selectedPoint = useMemo(
    () => points.find((point) => String(point.placeId) === String(selectedPlaceId)) || null,
    [points, selectedPlaceId],
  );

  const handlePointClick = useCallback((event) => {
    const feature = event.features?.find(
      (item) => item.layer?.id === POINT_LAYER.id,
    ) || event.features?.[0];
    const placeId = feature?.properties?.placeId;
    if (placeId !== undefined) setSelectedPlaceId(placeId);
  }, []);

  const handleMapMouseMove = useCallback((event) => {
    event.target.getCanvas().style.cursor = event.features?.length ? "pointer" : "";
  }, []);

  const handleMapMouseLeave = useCallback((event) => {
    event.target.getCanvas().style.cursor = "";
  }, []);

  const geoJsonData = useMemo(
    () => ({
      type: "FeatureCollection",
      features: points.map((point) => ({
        type: "Feature",
        properties: {
          weight: point.weight,
          name: point.name || "Địa điểm",
          address: point.address || "",
          placeId: point.placeId,
          selected: String(point.placeId) === String(selectedPlaceId),
        },
        geometry: {
          type: "Point",
          coordinates: [point.lng, point.lat],
        },
      })),
    }),
    [points, selectedPlaceId],
  );

  const totalWeight = useMemo(
    () => points.reduce((acc, point) => acc + point.weight, 0),
    [points],
  );

  const hottestPoint = useMemo(() => {
    if (points.length === 0) return null;
    return points.reduce(
      (previous, current) => (current.weight > previous.weight ? current : previous),
      points[0],
    );
  }, [points]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-950 text-white shadow-sm dark:border-zinc-800">
      <MapBase
        ref={mapRef}
        className="h-80 w-full overflow-hidden"
        interactiveLayerIds={[POINT_LAYER.id]}
        onLoad={(event) => fitMapToPoints(event.target)}
        onClick={handlePointClick}
        onMouseMove={handleMapMouseMove}
        onMouseLeave={handleMapMouseLeave}
      >
        <Source id="place-telemetry-source" type="geojson" data={geoJsonData}>
          <Layer {...HEATMAP_LAYER} />
          <Layer {...POINT_LAYER} />
        </Source>
      </MapBase>

      <div className="pointer-events-none absolute left-3 right-3 top-3 flex flex-wrap items-center justify-between gap-2">
        <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-1.5 backdrop-blur">
          <Flame className="h-4 w-4 animate-pulse text-orange-500" />
          <span className="text-xs font-semibold text-zinc-100">Bản đồ nhiệt tương tác</span>
          <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-[10px] text-sky-400">
            {points.length} vị trí
          </Badge>
        </div>

        {hottestPoint && (
          <div className="pointer-events-auto hidden items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-1.5 text-xs text-zinc-300 backdrop-blur sm:flex">
            <Activity className="h-3.5 w-3.5 text-yellow-400" />
            <span className="text-zinc-400">Điểm nóng nhất:</span>
            <span className="max-w-[140px] truncate font-semibold text-white">{hottestPoint.name}</span>
            <Badge className="ml-1 border-red-500/30 bg-red-500/20 text-[10px] text-red-400">
              {hottestPoint.weight} lượt
            </Badge>
          </div>
        )}
      </div>

      {selectedPoint && (
        <div className="pointer-events-auto absolute right-3 top-16 z-10 flex max-w-[calc(100%-1.5rem)] items-start gap-2 rounded-lg border border-sky-400/30 bg-zinc-950/90 px-3 py-2.5 shadow-lg backdrop-blur sm:top-14 sm:max-w-xs">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">{selectedPoint.name}</p>
            {selectedPoint.address && (
              <p className="mt-0.5 truncate text-[11px] text-zinc-400">{selectedPoint.address}</p>
            )}
            <p className="mt-1 text-[11px] font-medium text-emerald-400">
              {selectedPoint.weight.toLocaleString("vi-VN")} lượt tương tác
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng chi tiết địa điểm"
            className="rounded p-0.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            onClick={() => setSelectedPlaceId(null)}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/85 p-2.5 text-xs text-zinc-300 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400">Mật độ tương tác:</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-sky-400">Thấp</span>
            <div className="h-2 w-28 rounded-full bg-gradient-to-r from-sky-400 via-yellow-400 via-orange-500 to-red-600" />
            <span className="text-[10px] text-red-500">Cao</span>
          </div>
        </div>
        <div className="text-[11px] font-mono text-zinc-400">
          Tổng lượt tương tác: <span className="font-bold text-emerald-400">{totalWeight.toLocaleString("vi-VN")}</span>
        </div>
      </div>
    </div>
  );
}

export default function PlaceHeatmap({ data, isLoading, isError }) {
  const rawPoints = data?.data || data || [];
  const points = useMemo(() => normalizeHeatmapPoints(rawPoints), [rawPoints]);

  if (isLoading) {
    return (
      <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-xl border border-zinc-200/80 bg-zinc-100 animate-pulse dark:border-zinc-800 dark:bg-zinc-900">
        <Activity className="h-6 w-6 animate-spin text-zinc-400" />
        <span className="text-xs text-zinc-500">Đang tải bản đồ nhiệt tương tác...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-80 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/50 text-sm text-rose-600 dark:border-rose-900 dark:bg-rose-950/20">
        <AlertCircle className="h-4 w-4" />
        Không thể tải dữ liệu bản đồ nhiệt tương tác.
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="flex h-80 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50">
        <MapPin className="h-8 w-8 text-zinc-400" />
        <p className="font-medium text-zinc-700 dark:text-zinc-300">Chưa có vị trí tương tác</p>
        <p className="text-xs text-zinc-500">Không tìm thấy địa điểm hoặc dữ liệu tương tác trong khoảng thời gian này.</p>
      </div>
    );
  }

  return (
    <MapProvider>
      <HeatmapCanvas points={points} />
    </MapProvider>
  );
}
