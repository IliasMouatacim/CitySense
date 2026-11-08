import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadCityWorld,terrainHeight} from '../../apps/web/lib/city-world.ts';
import {createCityPhysics} from '../../apps/web/lib/city-physics.ts';
import {distance,offset,advance} from '../../apps/web/lib/walk-geometry.ts';

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
  const fixture={...data,bounds:[0,0,1,1],size:2,datum:0,heights:[0,10,20,40]};
  assert.equal(terrainHeight(.25,.25,fixture),7.5);assert.equal(terrainHeight(.75,.75,fixture),27.5);
  const physics=await createCityPhysics();
  try{
   const from:[number,number]=[6.798113188684639,47.51017527332869],to=offset(from,-.25,.6),resolved=physics.move(from,to);
   assert.ok(distance(from,resolved)>.1);assert.ok(distance(from,resolved)<1);assert.ok(physics.height(resolved)!>1);
   assert.deepEqual(physics.move(from,[0,0]),from);
   let position=from,total=0;
   for(let step=0;step<80;step++){const next=physics.move(position,advance(position,337,1,0,.05));total+=distance(position,next);position=next;}
   assert.ok(total>3.5&&total<4.5,'The capsule must keep walking across terrain cells without becoming embedded');
  }finally{physics.dispose();physics.dispose();}
 }finally{globalThis.fetch=original;}
});
