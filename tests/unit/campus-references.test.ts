import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {campusReferences} from '../../apps/web/lib/campus-references';
import {drawCampusFacade} from '../../apps/web/lib/campus-architecture';
import {CAMPUS_VISITS} from '../../apps/web/lib/campus-visits';
import {matchesFacadeEdge} from '../../apps/web/lib/facade-references';
import {metersBetween} from '../../apps/web/lib/city-details-data';
import {insidePolygon,nearestOnLine} from '../../apps/web/lib/walk-geometry';
import {CAMPUS_COURTYARD} from '../../apps/web/lib/campus-courtyard';
import {drawCampusBench} from '../../apps/web/lib/campus-furniture';
import {drawCampusEnvelope,estimatedCampusFace,campusCompletionProfile} from '../../apps/web/lib/campus-envelope';

const data=JSON.parse(readFileSync('apps/web/public/city/campus-portes-du-jura.json','utf8'));
const polygons=(f:any):number[][][][]=>f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;

test('campus side-wall completion fits real envelopes and leaves non-academic uses alone',()=>{
 let finished=0,estimated=0,nearGeometry=0,farGeometry=0;
 for(const profile of campusReferences.buildings){
  const building=data.buildings.features.find((f:any)=>f.properties.sourceId===profile.buildingId),height=building.properties.render_height;
  for(const poly of polygons(building))for(let i=1;i<poly[0].length;i++){
   const a=poly[0][i-1],b=poly[0][i],length=metersBetween(a,b);if(length<.5)continue;
   const check=(at:number,w:number,z0:number,z1:number,color:string,front=.1,back=.028)=>{
    assert.ok([at,w,z0,z1,front,back].every(Number.isFinite));
    assert.ok(w>0&&at-w/2>=-.001&&at+w/2<=length+.001);
    assert.ok(z0>=0&&z1>z0&&z1<=height+.061);
    assert.ok(front<=.3&&back<front,'Envelope relief must remain inside capsule clearance');
   };
   for(const close of [true,false])drawCampusEnvelope(length,height,{panel:(...args)=>{check(...args);if(close)nearGeometry++;else farGeometry++;},box:check,lettering:()=>assert.fail('No invented signs')},close,profile.faces.some(f=>f.kind==='libraryStone'));
   finished++;
   if(profile.faces.some(f=>matchesFacadeEdge(f,a,b)))continue;
   const face=estimatedCampusFace(profile,undefined,length,height);
   if(face){
    assert.equal(face.label,undefined);assert.equal(face.accent,undefined);estimated++;
    const opening=(at:number,w:number,z0:number,z1:number,color:string,front=.1)=>{
     assert.ok([at,w,z0,z1,front].every(Number.isFinite));
     assert.ok(w>0&&at-w/2>=-.3&&at+w/2<=length+.3);
     assert.ok(z0>=0&&z1>z0&&z1<=height+.15);assert.ok(front<1);
    };
    assert.ok(drawCampusFacade(face,length,height,{panel:opening,box:opening,lettering:()=>assert.fail('No inferred department signs')})>0);
   }
   if(profile.label.includes('Bibliothèque')||profile.label.includes('UTBM'))assert.equal(face,undefined);
  }
 }
 assert.ok(finished>100);assert.ok(estimated>10);assert.ok(nearGeometry>farGeometry*2);
 for(const use of ['apartments','dormitory','garage',undefined])assert.equal(estimatedCampusFace(undefined,use,20,10),undefined);
 assert.ok(estimatedCampusFace(undefined,'university',20,10));
 assert.equal(estimatedCampusFace(undefined,'university',3,10),undefined);
});

test('taller IUT cores and STGI connectors receive inferred detail without becoming photo observations',()=>{
 const cores=data.buildings.features.filter((f:any)=>campusCompletionProfile(f.properties.sourceId));
 assert.equal(cores.length,7);
 for(const core of cores){
  assert.ok(!campusReferences.buildings.some(b=>b.buildingId===core.properties.sourceId));
  const profile=campusCompletionProfile(core.properties.sourceId)!;
  if(['BATIMENT0000000223563541','BATIMENT0000000223563542'].includes(core.properties.sourceId)){
   assert.ok(polygons(core).some(p=>p[0].slice(1).some((b,i)=>estimatedCampusFace(profile,undefined,metersBetween(p[0][i],b),core.properties.render_height))),core.properties.sourceId);
  }
 }
});

