import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8081";
const errorRate = new Rate("errors");
const searchDuration = new Trend("search_duration", true);

export const options = {
  stages: [
    { duration: "30s", target: 20 }, // ramp up
    { duration: "1m", target: 20 }, // sustain
    { duration: "30s", target: 0 }, // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<300"], // 95% under 300ms
    search_duration: ["p(95)<300"],
    errors: ["rate<0.01"], // <1% error rate
  },
};

const SEARCH_QUERIES = [
  "phở",
  "café",
  "khách sạn",
  "spa",
  "nhà hàng",
  "resort",
  "massage",
  "karaoke",
];

const CATEGORIES = [1, 2, 3, 4, 5, 6];
const DISTRICTS = [1, 2, 3, 4, 5];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function () {
  const scenario = Math.random();
  let url;
  let tags = {};

  if (scenario < 0.3) {
    // 30% — plain list
    url = `${BASE_URL}/api/places?page=1&limit=10`;
    tags = { name: "GET /api/places (list)" };
  } else if (scenario < 0.55) {
    // 25% — search
    const q = pick(SEARCH_QUERIES);
    url = `${BASE_URL}/api/places?search=${encodeURIComponent(q)}&limit=10`;
    tags = { name: "GET /api/places (search)" };
  } else if (scenario < 0.75) {
    // 20% — category filter
    const cat = pick(CATEGORIES);
    url = `${BASE_URL}/api/places?categoryId=${cat}&limit=10`;
    tags = { name: "GET /api/places (category)" };
  } else if (scenario < 0.9) {
    // 15% — district filter
    const dist = pick(DISTRICTS);
    url = `${BASE_URL}/api/places?districtId=${dist}&limit=10`;
    tags = { name: "GET /api/places (district)" };
  } else {
    // 10% — combined search + filter
    const q = pick(SEARCH_QUERIES);
    const cat = pick(CATEGORIES);
    url = `${BASE_URL}/api/places?search=${encodeURIComponent(q)}&categoryId=${cat}&limit=10&sortBy=rating`;
    tags = { name: "GET /api/places (combined)" };
  }

  const res = http.get(url, { tags });

  const success = check(res, {
    "status is 200": (r) => r.status === 200,
    "response has data array": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data);
      } catch {
        return false;
      }
    },
    "response time < 300ms": (r) => r.timings.duration < 300,
  });

  searchDuration.add(res.timings.duration);
  errorRate.add(!success);

  sleep(0.5 + Math.random() * 1.5); // 0.5-2s think time
}
