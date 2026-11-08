"""Export road widths and mapped furniture without inventing mapped attributes."""
import json, pathlib, sys
import osmium
roads, objects = [], []
for obj in osmium.FileProcessor(sys.argv[1]).with_locations():
    if obj.is_way() and 'highway' in obj.tags:
        coordinates = [[n.lon, n.lat] for n in obj.nodes if n.location.valid()]
        if len(coordinates) < 2:
            continue
        roads.append({'id': obj.id, 'coordinates': coordinates, 'tags': dict(obj.tags)})
    elif obj.is_node() and (obj.tags.get('natural') == 'tree' or obj.tags.get('highway') == 'street_lamp' or obj.tags.get('amenity') == 'bench'):
        objects.append({'id': obj.id, 'coordinates': [obj.lon, obj.lat], 'tags': dict(obj.tags)})
path = pathlib.Path('apps/web/public/city/osm-streets.json')
path.write_text(json.dumps({'roads': roads, 'objects': objects, 'attribution': '© OpenStreetMap contributors, ODbL 1.0; Geofabrik extract'}, separators=(',', ':')))
print(f'Exported {len(roads)} roads and {len(objects)} mapped street objects.')
