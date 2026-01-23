import { Marker, Popup } from "react-map-gl/maplibre";
import { useMapContext } from "@/providers";
import { MapPin, Star, Eye } from "lucide-react";
import { Badge, Card, Button } from "@/components/ui";
import { useState } from "react";
import { MAP_THEME } from "@/constants/mapConfigs";

const PlaceMarkers = () => {
    const { filteredPlaces, flyTo } = useMapContext();
    const [popupInfo, setPopupInfo] = useState(null);

    const handleMarkerClick = (e, place) => {
        e.originalEvent.stopPropagation();
        setPopupInfo(place);
        flyTo({ lat: place.latitude, lng: place.longitude }, 15);
    };

    return (
        <>
            {filteredPlaces.map((place) => (
                <Marker
                    key={place.id}
                    latitude={place.latitude}
                    longitude={place.longitude}
                    anchor="bottom"
                    onClick={(e) => handleMarkerClick(e, place)}
                >
                    <div className="group relative cursor-pointer transition-transform hover:scale-125 duration-300">
                         {/* Pulse effect */}
                        <div className="absolute -inset-1 bg-primary/20 rounded-full animate-ping opacity-0 group-hover:opacity-100" />
                        
                        <div 
                            className="flex items-center justify-center p-2 rounded-full shadow-lg border-2 border-white bg-white text-primary hover:bg-primary hover:text-white transition-colors"
                            style={{ borderColor: "white" }}
                        >
                             <MapPin className="h-5 w-5 fill-current" />
                        </div>
                        
                        {/* Featured Star */}
                        {place.isFeatured && (
                             <div className="absolute -top-1 -right-1 bg-yellow-400 text-white rounded-full p-0.5 shadow-sm">
                                <Star className="h-2.5 w-2.5 fill-current" />
                             </div>
                        )}
                    </div>
                </Marker>
            ))}

            {popupInfo && (
                <Popup
                    anchor="top"
                    latitude={popupInfo.latitude}
                    longitude={popupInfo.longitude}
                    onClose={() => setPopupInfo(null)}
                    closeOnClick={false}
                    offset={10}
                    maxWidth="300px"
                    className="z-50"
                >
                    <div className="p-0">
                         <div className="relative h-24 w-full bg-slate-100 rounded-t-lg overflow-hidden">
                            {popupInfo.images?.[0]?.url ? (
                                <img 
                                    src={popupInfo.images[0].url} 
                                    className="w-full h-full object-cover" 
                                    alt={popupInfo.name} 
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <MapPin className="h-8 w-8" />
                                </div>
                            )}
                            <Badge className="absolute top-2 left-2 bg-white/90 text-primary text-[10px] hover:bg-white shadow-sm">
                                {popupInfo.category?.name}
                            </Badge>
                         </div>
                         <div className="p-3">
                             <h3 className="font-bold text-slate-800 line-clamp-1 mb-1" style={{ color: MAP_THEME.PRIMARY_BLUE }}>
                                {popupInfo.name}
                             </h3>
                             <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                                {popupInfo.address}
                             </p>
                             
                             <div className="flex items-center justify-between text-xs text-slate-400 border-t pt-2">
                                <span className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    {popupInfo.averageRating || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {popupInfo.viewCount || 0}
                                </span>
                             </div>
                         </div>
                    </div>
                </Popup>
            )}
        </>
    );
};

export default PlaceMarkers;
