import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadCityWorld,terrainHeight} from '../../apps/web/lib/city-world.ts';
import {createCityPhysics} from '../../apps/web/lib/city-physics.ts';
import {distance,offset,advance} from '../../apps/web/lib/walk-geometry.ts';
import {CAMPUS_COURTYARD} from '../../apps/web/lib/campus-courtyard';

test('IGN terrain samples, bounds and Rapier walking agree on the detailed city area',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async input=>{
  const name=String(input).split('/').at(-1)!;
  return new Response(readFileSync(new URL(`../../apps/web/public/city/${name}`,import.meta.url)),{headers:{'content-type':'application/json'}});
 };
 try{
  const data=await loadCityWorld();assert.ok(data.buildings.features.length>1000);assert.equal(data.heights.length,1681);
  const [w,s,e,n]=data.bounds;
  assert.ok(Math.abs(terrainHeight(w,s)!-(data.heights[0]-data.datum))<.001);
  assert.ok(Math.abs(terrainHeight(e,n)!-(data.heights.at(-1)!-data.datum))<.001);
  assert.equal(terrainHeight(w-.01,s),null);
  const campus=data.terrainPatches?.[0];assert.ok(campus,'Campus terrain must be installed alongside the centre');
  assert.equal(campus.heights.length,campus.size*campus.size);
  assert.equal(terrainHeight(campus.bounds[0],campus.bounds[1]),campus.heights[0]-data.datum,'Both terrain regions must use the same scene datum');
  assert.equal(terrainHeight(6.803,47.502),null,'The unmeasured gap between regions must not become walkable');
  assert.ok(data.buildings.features.some(f=>String(f.properties.campusName).includes('Réseaux')));
  assert.ok(data.buildings.features.some(f=>String(f.properties.campusName).includes('STGI')));
  assert.ok(data.campus?.pois.some(p=>p.tags.short_name==='UTBM'));
  assert.equal(new Set(data.buildings.features.map(f=>f.id)).size,data.buildings.features.length);
  const fixture={...data,bounds:[0,0,1,1],size:2,datum:0,heights:[0,10,20,40]};
  assert.equal(terrainHeight(.25,.25,fixture),7.5);assert.equal(terrainHeight(.75,.75,fixture),27.5);
  const physics=await createCityPhysics();
  try{
   const from:[number,number]=[6.798113188684639,47.51017527332869],to=offset(from,-.25,.6),resolved=physics.move(from,to);
   assert.ok(distance(from,resolved)>.1);assert.ok(distance(from,resolved)<1);assert.ok(physics.height(resolved)!>1);
   assert.deepEqual(physics.move(from,[0,0]),from);
   const campusPath=data.campus!.roads.filter(r=>['footway','pedestrian','path'].includes(r.tags.highway)).flatMap(r=>r.coordinates).find(p=>p[0]>6.802&&p[0]<6.805&&p[1]>47.494&&p[1]<47.496)!;
   assert.ok(campusPath);assert.equal(physics.height(campusPath),terrainHeight(...campusPath));
   assert.deepEqual(physics.move(campusPath,[6.803,47.502]),campusPath);
   const bed=CAMPUS_COURTYARD.fixtures.find(f=>f.kind==='planter')!,bedPoint:[number,number]=[...bed.coordinates];
   let besideBed=offset(bedPoint,4,0);
   for(let step=0;step<40;step++)besideBed=physics.move(besideBed,offset(besideBed,-.1,0));
   assert.ok(distance(bedPoint,besideBed)>bed.width/2+.15,'The raised planting bed must block the avatar');
   assert.ok(distance(bedPoint,besideBed)<3.5,'The avatar should reach the edge rather than freeze on approach');
   let position=from,total=0;
   for(let step=0;step<80;step++){const next=physics.move(position,advance(position,337,1,0,.05));total+=distance(position,next);position=next;}
   assert.ok(total>3.5&&total<4.5,'The capsule must keep walking across terrain cells without becoming embedded');
  }finally{physics.dispose();physics.dispose();}
 }finally{globalThis.fetch=original;}
});
