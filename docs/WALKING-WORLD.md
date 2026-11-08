# Detailed Montbéliard walking world

## Implemented data and rendering

The center-city scene uses the generated files in `apps/web/public/city`:

- `montbeliard.json`: 1,232 in-service IGN BD TOPO buildings with known positive heights, plus a 41×41 grid (1,681 samples) from the public `ign_rge_alti_wld` elevation resource. Bounds: longitude 6.7935–6.8065, latitude 47.5055–47.5135. Heights are expressed relative to the recorded datum (313 m). This is sampled RGE ALTI terrain, not an imported LiDAR HD point cloud or a 50 cm terrain mesh.
- `osm-streets.json`: 613 highway ways and 91 mapped trees, benches, or lamps from the Geofabrik Franche-Comté extract downloaded on 2026-11-08. Mapped widths and lane counts take priority; missing road widths use illustrative defaults. Sidewalks are generated only when the corresponding OSM sidewalk tag is present. Markings and furniture geometry are illustrative representations of mapped attributes.
- `osm2world.glb` and `osm2world-manifest.json`: a generated, validated 8,802,496-byte OSM2World street/environment model and its projection manifest. Buildings are excluded to avoid duplicating the IGN geometry. The procedural street renderer remains a fallback when model loading fails.

The IGN footprints replace grouped native building polygons in the detailed area. Old grouped polygons are split individually outside that area to avoid duplicate buildings across streets. Building roofs and facades use the IGN height relative to sampled ground. Roads are subdivided to follow the terrain. The existing IGN aerial ground/roof imagery remains selectable.

Local 512 px plaster, asphalt, and paving textures are CC0 derivatives from OSM2World-default-style / ambientCG. See `public/materials/README.md`. Facades and textured road surfaces use Three.js standard materials with diffuse lighting. These are generic materials, not photographic reproductions of the actual facades.

Nearby facades also have solid window surrounds and projecting sills, door frames and thresholds, cornices, storey bands, and alternating corner masonry. This geometry is limited to buildings within 85 m to bound rendering cost. Window panes vary deterministically. These architectural details are illustrative; IGN footprints/heights do not supply the real window positions, facade colors, roofs, or shopfront designs.

## Walking and physics

Rapier is loaded when entering walking mode. Its world contains the sampled terrain mesh, IGN building walls, and simplified colliders for mapped benches, trees, and lamps. A capsule character controller resolves movement, with stepping, ground snapping, and slope limits. OSM water/building checks remain an additional movement constraint. Walking is bounded to the detailed terrain grid.

The camera follows sampled ground at an eye height of approximately 1.8 m. MapLibre's center-to-ground clamping is disabled during walking; otherwise its render loop resets the camera target to zero even with a custom elevated terrain mesh. Exiting restores the prior clamping mode and camera. Terrain and physics are approximate and are not evidence of real-world route accessibility.

## Real street photos

The **Photos des rues** button opens a modal and pauses walking. A bounded Panoramax STAC search requests up to 40 nearby records and keeps at most 24 within 220 m. The view displays the image's author/producer, licence, capture date, and approximate distance. Equirectangular images use Photo Sphere Viewer; flat photos use an ordinary image view. Standard resolution loads first, with an optional HD selector when an original image is published. Closing or pressing Escape returns focus to the walking scene without leaving walking mode. Empty coverage, failed photos, and request failures have recovery controls.

On 2026-11-08, a live center-city search returned twelve nearby 360° records credited to Lejun under CC-BY-SA-4.0, with original dimensions 7680×3840. The metadata/API host is reachable. The images are hosted on `panoramax.openstreetmap.fr`; image downloads still require that additional host's network permission to be activated for final live verification in the cloud browser. Controlled browser fixtures test flat images, 360° rendering, credits, pause/resume, and failures; they do not substitute for actual image verification. No fabricated business/street photos are included.

## OSM2World offline pipeline

The source converter checkout is pinned during preparation to `1d31c252cbef964b489a55e5fb8242ee253375b1`; default-style materials were obtained at `3d82b2e97ae924b8e6599ed6664e407e9fe5ed30`. The full region extract and tools stay outside the application repository.

1. `scripts/extract-city-osm.py input.osm.pbf output.osm.pbf` creates a reference-complete center-city extract with pyosmium. Then `scripts/bound-city-osm.py output.osm.pbf bounded.osm.pbf` attaches the explicit city bounds needed by the converter.
2. Build OSM2World core-jvm and its dependencies with Java/Maven. The official `mvn.topobyte.de` / `mvn.slimjars.com` repositories must be reachable. Keep TLS verification enabled and configure Maven with the inherited proxy and cloud CA.
3. Set `CITY_OSM2WORLD_CP` to the built jars/runtime dependencies, `CITY_OSM2WORLD_STYLE` to the default-style checkout, and `CITY_OSM_EXTRACT` to the city extract. Run `bash scripts/build-osm2world-assets.sh`.
4. The Java adapter exports street/environment modules in a metric projection centered at 47.51, 6.8. IGN remains the building/terrain source. The publishing helper checks GLB format, origin, and a 20 MiB limit before copying a model into public assets and writing its manifest.
5. Three.js loads only a validated local model, transforms it into the city's coordinates, drapes it over sampled terrain, batches compatible meshes by material, and replaces the procedural street fallback. Failed model loading keeps the fallback active.

After the environment network update, the converter's core and JVM modules built successfully. The exported model includes road junctions and crossings, kerbs, benches, bus stops, trees, and other environment objects. The publisher rejects unexpected origins, oversized models, and accidental duplicate building modules. The converter logged degenerate triangles on six OSM ways, so some affected geometry may be incomplete. The model is bounded to the city extent; sparse forest trees are illustrative placements based on mapped forest areas. No conversion runs on Render, and no paid storage or service was provisioned.

## Rebuilding and verification

`node scripts/build-city-data.mjs` rebuilds the IGN data using bounded public requests. `scripts/export-city-osm.py` regenerates the street subset. Generated IGN data is under Licence Ouverte 2.0; the OSM derivative database is under ODbL 1.0 with OpenStreetMap/Geofabrik provenance. Material sources are CC0; the Rapier and photo viewer dependencies retain their package licences.

`node --import ./apps/api/node_modules/tsx/dist/loader.mjs --test tests/unit/city-world.test.ts` checks terrain bounds/samples and actual Rapier movement. Live browser tests cover camera elevation, photo-mode movement, control restoration, and controlled Panoramax success/empty/error responses. Inspect the saved `ign-grounded-*` screenshots as well as test results: successful control tests alone do not guarantee a visually correct camera.

Validation on 2026-11-08: production web build and both workspace type checks passed; all eight geometry/physics checks passed; all 28 browser tests passed against the local production build and PostGIS API in desktop and mobile Chromium. The browser run used the actual generated OSM2World asset and live map, IGN imagery, address search, and routing services. Panoramax image rendering, HD selection, and outage recovery used controlled fixtures because the actual image host remains blocked by the cloud network policy. Desktop and mobile walking screenshots were also inspected for terrain/camera alignment and control overlap. These results validate the local upgrade branch, not a deployment of it to the public website.

After adding solid facade trim, the production build, seven geometry/detail checks, and eight focused desktop/mobile browser checks passed again. The focused run covered grounded walking, facade/shop controls, lighting, visual height scale, viewpoint changes, orbit controls, and reduced motion. The resulting street screenshot was visually inspected before releasing the renderer.
