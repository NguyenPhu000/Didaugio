import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  MAP_CONFIGS,
  MAP_STYLES,
  DEFAULT_MAP_STYLE,
} from "../config/mapConfig";

const MapContext = createContext(null);

export const MapProvider = ({ children }) => {
  const [viewState, setViewState] = useState(MAP_CONFIGS.INITIAL_VIEW);
  const [basemap, setBasemap] = useState(DEFAULT_MAP_STYLE);

  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);

  const flyTo = useCallback((coords, zoom = 13) => {
    setViewState((prev) => ({
      ...prev,
      latitude: coords.lat,
      longitude: coords.lng,
      zoom,
      transitionDuration: 1000,
    }));
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

  const value = useMemo(
    () => ({
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
