# Detailed Montbéliard walking world

## Implemented data and rendering

The center-city scene uses the generated files in `apps/web/public/city`:

- `montbeliard.json`: 1,232 in-service IGN BD TOPO buildings with known positive heights, plus a 41×41 grid (1,681 samples) from the public `ign_rge_alti_wld` elevation resource. Bounds: longitude 6.7935–6.8065, latitude 47.5055–47.5135. Heights are expressed relative to the recorded datum (313 m). This is sampled RGE ALTI terrain, not an imported LiDAR HD point cloud or a 50 cm terrain mesh.
- `osm-streets.json`: 613 highway ways and 91 mapped trees, benches, or lamps from the Geofabrik Franche-Comté extract downloaded on 2026-11-08. Mapped widths and lane counts take priority; missing road widths use illustrative defaults. Sidewalks are generated only when the corresponding OSM sidewalk tag is present. Markings and furniture geometry are illustrative representations of mapped attributes.
- `osm2world-manifest.json`: records whether an offline-generated OSM2World street model is available. While its status is `pending-network`, the tested procedural street renderer remains active. It does not claim that OSM2World conversion succeeded.

The IGN footprints replace grouped native building polygons in the detailed area. Old grouped polygons are split individually outside that area to avoid duplicate buildings across streets. Building roofs and facades use the IGN height relative to sampled ground. Roads are subdivided to follow the terrain. The existing IGN aerial ground/roof imagery remains selectable.

Local 512 px plaster, asphalt, and paving textures are CC0 derivatives from OSM2World-default-style / ambientCG. See `public/materials/README.md`. Facades and textured road surfaces use Three.js standard materials with diffuse lighting. These are generic materials, not photographic reproductions of the actual facades.

## Walking and physics

Rapier is loaded when entering walking mode. Its world contains the sampled terrain mesh, IGN building walls, and simplified colliders for mapped benches, trees, and lamps. A capsule character controller resolves movement, with stepping, ground snapping, and slope limits. OSM water/building checks remain an additional movement constraint. Walking is bounded to the detailed terrain grid.

The camera follows sampled ground at an eye height of approximately 1.8 m. MapLibre's center-to-ground clamping is disabled during walking; otherwise its render loop resets the camera target to zero even with a custom elevated terrain mesh. Exiting restores the prior clamping mode and camera. Terrain and physics are approximate and are not evidence of real-world route accessibility.

## Real street photos

The **Photos des rues** button opens a modal and pauses walking. A bounded Panoramax STAC search requests up to 40 nearby records and keeps at most 24 within 220 m. The view displays the image's author/producer, licence, capture date, and approximate distance. Equirectangular images use Photo Sphere Viewer; flat photos use an ordinary image view. Closing or pressing Escape returns focus to the walking scene without leaving walking mode. Empty coverage, failed photos, and request failures have recovery controls.

Live Montbéliard photo coverage and the federated image hosts must be verified after network access is activated. Controlled browser fixtures test the integration contract; they do not establish real coverage or image licensing for a location. No fabricated business/street photos are included.

## OSM2World offline pipeline

The source converter checkout is pinned during preparation to `1d31c252cbef964b489a55e5fb8242ee253375b1`; default-style materials were obtained at `3d82b2e97ae924b8e6599ed6664e407e9fe5ed30`. The full region extract and tools stay outside the application repository.

1. `scripts/extract-city-osm.py input.osm.pbf output.osm.pbf` creates a reference-complete center-city extract with pyosmium.
2. Build OSM2World core-jvm and its dependencies with Java/Maven. The official `mvn.topobyte.de` / `mvn.slimjars.com` repositories must be reachable. Keep TLS verification enabled and configure Maven with the inherited proxy and cloud CA.
3. Set `CITY_OSM2WORLD_CP` to the built jars/runtime dependencies, `CITY_OSM2WORLD_STYLE` to the default-style checkout, and `CITY_OSM_EXTRACT` to the city extract. Run `bash scripts/build-osm2world-assets.sh`.
4. The Java adapter exports street/environment modules in a metric projection centered at 47.51, 6.8. IGN remains the building/terrain source. The publishing helper checks GLB format, origin, and a 20 MiB limit before copying a model into public assets and writing its manifest.
5. Three.js loads only a validated local model, transforms it into the city's coordinates, drapes it over sampled terrain, and replaces the procedural street fallback. Failed model loading keeps the fallback active.

The converter build was attempted and blocked by HTTP 403 on the official Maven repository. Export and the full model-loading path require validation with a real generated asset after access is applied. No conversion runs on Render, and no paid storage or service was provisioned.

## Rebuilding and verification

`node scripts/build-city-data.mjs` rebuilds the IGN data using bounded public requests. `scripts/export-city-osm.py` regenerates the street subset. Generated IGN data is under Licence Ouverte 2.0; the OSM derivative database is under ODbL 1.0 with OpenStreetMap/Geofabrik provenance. Material sources are CC0; the Rapier and photo viewer dependencies retain their package licences.

`node --import ./apps/api/node_modules/tsx/dist/loader.mjs --test tests/unit/city-world.test.ts` checks terrain bounds/samples and actual Rapier movement. Live browser tests cover camera elevation, photo-mode movement, control restoration, and controlled Panoramax success/empty/error responses. Inspect the saved `ign-grounded-*` screenshots as well as test results: successful control tests alone do not guarantee a visually correct camera.
