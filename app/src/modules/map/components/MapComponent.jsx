import React, { useRef, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { useMapStore } from "../store";
import { MapLibreDefaults } from "../../../constants/mapLibre"; // Will create this
import districtGeoJson from "../../../../assets/geojson/cantho-districts.json";

// MapLibreGL.setAccessToken(null); // Not needed if not using Mapbox

import { CategoryChips } from "./CategoryChips";
import { SearchBar } from "./SearchBar";
import { PlaceBottomSheet } from "./PlaceBottomSheet";

export const MapComponent = () => {
  const cameraRef = useRef(null);
  const { region, setRegion, selectedCategory, setSelectedCategory } = useMapStore();

  const onRegionDidChange = (feature) => {
    // ... existing logic
  };

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        styleURL="https://demotiles.maplibre.org/style.json"
        logoEnabled={false}
        attributionEnabled={true}
        onRegionDidChange={onRegionDidChange}
        rotateEnabled={false}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [105.7869, 10.0352],
            zoomLevel: 12,
          }}
        />

import { mockPlacesGeoJson } from "../../../../data/mockPlaces";

// ... inside MapComponent return ...

        {/* Places & Clusters */}
        <MapLibreGL.ShapeSource 
          id="placesSource" 
          shape={mockPlacesGeoJson} 
          cluster={true}
          clusterRadius={50}
          clusterMaxZoomLevel={14}
        >
          {/* Unclustered Points (Markers) */}
          <MapLibreGL.CircleLayer
            id="singlePoint"
            filter={['!', ['has', 'point_count']]}
            style={{
              circleColor: '#0077b8',
              circleRadius: 6,
              circleStrokeWidth: 2,
              circleStrokeColor: '#ffffff',
            }}
          />

          {/* Clusters (Circles) */}
          <MapLibreGL.CircleLayer
            id="clusteredPoints"
            filter={['has', 'point_count']}
            style={{
              circleColor: '#0077b8',
              circleRadius: [
                'step',
                ['get', 'point_count'],
                20, 100,
                30, 750,
                40
              ],
              circleOpacity: 0.8,
              circleStrokeWidth: 2,
              circleStrokeColor: '#ffffff',
            }}
          />

          {/* Cluster Counts (Text) */}
          <MapLibreGL.SymbolLayer
            id="clusterCount"
            filter={['has', 'point_count']}
            style={{
              textField: '{point_count_abbreviated}',
              textSize: 12,
              textColor: '#ffffff',
              textPitchAlignment: 'map',
            }}
          />
        </MapLibreGL.ShapeSource>

        {/* District Overlay */}
        <MapLibreGL.ShapeSource id="districtsSource" shape={districtGeoJson}>
          <MapLibreGL.FillLayer
            id="districtsFill"
            style={{
              fillColor: "rgba(0, 119, 184, 0.1)",
              fillOutlineColor: "#0077b8",
            }}
          />
          <MapLibreGL.LineLayer 
             id="districtsLine"
             style={{
               lineColor: "#0077b8",
               lineWidth: 2,
             }}
          />
        </MapLibreGL.ShapeSource>

        <MapLibreGL.UserLocation visible={true} />
      </MapLibreGL.MapView>

      <SearchBar onPress={() => {}} />
      <CategoryChips 
        selected={selectedCategory} 
        onSelect={setSelectedCategory} 
      />
      
      <PlaceBottomSheet />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e5e5e5",
  },
  map: {
    flex: 1,
  },
});
