/**
 * MAPLIBRE ADAPTER
 * Wraps all react-map-gl/maplibre exports in a single module.
 * To swap map engine: create a new adapter with the same export interface.
 */

export { default as MapGL } from "react-map-gl/maplibre";
export {
  Source,
  Layer,
  Marker,
  Popup,
  NavigationControl,
  ScaleControl,
  GeolocateControl,
} from "react-map-gl/maplibre";

import "maplibre-gl/dist/maplibre-gl.css";

export const ENGINE_NAME = "maplibre";
