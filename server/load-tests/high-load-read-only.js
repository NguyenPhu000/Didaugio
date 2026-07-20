import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const baseUrl = (__ENV.BASE_URL || "http://localhost:8081").replace(/\/$/, "");
const serviceId = __ENV.SERVICE_ID || "1";
const bookingDate = __ENV.BOOKING_DATE || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const testDuration = __ENV.TEST_DURATION || "5m";
const configuredRateScale = Number(__ENV.RATE_SCALE || 1);
const rateScale = Number.isFinite(configuredRateScale) && configuredRateScale > 0
  ? configuredRateScale
  : 1;
const scaled = (value) => Math.max(1, Math.round(value * rateScale));

const readFailureRate = new Rate("read_failures");
const filteredPlacesDuration = new Trend("filtered_places_duration", true);
const mapDuration = new Trend("map_duration", true);
const nearbyDuration = new Trend("nearby_duration", true);
const bookingReadDuration = new Trend("booking_read_duration", true);

export const options = {
  scenarios: {
    filtered_places: {
      executor: "constant-arrival-rate",
      exec: "filteredPlaces",
      rate: scaled(125),
      timeUnit: "1s",
      duration: testDuration,
      preAllocatedVUs: scaled(500),
      maxVUs: scaled(500),
    },
    map_markers: {
      executor: "constant-arrival-rate",
      exec: "mapMarkers",
      rate: scaled(75),
      timeUnit: "1s",
      duration: testDuration,
      preAllocatedVUs: scaled(300),
      maxVUs: scaled(300),
    },
    nearby_places: {
      executor: "constant-arrival-rate",
      exec: "nearbyPlaces",
      rate: scaled(25),
      timeUnit: "1s",
      duration: testDuration,
      preAllocatedVUs: scaled(100),
      maxVUs: scaled(100),
    },
    booking_reads: {
      executor: "constant-arrival-rate",
      exec: "bookingRead",
      rate: scaled(25),
      timeUnit: "1s",
      duration: testDuration,
      preAllocatedVUs: scaled(100),
      maxVUs: scaled(100),
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    checks: ["rate>0.99"],
    read_failures: ["rate<0.01"],
    filtered_places_duration: ["p(95)<500"],
    map_duration: ["p(95)<700"],
    nearby_duration: ["p(95)<700"],
    booking_read_duration: ["p(95)<1000"],
  },
};

function requestParams(endpoint) {
  const vu = Math.max(1, Number(__VU));
  const thirdOctet = Math.floor((vu - 1) / 254);
  const fourthOctet = ((vu - 1) % 254) + 1;

  return {
    headers: { "X-Forwarded-For": `198.18.${thirdOctet}.${fourthOctet}` },
    tags: { suite: "high-load-read-only", endpoint },
  };
}

function assertSuccess(response, trend) {
  trend.add(response.timings.duration);
  const ok = check(response, {
    "response is successful": (r) => r.status >= 200 && r.status < 300,
    "response is JSON": (r) => (r.headers["Content-Type"] || "").includes("application/json"),
  });
  readFailureRate.add(!ok);
  return ok;
}

export function filteredPlaces() {
  const response = http.get(
    `${baseUrl}/api/v2/places?limit=25&sortBy=newest&categoryId=1`,
    requestParams("filtered-places"),
  );
  assertSuccess(response, filteredPlacesDuration);
  sleep(0.05);
}

export function mapMarkers() {
  const response = http.get(
    `${baseUrl}/api/v2/places/map?west=105.70&south=9.95&east=105.90&north=10.15&zoom=12&limit=100`,
    requestParams("map"),
  );
  assertSuccess(response, mapDuration);
  sleep(0.05);
}

export function nearbyPlaces() {
  const response = http.get(
    `${baseUrl}/api/v2/places/nearby?latitude=10.034&longitude=105.787&radiusMeters=5000&limit=25`,
    requestParams("nearby"),
  );
  assertSuccess(response, nearbyDuration);
  sleep(0.05);
}

export function bookingRead() {
  const response = http.get(
    `${baseUrl}/api/bookings/availability/${encodeURIComponent(serviceId)}?date=${encodeURIComponent(bookingDate)}`,
    requestParams("booking-read"),
  );
  assertSuccess(response, bookingReadDuration);
  sleep(0.05);
}
