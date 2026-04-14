# OSRM Can Tho (Low-RAM Optimized)

This is the minimal command set for your setup: Docker memory around 7-8 GB, Can Tho only.

## 1) Build data (run once, Git Bash)

```bash
cd /d/didaugio/server/osrm
mkdir -p data
docker compose down --remove-orphans

curl -L -o data/vietnam-latest.osm.pbf https://download.geofabrik.de/asia/vietnam-latest.osm.pbf

rm -f data/cantho.osm.pbf data/cantho.osrm*
MSYS_NO_PATHCONV=1 docker run --rm -v "$PWD/data:/data" iboates/osmium \
  extract -b 105.45,9.88,105.95,10.35 \
  /data/vietnam-latest.osm.pbf \
  -o /data/cantho.osm.pbf --overwrite

MSYS_NO_PATHCONV=1 docker compose run --rm osrm osrm-extract -p /opt/car.lua /data/cantho.osm.pbf
MSYS_NO_PATHCONV=1 docker compose run --rm osrm osrm-partition /data/cantho.osrm
MSYS_NO_PATHCONV=1 docker compose run --rm osrm osrm-customize /data/cantho.osrm
```

## 2) Start service

```bash
cd /d/didaugio/server/osrm
docker compose up -d
```

## 3) Smoke test (Can Tho)

```bash
curl "http://localhost:5000/route/v1/driving/105.7793,10.0342;105.7469,10.0452?overview=full&geometries=polyline6"
```

## 4) Rebuild after map update

```bash
cd /d/didaugio/server/osrm
docker compose down --remove-orphans
rm -f data/cantho.osrm*

MSYS_NO_PATHCONV=1 docker compose run --rm osrm osrm-extract -p /opt/car.lua /data/cantho.osm.pbf
MSYS_NO_PATHCONV=1 docker compose run --rm osrm osrm-partition /data/cantho.osrm
MSYS_NO_PATHCONV=1 docker compose run --rm osrm osrm-customize /data/cantho.osrm
docker compose up -d
```
