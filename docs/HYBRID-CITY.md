# Montbéliard hybrid view

The default **Photo + 3D** view combines IGN orthophotography with CitySense's interactive MapLibre/Three.js scene. **Carte 3D** restores the vector ground and generated roof materials. The selector remains available while walking.

## Data actually used

- IGN Géoplateforme `ORTHOIMAGERY.ORTHOPHOTOS`, through public WMTS, provides photographic ground surfaces. Roads, gardens, paving, and markings are visible where captured in the imagery.
- A bounded, on-demand WMS image supplies roof colors and photographic surface detail. Its EPSG:3857 coordinates are projected into the same Mercator space as the building meshes. A new image is requested only when entering a different snapped area; pending obsolete images are cancelled. Imagery is loaded in the browser, without a bulk download or server image cache.
- OpenFreeMap/OpenStreetMap still supplies footprints, provider heights, road geometry, and named places. Three.js supplies the stylized facades, doors, windows, and signs. Collision geometry and the flat-ground pedestrian camera remain unchanged.

The IGN source attribution is displayed in the map. Data comes from the public Géoplateforme services without an API key or billing-enabled account. See [IGN open-data information](https://geoservices.ign.fr/services-web) and the [service capabilities](https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetCapabilities).

Photographs have a capture date and can differ from current building footprints or businesses. Projecting an overhead image onto roofs is not photogrammetry: walls remain illustrative, ground is flat, and photographed cars/trees do not become physical 3D objects. The night preset dims the daytime imagery.

## Reliability and scope

Ground-image errors automatically select the ordinary map and show a short notice. Roof-image errors retain the generated roof material. Existing routes, labels, walking, building collisions, and device-local saved places continue to use their existing sources. Mobile map height gives the new selector space without covering navigation controls.

The uploaded research also suggested OSM2World, BD TOPO, LiDAR HD, Panoramax, and municipal photomeshes. An IGN BD TOPO building query was verified for the center of Montbéliard, but this release does not import it or change building/collision geometry. OSM2World asset generation, LiDAR terrain, street-photo coverage, and a licensed Montbéliard photomesh require separate data preparation and validation. No Google billing account, paid service, or additional infrastructure was added.

## Validation

`tests/live/photo.spec.ts` checks successful IGN tile responses, photographic roof triangles, attribution, switching both directions, walking, and a simulated imagery outage on desktop and mobile. The existing detail and movement suites cover the shared renderer and controls. Screenshots are saved under `test-results/hybrid-*` for visual inspection.
