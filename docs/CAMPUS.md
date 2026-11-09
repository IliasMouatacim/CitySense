# Portes du Jura university campus

The **Campus universitaire** viewpoint opens the Montbéliard campus around Place
Lucien Tharradin. The nearby-place directory includes mapped IUT departments,
UFR STGI buildings, the university library, restaurant and research facilities.
Choose a place to centre the aerial map, or look towards it while walking.

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

The campus terrain uses the historic centre's scene datum for rendering and
Rapier collision. Independent elevation datasets must not reset that datum.
The unmeasured gap between the centre and campus remains outside the walking
terrain; use the viewpoint to move between the two areas.

Walls throughout this new region stay neutral instead of
receiving invented historic windows and ornaments. Matching names describe
approximate footprint association, not surveyed departmental boundaries.
This is a geographically grounded campus base, **not a photographic facade
reconstruction**. Hidden details, window patterns, facade colours and interior
access have not been verified.

On 2026-11-09, Panoramax's federation and OSM France APIs returned zero images
inside `[6.798, 47.492, 6.809, 47.499]`. A broader search found street imagery
north of the campus, but those images cannot document campus facades. Official
university reference pages were blocked by the environment's network policy.
Source photographs must be inspected before adding photo-specific architecture.

## Rebuild

From the repository root:

```sh
node scripts/build-city-data.mjs --campus
python scripts/build-campus-osm.py /path/to/franche-comte.osm.pbf
```

The Python exporter requires pyosmium. Input is the free Geofabrik
Franche-Comté extract. IGN data is under Licence Ouverte 2.0; OSM data is under
ODbL 1.0. Existing attribution remains visible on the map. No paid API, asset
pack or account is required.

Validation on 2026-11-09: the production web build and 12 unit checks passed.
Four focused desktop/mobile browser checks passed for campus navigation, named
departments, camera height, movement, exit restoration and the existing town-centre
photo facades. Campus screenshots were inspected. The neutral volumes remain a
base for reference-led facade work, not a finished detailed university model.
