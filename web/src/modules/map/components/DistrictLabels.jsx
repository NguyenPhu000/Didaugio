import { useMemo } from "react";
import { Marker } from "../adapters";
import { centroid as turfCentroid } from "@turf/turf";
import { DISTRICT_COLORS } from "../config/mapConfig";

const DistrictLabels = ({ districts }) => {
  const labels = useMemo(() => {
    if (!districts?.features) return [];

    const sorted = [...districts.features]
      .filter(
        (f) =>
          f.geometry?.type === "Polygon" ||
          f.geometry?.type === "MultiPolygon" ||
          f.geometry?.type === "Point",
      )
      .sort((a, b) => a.properties.id - b.properties.id);

    return sorted
      .map((feature, idx) => {
        let lng, lat;
        if (feature.geometry.type === "Point") {
          [lng, lat] = feature.geometry.coordinates;
        } else {
          try {
            const c = turfCentroid(feature);
            [lng, lat] = c.geometry.coordinates;
          } catch {
            return null;
          }
        }
        const color = DISTRICT_COLORS[idx % DISTRICT_COLORS.length].line;
        return {
          id: feature.properties.id,
          name: feature.properties.name,
          lng,
          lat,
          color,
        };
      })
      .filter(Boolean);
  }, [districts]);

  return (
    <>
      {labels.map((label) => (
        <Marker
          key={`label-${label.id}`}
          latitude={label.lat}
          longitude={label.lng}
          anchor="center"
          style={{ pointerEvents: "none" }}
        >
          <div
            className="select-none whitespace-nowrap font-black text-[11px] tracking-wider uppercase drop-shadow-sm"
            style={{
              color: label.color,
              textShadow:
                "0 1px 3px rgba(255,255,255,0.9), 0 -1px 3px rgba(255,255,255,0.9)",
            }}
          >
            {label.name}
          </div>
        </Marker>
      ))}
    </>
  );
};

export default DistrictLabels;
