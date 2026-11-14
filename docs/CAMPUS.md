# Portes du Jura university campus

Walking feedback now reports physical stops against furniture and facade relief,
not only footprint/water exclusions. The controller compares requested movement
with the capsule's resolved movement; less than 20% progress signals a stop.
Normal sliding and negligible idle corrections do not trigger that message.
The boundary warning remains reserved for leaving supported terrain.
Validation (2026-11-14): production build and all 37 unit checks passed, including
an actual Rapier bin collision triggering the feedback and checks for sliding,
small movement steps and idle corrections. No new browser run was performed
for this feedback-only change.


Street-furniture collision now follows the rendered object type instead of
assigning a tall capsule to every OSM node. Bicycle parking has separate hoop
bounds, bins have their visible width, and bus shelters retain an open front
with collision at their posts, back panel and seat. Entrance markers and
unrendered barrier metadata no longer create invisible posts. This does not
add interior access through building walls or infer the state of mapped gates.
Furniture dimensions remain illustrative, as in the rendered model.
Validation (2026-11-14): production build and all 36 unit checks passed, including
actual Rapier movement through an entrance marker and stopping at a bin, plus
rack bounds checked against rendered hoop/base-plate geometry. Four desktop/mobile
browser cases passed for all eight stops, reset/exit, eye height and movement;
representative captures were inspected. These cloud software-WebGL checks used
a test-only certificate exception for the external basemap and device scale 0.5.
The original desktop movement assertion failed at 0.92 fps (2.91 m in 4.36 s);
the reduced-raster rerun advanced 5.71 m in 4.22 s on desktop and 10.10 m in
4.85 s on mobile. This validates functional navigation at that test resolution,
not performance on physical devices.


Campus-wide material/navigation pass: fixed curtain walls at STGI, the library
and CROUS use a coherent, blind-free glass atlas; classroom windows at STGI, IUT
and UTBM retain restrained individual variation. The procedural glass is an
illustrative material, not a photograph of the interior or the opposite street.
Frame/jamb hardware shares a separate batched painted-metal material, with
moderate roughness rather than the concrete finish. UTBM's horizontal screen
adds shallow staggered board-end joints; their spacing is an estimated assembly
detail, not a measured reconstruction.

The campus selector is also available while walking (under “Options et lieux”
on phones). Choosing a stop recreates the pedestrian controller at that stop's
mapped start, resets held movement/sprint, and restores the registered view.
UTBM's start is now registered directly on its safe mapped pedestrian approach,
removing the previous roughly 9.5 m snap from the nominal start.
The original pre-walk view is retained for leaving walking mode. No new paid
services, facade-image downloads or per-frame geometry generation are required.
Validation (2026-11-13): production build and all 34 unit tests passed. The full
eight-stop walking tour passed on desktop and mobile, including location/eye
height checks, sprint reset, return-to-start and exit. Desktop/mobile floor and
movement regressions also passed; software-WebGL samples advanced 8.58 m in
4.63 s and 10.16 m in 4.17 s, respectively, with no supported-eye drift. This is
not a hardware frame-rate benchmark. Screenshots across all campus sectors and
representative mobile views were reviewed. Testing caught and corrected the
glass atlas's flipped canvas coordinates and UTBM's off-path nominal start.

CROUS entrance and corner glazing now use fixed lights divided in both axes,
following the grid in Antomoro's 2012 photograph. This removes classroom latches
and full-height stretched reflections from the restaurant's curtain walls.
Small wall-light housings sit on the entrance fascia; their shape and spacing
are estimates and they add no realtime light sources. Existing door positions,
structural piers and canopy remain in place.
Validation (2026-11-13): production build and 17 targeted geometry/physics tests
passed. Desktop/mobile walkthroughs covered the restaurant entrance, east wing
and IUT, with supported eye height and no reported WebGL errors. Entrance and
corner screenshots were inspected.

STGI's west stairwell now has individual fixed glass lights and a full-height
metal grid, following the institutional west-facade photo. Reflections no longer
stretch through several storeys. Red guardrail uprights/brackets and the red/green
upper-ribbon divisions add the photographed colour rhythm. Spacing and hardware
dimensions remain estimates; the solid pier, stair-bay extent and footprint are
unchanged.
Validation (2026-11-13): production build and 17 targeted geometry/physics tests
passed. Desktop/mobile STGI and UTBM walking checks passed with supported eye
height and no reported rendering errors. The new STGI screenshots were inspected.

