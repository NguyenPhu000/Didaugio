# Read-only high-load test

This k6 suite drives **250 requests/second for 5 minutes** with a maximum of 1,000 preallocated VUs. It contains no mutation requests:

- 50% `GET /api/v2/places` with a representative filter
- 30% `GET /api/v2/places/map` for map markers
- 10% `GET /api/v2/places/nearby`
- 10% `GET /api/bookings/public/availability/:serviceId`

## Run

Install k6 outside this repository, then run against staging (never a production environment without an approved load-test window):

```powershell
$env:BASE_URL = "https://staging-api.example.com"
$env:SERVICE_ID = "1"
k6 run server/load-tests/high-load-read-only.js
```

`BASE_URL` defaults to `http://localhost:8081`; `SERVICE_ID` defaults to `1`. Ensure the selected service ID exists and the staging dataset has approved places in the Can Tho viewport used by the scenario. Set those variables to a known seeded service and appropriate coordinates when using another environment.

The run fails when the HTTP or read failure rate reaches 1%, checks fall below 99%, filtered-place p95 reaches 500 ms, map/nearby p95 reaches 700 ms, or booking-read p95 reaches 1 second. k6 also reports dropped iterations; treat any dropped iteration as capacity saturation even though it is not a formal threshold.

Run the suite only after `/api/v2/places`, `/api/v2/places/map`, and `/api/v2/places/nearby` have been deployed. It deliberately does not authenticate or create, confirm, cancel, or otherwise mutate bookings.
