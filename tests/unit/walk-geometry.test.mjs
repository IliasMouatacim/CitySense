import {test} from 'node:test';
import assert from 'node:assert/strict';
import {advance,distance,movementStopped,offset,insidePolygon,makeObstacle,blocked,nearestOnLine,withinPilot,walkFrame} from '../../apps/web/lib/walk-geometry.ts';
import {WALK_SPEED,RUN_SPEED,walkBob} from '../../apps/web/lib/walk-settings.ts';
const start=[6.8,47.51];
test('walking covers the same distance down to 1 fps while checking short collision steps',()=>{
 for(const speed of [WALK_SPEED,RUN_SPEED])for(const fps of [60,5,2,1]){
  let position=start;
  for(let frame=0;frame<fps;frame++){
   const timing=walkFrame(1/fps);assert.ok(timing.step<=.05);
   for(let step=0;step<timing.steps;step++)position=advance(position,0,1,0,speed*timing.step);
  }
  assert.ok(Math.abs(distance(start,position)-speed)<.001);
 }
 const suspended=walkFrame(10);assert.equal(suspended.elapsed,1);assert.ok(suspended.step<=.05);
});
test('footfall motion stays subtle and does not accumulate vertical drift',()=>{
 for(let d=0;d<100;d+=.03)assert.ok(Math.abs(walkBob(d))<=.022);
 assert.ok(Math.abs(walkBob(1.4))<1e-9);
});
test('walking moves in meters in the camera direction without diagonal speed gain',()=>{
 const north=advance(start,0,1,0,10),east=advance(start,90,1,0,10),diagonal=advance(start,0,1,1,10);
 assert.ok(north[1]>start[1]);assert.ok(east[0]>start[0]);
 assert.ok(Math.abs(distance(start,north)-10)<.01);assert.ok(Math.abs(distance(start,diagonal)-10)<.01);
 assert.deepEqual(advance(start,0,0,0,10),start);
});
test('building collision respects polygon holes and avatar clearance',()=>{
 const ring=[offset(start,-5,-5),offset(start,5,-5),offset(start,5,5),offset(start,-5,5),offset(start,-5,-5)];
 const hole=[offset(start,-1,-1),offset(start,1,-1),offset(start,1,1),offset(start,-1,1),offset(start,-1,-1)];
 const obstacle=makeObstacle([ring,hole],'building');
 assert.equal(insidePolygon(start,obstacle.rings),false);
 assert.equal(blocked(offset(start,3,0),[obstacle]),true);
 assert.equal(blocked(offset(start,5.15,0),[obstacle]),true);
 assert.equal(blocked(offset(start,6,0),[obstacle]),false);
});
test('water blocks walking except on a mapped bridge, while pilot bounds are enforced',()=>{
 const ring=[offset(start,-5,-5),offset(start,5,-5),offset(start,5,5),offset(start,-5,5),offset(start,-5,-5)];
 const water=makeObstacle([ring],'water');const bridge=[offset(start,-10,0),offset(start,10,0)];
 assert.equal(blocked(start,[water]),true);assert.equal(blocked(start,[water],[bridge]),false);
 assert.equal(blocked(offset(start,0,4),[water],[bridge]),true);
 assert.ok(distance(nearestOnLine(offset(start,0,3),bridge),start)<.01);
 assert.equal(withinPilot(start),true);assert.equal(withinPilot(offset(start,3000,0)),false);
});

test('physical-stop feedback distinguishes a blocked capsule from sliding and tiny idle corrections',()=>{
 for(const step of [.002,.05,.275]){
  const requested=offset(start,step,0);
  assert.equal(movementStopped(start,requested,start),true);
  assert.equal(movementStopped(start,requested,offset(start,step*.05,0)),true);
  assert.equal(movementStopped(start,requested,requested),false);
  assert.equal(movementStopped(start,requested,offset(start,step*.5,step*.5)),false);
 }
 assert.equal(movementStopped(start,start,start),false);
 assert.equal(movementStopped(start,offset(start,1e-7,0),start),false);
});
