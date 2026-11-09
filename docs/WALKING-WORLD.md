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

On 2026-11-08, a live center-city search returned nearby 360° records credited to Lejun under CC-BY-SA-4.0, with original dimensions 7680×3840. After the `panoramax.openstreetmap.fr` network rule was activated, twelve reference panoramas and two original-resolution images downloaded successfully. The actual photo viewer was also checked in Chromium using live Panoramax metadata and images. Controlled browser fixtures separately test flat images, HD selection, credits, pause/resume, and failures. No fabricated business/street photos are included.

## Facades based on Panoramax

`public/city/panoramax-facades.json` records three visually matched IGN building IDs near the northern intersection: the cream tower with yellow balcony panels, the grey Auto École Pilote block, and the adjoining pale-blue retail building. The default viewpoint opens this documented area. This is limited coverage; the other city buildings remain illustrative.

Three selected upper wall faces on the two residential buildings use unchanged Panoramax photographs: two sides of the tower and the grey block's clear northern side. Three visible landmarks per registration were manually identified in original-resolution images and matched to IGN geometry; most are roof corners, while the farther western view also uses a lower wall corner. Fitted virtual camera transforms register the photographs to existing ENU geometry. These are texture-registration transforms, not independently recovered physical camera poses. Wall meshes subdivided at approximately 0.4 m carry spherical UV coordinates. Registration and geometry remain approximate; a small fit residual does not validate survey accuracy.

The tower's west face uses a clearer, farther western view. The grey block's eastern front is reconstructed as geometry from its observed four upper storeys, asymmetric shutter/window bays, central balcony bays, floor bands and ground-floor businesses. This avoids projecting foreground lamps and road signs onto that wall. Balcony surrounds, sills, rails, shutter slats and plain signs have modeled depth; their dimensions and depth are estimates. The blue building uses manually reconstructed glazing, canopy, upper blue wall and ribbon windows based on the photos, with estimated spacing and dimensions. Hidden portions stay simplified. Unobserved faces on these matched buildings receive no invented traditional ornaments or windows; the tower's actual balcony relief, roof details and the entire city are not reconstructed by this reference set.

The original JPEG, SHA-256, photo date, author, source URL, registration correspondences and per-face coverage accompany the profiles. See `public/city/facades/README.md` for attribution and the CC-BY-SA-4.0 photographic adaptations. The scene displays the source and licence, explains the three-building scope, and uses simplified volumes if the texture fails. Photo textures have captured lighting; night mode dims them rather than recreating nighttime photography.

`python scripts/calibrate-facade-photos.py` (NumPy/SciPy, offline preparation only) refits the reviewed landmarks without changing files. `--write` updates the fits for visual review. A small landmark residual measures agreement with selected points; it is not an independent measurement of building or camera accuracy. Adding buildings requires inspecting their actual source imagery and recording matching facade edges; proximity to a photo alone is insufficient.

Walking temporarily uses a 72° vertical field of view and allows looking upward to inspect upper storeys. Entering from the Panoramax viewpoint looks toward the documented tower. Exiting restores the previous camera field of view and pitch.

Movement catches up for frame intervals up to 250 ms using collision-checked substeps of at most 50 ms. This preserves walking distance at 5 fps as well as 60 fps without a large step through walls; longer suspended frames remain capped. Native map symbols are hidden during walking to avoid floating city/road-shield labels over the photographed facade scene and are restored on exit. Mapped names remain available through the street HUD, business list and 3D signs.

## OSM2World offline pipeline

The source converter checkout is pinned during preparation to `1d31c252cbef964b489a55e5fb8242ee253375b1`; default-style materials were obtained at `3d82b2e97ae924b8e6599ed6664e407e9fe5ed30`. The full region extract and tools stay outside the application repository.

