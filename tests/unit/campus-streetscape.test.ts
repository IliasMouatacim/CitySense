import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {campusZebras} from '../../apps/web/lib/campus-streetscape';
import type {CampusData} from '../../apps/web/lib/city-world';

test('zebra stripes follow mapped carriageways only at explicitly marked nodes', () => {
 const data: CampusData = JSON.parse(readFileSync('apps/web/public/city/campus-osm.json','utf8'));
 const project = ([x,y]:number[]):[number,number] => [(x-6.8)*75400,(y-47.49)*111319];
 const nodes = data.objects.filter(n=>n.tags.highway==='crossing' && n.tags['crossing:markings']==='zebra');
 const crossings = campusZebras(data,project);
 assert.ok(nodes.length>0);
 assert.deepEqual(crossings.map(c=>c.position), nodes.map(n=>n.coordinates));
 for(const crossing of crossings) {
  assert.ok(crossing.stripes.length>=1);
  for(const [a,b,c] of crossing.stripes){
   assert.ok(Math.abs(Math.hypot(b[0]-a[0],b[1]-a[1])-2.5)<1e-6);
   assert.ok(Math.abs(Math.hypot(c[0]-b[0],c[1]-b[1])-.48)<1e-6);
  }
 }
});
