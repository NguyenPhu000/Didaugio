import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { MapProvider, useMapContext } from "../context/MapProvider";
import { useMapData } from "../hooks/useMapData";
import MapBase from "./MapBase";
import BoundaryLayer from "./BoundaryLayer";
import PlaceMarkers from "./PlaceMarkers";
import MapControls from "./MapControls";

const MapViewInner = ({
  places = [],
  onSelectPlace,
  onSelectArea,
  showMarkers = true,
  interactive = true,
  children,
  initialViewState,
}) => {
  const { setPlaces, setFilteredPlaces, selectArea, setViewState } =
    useMapContext();
  const { districts, wards, canThoMask, loading } = useMapData();

  // Apply initial viewState if provided
  useEffect(() => {
    if (initialViewState) {
      setViewState((prev) => ({ ...prev, ...initialViewState }));
    }
  }, [initialViewState, setViewState]);

  // Sync places to context
  useEffect(() => {
    setPlaces(places);
    setFilteredPlaces(places);
  }, [places, setPlaces, setFilteredPlaces]);

  const handleAreaSelection = (feature, type) => {
    selectArea(feature, type);
    onSelectArea?.(feature, type);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-primary font-medium">
          Đang tải bản đồ...
        </span>
      </div>
    );
  }

  const interactionProps = interactive
    ? {}
    : {
        scrollZoom: false,
        dragPan: false,
        doubleClickZoom: false,
        touchZoom: false,
      };

  return (
    <MapBase
      className="rounded-xl overflow-hidden shadow-inner"
      {...interactionProps}
    >
      <BoundaryLayer
        mask={canThoMask}
        districts={districts}
        wards={wards}
        onSelect={handleAreaSelection}
      />
      {showMarkers && <PlaceMarkers />}
      {children}
      {interactive && <MapControls />}
    </MapBase>
  );
};

/**
 * MapView — Main map component with full boundary + marker support.
 * Drop-in replacement for the old CanThoMap.
 *
 * Props:
 *  - places: Place[] - places to show as markers
 *  - onSelectArea: (feature, type) => void - area click handler
 *  - showMarkers: boolean - toggle markers
 *  - interactive: boolean - toggle zoom/pan
 *  - initialViewState: partial viewState override
 *  - children: additional map children (custom layers, etc.)
 */
const MapView = (props) => (
  <MapProvider>
    <MapViewInner {...props} />
  </MapProvider>
);

export default MapView;
