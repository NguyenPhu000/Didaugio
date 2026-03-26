import { useEffect } from "react";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { MapProvider, useMapContext } from "../context/MapProvider";
import { useMapData } from "../hooks/useMapData";
import MapBase from "./MapBase";
import BoundaryLayer from "./BoundaryLayer";
import PlaceMarkers from "./PlaceMarkers";
import MapControls from "./MapControls";
import DistrictLabels from "./DistrictLabels";
import WardLabels from "./WardLabels";
import RouteLayer from "./RouteLayer";

const MapSkeleton = () => (
  <div className="w-full h-full flex items-center justify-center bg-slate-50">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <span className="ml-2 text-primary font-medium">Đang tải bản đồ...</span>
  </div>
);

const MapError = ({ onRetry }) => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 gap-3">
    <AlertTriangle className="h-10 w-10 text-red-400" />
    <p className="text-sm font-medium text-gray-600">
      Không tải được dữ liệu bản đồ
    </p>
    <button
      onClick={onRetry}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
    >
      <RefreshCw className="h-4 w-4" />
      Thử lại
    </button>
  </div>
);

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
  const {
    setPlaces,
    setFilteredPlaces,
    selectArea,
    setViewState,
    setOnSelectPlace,
    routing,
  } = useMapContext();
  const { districts, wards, canThoMask, loading, error, retry } = useMapData();

  useEffect(() => {
    if (initialViewState)
      setViewState((prev) => ({ ...prev, ...initialViewState }));
  }, [initialViewState, setViewState]);

  useEffect(() => {
    setPlaces(places);
    setFilteredPlaces(places);
  }, [places, setPlaces, setFilteredPlaces]);

  // Register / unregister the onSelectPlace callback
  useEffect(() => {
    if (onSelectPlace) setOnSelectPlace(onSelectPlace);
    return () => setOnSelectPlace(null);
  }, [onSelectPlace, setOnSelectPlace]);

  const handleAreaSelection = (feature, type) => {
    selectArea(feature, type);
    onSelectArea?.(feature, type);
  };

  if (loading) return <MapSkeleton />;
  if (error) return <MapError onRetry={retry} />;

  const interactionProps = interactive
    ? {}
    : {
        scrollZoom: false,
        dragPan: false,
        doubleClickZoom: false,
        touchZoom: false,
      };

  return (
    <MapBase onBoundaryClick={handleAreaSelection} {...interactionProps}>
      <BoundaryLayer mask={canThoMask} districts={districts} wards={wards} />
      {showMarkers && <PlaceMarkers />}
      {showLabels && districts && <DistrictLabels districts={districts} />}
      {showLabels && wards && <WardLabels wards={wards} />}
      <RouteLayer
        route={routing.route}
        origin={routing.origin}
        destination={routing.destination}
      />
      {children}
      {interactive && <MapControls />}
    </MapBase>
  );
};

const MapView = (props) => (
  <MapProvider>
    <MapViewInner {...props} />
  </MapProvider>
);

export default MapView;