1. `scripts/extract-city-osm.py input.osm.pbf output.osm.pbf` creates a reference-complete center-city extract with pyosmium. Then `scripts/bound-city-osm.py output.osm.pbf bounded.osm.pbf` attaches the explicit city bounds needed by the converter.
2. Build OSM2World core-jvm and its dependencies with Java/Maven. The official `mvn.topobyte.de` / `mvn.slimjars.com` repositories must be reachable. Keep TLS verification enabled and configure Maven with the inherited proxy and cloud CA.
3. Set `CITY_OSM2WORLD_CP` to the built jars/runtime dependencies, `CITY_OSM2WORLD_STYLE` to the default-style checkout, and `CITY_OSM_EXTRACT` to the city extract. Run `bash scripts/build-osm2world-assets.sh`.
4. The Java adapter exports street/environment modules in a metric projection centered at 47.51, 6.8. IGN remains the building/terrain source. The publishing helper checks GLB format, origin, and a 20 MiB limit before copying a model into public assets and writing its manifest.
5. Three.js loads only a validated local model, transforms it into the city's coordinates, drapes it over sampled terrain, batches compatible meshes by material, and replaces the procedural street fallback. Failed model loading keeps the fallback active.

After the environment network update, the converter's core and JVM modules built successfully. The exported model includes road junctions and crossings, kerbs, benches, bus stops, trees, and other environment objects. The publisher rejects unexpected origins, oversized models, and accidental duplicate building modules. The converter logged degenerate triangles on six OSM ways, so some affected geometry may be incomplete. The model is bounded to the city extent; sparse forest trees are illustrative placements based on mapped forest areas. No conversion runs on Render, and no paid storage or service was provisioned.

The grey block also models the front roof parapet, two tall pale stacks, the smaller brick chimney, solid lower balcony panels and the salon's sloping awning visible in Lejun's `bbf18b7c-94a6-4969-9cf5-6be5ca50dc98` photograph. These CC-BY-SA-4.0 adaptations use estimated dimensions and setbacks. Hidden roof structures are not reconstructed.

## Rebuilding and verification

`node scripts/build-city-data.mjs` rebuilds the IGN data using bounded public requests. `scripts/export-city-osm.py` regenerates the street subset. Generated IGN data is under Licence Ouverte 2.0; the OSM derivative database is under ODbL 1.0 with OpenStreetMap/Geofabrik provenance. Material sources are CC0; the Rapier and photo viewer dependencies retain their package licences.

`node --import ./apps/api/node_modules/tsx/dist/loader.mjs --test tests/unit/city-world.test.ts` checks terrain bounds/samples and actual Rapier movement. Live browser tests cover camera elevation, photo-mode movement, control restoration, and controlled Panoramax success/empty/error responses. Inspect the saved `ign-grounded-*` screenshots as well as test results: successful control tests alone do not guarantee a visually correct camera.

Initial validation on 2026-11-08: production web build and both workspace type checks passed; all eight geometry/physics checks passed; all 28 browser tests passed against the local production build and PostGIS API in desktop and mobile Chromium. The browser run used the actual generated OSM2World asset and live map, IGN imagery, address search, and routing services. At that stage, Panoramax rendering used controlled fixtures because the actual image host was blocked by the cloud policy. Desktop and mobile walking screenshots were inspected for terrain/camera alignment and control overlap. This historical run validated the earlier upgrade before the image host was enabled and the photo-based facades were added.

After adding solid facade trim, the production build, seven geometry/detail checks, and eight focused desktop/mobile browser checks passed again. The focused run covered grounded walking, facade/shop controls, lighting, visual height scale, viewpoint changes, orbit controls, and reduced motion. The resulting street screenshot was visually inspected before releasing the renderer.

Photo-based facade validation on 2026-11-09: the production web build and all twelve unit checks passed, including source-image hashes, matching IGN edges, recorded photo landmarks, the observed four-storey front layout, actual Rapier movement, and equal walking distance at 5 and 60 fps. Twenty-four distinct desktop/mobile functional scenarios were validated; the long desktop lighting scenario required a focused rerun with a 210-second software-GPU capture budget. After the final grey-front geometry revision, eight focused desktop/mobile checks passed again for facade controls, photographic coverage and credits, camera/FOV restoration, real Panoramax image viewing, and texture-outage fallback. Street screenshots of the tower and grey block were compared with the references. These checks verify the implementation and limited documented coverage, not survey accuracy or performance on physical mobile hardware.
