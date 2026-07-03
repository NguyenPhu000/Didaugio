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

/**
 * Thuật toán K-Means Clustering để phân cụm địa lý các địa điểm thành K cụm (tương ứng K ngày)
 * @param {Array} places Danh sách các địa điểm từ database
 * @param {number} k Số cụm (ngày) cần phân chia
 * @returns {Array<Array>} Mảng gồm k cụm, mỗi cụm chứa danh sách địa điểm
 */
export function kMeansClustering(places, k) {
  if (!Array.isArray(places) || places.length === 0) return [];
  const safeK = Math.max(1, Math.min(k, places.length));

  // Khởi tạo centroids bằng cách chọn các địa điểm ngẫu nhiên cách xa nhau
  let centroids = [];
  const selectedIndices = new Set();
  
  // Chọn centroid đầu tiên ngẫu nhiên
  const firstIndex = Math.floor(Math.random() * places.length);
  centroids.push({
    lat: Number(places[firstIndex].latitude),
    lng: Number(places[firstIndex].longitude),
  });
  selectedIndices.add(firstIndex);

  // Chọn các centroid tiếp theo sao cho xa các centroid đã chọn nhất (K-Means++ initialization style)
  for (let i = 1; i < safeK; i++) {
    let maxDist = -1;
    let nextIndex = 0;
    for (let j = 0; j < places.length; j++) {
      if (selectedIndices.has(j)) continue;
      const lat = Number(places[j].latitude);
      const lng = Number(places[j].longitude);
      
      // Tìm khoảng cách ngắn nhất từ điểm này đến bất kỳ centroid nào đã chọn
      let minDistToCentroids = Number.MAX_VALUE;
      for (const centroid of centroids) {
        const dist = getDistance(lat, lng, centroid.lat, centroid.lng);
        if (dist < minDistToCentroids) {
          minDistToCentroids = dist;
        }
      }

      if (minDistToCentroids > maxDist) {
        maxDist = minDistToCentroids;
        nextIndex = j;
      }
    }
    centroids.push({
      lat: Number(places[nextIndex].latitude),
      lng: Number(places[nextIndex].longitude),
    });
    selectedIndices.add(nextIndex);
  }

  let clusters = Array.from({ length: safeK }, () => []);
  let iterations = 15;
  let converged = false;

  for (let iter = 0; iter < iterations && !converged; iter++) {
    // 1. Gán các địa điểm vào cụm có centroid gần nhất
    const nextClusters = Array.from({ length: safeK }, () => []);
    for (const place of places) {
      const lat = Number(place.latitude);
      const lng = Number(place.longitude);

      let minDist = Number.MAX_VALUE;
      let closestClusterIndex = 0;

      for (let i = 0; i < safeK; i++) {
        const dist = getDistance(lat, lng, centroids[i].lat, centroids[i].lng);
        if (dist < minDist) {
          minDist = dist;
          closestClusterIndex = i;
        }
      }
      nextClusters[closestClusterIndex].push(place);
    }

    // Xử lý cụm rỗng nếu có (gán điểm xa nhất của cụm đông nhất vào cụm rỗng)
    for (let i = 0; i < safeK; i++) {
      if (nextClusters[i].length === 0) {
        // Tìm cụm có nhiều phần tử nhất
        let maxLen = 0;
        let maxIdx = 0;
        for (let c = 0; c < safeK; c++) {
          if (nextClusters[c].length > maxLen) {
            maxLen = nextClusters[c].length;
            maxIdx = c;
          }
        }
        if (maxLen > 1) {
          // Lấy 1 điểm ra gán cho cụm rỗng
          const popped = nextClusters[maxIdx].pop();
          nextClusters[i].push(popped);
        }
      }
    }

    // 2. Tính toán lại Centroids mới
    let nextCentroids = [];
    let centroidShift = 0;

    for (let i = 0; i < safeK; i++) {
      const clusterPlaces = nextClusters[i];
      if (clusterPlaces.length === 0) {
        nextCentroids.push(centroids[i]);
        continue;
      }

      let sumLat = 0;
      let sumLng = 0;
      for (const place of clusterPlaces) {
        sumLat += Number(place.latitude);
        sumLng += Number(place.longitude);
      }

      const meanCentroid = {
        lat: sumLat / clusterPlaces.length,
        lng: sumLng / clusterPlaces.length,
      };
      
      centroidShift += getDistance(meanCentroid.lat, meanCentroid.lng, centroids[i].lat, centroids[i].lng);
      nextCentroids.push(meanCentroid);
    }

    centroids = nextCentroids;
    clusters = nextClusters;

    if (centroidShift < 10) {
      converged = true;
    }
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
