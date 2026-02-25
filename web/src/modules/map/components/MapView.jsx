import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { MapProvider, useMapContext } from "../context/MapProvider";
import { useMapData } from "../hooks/useMapData";
import MapBase from "./MapBase";
import BoundaryLayer from "./BoundaryLayer";
import PlaceMarkers from "./PlaceMarkers";
import MapControls from "./MapControls";
import DistrictLabels from "./DistrictLabels";

const MapViewInner = ({
  places = [],
  onSelectPlace,
  onSelectArea,
  showMarkers = true,
  showLabels = true,
  interactive = true,
  children,
  initialViewState,
}) => {
  const { setPlaces, setFilteredPlaces, selectArea, setViewState } =
    useMapContext();
  const { districts, wards, canThoMask, loading } = useMapData();

  useEffect(() => {
    if (initialViewState)
      setViewState((prev) => ({ ...prev, ...initialViewState }));
  }, [initialViewState, setViewState]);

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
    <MapBase {...interactionProps}>
      <BoundaryLayer
        mask={canThoMask}
        districts={districts}
        wards={wards}
        onSelect={handleAreaSelection}
      />
      {showMarkers && <PlaceMarkers />}
      {showLabels && districts && <DistrictLabels districts={districts} />}
      {children}
      {interactive && <MapControls />}
    </MapBase>
  );
};

/**
 * MapView — full map with boundaries, markers, district labels and controls.
 */
const MapView = (props) => (
  <MapProvider>
    <MapViewInner {...props} />
  </MapProvider>
);

export default MapView;
