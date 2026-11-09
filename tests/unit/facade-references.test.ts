import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {facadeReferences,facadePhotoUv,matchesFacadeEdge} from '../../apps/web/lib/facade-references';

test('reviewed facade edges still match the actual IGN building geometry',()=>{
 const world=JSON.parse(readFileSync('apps/web/public/city/montbeliard.json','utf8'));
 assert.equal(facadeReferences.buildings.length,3);
 for(const profile of facadeReferences.buildings){
  const building=world.buildings.features.find((b:any)=>b.properties.sourceId===profile.buildingId);assert.ok(building);
  const polygons=building.geometry.type==='Polygon'?[building.geometry.coordinates]:building.geometry.coordinates;
  for(const edge of [...profile.observedWalls,...profile.photoFaces]){
   assert.ok(polygons.some((polygon:number[][][])=>polygon[0].slice(1).some((b,i)=>matchesFacadeEdge(edge,polygon[0][i],b))),profile.buildingId);
   assert.ok(matchesFacadeEdge(edge,edge.b,edge.a));
   assert.equal(matchesFacadeEdge(edge,[edge.a[0]+.001,edge.a[1]],edge.b),false);
  }
 }
});
test('the stored source photo is unchanged and credited, and registered roof corners land on the recorded pixels',()=>{
 const raw=JSON.parse(readFileSync('apps/web/public/city/panoramax-facades.json','utf8'));
 for(const source of [raw.source,...raw.additionalSources]){
  const bytes=readFileSync('apps/web/public'+source.image);assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256);
 }
 assert.equal(raw.source.author,'Lejun');assert.equal(raw.source.license,'CC-BY-SA-4.0');
 for(const projection of Object.values(raw.projections) as any[])for(const match of projection.correspondences){
  const [u,v]=facadePhotoUv(match.world,projection);
  const [width,height]=projection.calibrationImageSize||raw.source.imageSize;
  assert.ok(Math.abs(u*width-match.pixel[0])<2);
  assert.ok(Math.abs((1-v)*height-match.pixel[1])<2);
 }
});
test('the grey front records the four observed upper storeys and asymmetric balcony/window bays',()=>{
 const profile=facadeReferences.buildings.find(b=>b.kind==='slab')!,front=profile.manualFront!;
 assert.equal(front.floors,4);assert.deepEqual(front.bays.map(b=>b.kind),['shutter','balcony','window','shutter']);
 assert.ok(front.bays.every(b=>b.at>0&&b.at<1&&b.width>0));
 const world=JSON.parse(readFileSync('apps/web/public/city/montbeliard.json','utf8'));
 const building=world.buildings.features.find((b:any)=>b.properties.sourceId===profile.buildingId);
 const rings=building.geometry.type==='Polygon'?building.geometry.coordinates:building.geometry.coordinates.flat();
 for(const point of [front.a,front.b])assert.ok(rings.some((ring:number[][])=>ring.some(p=>Math.abs(p[0]-point[0])<1e-7&&Math.abs(p[1]-point[1])<1e-7)));
});
