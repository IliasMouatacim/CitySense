import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {campusReferences} from '../../apps/web/lib/campus-references';
import {drawCampusFacade} from '../../apps/web/lib/campus-architecture';
import {CAMPUS_VISITS} from '../../apps/web/lib/campus-visits';
import {matchesFacadeEdge} from '../../apps/web/lib/facade-references';
import {metersBetween} from '../../apps/web/lib/city-details-data';
import {insidePolygon} from '../../apps/web/lib/walk-geometry';
import {CAMPUS_COURTYARD} from '../../apps/web/lib/campus-courtyard';

const data=JSON.parse(readFileSync('apps/web/public/city/campus-portes-du-jura.json','utf8'));
const polygons=(f:any):number[][][][]=>f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;

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

test('photo-observed courtyard fixtures are credited and stay outside building interiors',()=>{
 for(const id of CAMPUS_COURTYARD.sourceIds)assert.ok(campusReferences.sources.some(s=>s.id===id));
 for(const fixture of CAMPUS_COURTYARD.fixtures){
  assert.ok(fixture.height>0&&fixture.width>0&&fixture.depth>0);
  assert.ok(!data.buildings.features.some((f:any)=>polygons(f).some(poly=>insidePolygon([...fixture.coordinates],poly))));
 }
});
