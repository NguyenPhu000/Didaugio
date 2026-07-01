import { bbox, booleanPointInPolygon, point } from "@turf/turf";

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const findDistrictFeature = (districts, districtId) => {
  if (!districts?.features?.length || !districtId) return null;
  const selectedId = String(districtId);
  return (
    districts.features.find(
      (feature) => String(feature.properties?.id ?? feature.id) === selectedId,
    ) || null
  );
};

export const getDistrictSelectionState = ({
  districts,
  districtId,
  latitude,
  longitude,
}) => {
  const feature = findDistrictFeature(districts, districtId);
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);

  if (!districtId || !feature || lat == null || lng == null) {
    return {
      locked: Boolean(districtId && feature),
      inside: true,
      districtName: feature?.properties?.name ?? null,
      feature,
    };
  }

  const geometryType = feature.geometry?.type;
  const canTestBoundary =
    geometryType === "Polygon" || geometryType === "MultiPolygon";

  return {
    locked: true,
    inside: canTestBoundary
      ? booleanPointInPolygon(point([lng, lat]), feature)
      : true,
    districtName: feature.properties?.name ?? null,
    feature,
  };
};

export const getDistrictViewport = ({ districts, districtId }) => {
  const feature = findDistrictFeature(districts, districtId);
  if (!feature) return null;

  const [minLng, minLat, maxLng, maxLat] = bbox(feature);
  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    latitude,
    longitude,
    zoom: 12,
  };
};
