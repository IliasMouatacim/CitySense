#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .data/valhalla
if [ ! -s .data/valhalla/franche-comte-latest.osm.pbf ]; then
  stage=$(mktemp -d .data/valhalla/download-XXXXXX)
  trap 'rm -rf "$stage"' EXIT
  curl --fail --location --retry 2 --max-time 600 https://download.geofabrik.de/europe/france/franche-comte-latest.osm.pbf -o "$stage/franche-comte-latest.osm.pbf"
  curl --fail --location --retry 2 --max-time 30 https://download.geofabrik.de/europe/france/franche-comte-latest.osm.pbf.md5 -o "$stage/source.md5"
  expected=$(awk 'NR==1 {print $1}' "$stage/source.md5")
  [[ "$expected" =~ ^[a-fA-F0-9]{32}$ ]] || { echo 'Invalid provider checksum' >&2; exit 1; }
  (cd "$stage"; printf '%s  franche-comte-latest.osm.pbf\n' "$expected" | md5sum --check -)
  mv "$stage/franche-comte-latest.osm.pbf" .data/valhalla/
  mv "$stage/source.md5" .data/valhalla/source.md5
fi
# Keep existing Docker registry credentials; select only the local managed daemon.
env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock compose --profile routing up -d valhalla
printf 'Regional graph build started (two threads). Check docker compose logs valhalla.\n'