test('detailed benches remain inside existing walking collision envelopes',()=>{
 for(const width of [1.6,2.2]){
  const point=(x:number,y:number,z:number,r=0)=>{
   assert.ok([x,y,z,r].every(Number.isFinite));
   assert.ok(Math.abs(x)+r<=width/2+.0001);
   assert.ok(Math.abs(y)+r<=.25+.0001);assert.ok(z-r>=0&&z+r<=.85);
  };
  drawCampusBench(width,{
   box:(x,y,z,w,d,h)=>{point(x-w/2,y-d/2,z);point(x+w/2,y+d/2,z+h);},
   tube:(a,b,r)=>{point(...a,r);point(...b,r);},
  });
 }
});

test('institutional campus observations remain attached to actual IGN walls and credited reference URLs',()=>{
 assert.equal(campusReferences.buildings.length,9);assert.equal(campusReferences.sourceImagesRedistributed,false);
 for(const profile of campusReferences.buildings){
  const building=data.buildings.features.find((f:any)=>f.properties.sourceId===profile.buildingId);assert.ok(building);
  for(const face of profile.faces)assert.ok(polygons(building).some(p=>p[0].slice(1).some((b,i)=>matchesFacadeEdge(face,p[0][i],b))),profile.buildingId);
  for(const id of profile.sourceIds){const source=campusReferences.sources.find(s=>s.id===id);assert.ok(source);assert.equal(new URL(source.url).protocol,'https:');assert.equal(source.captureDate,null);}
 }
});

test('observed campus facade geometry stays finite and within its envelope at real measured wall dimensions',()=>{
 let panes=0,solidTrim=0;
 for(const profile of campusReferences.buildings){
  const height=data.buildings.features.find((f:any)=>f.properties.sourceId===profile.buildingId).properties.render_height;
  for(const face of profile.faces){
   const length=metersBetween(face.a,face.b);
   function check(at:number,width:number,bottom:number,top:number,color:string,front=.1,back=.03){
    assert.ok([at,width,bottom,top,front,back].every(Number.isFinite));assert.ok(width>0&&width<=length+.4);
    assert.ok(at-width/2>=-.3&&at+width/2<=length+.3);
    assert.ok(bottom>=0&&bottom<top&&top<=height+.15,`${profile.label}: ${bottom}..${top}`);
    assert.match(color,/^#[0-9a-f]{6}$/i);assert.ok(front>=0&&front<1);
   }
   panes+=drawCampusFacade(face,length,height,{panel:check,box:(...args)=>{solidTrim++;check(...args);},lettering:(text,at,width,bottom,top)=>{assert.ok(text.length>0);check(at,width,bottom,top,'#ffffff');}});
  }
 }
 assert.ok(panes>300);assert.ok(solidTrim>500);
});

test('campus visit starts sit inside the measured terrain and outside building interiors',()=>{
 const [w,s,e,n]=data.bounds;
 for(const visit of CAMPUS_VISITS){
  const p=visit.start;assert.ok(p[0]>w&&p[0]<e&&p[1]>s&&p[1]<n);
  assert.ok(!data.buildings.features.some((f:any)=>polygons(f).some(poly=>insidePolygon(p,poly))),visit.id);
  assert.ok(visit.pitch>=90&&visit.pitch<120);
 }
});

test('the IUT walking view reaches a documented windowed facade without another building blocking it',()=>{
 const visit=CAMPUS_VISITS.find(v=>v.id==='iut-mp')!;
 const facade=campusReferences.buildings.flatMap(b=>b.faces).find(face=>face.kind==='ribbon'&&metersBetween(visit.lookAt,nearestOnLine(visit.lookAt,[face.a,face.b]))<.2);
 assert.ok(facade,'Look target must lie on an observed ribbon facade');
 const span=metersBetween(visit.start,visit.lookAt);
 assert.ok(span>15&&span<40,'Leave room to see the full elevation at pedestrian height');
 for(let d=0;d<span-.5;d+=.5){
  const p:[number,number]=[visit.start[0]+(visit.lookAt[0]-visit.start[0])*d/span,visit.start[1]+(visit.lookAt[1]-visit.start[1])*d/span];
  assert.ok(!data.buildings.features.some((f:any)=>polygons(f).some(poly=>insidePolygon(p,poly))),'View must not cross a blank wall');
 }
});

test('photo-observed courtyard fixtures are credited and stay outside building interiors',()=>{
 for(const id of CAMPUS_COURTYARD.sourceIds)assert.ok(campusReferences.sources.some(s=>s.id===id));
 for(const fixture of CAMPUS_COURTYARD.fixtures){
  assert.ok(fixture.height>0&&fixture.width>0&&fixture.depth>0);
  assert.ok(!data.buildings.features.some((f:any)=>polygons(f).some(poly=>insidePolygon([...fixture.coordinates],poly))));
 }
});
