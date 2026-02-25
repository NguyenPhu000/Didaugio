import { useMemo } from "react";
import { Marker } from "../adapters";
import { centroid as turfCentroid } from "@turf/turf";

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
        return {
          id: feature.properties.id,
          name: feature.properties.name,
          lng,
          lat,
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
            className="select-none whitespace-nowrap font-bold uppercase"
            style={{
              fontSize: "11px",
              letterSpacing: "0.15em",
              color: "#334155",
              textShadow:
                "0 0 6px #fff, 0 0 10px #fff, 1px 1px 0 #fff, -1px -1px 0 #fff",
            }}
          >
            {label.name.toUpperCase()}
          </div>
        </Marker>
      ))}
    </>
  );
};

export default DistrictLabels;
