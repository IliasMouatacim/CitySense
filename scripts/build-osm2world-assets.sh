#!/usr/bin/env bash
set -euo pipefail
# The classpath must contain the built OSM2World core-jvm and its dependencies.
# No converter runs on Render or in the browser.
: "${CITY_OSM2WORLD_CP:?Set CITY_OSM2WORLD_CP to the built OSM2World jars and runtime dependencies}"
: "${CITY_OSM2WORLD_STYLE:?Set CITY_OSM2WORLD_STYLE to the default-style checkout}"
: "${CITY_OSM_EXTRACT:?Set CITY_OSM_EXTRACT to the reference-complete Montbeliard .osm.pbf extract}"
mkdir -p .data/city-export
if command -v javac >/dev/null; then
  javac -cp "$CITY_OSM2WORLD_CP" -d .data/city-export scripts/CitySceneExport.java
else
  java -cp "$CITY_OSM2WORLD_CP" -m jdk.compiler/com.sun.tools.javac.Main -d .data/city-export scripts/CitySceneExport.java
fi
java -Djava.awt.headless=true -Xmx3G -cp ".data/city-export:$CITY_OSM2WORLD_CP" CitySceneExport "$CITY_OSM_EXTRACT" "$CITY_OSM2WORLD_STYLE/standard.properties" .data/city-export/osm2world.glb
node scripts/publish-city-model.mjs
