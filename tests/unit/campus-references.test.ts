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

test('library curtain wall uses individual fixed lights without classroom handles or repeated sills',()=>{
 const face=campusReferences.buildings.flatMap(p=>p.faces).find(f=>f.kind==='libraryGlass')!;
 const panes:number[][]=[],boxes:number[][]=[];
 drawCampusFacade(face,8,14,{panel:()=>{},lettering:()=>{},box:(at,w,b,t)=>boxes.push([at,w,b,t]),glazing:(at,w,b,t)=>panes.push([at,w,b,t])});
 assert.ok(panes.length>40);
 assert.ok(panes.every(p=>p[3]-p[2]<1.1&&p[1]<1.7),'Do not stretch one reflection through multiple floors');
 assert.ok(!boxes.some(b=>b[1]===.025&&Math.abs(b[3]-b[2]-.13)<1e-6),'Fixed lights should not inherit classroom handles');
 assert.equal(boxes.filter(b=>b[1]===7.65&&Math.abs(b[3]-b[2]-.18)<1e-6).length,2,'Keep the photographed floor-beam structure');
});

test('CROUS restaurant preserves its distinct glazing and dated photographic source',()=>{
 const profiles=campusReferences.buildings.filter(b=>b.label.startsWith('CROUS'));
 assert.equal(profiles.length,2);
 const source=campusReferences.sources.find(s=>s.id==='crous-2012')!;
 assert.equal(source.captureDate,'2012-11-13');assert.equal(source.author,'Antomoro');
 const face=profiles.flatMap(p=>p.faces).find(f=>f.layout==='crous-east')!,panes:number[][]=[];
 drawCampusFacade(face,16,8,{panel:()=>{},box:()=>{},lettering:()=>assert.fail('No invented departmental signs'),glazing:(at,w,b,t)=>panes.push([at,w,b,t])});
 assert.ok(panes.filter(p=>p[2]>3).every(p=>p[1]<.7&&p[3]-p[2]>3),'Tall narrow upper lights, not generic ribbon windows');
 assert.ok(panes.filter(p=>p[2]<2).length<5,'Keep the service wall mostly solid');
 const front=profiles.flatMap(p=>p.faces).find(f=>f.layout==='crous-front')!;
 panes.length=0;
 drawCampusFacade(front,34,8.5,{panel:()=>{},box:()=>{},lettering:()=>{},glazing:(at,w,b,t)=>panes.push([at,w,b,t])});
 assert.ok(panes.length>=16&&panes.every(p=>p[1]<1.6),'Broad restaurant bays need individual glass lights, not one stretched texture');
});

test('restaurant east walking view faces a documented elevation without crossing another building',()=>{
 const visit=CAMPUS_VISITS.find(v=>v.id==='crous-east')!;
 const face=campusReferences.buildings.flatMap(b=>b.faces).find(f=>f.layout==='crous-east')!;
 assert.ok(metersBetween(visit.lookAt,nearestOnLine(visit.lookAt,[face.a,face.b]))<.2);
 const span=metersBetween(visit.start,visit.lookAt);assert.ok(span>15&&span<35);
 for(let d=0;d<span-.5;d+=.5){
  const p:[number,number]=[visit.start[0]+(visit.lookAt[0]-visit.start[0])*d/span,visit.start[1]+(visit.lookAt[1]-visit.start[1])*d/span];
  assert.ok(!data.buildings.features.some((f:any)=>polygons(f).some(poly=>insidePolygon(p,poly))),'Keep the east-wing view unobstructed');
 }
});

test('STGI keeps its photographed solid pier, narrow upper lights and actual facade lettering',()=>{
 const profile=campusReferences.buildings.find(b=>b.buildingId==='BATIMENT0000000223563366')!,face=profile.faces.find(f=>f.layout==='stgi-west')!;
 assert.ok(face);const height=12,length=metersBetween(face.a,face.b),panes:number[][]=[],labels:string[]=[];
 drawCampusFacade(face,length,height,{panel:()=>{},box:()=>{},lettering:text=>labels.push(text),glazing:(at,w,bottom,top)=>panes.push([at-w/2,at+w/2,bottom,top])});
 assert.deepEqual(labels,['UFR STGI']);
 for(const [a,b] of face.solidBays!)assert.ok(panes.every(p=>p[1]<=a*length||p[0]>=b*length),'Do not run windows through the photographed concrete pier');
 const upper=panes.filter(p=>p[2]>height*.7);assert.ok(upper.length>3);assert.ok(upper.every(p=>p[3]-p[2]<height*.15));
 assert.ok(panes.some(p=>p[2]<height*.1&&p[3]>height*.8),'Keep the continuous stair glazing');
});

