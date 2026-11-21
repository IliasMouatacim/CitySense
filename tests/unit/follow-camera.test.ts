import test from 'node:test';
import assert from 'node:assert/strict';
import {followCamera} from '../../apps/web/lib/follow-camera';
import {distance,type Position} from '../../apps/web/lib/walk-geometry';
import {readFileSync} from 'node:fs';

const start:Position=[6.804,47.495];
test('camera orbits the stationary player and follows terrain elevation',()=>{
 const north=followCamera(start,41,0,90,3.65,.016);
 const east=followCamera(start,41,90,90,3.65,.016);
 assert.ok(north.camera[1]<start[1]&&east.camera[0]<start[0]);
 assert.ok(north.eye>42&&north.targetElevation<north.eye);
 assert.ok(distance(north.camera,start)>3&&distance(north.camera,start)<3.65);
});
test('follow camera retracts immediately and extends smoothly after a wall',()=>{
 const contact=followCamera(start,41,0,90,3.65,.016,()=>.6);
 assert.equal(contact.arm,.6);
 const leaving=followCamera(start,41,0,90,contact.arm,.016);
 assert.ok(leaving.arm>.6&&leaving.arm<1.1&&leaving.settling);
});
test('walking avatar is one textured skinned primitive within the mobile asset budget',()=>{
 const bytes=readFileSync(new URL('../../apps/web/public/city/player.glb',import.meta.url));
 assert.equal(bytes.toString('ascii',0,4),'glTF');
 const asset=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));
 assert.equal(asset.meshes.length,1);assert.equal(asset.meshes[0].primitives.length,1);
 const primitive=asset.meshes[0].primitives[0];
 assert.ok(primitive.attributes.WEIGHTS_0!==undefined&&primitive.attributes.JOINTS_0!==undefined);
 assert.ok(asset.accessors[primitive.indices].count/3<12000&&bytes.length<430000);
 assert.equal(asset.images.length,1);assert.equal(asset.images[0].mimeType,'image/jpeg');
 for(const name of ['hips','spine','head','armL','armR','foreL','foreR','thighL','thighR','shinL','shinR','footL','footR'])
  assert.ok(asset.skins[0].joints.some((id:number)=>asset.nodes[id].name===name),name);
});
