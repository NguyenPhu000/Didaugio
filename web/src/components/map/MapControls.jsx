import { NavigationControl, ScaleControl, GeolocateControl } from "react-map-gl/maplibre";

const MapControls = () => {
    return (
        <>
            <NavigationControl position="bottom-right" style={{ marginRight: 10, marginBottom: 50 }} />
            <GeolocateControl position="bottom-right" style={{ marginRight: 10, marginBottom: 15 }} />
            <ScaleControl position="bottom-left" maxWidth={100} unit="metric" style={{ marginLeft: 10, marginBottom: 10, background: "rgba(255,255,255,0.8)" }} />
        </>
    );
};

export default MapControls;
