"""Export mapped Portes du Jura buildings, public spaces and facilities.

Requires pyosmium. No inferred windows, entrances or furniture are generated.
Usage: python scripts/build-campus-osm.py franche-comte.osm.pbf
"""
import json
import pathlib
import sys
import osmium

bounds = [6.798, 47.4915, 6.81, 47.4985]
def inside(p):
    return bounds[0] <= p[0] <= bounds[2] and bounds[1] <= p[1] <= bounds[3]

roads, objects, areas, buildings, pois = [], [], [], [], []
keys = osmium.filter.KeyFilter('highway', 'natural', 'amenity', 'building', 'building:part', 'landuse', 'leisure', 'entrance', 'barrier', 'public_transport', 'office')
for obj in osmium.FileProcessor(sys.argv[1]).with_locations().with_filter(keys):
    if obj.is_node():
        point = [obj.lon, obj.lat]
        if not inside(point):
            continue
        tags = dict(obj.tags)
        if any(k in tags for k in ['entrance', 'barrier']) or tags.get('natural') == 'tree' or tags.get('highway') in ['street_lamp', 'bus_stop'] or tags.get('amenity') in ['bench', 'bicycle_parking', 'waste_basket']:
            objects.append({'id': obj.id, 'coordinates': point, 'tags': tags})
        if tags.get('name') and any(k in tags for k in ['amenity', 'office', 'public_transport']):
            pois.append({'id': str(obj.id), 'coordinates': point, 'tags': tags})
    elif obj.is_way():
        points = [[n.lon, n.lat] for n in obj.nodes if n.location.valid()]
        if len(points) < 2 or not any(inside(p) for p in points):
            continue
        tags = dict(obj.tags)
        feature = {'id': obj.id, 'coordinates': points, 'tags': tags}
        if 'highway' in tags and tags.get('area') != 'yes':
            roads.append(feature)
        if points[0] != points[-1] or len(points) < 4:
            continue
        if tags.get('amenity') in ['university', 'college'] and 'building' not in tags and 'building:part' not in tags and tags.get('name'):
            center = [sum(p[i] for p in points[:-1]) / (len(points) - 1) for i in [0, 1]]
            pois.append({'id': str(obj.id), 'coordinates': center, 'tags': tags})
        if 'building' in tags or 'building:part' in tags:
            buildings.append(feature)
            if tags.get('name'):
                center = [sum(p[i] for p in points[:-1]) / (len(points) - 1) for i in [0, 1]]
                pois.append({'id': str(obj.id), 'coordinates': center, 'tags': tags})
        elif tags.get('amenity') in ['parking', 'bicycle_parking'] or tags.get('landuse') in ['grass', 'flowerbed'] or tags.get('leisure') in ['garden', 'pitch'] or tags.get('area') == 'yes':
            areas.append(feature)

destination = pathlib.Path('apps/web/public/city/campus-osm.json')
data = {'version': 1, 'bounds': bounds, 'roads': roads, 'objects': objects, 'areas': areas, 'buildings': buildings, 'pois': pois, 'attribution': '© OpenStreetMap contributors — ODbL 1.0; Geofabrik Franche-Comté extract'}
destination.write_text(json.dumps(data, separators=(',', ':'), ensure_ascii=False))
print({k: len(data[k]) for k in ['roads', 'objects', 'areas', 'buildings', 'pois']})
