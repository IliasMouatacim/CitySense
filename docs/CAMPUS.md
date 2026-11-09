# Portes du Jura university campus

The **Campus universitaire** viewpoint opens the Montbéliard campus around Place
Lucien Tharradin. The nearby-place directory includes mapped IUT departments,
UFR STGI buildings, the university library, restaurant and research facilities.
Choose a place to centre the aerial map, or look towards it while walking.
The **Explorer** sector menu provides starts beside UFR STGI, IUT Mesures
physiques, the library and UTBM's timber facade.

## Recorded coverage

- `public/city/campus-portes-du-jura.json`: 570 IGN BD TOPO building volumes;
  a separate 41 × 41 RGE ALTI terrain tile, bounds
  `[6.798, 47.4915, 6.81, 47.4985]`.
- `public/city/campus-osm.json`: 287 mapped roads/paths, 242 mapped objects
  (including 189 trees, 16 benches, eight bicycle parking locations and four
  entrance nodes), 48 public-space areas, 581 building outlines and 49 named
  places. These counts include the surrounding neighbourhood, not only the
  university estate. Relations and detailed indoor layouts are not imported.
- IGN orthophotos supply ground and roof imagery in **Photo + 3D** mode.
  Furniture sizes and rounded tree crowns are illustrative; mapped locations,
  names and recorded capacities are retained. Entrances are recorded in the
  dataset but door appearances are not reconstructed.
- `public/city/campus-facades.json`: nine IGN envelopes and 26 facade sections
  modelled from inspected institutional reference photographs. This is nine
  volumes/parts, not nine independently surveyed whole buildings.
- The mapped pedestrian courtyard (OSM way `1334515492`) receives a terrain-following
  concrete-slab surface in both viewing modes. Its boundary is mapped; slab size,
  material appearance and relief are estimates from the courtyard photograph.

The campus terrain uses the historic centre's scene datum for rendering and
Rapier collision. Independent elevation datasets must not reset that datum.
The unmeasured gap between the centre and campus remains outside the walking
terrain; use the viewpoint to move between the two areas.

Documented STGI elevations have ribbon glazing, concrete grids, sills, coloured
transoms and a turquoise accent bay. The library has concrete/brick bands,
glazed ends and stair glazing. UTBM's southern frontage has a projecting timber
louvre screen, window bands, a concrete base and outline lettering. Three
IUT Mesures physiques volumes have the courtyard-facing ribbon glazing visible
in the STGI courtyard photograph. Other walls stay neutral instead of receiving
invented historic ornaments. The institutional plan supplies sector identities;
OSM names and departmental boundaries may differ or be outdated.

These are manual architectural reconstructions on approximate IGN envelopes,
**not photogrammetry or a surveyed replica**. Window positions, counts, dimensions,
depths and the registration of photographs to particular walls are estimated.
Some adjoining parts, hidden elevations and the IUT R&T/GACO/MMI facades remain
simplified. Building interiors and undercrofts cannot be entered. The largest
letters are a plain typographic interpretation of observed facade lettering.

The campus renderer uses lit cast-concrete surfaces with procedural grain and
formwork marks, deeper window jambs and sills, reflective physical glazing and
directional shadow maps (2048 pixels on desktop-sized views, 1024 on narrower
views). A CC0 HDR environment supplies generic outdoor light/reflections; it is
not a photograph of this campus. Photographic facade textures keep their unlit
colour treatment. The renderer preserves MapLibre's external framebuffer during
shadow rendering and factors the true ENU eye position into physical shading.

`lib/campus-courtyard.ts` records a tree, planting bed with timber seating, bench
and two lamps observed in the institutional courtyard images. Their geographic
positions and dimensions are estimates, not additional OSM survey data. Trees
have branches and cutout leaf clusters instead of solid polygon crowns; the
raised planting bed and posts have Rapier colliders. Roof-edge coping is an
estimated continuation of the visible contemporary detailing.

On 2026-11-09, Panoramax's federation and OSM France APIs returned zero images
inside `[6.798, 47.492, 6.809, 47.499]`. A broader search found street imagery
north of the campus, but those images cannot document campus facades. After
network access was enabled, the STGI, IUT and UTBM institutional sources were
inspected. URLs, source institutions, publication dates and observation notes
are recorded in the facade manifest and linked from the campus panel. The
UTBM reference was published in 2015 and the STGI/library photographs in 2021;
their actual capture dates and present-day changes are unknown. The 2026 IUT
plan confirms the Mesures physiques sector. Original institutional photos are
used only for inspection and are **not redistributed or projected as textures**.

## Rebuild

From the repository root:

```sh
node scripts/build-city-data.mjs --campus
python scripts/build-campus-osm.py /path/to/franche-comte.osm.pbf
node scripts/build-campus-references.mjs
```

The Python exporter requires pyosmium. Input is the free Geofabrik
Franche-Comté extract. IGN data is under Licence Ouverte 2.0; OSM data is under
ODbL 1.0. Existing attribution remains visible on the map. No paid API, asset
pack or account is required.

Base validation on 2026-11-09: the production web build and 12 unit checks passed,
with four focused desktop/mobile browser cases. After adding the institutional
facades, all 15 unit checks passed, including real IGN edge matching, bounded
facade geometry and safe sector origins. Six desktop/mobile browser cases passed
for campus navigation, all four walking sectors, named departments, camera height,
movement, exit restoration and existing town-centre photo facades. Street screenshots
of STGI, UTBM, the library and IUT were inspected. These checks validate the
implementation and documented approximate coverage, not survey accuracy.
After adding the mapped courtyard's terrain-following slab surface, the production
build and two focused desktop/mobile campus walking cases passed again; the
resulting paving and facade screenshot was inspected before release.

Graphics revision validation: the production build and 17 unit checks passed,
including fixture collision and restoring MapLibre's compressed depth range after
an isolated shadow pass. Eight desktop/mobile campus and town-centre cases passed.
After final light/reflection tuning and the shadow-depth correction, both
matching-angle courtyard cases passed again, including night/day restoration.
The desktop capture uses the reported 220° view at 1868 × 938; desktop and mobile
captures were visually inspected. Hardware-device frame rates remain unmeasured.
The final mobile capture exposed ground self-shadow aliasing. Ground meshes now
receive shadows without casting onto themselves; the mobile comparison case passed
again and its clean paving capture was inspected before the correction was released.
