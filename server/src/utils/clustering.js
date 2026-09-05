import crypto from "node:crypto";
/**
 * Tính khoảng cách thực tế (Haversine) giữa 2 tọa độ GPS.
 * Trả về khoảng cách tính bằng mét.
 */
const getDistance = (lat1, lon1, lat2, lon2) => {
  const toRadians = (value) => (value * Math.PI) / 180;
  const R = 6371e3; // Bán kính Trái Đất tính bằng mét
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function initializeCentroids(places, safeK) {
  const centroids = [];
  const selectedIndices = new Set();
  const firstIndex = crypto.randomInt(0, places.length);
  centroids.push({ lat: Number(places[firstIndex].latitude), lng: Number(places[firstIndex].longitude) });
  selectedIndices.add(firstIndex);
  for (let i = 1; i < safeK; i += 1) {
    let maxDist = -1;
    let nextIndex = 0;
    for (let j = 0; j < places.length; j += 1) {
      if (selectedIndices.has(j)) continue;
      const minDist = Math.min(...centroids.map((centroid) => getDistance(Number(places[j].latitude), Number(places[j].longitude), centroid.lat, centroid.lng)));
      if (minDist > maxDist) { maxDist = minDist; nextIndex = j; }
    }
    centroids.push({ lat: Number(places[nextIndex].latitude), lng: Number(places[nextIndex].longitude) });
    selectedIndices.add(nextIndex);
  }
  return centroids;
}

function assignPlacesToClusters(places, centroids, safeK) {
  const clusters = Array.from({ length: safeK }, () => []);
  for (const place of places) {
    let minDist = Number.MAX_VALUE;
    let closestClusterIndex = 0;
    for (let i = 0; i < safeK; i += 1) {
      const dist = getDistance(Number(place.latitude), Number(place.longitude), centroids[i].lat, centroids[i].lng);
      if (dist < minDist) { minDist = dist; closestClusterIndex = i; }
    }
    clusters[closestClusterIndex].push(place);
  }
  return clusters;
}

function repairEmptyClusters(clusters, safeK) {
  for (let i = 0; i < safeK; i += 1) {
    if (clusters[i].length > 0) continue;
    const maxIdx = clusters.reduce((best, cluster, index) => cluster.length > clusters[best].length ? index : best, 0);
    if (clusters[maxIdx].length > 1) clusters[i].push(clusters[maxIdx].pop());
  }
  return clusters;
}

function recalculateCentroids(clusters, centroids, safeK) {
  let centroidShift = 0;
  const nextCentroids = clusters.map((clusterPlaces, index) => {
    if (clusterPlaces.length === 0) return centroids[index];
    const meanCentroid = clusterPlaces.reduce((sum, place) => ({ lat: sum.lat + Number(place.latitude), lng: sum.lng + Number(place.longitude) }), { lat: 0, lng: 0 });
    meanCentroid.lat /= clusterPlaces.length;
    meanCentroid.lng /= clusterPlaces.length;
    centroidShift += getDistance(meanCentroid.lat, meanCentroid.lng, centroids[index].lat, centroids[index].lng);
    return meanCentroid;
  });
  return { nextCentroids, centroidShift };
}

/**
 * Thuật toán K-Means Clustering để phân cụm địa lý các địa điểm thành K cụm (tương ứng K ngày)
 * @param {Array} places Danh sách các địa điểm từ database
 * @param {number} k Số cụm (ngày) cần phân chia
 * @returns {Array<Array>} Mảng gồm k cụm, mỗi cụm chứa danh sách địa điểm
 */
export function kMeansClustering(places, k) {
  if (!Array.isArray(places) || places.length === 0) return [];
  const safeK = Math.max(1, Math.min(k, places.length));

  let centroids = initializeCentroids(places, safeK);

  let clusters = Array.from({ length: safeK }, () => []);
  let iterations = 15;
  let converged = false;

  for (let iter = 0; iter < iterations && !converged; iter += 1) {
    const nextClusters = repairEmptyClusters(assignPlacesToClusters(places, centroids, safeK), safeK);
    const { nextCentroids, centroidShift } = recalculateCentroids(nextClusters, centroids, safeK);
    centroids = nextCentroids;
    clusters = nextClusters;
    converged = centroidShift < 10;
  }

  return clusters;
}

/**
 * Thuật toán Nearest Neighbor TSP Solver để tối ưu hóa thứ tự chặng đi trong cụm
 * @param {Array} places Mảng địa điểm trong 1 cụm
 * @returns {Array} Mảng địa điểm đã được sắp xếp lại tối ưu
 */
export function solveNearestNeighborTSP(places) {
  if (!Array.isArray(places) || places.length <= 2) return places;

  const unvisited = [...places];
  const result = [];

  // Bắt đầu từ địa điểm đầu tiên (hoặc điểm gần trung tâm Can Tho nhất)
  let current = unvisited.shift();
  result.push(current);

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDist = Number.MAX_VALUE;

    const currentLat = Number(current.latitude);
    const currentLng = Number(current.longitude);

    for (let i = 0; i < unvisited.length; i++) {
      const dist = getDistance(
        currentLat,
        currentLng,
        Number(unvisited[i].latitude),
        Number(unvisited[i].longitude)
      );
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = i;
      }
    }

    current = unvisited.splice(nearestIndex, 1)[0];
    result.push(current);
  }

  return result;
}
