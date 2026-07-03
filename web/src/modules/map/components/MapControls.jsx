import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavigationControl, ScaleControl, GeolocateControl } from "../adapters";
import { useMapContext } from "../hooks/useMapContext";
import {
  Layers,
  Map,
  Satellite,
  Globe2,
  Sun,
  Shield,
  ChevronDown,
} from "lucide-react";

const BASEMAP_KEYS = [
  { key: "BLANK", i18nKey: "map.controls.blank", Icon: Globe2 },
  { key: "OSM", i18nKey: "map.controls.osm", Icon: Map },
  { key: "CARTO_LIGHT", i18nKey: "map.controls.light", Icon: Sun },
  { key: "ADMIN", i18nKey: "map.controls.admin", Icon: Shield },
  { key: "SATELLITE", i18nKey: "map.controls.satellite", Icon: Satellite },
  { key: "HYBRID", i18nKey: "map.controls.hybrid", Icon: Layers },
];

const MapControls = () => {
  const { t } = useTranslation();
  const { basemap, setBasemap, MAP_STYLES } = useMapContext();
  const [expanded, setExpanded] = useState(false);

  const BASEMAP_OPTIONS = BASEMAP_KEYS.map(({ key, i18nKey, Icon }) => ({
    key,
    label: t(i18nKey),
    Icon,
  }));

  const activeOption = BASEMAP_OPTIONS.find(
    ({ key }) => basemap === MAP_STYLES[key],
  );

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

      <div className="absolute top-3 right-3" style={{ zIndex: 10 }}>
        {expanded ? (
          <div className="grid grid-cols-3 gap-1 bg-white/95 backdrop-blur-sm border border-black/10 shadow-lg p-1.5 rounded-lg">
            {BASEMAP_OPTIONS.map(({ key, label, Icon }) => {
              const active = basemap === MAP_STYLES[key];
              return (
                <button
                  key={key}
                  onClick={() => {
                    setBasemap(MAP_STYLES[key]);
                    setExpanded(false);
                  }}
                  title={label}
                  className={`flex flex-col items-center gap-1 px-3 py-2 text-[9px] font-bold uppercase tracking-wider transition-colors rounded-md cursor-pointer ${
                    active
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
            {/* Close row */}
            <button
              onClick={() => setExpanded(false)}
              className="col-span-3 mt-0.5 py-1 text-[9px] font-bold text-gray-400 hover:text-gray-700 uppercase tracking-wider transition-colors"
            >
              {t("map.controls.close")}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-black/10 shadow-md px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {activeOption && <activeOption.Icon className="h-3.5 w-3.5" />}
            {activeOption?.label || t("map.controls.basemap")}
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </button>
        )}
      </div>
    </>
  );
};

export default MapControls;