The library's reddish bands now contain two staggered masonry courses with fine
horizontal and vertical joints. The same treatment continues around its solid
returns at close range; distant inferred returns keep simpler bands. Band
locations follow the existing photo registration, while individual unit sizes
and mortar widths are illustrative. All joints remain shallow, batched surfaces.
Validation (2026-11-13): production build and 17 targeted geometry/physics checks
passed. Both desktop/mobile library walkthroughs passed, including the north
elevation, material loading and WebGL error checks. Captured views were inspected
for surface overlap and continuity around the building corners.

UTBM's glazing frames and sills sit behind the wooden screen instead of piercing
its slats. The two OSM-registered entrances retain their locations and now have
estimated metal kick plates and hinges alongside their handles. These small
hardware details are illustrative, not a claim of surveyed door construction.
Validation (2026-11-13): build and 17 targeted geometry/physics checks passed,
including a depth check that keeps window fittings behind the screen. Both
desktop/mobile STGI and UTBM walkthrough cases passed without reported WebGL
errors and retained the supported pedestrian eye height.

The library's glazed elevations now use individual fixed glass lights, thin
vertical/horizontal framing and two stronger floor beams, following the cited
institutional library photograph. Reflections are assigned per light rather than
stretched over the full height. Classroom-style handles and repeated projecting
sills are removed from these curtain walls. Grid dimensions remain estimates;
the existing concrete jambs, plinth and collision envelopes are retained.
Validation (2026-11-13): production build and 16 targeted geometry/physics checks
passed. Desktop and mobile library walkthroughs passed, including material
loading, a walk round to the north elevation and checks for WebGL errors.

The restaurant's broad structural bays contain individual glass lights instead
of one stretched reflection per bay. Its existing green door positions now have
frames, kick plates, hinges and handles; hardware dimensions are illustrative.
The canopy also has a metal edge. **CROUS · aile est et verrière** opens a second
walking start on the mapped service road, facing the documented east elevation
without another building crossing the view. It retains a horizontal camera and
the same ground support/collision behavior as the other campus sectors.
Validation: production build and 15 targeted geometry/physics checks passed.
Desktop and phone walkthroughs cover the restaurant front, east wing and IUT;
both cases passed, with the new start resolving within 3 m of its mapped road
position, a 1.65 m supported eye height and no reported WebGL errors.

Restaurant/IUT expansion validation (2026-11-12): production build and 29 unit
checks passed, including real-envelope geometry bounds and Rapier collision
against the restaurant pilasters. Both desktop/mobile walkthrough cases passed
after widening the entrance bays and adding canopy supports; restaurant and IUT
screenshots were inspected. The new restaurant start resolves within 3 m of its
mapped road position, with a 1.65 m eye height and no reported WebGL errors.

On phones, campus walking starts with the facade/settings panel collapsed behind
**Options et lieux**. The street name remains visible; expanding the panel gives
access to building controls, roof style, nearby places and reference sources in
a scrollable area. Desktop and city-centre controls retain their existing layout.
Validation (2026-11-12): production build and two mobile browser cases passed,
covering collapse/expand at all three STGI views plus ground/material switching
and walking height/movement. The collapsed panel remains below 120 px tall.

