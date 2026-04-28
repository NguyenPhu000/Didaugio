const PRECISION = 1e6;

export const decodePolyline6 = (encoded) => {
  if (!encoded || typeof encoded !== "string") return [];

  const coords = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index <= encoded.length);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index <= encoded.length);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coords.push({ lat: lat / PRECISION, lng: lng / PRECISION });
  }

  return coords;
};

export const encodePolyline6 = (points = []) => {
  let lastLat = 0;
  let lastLng = 0;
  let result = "";

  points.forEach((point) => {
    const lat = Math.round(Number(point.lat) * PRECISION);
    const lng = Math.round(Number(point.lng) * PRECISION);
    result += encodeSignedNumber(lat - lastLat);
    result += encodeSignedNumber(lng - lastLng);
    lastLat = lat;
    lastLng = lng;
  });

  return result;
};

export const simplifyPolyline6 = (encoded, toleranceMeters = 8) => {
  const points = decodePolyline6(encoded);
  if (points.length <= 2) {
    return {
      geometry: encoded,
      before: points.length,
      after: points.length,
      toleranceMeters,
    };
  }

  const simplified = simplifyDouglasPeucker(points, toleranceMeters);
  return {
    geometry: encodePolyline6(simplified),
    before: points.length,
    after: simplified.length,
    toleranceMeters,
  };
};

export const simplifyGeoJsonLineString = (geometry, toleranceMeters = 8) => {
  if (
    !geometry ||
    geometry.type !== "LineString" ||
    !Array.isArray(geometry.coordinates)
  ) {
    return {
      geometry,
      before: 0,
      after: 0,
      toleranceMeters,
    };
  }

  const points = geometry.coordinates
    .map(([lng, lat]) => ({ lat: Number(lat), lng: Number(lng) }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));

  if (points.length <= 2) {
    return {
      geometry,
      before: points.length,
      after: points.length,
      toleranceMeters,
    };
  }

  const simplified = simplifyDouglasPeucker(points, toleranceMeters);
  return {
    geometry: {
      ...geometry,
      coordinates: simplified.map((point) => [point.lng, point.lat]),
    },
    before: points.length,
    after: simplified.length,
    toleranceMeters,
  };
};

const simplifyDouglasPeucker = (points, toleranceMeters) => {
  if (points.length <= 2) return points;

  const keep = new Array(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;

  simplifySegment(points, 0, points.length - 1, toleranceMeters, keep);
  return points.filter((_, index) => keep[index]);
};

const simplifySegment = (points, first, last, toleranceMeters, keep) => {
  if (last <= first + 1) return;

  let maxDistance = 0;
  let maxIndex = first;

  for (let index = first + 1; index < last; index += 1) {
    const distance = perpendicularDistanceMeters(
      points[index],
      points[first],
      points[last],
    );

    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = index;
    }
  }

  if (maxDistance <= toleranceMeters) return;

  keep[maxIndex] = true;
  simplifySegment(points, first, maxIndex, toleranceMeters, keep);
  simplifySegment(points, maxIndex, last, toleranceMeters, keep);
};

const perpendicularDistanceMeters = (point, start, end) => {
  const projected = projectToMeters(point, start);
  const lineStart = { x: 0, y: 0 };
  const lineEnd = projectToMeters(end, start);
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(projected.x, projected.y);
  }

  const t = Math.max(
    0,
    Math.min(1, (projected.x * dx + projected.y * dy) / (dx * dx + dy * dy)),
  );
  const nearest = {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };

  return Math.hypot(projected.x - nearest.x, projected.y - nearest.y);
};

const projectToMeters = (point, origin) => {
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng =
    111320 * Math.cos((Number(origin.lat) * Math.PI) / 180);

  return {
    x: (Number(point.lng) - Number(origin.lng)) * metersPerDegreeLng,
    y: (Number(point.lat) - Number(origin.lat)) * metersPerDegreeLat,
  };
};

const encodeSignedNumber = (value) => {
  let num = value < 0 ? ~(value << 1) : value << 1;
  let encoded = "";

  while (num >= 0x20) {
    encoded += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
    num >>= 5;
  }

  encoded += String.fromCharCode(num + 63);
  return encoded;
};