test('UTBM has a solid western plinth and doors registered to existing OSM entrances',()=>{
 const face=campusReferences.buildings.find(b=>b.buildingId==='BATIMENT0000000292211747')!.faces.find(f=>f.kind==='timber')!;
 const length=metersBetween(face.a,face.b),height=16.3,panes:number[][]=[];
 drawCampusFacade(face,length,height,{panel:()=>{},box:()=>{},lettering:()=>{},glazing:(at,w,bottom,top)=>panes.push([at-w/2,at+w/2,bottom,top])});
 assert.ok(panes.filter(p=>p[3]<3.05).every(p=>p[0]>length*.18),'No repeated windows across the solid western plinth');
 const map=JSON.parse(readFileSync('apps/web/public/city/campus-osm.json','utf8'));
 assert.equal(face.entrances?.length,2);
 for(const entry of face.entrances!){
  const node=map.objects.find((n:any)=>n.id===entry.sourceNode);assert.equal(node.tags.entrance,'main');
  const projected=nearestOnLine(node.coordinates,[face.a,face.b]);
  assert.ok(metersBetween(node.coordinates,projected)<8,'Allow only the small OSM/IGN registration difference');
  const actual=[face.a[0]+(face.b[0]-face.a[0])*entry.at,face.a[1]+(face.b[1]-face.a[1])*entry.at];
  assert.ok(metersBetween(actual,projected)<.05);
  assert.ok(panes.some(p=>Math.abs((p[0]+p[1])/2-entry.at*length)<entry.width/2&&p[2]<.2&&p[3]>2.5));
 }
});

test('UTBM window fittings stay behind the timber screen',()=>{
 const face=campusReferences.buildings.find(b=>b.buildingId==='BATIMENT0000000292211747')!.faces.find(f=>f.kind==='timber')!;
 const fittings=new Set(['#344b4c','#aeb2a9','#879087','#8c968e','#263b3c','#2d4141','#a8b3ac']);
 let checked=0;
 drawCampusFacade(face,60,16.3,{panel:()=>{},lettering:()=>{},box:(_at,_w,bottom,_top,color,front)=>{
  if(bottom>3.05&&fittings.has(color)){assert.ok(front<.27,'Window frames and sills must stay behind the rear of the wood slats');checked++;}
 }});
 assert.ok(checked>100);
});

test('STGI courtyard piers are continuous and the turquoise panel preserves the ground ribbon',()=>{
 const faces=campusReferences.buildings.flatMap(b=>b.faces),court=faces.find(f=>f.layout==='stgi-court')!,colour=faces.find(f=>f.layout==='stgi-colour')!;
 assert.ok(court&&colour);
 const boxes:number[][]=[];
 drawCampusFacade(court,12,10,{panel:()=>{},lettering:()=>{},box:(at,w,z0,z1,_c,front)=>boxes.push([at,w,z0,z1,front])});
 const piers=boxes.filter(b=>b[1]<.5&&b[2]<.1&&b[3]===10&&b[4]>.8);
 assert.ok(piers.length>=4,'Continuous piers must replace window-sized trim');
 assert.ok(boxes.some(b=>b[1]===12&&b[2]>9&&b[4]>=.9),'Keep the projecting roof soffit');
 const panes:number[][]=[];let fakeDoor=false;
 drawCampusFacade(colour,22,10,{panel:()=>{},lettering:()=>{},box:(_at,_w,z0,z1)=>{if(z0===.13&&z1===.18)fakeDoor=true;},glazing:(at,w,z0,z1)=>panes.push([at-w/2,at+w/2,z0,z1])});
 assert.equal(fakeDoor,false);
 const [left,right]=colour.accentBay!;
 assert.ok(panes.filter(p=>p[2]<1).some(p=>p[0]<right*22&&p[1]>left*22),'Ground-floor glazing continues below the upper panel');
 assert.ok(panes.some(p=>p[1]-p[0]<.3&&p[2]>2.5&&p[3]>8),'Keep the narrow yellow stair slit');
 const slit=panes.find(p=>p[1]-p[0]<.3&&p[2]>2.5&&p[3]>8)!;
 const smallWindow=panes.find(p=>p[2]===3.65)!;
 assert.ok(slit[1]<smallWindow[0],'The right-to-left IGN edge must put the slit to the photographed right of the horizontal opening');
});

test('STGI painted infill remains distinct from its exposed concrete courtyard structure',()=>{
 const panels:{color:string;bottom:number;top:number}[]=[];
 for(const layout of ['stgi-west','stgi-ribbon','stgi-colour','stgi-court']){
  panels.length=0;
  const face=campusReferences.buildings.flatMap(b=>b.faces).find(f=>f.layout===layout)!;
  drawCampusFacade(face,22,10,{panel:(_at,_w,bottom,top,color)=>panels.push({color,bottom,top}),box:()=>{},lettering:()=>{}});
  const paint=panels.find(p=>p.color==='#eeeae0');
  if(layout==='stgi-court')assert.equal(paint,undefined,'Keep the courtyard concrete frame exposed');
  else {assert.ok(paint);assert.equal(paint.top,9,'Leave the upper parapet exposed');}
 }
});

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
 assert.equal(campusReferences.buildings.length,11);assert.equal(campusReferences.sourceImagesRedistributed,false);
 for(const profile of campusReferences.buildings){
  const building=data.buildings.features.find((f:any)=>f.properties.sourceId===profile.buildingId);assert.ok(building);
  for(const face of profile.faces)assert.ok(polygons(building).some(p=>p[0].slice(1).some((b,i)=>matchesFacadeEdge(face,p[0][i],b))),profile.buildingId);
  for(const id of profile.sourceIds){const source=campusReferences.sources.find(s=>s.id===id);assert.ok(source);assert.equal(new URL(source.url).protocol,'https:');if(source.captureDate){assert.match(source.captureDate,/^\d{4}-\d{2}-\d{2}$/);assert.ok(source.author&&source.license);}}
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
