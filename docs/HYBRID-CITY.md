# Montbéliard hybrid view

The default **Photo + 3D** view combines IGN orthophotography with CitySense's interactive MapLibre/Three.js scene. **Carte 3D** restores the vector ground and generated roof materials. The selector remains available while walking.

## Data actually used

- IGN Géoplateforme `ORTHOIMAGERY.ORTHOPHOTOS`, through public WMTS, provides photographic ground surfaces. Roads, gardens, paving, and markings are visible where captured in the imagery.
- A bounded, on-demand WMS image supplies roof colors and photographic surface detail. Its EPSG:3857 coordinates are projected into the same Mercator space as the building meshes. A new image is requested only when entering a different snapped area; pending obsolete images are cancelled. Imagery is loaded in the browser, without a bulk download or server image cache.
- OpenFreeMap/OpenStreetMap supplies named places and the wider map. In the detailed center, IGN BD TOPO supplies building footprints/heights and a sampled RGE ALTI surface supplies terrain. Three.js supplies illustrative facades and loads generated OSM2World street/environment assets. See [the walking world](WALKING-WORLD.md) for physics, bounds, and data provenance.

The IGN source attribution is displayed in the map. Data comes from the public Géoplateforme services without an API key or billing-enabled account. See [IGN open-data information](https://geoservices.ign.fr/services-web) and the [service capabilities](https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetCapabilities).

Photographs have a capture date and can differ from current building footprints or businesses. Projecting an overhead image onto roofs does not reconstruct photographic facades. Walls remain illustrative, and photographed objects do not automatically become 3D objects. The night preset dims the daytime imagery.

## Reliability and scope

Ground-image errors automatically select the ordinary map and show a short notice. Roof-image errors retain the generated roof material. Existing routes, labels, walking, building collisions, and device-local saved places continue to use their existing sources. Mobile map height gives the new selector space without covering navigation controls.

In walking mode, changing the image selector returns keyboard focus to the scene. Roof textures are reused across nearby geometry rebuilds, with anisotropic filtering where supported. An overlapping image reuse area avoids repeated requests when crossing a grid boundary in both directions. Photo tile events do not rebuild the walking collision geometry. These changes reduce redundant work; they do not increase the source imagery's resolution or supply street-level facade photographs.

The walking upgrade now imports BD TOPO geometry, sampled terrain, Rapier physics, OSM2World streets, and a Panoramax photo viewer. The terrain resource is RGE ALTI; a dedicated LiDAR HD point-cloud import and a fully textured municipal photomesh are not included. No Google billing account, paid service, or additional infrastructure was added.

## Validation

`tests/live/photo.spec.ts` checks successful IGN tile responses, photographic roof triangles, attribution, switching both directions, walking, and a simulated imagery outage on desktop and mobile. The existing detail and movement suites cover the shared renderer and controls. Screenshots are saved under `test-results/hybrid-*` for visual inspection.