The STGI ribbon elevations distinguish painted white infill from exposed concrete
parapets and courtyard columns. Window rails have shallow support brackets; the
turquoise projection retains its horizontal opening and segmented yellow slit.
Its left/right arrangement follows the institutional colour photograph, correcting
the formerly mirrored composition along the IGN edge. Surface finish is also
checked against [Noscium's STGI photograph from 10 November 2016](https://commons.wikimedia.org/wiki/File:Ufr_stgi_univ_framche_comte.jpg)
(CC BY-SA 4.0). That photograph informs materials and trim, not a new surveyed
facade location. Original image pixels are not included in the application.

The **Campus universitaire** viewpoint opens the Montbéliard campus around Place
Lucien Tharradin. The nearby-place directory includes mapped IUT departments,
UFR STGI buildings, the university library, restaurant and research facilities.
Choose a place to centre the aerial map, or look towards it while walking.
The **Explorer** sector menu provides starts beside UFR STGI, IUT Mesures
physiques, the library and UTBM's timber facade. STGI has separate starts for
the western frontage, the courtyard gallery and the turquoise elevation, placed
on mapped pedestrian paths. All three open at a horizontal pedestrian eye level.
The IUT start sits on the courtyard footpath and faces the documented ribbon
windows, with an unobstructed line of sight checked against the IGN footprints.
Returning to the starting point restores each sector's intended viewing direction
and pitch as well as its position.

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
  At walking height on the campus, the ground instead uses repeating surface
  materials, including in photo mode; IGN roof images remain available. This
  removes stretched aerial photographs and their baked building/tree shadows
  from beneath the pedestrian camera. Unknown surfaces use a neutral aggregate
  appearance; OSM paths, lawns, parking and courtyard areas retain mapped extents.
  A failed individual tile no longer disables images that have loaded. An initial
  complete imagery outage falls back to the vector map after a five-second grace
  period. Campus roofs without photography use a neutral mineral surface instead
  of the historic centre's illustrative tile colours.
  Furniture sizes and rounded tree crowns are illustrative; mapped locations,
  names and recorded capacities are retained. Entrances are recorded in the
  dataset. UTBM's two mapped main entrances now have estimated door geometry;
  other recorded entrances do not yet have individual reconstructions.
- `public/city/campus-facades.json`: eleven IGN envelopes and 31 facade sections
  modelled from inspected institutional and Wikimedia reference photographs.
  These are building volumes/parts, not eleven independently surveyed buildings.
  The CROUS restaurant adds its entrance frontage, white corner with upper ribbon,
  glazed return and eastern service wing with narrow upper windows. Its source is
  [Antomoro's photograph from 13 November 2012](https://commons.wikimedia.org/wiki/File:URF_STGI_CROUS.JPG)
  under the Free Art License; current alterations are unverified. The source is
  consulted for modeling, and its pixels are not redistributed. The entrance
  canopy and blue/red details are estimated on the IGN envelopes. The detached
  forecourt structure and interiors are not modeled. Ground-level facade columns
  share geometry with the walking collision system. A **CROUS · restaurant
  universitaire** sector starts on the mapped Cours Louis le Prince-Ringuet.
  IUT Mesures physiques also receives painted infill and shallower window frames
  on its three previously documented courtyard-facing facade sections.
- The mapped pedestrian courtyard (OSM way `1334515492`) receives a terrain-following
  concrete-slab surface in both viewing modes. Its boundary is mapped; slab size,
  material appearance and relief are estimates from the courtyard photograph.
  A muted grey tint follows the weathered outdoor paving seen in that reference.
  Ground overlays are clipped to the terrain grid's cell diagonals, so paths,
  markings and courtyards follow the same triangles as physics without cutting
  across slopes. Foundations extend down to sloping ground instead of hovering
  above it. Material appearance and foundation depth are illustrative.

The campus terrain uses the historic centre's scene datum for rendering and
Rapier collision. Independent elevation datasets must not reset that datum.
The unmeasured gap between the centre and campus remains outside the walking
terrain; use the viewpoint to move between the two areas.

Documented STGI elevations have ribbon glazing, concrete grids, sills, coloured
transoms and a turquoise accent bay. The library has concrete/brick bands,
glazed ends and stair glazing. UTBM's southern frontage has a projecting timber
louvre screen, window bands, a concrete base and outline lettering. Three
IUT Mesures physiques volumes have the courtyard-facing ribbon glazing visible
in the STGI courtyard photograph: taller ground-floor glazing and shallower upper
bands. The library's long courtyard wall has uneven window groups and coloured
reveals from that same photograph, rather than repeating continuous strips.
The library’s long north elevation now includes the narrow window bands and
smaller openings visible in the library reference. Opening positions remain
approximate. Classroom side walls longer than eight metres continue their
building’s window pattern as explicitly estimated elevations. Mapped university
and college buildings without a photo profile use estimated modern ribbons;
residential and utility buildings do not receive this treatment. Library and
UTBM hidden walls remain solid. The institutional plan supplies sector identities;
OSM names and departmental boundaries may differ or be outdated.

Seven adjoining IUT/STGI cores and connectors inherit their wing's estimated
style. This includes the taller IUT core behind its lower glazed strip; it must
not disappear from detailing merely because the strip masks its lower floors.
These associations are in `lib/campus-envelope.ts`, outside the photo manifest.

A further comparison with `stgi-west` corrects the western STGI elevation to
two broad lower glazing bands and paired narrow upper lights, with an unglazed
concrete pier, continuous stair glazing, green/red infill, outside guardrails
and the photographed `UFR STGI` lettering. These are approximate fractions along
the IGN wall derived from an oblique photograph, not measured opening sizes.
The IGN heights and footprint remain unchanged.

STGI's other documented walls now use separate courtyard and ribbon layouts.
The courtyard gallery has continuous concrete piers, cross beams, recessed
window bands and a projecting roof soffit. The turquoise facade follows the
colour reference's upper projection, horizontal opening and yellow stair slit;
ground-floor glazing continues beneath it. The previously inferred doorway in
that location has been removed. Window frames on the projecting panel are offset
with the panel, rather than disappearing behind its surface.

`lib/campus-facade-solids.ts` derives substantial low-level projections from the
same geometry callbacks as the renderer. Rapier uses those shapes for collision,
so the walking capsule stops outside the gallery piers. Tiny fittings and upper
canopies are excluded from this additional collision set. Existing terrain,
camera eye height and walking speeds are retained.

UTBM's western ground-floor plinth is mostly solid, with a small slit and grouped
glazing as in its reference; the former repeated windows across the whole base
have been removed. Door centres project OSM nodes `6050160864` and `6050160865`
onto the documented frontage. Their widths, hardware and present-day appearance
remain estimates. The timber screen has denser slats to match the reference's
coverage. The source photos were published in 2021 (STGI) and 2015 (UTBM), and
do not establish the buildings' current condition.

These are manual architectural reconstructions on approximate IGN envelopes,
**not photogrammetry or a surveyed replica**. Window positions, counts, dimensions,
depths and the registration of photographs to particular walls are estimated.
The IUT R&T/GACO/MMI elevations and undocumented classroom sides use inferred
window layouts, not photo observations. The panel reports observed faces and
estimated faces separately. Building interiors and undercrofts cannot be entered. The largest
letters are a plain typographic interpretation of observed facade lettering.

Academic buildings, the mapped research centre, sports hall and restaurant
also receive wraparound roof coping, plinths, concrete pour
joints and, within 100 metres, tie holes and shallow rainwater pipes. Generic
rainwater pipes are omitted on documented elevations; STGI's west stair bay
instead uses the pipe visible in its reference. These
construction details are illustrative. Hidden party walls are skipped, fine
detail is omitted farther away, and geometry shares the existing material
batches. Entrance locations come from OSM; facade lettering follows the photos.

The campus renderer uses lit cast-concrete surfaces with photographed grain and
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

The close-range material pass adds concrete rain streaks and formwork tie holes,
smaller aggregate paving slabs with recessed joints and bump shading, and a
sixteen-variant window atlas under the HDR reflections. Subdivided opening lights,
rubber-coloured seals, aluminium latches and the turquoise bay's double entrance
give the observed facades finer relief. Bed seating and benches have separate
timber slats, fixings and metal armrests; courtyard lamps have mounting plates
and base collars. These are original procedural materials and estimated small
details. Window shading and occasional blinds are illustrative; no university
interiors or exact hardware were surveyed or copied as photographic textures.

The subsequent realism pass replaces the generated concrete and slab colours
with CC0 photographed ambientCG surfaces and separate linear height/roughness
maps. Timber seating and UTBM louvres have photographed grain in a shared batch.
Materials are bounded to 1024 pixels per edge and served locally. The generic
Poly Haven daylight HDR also supplies an upper sky hemisphere; it follows the
eye without writing depth, and is removed in night mode. Hemisphere lighting
uses the scene's Z-up convention to distinguish cool sky fill from ground bounce.
These generic material/sky references add visual realism, not new evidence about
the campus's exact appearance. Source links and derivative steps are recorded
in `public/materials/README.md`.

The hardware pass extends the same concrete PBR material over documented facade
columns, lintels and masonry backing panels, with texture coordinates measured
separately on front, side and top faces. Door leaves in the existing turquoise
entry bay have estimated hinges and kickplates; window sills have projecting
drip edges. Existing mapped benches and the courtyard bench share slatted timber
seating, fixings, metal legs and armrests. Existing bicycle-parking locations keep
their mapped capacity (and the eight-stand rendering cap); their estimated stands
have curved steel hoops, mounting plates and bolts. Metal furniture shares one
reflective mesh batch. Hardware dimensions and furniture orientation are visual
estimates; no new entrance or furniture locations were invented.

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

Close-range detail validation: the production build and 17 unit checks passed.
All six desktop/mobile courtyard, navigation and sector cases passed. Visual
inspection then identified library wall self-shadow aliasing; calibrating depth
and normal bias removed that pattern in the inspected desktop and mobile captures.
Both focused library graphics cases passed after the final correction. Fine window
hardware, material variation and furniture are estimates rather than survey data.

Photographed-material revision: the production build and 18 unit checks passed,
including a sky-geometry regression check that keeps the generic HDR landscape
out of the sky cap. Four desktop/mobile library and courtyard graphics cases
passed, with all nine local PBR textures loaded successfully. After tuning leaf
coverage against the captures, both courtyard cases passed again, including
night/day restoration and GPU error checks. Desktop and mobile captures were
inspected. CC0 materials and generic skies do not make the approximate building
envelopes a photogrammetric replica; hardware-device frame rates remain unmeasured.

Hardware revision validation: the production build and 19 unit checks passed,
including detailed bench bounds against the existing walking collision envelopes.
Four desktop/mobile courtyard and sector cases passed, covering UTBM, library,
IUT, walking starts and night/day restoration. The sector and courtyard captures
were inspected. IGN imagery fell back to the vector map in this test run; the
locally served architectural, material and furniture details remained available.

Walking polish validation: the production build and 20 unit checks passed,
including an unobstructed sight line from the IUT start to its documented facade.
Eight desktop/mobile cases covered partial and complete imagery failure, campus
starts, reset direction and day/night restoration. After correcting the IUT and
library opening proportions, library frame depth and courtyard paving tint, both
desktop/mobile sector cases passed again. Their walking captures were inspected.
Facade registration and opening dimensions remain estimates from the cited photos;
unobserved elevations remain simplified.

Ground/movement repair validation: production build and 22 unit checks passed.
The new terrain test verifies overlay interiors as well as vertices against every
cell diagonal, with no missing or duplicate area. Camera support checks include
the courtyard and raised sidewalks; movement substeps preserve distance from
60 down to 1 fps. Six desktop/mobile browser cases covered campus sectors,
ground-material mode switching, movement, camera height and town-centre walking.
After the foundation and sidewalk refinements, both library ground cases passed
again and their stationary/moving screenshots were inspected. Browser frame
samples use software WebGL and do not establish a hardware-device frame-rate
guarantee; desktop/mobile samples still advanced more than 8 m in roughly 4–5 s.

Building completion validation (2026-11-10): production build and 24 unit checks
passed, including real-wall geometry bounds, inferred-core associations and
preservation of mapped department names. The reference generator reproduces the
committed manifest. All six final desktop/mobile cases passed: library material
loading, a walk around its newly detailed north elevation, courtyard lighting,
ground-mode stability, eye height and movement. North-wall and courtyard captures
were inspected. Additional geometry remains batched; measured software-rendered
walking progressed more than 8 m in 4–5 seconds. Hardware frame rates and exact
real-world correspondence of estimated elevations remain unverified.

Photo-fidelity revision validation (2026-11-10): production build and 26 unit
checks passed. New geometry checks keep windows out of STGI's solid pier, retain
its narrow upper lights and actual lettering, and verify UTBM door centres
against the mapped entrances. The generator reproduces the committed manifest.
Four desktop/mobile browser cases passed for STGI/UTBM facade views and the
ground/movement regression; both facade screenshots were inspected. No walking
physics, building height or terrain geometry changed in this revision.

STGI surface/detail validation (2026-11-10): 28 unit checks and the production
build passed. Four desktop/mobile browser cases cover the west, courtyard and
turquoise views, ground-material switching, eye height, movement and GPU errors.
The captured elevations were visually reviewed. Walking samples advanced 8.55 m
in 4.89 s on desktop and 9.96 m in 4.51 s on mobile software WebGL, with the camera
remaining 1.65 m above support. Tests also retain collision against the courtyard
columns and ensure the turquoise slit is no longer mirrored. These checks verify
rendering and navigation; the photo-based dimensions remain approximate.
