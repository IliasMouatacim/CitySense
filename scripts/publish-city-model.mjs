import {readFileSync,copyFileSync,writeFileSync} from 'node:fs';
const path='.data/city-export/osm2world.glb',data=readFileSync(path);
if(data.readUInt32LE(0)!==0x46546c67||data.readUInt32LE(4)!==2||data.length>20*1024*1024)throw Error('Invalid or oversized GLB; split the scene before publishing');
const metadata=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());
const origin=metadata.scenes?.[metadata.scene||0]?.extras?.origin;
if(!origin||Math.abs(origin.lat-47.51)>.000001||Math.abs(origin.lon-6.8)>.000001)throw Error('Unexpected model projection origin');
copyFileSync(path,'apps/web/public/city/osm2world.glb');
writeFileSync('apps/web/public/city/osm2world-manifest.json',JSON.stringify({version:1,url:'/city/osm2world.glb',origin,bytes:data.length,attribution:'© OpenStreetMap contributors / ODbL; OSM2World-generated mesh; default-style materials CC0'}));
console.log(`Published validated ${data.length}-byte OSM2World model.`);
