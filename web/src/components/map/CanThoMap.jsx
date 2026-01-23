import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { MapProvider, useMapContext } from "@/providers";
import { useMapData } from "@/hooks/useMapData";
import MapBase from "./MapBase";
import BoundaryLayer from "./BoundaryLayer";
import PlaceMarkers from "./PlaceMarkers";
import MapControls from "./MapControls";

const CanThoMapInner = ({ 
  places = [], 
  onSelectPlace, 
  onSelectArea,
  showMarkers = true,
  interactive = true,
  children,
  initialViewState
}) => {
  const { 
    setPlaces, 
    setFilteredPlaces, 
    selectArea,
    setViewState
  } = useMapContext();

  const {
      districts,
      wards,
      canThoMask,
      loading: dataLoading
  } = useMapData();
  
  // Set initial ViewState if provided
  useEffect(() => {
    if (initialViewState) {
        setViewState(prev => ({ ...prev, ...initialViewState }));
    }
  }, [initialViewState, setViewState]);

  // Sync props to context
  useEffect(() => {
    setPlaces(places);
    setFilteredPlaces(places); // Initially all places are filtered
  }, [places, setPlaces, setFilteredPlaces]);
  
  // Pass handleAreaSelection logic...
  const handleAreaSelection = (feature, type) => {
      selectArea(feature, type);
      if (onSelectArea) {
          onSelectArea(feature, type);
      }
  };

  if (dataLoading) {
      return (
          <div className="w-full h-full flex items-center justify-center bg-slate-50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-primary font-medium">Đang tải bản đồ...</span>
          </div>
      );
  }

  // Interactive controls: if interactive=false, disable scroll/drag
  const interactionProps = interactive ? {} : {
      scrollZoom: false,
      dragPan: false,
      doubleClickZoom: false,
      touchZoom: false,
  };

  return (
    <MapBase className="rounded-xl overflow-hidden shadow-inner" {...interactionProps}>
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

// Wrapper ensuring Provider exists
const CanThoMap = (props) => {
  return (
    <MapProvider>
      <CanThoMapInner {...props} />
    </MapProvider>
  );
};

export default CanThoMap;
