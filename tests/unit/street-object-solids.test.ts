import {test} from 'node:test';
import assert from 'node:assert/strict';
import {streetObjectSolids} from '../../apps/web/lib/street-object-solids';
import {drawCampusCycleStand} from '../../apps/web/lib/campus-furniture';

test('bicycle parking collision bounds cover each rendered hoop without filling the entire rack',()=>{
 const solids=streetObjectSolids({amenity:'bicycle_parking',capacity:'8'});
 assert.equal(solids.length,4);
 for(const solid of solids){
  assert.equal(solid.kind,'box');if(solid.kind!=='box')continue;
  const contains=(x:number,y:number,z:number,r=0)=>{
   assert.ok(x-r>=solid.x-solid.width/2-1e-8&&x+r<=solid.x+solid.width/2+1e-8);
   assert.ok(y-r>=solid.y-solid.depth/2-1e-8&&y+r<=solid.y+solid.depth/2+1e-8);
   assert.ok(z-r>=solid.z-1e-8&&z+r<=solid.z+solid.height+1e-8);
  };
  drawCampusCycleStand(solid.x,{
   box:(x,y,z,w,d,h)=>{contains(x-w/2,y-d/2,z);contains(x+w/2,y+d/2,z+h);},
   tube:(a,b,r)=>{contains(...a,r);contains(...b,r);},
  });
 }
 assert.equal(streetObjectSolids({amenity:'bicycle_parking',capacity:'999'}).length,8);
});

test('bus shelters keep their open front clear and unrendered map markers create no collision',()=>{
 const shelter=streetObjectSolids({highway:'bus_stop',shelter:'yes',bench:'yes'});
 assert.ok(shelter.length>0);
 assert.ok(shelter.every(s=>s.kind==='box'&&s.y-s.depth/2>=0),'No wall across the open front');
 for(const tags of [{entrance:'main'},{barrier:'gate',foot:'yes'},{highway:'bus_stop',shelter:'no'}])assert.deepEqual(streetObjectSolids(tags),[]);
});

test('opposite platforms face the carriageway regardless of road digitisation direction',async()=>{
 const {shelterAngle,shelterOffset}=await import('../../apps/web/lib/campus-shelter');
 const coordinates:[number,number][]=[[6.8,47.49],[6.801,47.49]];
 for(const line of [coordinates,[...coordinates].reverse()]){
  const road={id:1,coordinates:line,tags:{highway:'service'}};
  for(const side of [-1,1]){
   const angle=shelterAngle([6.8005,47.49+side*.00004],[road]);
   const [east,north]=shelterOffset(angle,0,-1);
   assert.ok(Math.abs(east)<1e-6 && north*side<-.99);
  }
 }
 const tags={highway:'bus_stop',shelter:'yes',bin:'yes'};
 assert.equal(streetObjectSolids(tags,true).length,streetObjectSolids(tags).length+1);
});

test('the CROUS platform spans two benches and both boarding bays remain open',()=>{
 const solids=streetObjectSolids({highway:'bus_stop',shelter:'yes',bench:'yes'},true,4876779236);
 const boxes=solids.filter(s=>s.kind==='box');
 assert.equal(boxes.filter(s=>s.width===2.60).length,2);
 for(const x of [-1.75,1.75]){
  assert.ok(!boxes.some(s=>Math.abs(s.x-x)<s.width/2+.3&&s.y<-.2));
 }
 assert.ok(boxes.some(s=>s.x===-3.50&&s.depth>1),'The photographed end panel blocks side entry');
});
