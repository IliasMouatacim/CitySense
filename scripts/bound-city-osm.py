"""Attach the detailed city's explicit bounds to a reference-complete extract."""
import sys
import osmium
source, destination = sys.argv[1:3]
header = osmium.io.Header()
header.add_box(osmium.osm.Box(osmium.osm.Location(6.7935, 47.5055), osmium.osm.Location(6.8065, 47.5135)))
header.set('generator', 'CitySense reference-complete city extract')
with osmium.SimpleWriter(destination, header=header) as writer:
    for obj in osmium.FileProcessor(source):
        writer.add(obj)
print('Saved bounded city extract.')
