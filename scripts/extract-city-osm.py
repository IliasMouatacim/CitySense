"""Create a reference-complete central Montbeliard extract from Geofabrik.

Requires the free pyosmium package. Output is generated data, not source code.
"""
import sys
import osmium
source, destination = sys.argv[1:3]
west, south, east, north = 6.7935, 47.5055, 6.8065, 47.5135
def inside(location):
    return location.valid() and west <= location.lon <= east and south <= location.lat <= north
count = 0
with osmium.BackReferenceWriter(destination, source, remove_tags=False) as writer:
    for obj in osmium.FileProcessor(source).with_locations():
        if obj.is_node() and inside(obj.location):
            writer.add_node(obj)
            count += 1
        elif obj.is_way() and any(inside(node.location) for node in obj.nodes):
            writer.add_way(obj)
            count += 1
print(f'Extracted {count} mapped objects with complete node references.')
