import { useMemo } from "react";
import { AlertCircle, MapPin } from "lucide-react";
import { MapProvider, MapBase } from "@/modules/map";
import { Layer, Source } from "@/modules/map/adapters";

const HEATMAP_LAYER = {
  id: "place-telemetry-heatmap",
  type: "heatmap",
  maxzoom: 16,
  paint: {
    "heatmap-weight": ["get", "weight"],
    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 7, 0.8, 14, 2],
    "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(59,130,246,0)", 0.25, "#38bdf8", 0.5, "#facc15", 0.75, "#f97316", 1, "#dc2626"],
    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 7, 18, 14, 38],
    "heatmap-opacity": 0.9,
  },
};

function HeatmapCanvas({ points }) {
  const data = useMemo(() => ({
    type: "FeatureCollection",
    features: points.map((point) => ({
      type: "Feature",
      properties: { weight: point.weight, name: point.name },
      geometry: { type: "Point", coordinates: [point.lng, point.lat] },
    })),
  }), [points]);

  return (
    <MapBase className="h-72 overflow-hidden rounded-xl border">
      <Source id="place-telemetry-source" type="geojson" data={data}>
        <Layer {...HEATMAP_LAYER} />
      </Source>
    </MapBase>
  );
}

export default function PlaceHeatmap({ data, isLoading, isError }) {
  const points = data?.data || data || [];
  if (isLoading) return <div className="h-72 animate-pulse rounded-xl bg-muted" />;
  if (isError) return <div className="flex h-72 items-center justify-center gap-2 rounded-xl border border-destructive/30 text-sm text-destructive"><AlertCircle className="h-4 w-4" />Không tải được dữ liệu heatmap.</div>;
  if (points.length === 0) return <div className="flex h-72 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground"><MapPin className="h-5 w-5" />Chưa có dữ liệu tương tác trong khoảng thời gian này.</div>;
  return <MapProvider><HeatmapCanvas points={points} /></MapProvider>;
}
