import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  MAP_CONFIGS,
  MAP_STYLES,
  DEFAULT_MAP_STYLE,
} from "../config/mapConfig";
import { useRouting } from "../hooks/useRouting";

const MapContext = createContext(null);
const FLY_DURATION_MS = 1000;

export const MapProvider = ({ children }) => {
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState(MAP_CONFIGS.INITIAL_VIEW);
  const [basemap, setBasemap] = useState(DEFAULT_MAP_STYLE);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);

  /**
   * Stable ref for the "view place detail" callback.
   * Page consumers call setOnSelectPlace(fn) on mount to register their handler.
   */
  const onSelectPlaceCbRef = useRef(null);

  const flyTo = useCallback((coords, zoom = 13) => {
    const map = mapRef.current?.getMap?.();
    if (map) {
      map.flyTo({
        center: [coords.lng, coords.lat],
        zoom,
        duration: FLY_DURATION_MS,
      });
    }
  }, []);

  const selectArea = useCallback((feature, type = "district") => {
    if (type === "district") {
      setSelectedDistrict(feature);
      setSelectedWard(null);
    } else {
      setSelectedWard(feature);
    }
  }, []);

  const resetSelection = useCallback(() => {
    setSelectedDistrict(null);
    setSelectedWard(null);
    setHoveredFeature(null);
  }, []);

  const setOnSelectPlace = useCallback((fn) => {
    onSelectPlaceCbRef.current = fn ?? null;
  }, []);

  const selectPlace = useCallback((place) => {
    onSelectPlaceCbRef.current?.(place);
  }, []);

  // ─── Phase 1: Routing ─────────────────────────────────────────────────────
  const [routingMode, setRoutingMode] = useState(false); // whether routing panel is visible
  const routing = useRouting();

  const value = useMemo(
    () => ({
      mapRef,
      viewState,
      setViewState,
      basemap,
      setBasemap,
      MAP_STYLES,
      selectedDistrict,
      selectedWard,
      hoveredFeature,
      setHoveredFeature,
      selectArea,
      resetSelection,
      flyTo,
      places,
      setPlaces,
      filteredPlaces,
      setFilteredPlaces,
      selectPlace,
      setOnSelectPlace,
      // Routing
      routingMode,
      setRoutingMode,
      routing,
    }),
    [
      viewState,
      basemap,
      selectedDistrict,
      selectedWard,
      hoveredFeature,
      selectArea,
      resetSelection,
      flyTo,
      places,
      filteredPlaces,
      selectPlace,
      setOnSelectPlace,
      routingMode,
      routing,
    ],
  );

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMapContext must be used within a MapProvider");
  }
  return context;
};
