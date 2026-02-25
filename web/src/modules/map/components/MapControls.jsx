import { NavigationControl, ScaleControl, GeolocateControl } from "../adapters";
import { useMapContext } from "../context/MapProvider";
import { Layers, Map, Satellite } from "lucide-react";

const BASEMAP_OPTIONS = [
  { key: "OSM", label: "Bản đồ", Icon: Map },
  { key: "SATELLITE", label: "Vệ tinh", Icon: Satellite },
  { key: "HYBRID", label: "Hybrid", Icon: Layers },
];

const MapControls = () => {
  const { basemap, setBasemap, MAP_STYLES } = useMapContext();

  return (
    <>
      <NavigationControl
        position="bottom-right"
        style={{ marginRight: 12, marginBottom: 60 }}
      />
      <GeolocateControl
        position="bottom-right"
        style={{ marginRight: 12, marginBottom: 10 }}
      />
      <ScaleControl
        position="bottom-left"
        maxWidth={100}
        unit="metric"
        style={{ marginLeft: 10, marginBottom: 10 }}
      />

      {/* Basemap switcher */}
      <div
        className="absolute top-3 right-3 flex gap-1 bg-white/90 backdrop-blur-sm border border-black/10 shadow-md p-1"
        style={{ zIndex: 10 }}
      >
        {BASEMAP_OPTIONS.map(({ key, label, Icon }) => {
          const active = basemap === MAP_STYLES[key];
          return (
            <button
              key={key}
              onClick={() => setBasemap(MAP_STYLES[key])}
              title={label}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[9px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
                active
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default MapControls;
