# Material provenance

These small JPEG derivatives are from the OSM2World default-style collection:
https://github.com/tordanik/OSM2World-default-style
Source commit: 3d82b2e97ae924b8e6599ed6664e407e9fe5ed30

- plaster.jpg: textures/cc0textures/Plaster002/Plaster002_Color.jpg
- asphalt.jpg: textures/cc0textures/Asphalt003/Asphalt003_Color.jpg
- paving.jpg: textures/cc0textures/PavingStones072/PavingStones072_Color.jpg

The source collection declares CC0 1.0 Universal in COPYING.txt:
https://creativecommons.org/publicdomain/zero/1.0/legalcode
Original cc0textures materials are now distributed by https://ambientcg.com/.
Derivation: GDAL JPEG conversion, 512×512 pixels, quality 85. These are generic
surface materials, not photographs of specific Montbéliard facades or roads.

`spruit_sunrise_1k.hdr`: **Spruit Sunrise**, Greg Zaal / HDRI Haven (now
Poly Haven), CC0. Source: https://polyhaven.com/a/spruit_sunrise
Downloaded from the Three.js example asset mirror:
https://github.com/mrdoob/three.js/blob/dev/examples/textures/equirectangular/spruit_sunrise_1k.hdr
Earlier generic outdoor illumination/reflection asset, retained for provenance;
the current campus renderer uses Kloofendal below. It is not campus imagery.
Cutout foliage and window shading remain generated locally by the renderer.

## Campus photographed PBR surfaces

- `campus-concrete-{color,height,roughness}.jpg`: ambientCG **Concrete034**,
  from `textures/cc0textures/Concrete034/` in the same pinned OSM2World style
  collection above. https://ambientcg.com/view?id=Concrete034
- `campus-timber-{color,height,roughness}.jpg`: ambientCG **Wood026**, from
  `textures/cc0textures/Wood026/` in that collection.
  https://ambientcg.com/view?id=Wood026
- `campus-paving-{color,height,roughness}.jpg`: ambientCG **Concrete023**,
  official `Concrete023_1K-JPG.zip` (Color, Displacement, Roughness), downloaded
  through https://ambientcg.com/get?file=Concrete023_1K-JPG.zip.
  https://ambientcg.com/view?id=Concrete023

All three sources are **CC0 1.0**. Derivatives use at most 1024 pixels per edge;
roughness comes from the ORM green channel where supplied. Timber is desaturated
to weathered ash tones. The paving derivative arranges photographed aggregate
in square slabs with estimated joints; this is not a scan of the campus paving.
Reproduce with `scripts/build-campus-materials.py` (Pillow), passing a checkout
of the pinned style collection and an extracted Concrete023 1K-JPG directory.
Photographic colour is separate from linear height and roughness data.

`kloofendal_48d_partly_cloudy_1k.hdr`: **Kloofendal 48d Partly Cloudy**,
Greg Zaal / Poly Haven, **CC0**.
https://polyhaven.com/a/kloofendal_48d_partly_cloudy
Official download: https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloofendal_48d_partly_cloudy_1k.hdr
Supplies generic outdoor reflections and the upper sky hemisphere. It is not
Montbéliard imagery; mapped ground and buildings remain in the scene.

The campus grass and sand JPEGs are original procedural textures. Run
`python scripts/build-campus-landscape-textures.py` with Pillow to reproduce them.
