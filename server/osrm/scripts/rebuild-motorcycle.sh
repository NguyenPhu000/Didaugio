#!/usr/bin/env bash
# rebuild-motorcycle.sh — Download, extract, and build OSRM data with motorcycle profile.
# Safe to run multiple times (idempotent).
# Usage: bash scripts/rebuild-motorcycle.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OSRM_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DATA_DIR="$OSRM_DIR/data"

# Bounding box for Can Tho + surroundings (expanded for better coverage)
# Format: west,south,east,north
BBOX="105.25,9.70,106.15,10.55"

echo "=== OSRM Motorcycle Profile Rebuild ==="
echo "Working directory: $OSRM_DIR"
echo "Bounding box: $BBOX"
echo ""

cd "$OSRM_DIR"
mkdir -p "$DATA_DIR"

# --- Step 1: Download Vietnam OSM extract ---
echo "[1/7] Downloading Vietnam OSM extract from Geofabrik..."
if [ -f "$DATA_DIR/vietnam-latest.osm.pbf" ]; then
  echo "  -> vietnam-latest.osm.pbf already exists, skipping download"
else
  curl -L -o "$DATA_DIR/vietnam-latest.osm.pbf" \
    "https://download.geofabrik.de/asia/vietnam-latest.osm.pbf"
  echo "  -> Download complete"
fi

# --- Step 2: Extract Can Tho region ---
echo "[2/7] Extracting Can Tho region (bbox: $BBOX)..."
rm -f "$DATA_DIR/cantho.osm.pbf"
MSYS_NO_PATHCONV=1 docker run --rm -v "$DATA_DIR:/data" iboates/osmium \
  extract -b "$BBOX" \
  /data/vietnam-latest.osm.pbf \
  -o /data/cantho.osm.pbf --overwrite
echo "  -> Extract complete"

# --- Step 3: Clean old routing data ---
echo "[3/7] Cleaning old routing data..."
rm -f "$DATA_DIR"/cantho.osrm*
echo "  -> Cleaned"

# --- Step 4: osrm-extract with motorcycle profile ---
echo "[4/7] Running osrm-extract with motorcycle.lua profile..."
MSYS_NO_PATHCONV=1 docker compose run --rm osrm \
  osrm-extract -p /profiles/motorcycle.lua /data/cantho.osm.pbf
echo "  -> Extract done"

# --- Step 5: osrm-partition ---
echo "[5/7] Running osrm-partition..."
MSYS_NO_PATHCONV=1 docker compose run --rm osrm \
  osrm-partition /data/cantho.osrm
echo "  -> Partition done"

# --- Step 6: osrm-customize ---
echo "[6/7] Running osrm-customize..."
MSYS_NO_PATHCONV=1 docker compose run --rm osrm \
  osrm-customize /data/cantho.osrm
echo "  -> Customize done"

# --- Step 7: Start service ---
echo "[7/7] Starting OSRM service..."
docker compose up -d
echo "  -> Service started on port 5000"

echo ""
echo "=== Build complete! ==="
echo ""
echo "Smoke test commands:"
echo ""
echo "  # Standard route (Ninh Kieu -> Cai Rang)"
echo '  curl "http://localhost:5000/route/v1/driving/105.7793,10.0342;105.7469,10.0452?overview=full&geometries=polyline6"'
echo ""
echo "  # Route through hem (living street) — should prefer narrow roads"
echo '  curl "http://localhost:5000/route/v1/driving/105.7712,10.0309;105.7680,10.0325?overview=full&geometries=polyline6"'
echo ""
echo "  # Route via ferry (if available in OSM data)"
echo '  curl "http://localhost:5000/route/v1/driving/105.7800,10.0400;105.7600,10.0450?overview=full&geometries=polyline6"'
echo ""
echo "  # Verify service is running"
echo '  curl "http://localhost:5000/health"'
