# OSRM Can Tho — Motorcycle Routing

Routing engine for the "Di Dau Gio?" platform, configured with a custom motorcycle profile optimized for Vietnamese roads.

## Profiles

| Profile | File | Description |
|---------|------|-------------|
| Motorcycle (default) | `profiles/motorcycle.lua` | Tuned for VN motorcycles: 28 km/h default, hems prioritized, ferries enabled, surface-aware |
| Car (OSRM built-in) | `/opt/car.lua` | Standard car profile, available inside the OSRM container |

### Motorcycle Profile Details

- **Default speed:** 28 km/h (realistic for VN urban motorcycles)
- **Speed table:** motorway 60, trunk 50, primary 40, secondary 35, tertiary 30, unclassified 25, residential 20, living_street 15, service 12 km/h
- **Ferries:** enabled at 15 km/h (critical for Mekong Delta / DBSCL)
- **Living street penalty:** 0.5 (prefers hems/ngos for motorcycle routing)
- **Barriers:** gate, lift_gate, swing_gate allowed; wall, fence, spikes blocked
- **Access:** checks `motorcycle` tag first, then `motor_vehicle` / `vehicle` / `access`
- **Surface penalties:** asphalt/concrete 1.0, unpaved 0.7, gravel 0.6, dirt 0.4, grass 0.3, sand 0.3, mud 0.2
- **Turn penalties:** traffic light +5s, u-turn +20s

## Bounding Box

The expanded bounding box covers Can Tho city and surrounding areas:

```
105.25,9.70,106.15,10.55  (west,south,east,north)
```

Previous (smaller) box was `105.45,9.88,105.95,10.35`.

## RAM Usage

- **~200–400 MB** with MLD algorithm and Can Tho extract
- Safe for a 4 GB Docker memory limit

## Prerequisites

- Docker Desktop with Compose V2
- ~1 GB free disk for OSM data
- Git Bash on Windows (for `MSYS_NO_PATHCONV=1` workaround)

## Quick Start (Recommended)

Use the rebuild script — it handles everything:

```bash
cd /d/didaugio/server/osrm
bash scripts/rebuild-motorcycle.sh
```

## Manual Build Steps

If you need more control, run each step manually:

### 1) Download and extract OSM data

```bash
cd /d/didaugio/server/osrm
mkdir -p data

# Download Vietnam extract (skip if already exists)
curl -L -o data/vietnam-latest.osm.pbf https://download.geofabrik.de/asia/vietnam-latest.osm.pbf

# Extract Can Tho region (expanded bounding box)
rm -f data/cantho.osm.pbf
MSYS_NO_PATHCONV=1 docker run --rm -v "$PWD/data:/data" iboates/osmium \
  extract -b 105.25,9.70,106.15,10.55 \
  /data/vietnam-latest.osm.pbf \
  -o /data/cantho.osm.pbf --overwrite
```

### 2) Build OSRM routing data with motorcycle profile

```bash
cd /d/didaugio/server/osrm
docker compose down --remove-orphans
rm -f data/cantho.osrm*

MSYS_NO_PATHCONV=1 docker compose run --rm osrm osrm-extract -p /profiles/motorcycle.lua /data/cantho.osm.pbf
MSYS_NO_PATHCONV=1 docker compose run --rm osrm osrm-partition /data/cantho.osrm
MSYS_NO_PATHCONV=1 docker compose run --rm osrm osrm-customize /data/cantho.osrm
```

### 3) Start service

```bash
cd /d/didaugio/server/osrm
docker compose up -d
```

## Smoke Tests

```bash
# Standard route (Ninh Kieu -> Cai Rang)
curl "http://localhost:5000/route/v1/driving/105.7793,10.0342;105.7469,10.0452?overview=full&geometries=polyline6"

# Route through hem (should prefer narrow residential streets)
curl "http://localhost:5000/route/v1/driving/105.7712,10.0309;105.7680,10.0325?overview=full&geometries=polyline6"

# Route via ferry
curl "http://localhost:5000/route/v1/driving/105.7800,10.0400;105.7600,10.0450?overview=full&geometries=polyline6"

# Health check
curl "http://localhost:5000/health"
```

## Rebuild After Map Update

```bash
cd /d/didaugio/server/osrm
docker compose down --remove-orphans
rm -f data/cantho.osrm*

MSYS_NO_PATHCONV=1 docker compose run --rm osrm osrm-extract -p /profiles/motorcycle.lua /data/cantho.osm.pbf
MSYS_NO_PATHCONV=1 docker compose run --rm osrm osrm-partition /data/cantho.osrm
MSYS_NO_PATHCONV=1 docker compose run --rm osrm osrm-customize /data/cantho.osrm
docker compose up -d
```

Or simply: `bash scripts/rebuild-motorcycle.sh`

## File Structure

```
server/osrm/
├── docker-compose.yml          # Docker Compose config
├── profiles/
│   └── motorcycle.lua          # Custom motorcycle profile for VN
├── scripts/
│   └── rebuild-motorcycle.sh   # One-command rebuild script
├── data/
│   ├── vietnam-latest.osm.pbf  # Vietnam OSM extract (downloaded)
│   ├── cantho.osm.pbf          # Can Tho extract (generated)
│   └── cantho.osrm*            # OSRM routing data (generated)
└── README.md                   # This file
```
